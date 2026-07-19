from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.utils.security import create_access_token, verify_password


class AuthService:
    @staticmethod
    def login(db: Session, *, email: str, password: str) -> tuple[str, User]:
        user = db.query(User).filter(User.email == email.lower()).first()
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        token = create_access_token(str(user.id))
        return token, user

