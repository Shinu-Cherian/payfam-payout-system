from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Page(ORMModel):
    total: int
    page: int
    page_size: int


class MoneySummary(ORMModel):
    pending_earnings: Decimal
    advance_paid: Decimal
    final_payout: Decimal
    withdrawable_balance: Decimal


class MessageResponse(BaseModel):
    message: str


class Timestamped(ORMModel):
    created_at: datetime

