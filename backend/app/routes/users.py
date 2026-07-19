from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.auth import UserProfile
from app.utils.dependencies import require_admin

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=list[UserProfile])
def list_payout_users(_admin=Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == UserRole.USER).order_by(User.full_name.asc()).all()

