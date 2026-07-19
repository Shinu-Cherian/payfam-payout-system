from app.schemas.common import MoneySummary, ORMModel
from app.schemas.sale import SaleRead
from app.schemas.transaction import TransactionRead
from app.schemas.withdrawal import WithdrawalRead


class StatusCounts(ORMModel):
    pending_sales: int
    approved_sales: int
    rejected_sales: int
    pending_withdrawals: int


class DashboardResponse(ORMModel):
    summary: MoneySummary
    status_counts: StatusCounts
    recent_sales: list[SaleRead]
    recent_transactions: list[TransactionRead]
    recent_withdrawals: list[WithdrawalRead]

