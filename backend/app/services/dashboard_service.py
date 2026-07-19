from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.enums import SaleStatus, UserRole, WithdrawalStatus
from app.models.sale import Sale
from app.models.transaction import Transaction
from app.models.user import User
from app.models.withdrawal import Withdrawal
from app.services.sale_service import SaleService


class DashboardService:
    @staticmethod
    def get_dashboard(db: Session, *, current_user: User) -> dict[str, object]:
        user_scope = None if current_user.role == UserRole.ADMIN else current_user
        sale_query = db.query(Sale)
        withdrawal_query = db.query(Withdrawal)
        transaction_query = db.query(Transaction)
        if user_scope:
            sale_query = sale_query.filter(Sale.user_id == current_user.id)
            withdrawal_query = withdrawal_query.filter(Withdrawal.user_id == current_user.id)
            transaction_query = transaction_query.filter(Transaction.user_id == current_user.id)

        status_counts = {
            "pending_sales": sale_query.filter(Sale.status == SaleStatus.PENDING).count(),
            "approved_sales": sale_query.filter(Sale.status == SaleStatus.APPROVED).count(),
            "rejected_sales": sale_query.filter(Sale.status == SaleStatus.REJECTED).count(),
            "pending_withdrawals": withdrawal_query.filter(Withdrawal.status == WithdrawalStatus.PENDING).count(),
        }
        return {
            "summary": SaleService.summary_for_user(db, user=user_scope),
            "status_counts": status_counts,
            "recent_sales": sale_query.order_by(Sale.created_at.desc()).limit(5).all(),
            "recent_transactions": transaction_query.order_by(Transaction.created_at.desc()).limit(5).all(),
            "recent_withdrawals": withdrawal_query.order_by(Withdrawal.requested_at.desc()).limit(5).all(),
        }

