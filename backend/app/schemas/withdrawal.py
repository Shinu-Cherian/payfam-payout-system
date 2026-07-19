from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import WithdrawalStatus
from app.schemas.common import ORMModel, Page


class WithdrawalCreate(BaseModel):
    amount: Decimal = Field(gt=0)


class WithdrawalStatusUpdate(BaseModel):
    status: WithdrawalStatus
    note: str | None = None


class WithdrawalRead(ORMModel):
    id: int
    user_id: int
    amount: Decimal
    status: WithdrawalStatus
    note: str | None
    requested_at: datetime
    resolved_at: datetime | None


class WithdrawalList(Page):
    items: list[WithdrawalRead]

