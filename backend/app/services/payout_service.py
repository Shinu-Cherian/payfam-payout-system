from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.advance_payout import AdvancePayout
from app.models.enums import SaleStatus, TransactionType
from app.models.sale import Sale
from app.models.user import User
from app.services.audit_service import AuditService
from app.services.ledger_service import LedgerService, money


class PayoutService:
    ADVANCE_PERCENTAGE = Decimal("0.10")

    @classmethod
    def _pay_advance(cls, db: Session, *, actor: User, sale: Sale) -> AdvancePayout:
        if sale.status != SaleStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Advance payout is allowed only for pending sales")
        if sale.advance_paid or sale.advance_payout:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Advance payout already paid for this sale")

        user = db.get(User, sale.user_id)
        amount = money(sale.commission_amount * cls.ADVANCE_PERCENTAGE)
        sale.advance_paid = True
        sale.advance_amount = amount
        payout = AdvancePayout(sale_id=sale.id, user_id=sale.user_id, amount=amount)
        db.add(payout)
        db.flush()
        LedgerService.credit(
            db,
            user=user,
            amount=amount,
            transaction_type=TransactionType.ADVANCE_PAYOUT,
            reference_type="AdvancePayout",
            reference_id=payout.id,
            description=f"10% advance payout for sale #{sale.id}",
        )
        AuditService.log(
            db,
            actor=actor,
            action="ADVANCE_PAYOUT_PAID",
            entity_type="AdvancePayout",
            entity_id=payout.id,
            details={"sale_id": sale.id, "amount": amount},
        )
        return payout

    @classmethod
    def run_advance_payout(cls, db: Session, *, actor: User, sale_id: int | None = None) -> tuple[list[AdvancePayout], Decimal]:
        if sale_id:
            sale = db.get(Sale, sale_id)
            if not sale:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")
            payouts = [cls._pay_advance(db, actor=actor, sale=sale)]
        else:
            eligible_sales = (
                db.query(Sale)
                .filter(Sale.status == SaleStatus.PENDING, Sale.advance_paid.is_(False))
                .order_by(Sale.created_at.asc())
                .all()
            )
            payouts = [cls._pay_advance(db, actor=actor, sale=sale) for sale in eligible_sales]

        total = money(sum((payout.amount for payout in payouts), Decimal("0.00")))
        db.commit()
        for payout in payouts:
            db.refresh(payout)
        return payouts, total

