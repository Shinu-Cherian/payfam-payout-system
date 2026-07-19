from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.user import User
from app.models.enums import UserRole


class TransactionService:
    @staticmethod
    def list_transactions(db: Session, *, current_user: User, page: int = 1, page_size: int = 10) -> tuple[list[Transaction], int]:
        query = db.query(Transaction)
        if current_user.role != UserRole.ADMIN:
            query = query.filter(Transaction.user_id == current_user.id)
        total = query.count()
        items = query.order_by(Transaction.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

