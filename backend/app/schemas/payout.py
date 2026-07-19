from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import ORMModel


class AdvancePayoutRequest(BaseModel):
    sale_id: int | None = None


class AdvancePayoutRead(ORMModel):
    id: int
    sale_id: int
    user_id: int
    amount: Decimal
    status: str
    created_at: datetime


class AdvancePayoutRunResult(BaseModel):
    processed_count: int
    total_amount: Decimal
    payouts: list[AdvancePayoutRead]

