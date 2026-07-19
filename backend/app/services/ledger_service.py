from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.orm import Session

from app.models.enums import TransactionDirection, TransactionType
from app.models.transaction import Transaction
from app.models.user import User


TWOPLACES = Decimal("0.01")


def money(value: Decimal) -> Decimal:
    return Decimal(value).quantize(TWOPLACES, rounding=ROUND_HALF_UP)


class LedgerService:
    @staticmethod
    def credit(
        db: Session,
        *,
        user: User,
        amount: Decimal,
        transaction_type: TransactionType,
        reference_type: str,
        reference_id: int,
        description: str,
    ) -> Transaction:
        amount = money(amount)
        user.withdrawable_balance = money(user.withdrawable_balance + amount)
        transaction = Transaction(
            user_id=user.id,
            type=transaction_type,
            direction=TransactionDirection.CREDIT,
            amount=amount,
            balance_after=user.withdrawable_balance,
            reference_type=reference_type,
            reference_id=reference_id,
            description=description,
        )
        db.add(transaction)
        return transaction

    @staticmethod
    def debit(
        db: Session,
        *,
        user: User,
        amount: Decimal,
        transaction_type: TransactionType,
        reference_type: str,
        reference_id: int,
        description: str,
    ) -> Transaction:
        amount = money(amount)
        user.withdrawable_balance = money(user.withdrawable_balance - amount)
        transaction = Transaction(
            user_id=user.id,
            type=transaction_type,
            direction=TransactionDirection.DEBIT,
            amount=amount,
            balance_after=user.withdrawable_balance,
            reference_type=reference_type,
            reference_id=reference_id,
            description=description,
        )
        db.add(transaction)
        return transaction

