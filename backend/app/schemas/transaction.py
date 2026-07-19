from datetime import datetime
from decimal import Decimal

from app.models.enums import TransactionDirection, TransactionType
from app.schemas.common import ORMModel, Page


class TransactionRead(ORMModel):
    id: int
    user_id: int
    type: TransactionType
    direction: TransactionDirection
    amount: Decimal
    balance_after: Decimal
    reference_type: str
    reference_id: int
    description: str
    created_at: datetime


class TransactionList(Page):
    items: list[TransactionRead]

