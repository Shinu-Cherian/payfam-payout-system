from pydantic import BaseModel

from app.models.enums import UserRole
from app.schemas.common import ORMModel


class LoginRequest(BaseModel):
    email: str
    password: str


class UserProfile(ORMModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    withdrawable_balance: float


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
