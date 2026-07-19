from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.enums import TransactionType, UserRole, WithdrawalStatus
from app.models.user import User
from app.models.withdrawal import Withdrawal
from app.services.audit_service import AuditService
from app.services.ledger_service import LedgerService, money


class WithdrawalService:
    @staticmethod
    def create_withdrawal(db: Session, *, user: User, amount) -> Withdrawal:
        amount = money(amount)
        if user.withdrawable_balance < amount:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient withdrawable balance")

        cutoff = datetime.utcnow() - timedelta(hours=24)
        recent = (
            db.query(Withdrawal)
            .filter(
                Withdrawal.user_id == user.id,
                Withdrawal.requested_at >= cutoff,
                Withdrawal.status.in_([WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED]),
            )
            .order_by(Withdrawal.requested_at.desc())
            .first()
        )
        if recent:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only one withdrawal is allowed every 24 hours")

        withdrawal = Withdrawal(user_id=user.id, amount=amount, status=WithdrawalStatus.PENDING)
        db.add(withdrawal)
        db.flush()
        LedgerService.debit(
            db,
            user=user,
            amount=amount,
            transaction_type=TransactionType.WITHDRAWAL_DEBIT,
            reference_type="Withdrawal",
            reference_id=withdrawal.id,
            description=f"Withdrawal request #{withdrawal.id}",
        )
        AuditService.log(
            db,
            actor=user,
            action="WITHDRAWAL_REQUESTED",
            entity_type="Withdrawal",
            entity_id=withdrawal.id,
            details={"amount": amount},
        )
        db.commit()
        db.refresh(withdrawal)
        return withdrawal

    @staticmethod
    def list_withdrawals(
        db: Session,
        *,
        current_user: User,
        page: int = 1,
        page_size: int = 10,
        status_filter: WithdrawalStatus | None = None,
    ) -> tuple[list[Withdrawal], int]:
        query = db.query(Withdrawal)
        if current_user.role != UserRole.ADMIN:
            query = query.filter(Withdrawal.user_id == current_user.id)
        if status_filter:
            query = query.filter(Withdrawal.status == status_filter)
        total = query.count()
        items = query.order_by(Withdrawal.requested_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    @staticmethod
    def update_status(db: Session, *, actor: User, withdrawal_id: int, new_status: WithdrawalStatus, note: str | None) -> Withdrawal:
        withdrawal = db.get(Withdrawal, withdrawal_id)
        if not withdrawal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Withdrawal not found")
        if withdrawal.status != WithdrawalStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending withdrawals can be updated")
        if new_status == WithdrawalStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Choose a final withdrawal status")

        user = db.get(User, withdrawal.user_id)
        withdrawal.status = new_status
        withdrawal.note = note
        withdrawal.resolved_at = datetime.utcnow()

        if new_status in {WithdrawalStatus.FAILED, WithdrawalStatus.CANCELLED, WithdrawalStatus.REJECTED}:
            refund = LedgerService.credit(
                db,
                user=user,
                amount=withdrawal.amount,
                transaction_type=TransactionType.WITHDRAWAL_REFUND,
                reference_type="Withdrawal",
                reference_id=withdrawal.id,
                description=f"Returned funds for {new_status.value.lower()} withdrawal #{withdrawal.id}",
            )
            db.flush()
            withdrawal.refund_transaction_id = refund.id

        AuditService.log(
            db,
            actor=actor,
            action=f"WITHDRAWAL_{new_status.value}",
            entity_type="Withdrawal",
            entity_id=withdrawal.id,
            details={"status": new_status.value, "note": note},
        )
        db.commit()
        db.refresh(withdrawal)
        return withdrawal

