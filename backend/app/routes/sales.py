from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.enums import SaleStatus
from app.schemas.sale import ReconciliationRequest, SaleCreate, SaleList, SaleRead
from app.services.sale_service import SaleService
from app.utils.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.get("", response_model=SaleList)
def list_sales(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: SaleStatus | None = None,
    search: str | None = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = SaleService.list_sales(
        db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        status_filter=status,
        search=search,
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=SaleRead)
def create_sale(payload: SaleCreate, admin=Depends(require_admin), db: Session = Depends(get_db)):
    return SaleService.create_sale(db, actor=admin, payload=payload)


@router.patch("/{sale_id}/reconcile", response_model=SaleRead)
def reconcile_sale(sale_id: int, payload: ReconciliationRequest, admin=Depends(require_admin), db: Session = Depends(get_db)):
    return SaleService.reconcile_sale(db, actor=admin, sale_id=sale_id, decision=payload.status)

