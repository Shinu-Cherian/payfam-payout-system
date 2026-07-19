from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.enums import SaleStatus, TransactionType, UserRole
from app.models.sale import Sale
from app.models.user import User
from app.schemas.sale import SaleCreate
from app.services.audit_service import AuditService
from app.services.ledger_service import LedgerService, money


class SaleService:
    @staticmethod
    def create_sale(db: Session, *, actor: User, payload: SaleCreate) -> Sale:
        if payload.commission_amount > payload.gross_amount:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Commission cannot exceed gross amount")
        user = db.get(User, payload.user_id)
        if not user or user.role != UserRole.USER:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payout user not found")
        sale = Sale(**payload.model_dump())
        db.add(sale)
        db.flush()
        AuditService.log(db, actor=actor, action="SALE_CREATED", entity_type="Sale", entity_id=sale.id, details=payload.model_dump())
        db.commit()
        db.refresh(sale)
        return sale

    @staticmethod
    def list_sales(
        db: Session,
        *,
        current_user: User,
        page: int = 1,
        page_size: int = 10,
        status_filter: SaleStatus | None = None,
        search: str | None = None,
    ) -> tuple[list[Sale], int]:
        query = db.query(Sale)
        if current_user.role != UserRole.ADMIN:
            query = query.filter(Sale.user_id == current_user.id)
        if status_filter:
            query = query.filter(Sale.status == status_filter)
        if search:
            like = f"%{search}%"
            query = query.filter(or_(Sale.customer_name.ilike(like), Sale.product_name.ilike(like)))
        total = query.count()
        items = query.order_by(Sale.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    @staticmethod
    def reconcile_sale(db: Session, *, actor: User, sale_id: int, decision: SaleStatus) -> Sale:
        if decision == SaleStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sale can only be approved or rejected")
        sale = db.get(Sale, sale_id)
        if not sale:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")
        if sale.status != SaleStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sale already reconciled")

        user = db.get(User, sale.user_id)
        sale.status = decision
        sale.decided_at = datetime.utcnow()

        if decision == SaleStatus.APPROVED:
            remaining = money(sale.commission_amount - sale.advance_amount)
            sale.final_paid_amount = remaining
            if remaining > 0:
                LedgerService.credit(
                    db,
                    user=user,
                    amount=remaining,
                    transaction_type=TransactionType.FINAL_PAYOUT,
                    reference_type="Sale",
                    reference_id=sale.id,
                    description=f"Final payout for approved sale #{sale.id}",
                )
        else:
            deduction = money(sale.advance_amount)
            sale.rejection_deduction_amount = deduction
            if deduction > 0:
                LedgerService.debit(
                    db,
                    user=user,
                    amount=deduction,
                    transaction_type=TransactionType.REJECTION_DEDUCTION,
                    reference_type="Sale",
                    reference_id=sale.id,
                    description=f"Advance deducted for rejected sale #{sale.id}",
                )

        AuditService.log(
            db,
            actor=actor,
            action=f"SALE_{decision.value}",
            entity_type="Sale",
            entity_id=sale.id,
            details={"sale_id": sale.id, "decision": decision.value},
        )
        db.commit()
        db.refresh(sale)
        return sale

    @staticmethod
    def summary_for_user(db: Session, *, user: User | None = None) -> dict[str, object]:
        query = db.query(Sale)
        user_query = db.query(User)
        if user:
            query = query.filter(Sale.user_id == user.id)
            user_query = user_query.filter(User.id == user.id)
        pending = query.filter(Sale.status == SaleStatus.PENDING).with_entities(func.coalesce(func.sum(Sale.commission_amount), 0)).scalar()
        advance = query.with_entities(func.coalesce(func.sum(Sale.advance_amount), 0)).scalar()
        final = query.with_entities(func.coalesce(func.sum(Sale.final_paid_amount), 0)).scalar()
        balance = user_query.with_entities(func.coalesce(func.sum(User.withdrawable_balance), 0)).scalar()
        return {
            "pending_earnings": money(pending),
            "advance_paid": money(advance),
            "final_payout": money(final),
            "withdrawable_balance": money(balance),
        }
