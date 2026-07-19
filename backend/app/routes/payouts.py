from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.payout import AdvancePayoutRequest, AdvancePayoutRunResult
from app.services.payout_service import PayoutService
from app.utils.dependencies import require_admin

router = APIRouter(prefix="/payouts", tags=["Advance Payout"])


@router.post("/advance", response_model=AdvancePayoutRunResult)
def run_advance_payout(payload: AdvancePayoutRequest, admin=Depends(require_admin), db: Session = Depends(get_db)):
    payouts, total = PayoutService.run_advance_payout(db, actor=admin, sale_id=payload.sale_id)
    return {"processed_count": len(payouts), "total_amount": total, "payouts": payouts}

