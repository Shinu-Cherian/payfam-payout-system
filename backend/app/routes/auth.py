from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse, UserProfile
from app.services.auth_service import AuthService
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    token, user = AuthService.login(db, email=payload.email, password=payload.password)
    return {"access_token": token, "user": UserProfile.model_validate(user)}


@router.get("/me", response_model=UserProfile)
def me(current_user=Depends(get_current_user)):
    return current_user

