from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import SaleStatus
from app.schemas.common import ORMModel, Page


class SaleCreate(BaseModel):
    user_id: int
    customer_name: str = Field(min_length=2, max_length=120)
    product_name: str = Field(min_length=2, max_length=120)
    gross_amount: Decimal = Field(gt=0)
    commission_amount: Decimal = Field(gt=0)


class SaleRead(ORMModel):
    id: int
    user_id: int
    customer_name: str
    product_name: str
    gross_amount: Decimal
    commission_amount: Decimal
    status: SaleStatus
    advance_paid: bool
    advance_amount: Decimal
    final_paid_amount: Decimal
    rejection_deduction_amount: Decimal
    created_at: datetime
    decided_at: datetime | None


class SaleList(Page):
    items: list[SaleRead]


class ReconciliationRequest(BaseModel):
    status: SaleStatus

