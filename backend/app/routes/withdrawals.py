from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.enums import WithdrawalStatus
from app.schemas.withdrawal import WithdrawalCreate, WithdrawalList, WithdrawalRead, WithdrawalStatusUpdate
from app.services.withdrawal_service import WithdrawalService
from app.utils.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/withdrawals", tags=["Withdrawals"])


@router.get("", response_model=WithdrawalList)
def list_withdrawals(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: WithdrawalStatus | None = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = WithdrawalService.list_withdrawals(
        db, current_user=current_user, page=page, page_size=page_size, status_filter=status
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=WithdrawalRead)
def create_withdrawal(payload: WithdrawalCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return WithdrawalService.create_withdrawal(db, user=current_user, amount=payload.amount)


@router.patch("/{withdrawal_id}/status", response_model=WithdrawalRead)
def update_withdrawal_status(
    withdrawal_id: int,
    payload: WithdrawalStatusUpdate,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    return WithdrawalService.update_status(
        db, actor=admin, withdrawal_id=withdrawal_id, new_status=payload.status, note=payload.note
    )

