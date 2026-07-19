from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.transaction import TransactionList
from app.services.transaction_service import TransactionService
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("", response_model=TransactionList)
def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = TransactionService.list_transactions(db, current_user=current_user, page=page, page_size=page_size)
    return {"items": items, "total": total, "page": page, "page_size": page_size}

