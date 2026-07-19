from sqlalchemy.orm import Session

from app.models.enums import UserRole
from app.models.user import User
from app.utils.security import hash_password


def seed_database(db: Session) -> None:
    if db.query(User).first():
        return

    admin = User(
        email="admin@payfam.test",
        full_name="Admin Reviewer",
        role=UserRole.ADMIN,
        password_hash=hash_password("admin123"),
    )
    maya = User(
        email="maya@payfam.test",
        full_name="Maya Creator",
        role=UserRole.USER,
        password_hash=hash_password("user123"),
    )
    ravi = User(
        email="ravi@payfam.test",
        full_name="Ravi Affiliate",
        role=UserRole.USER,
        password_hash=hash_password("user123"),
    )
    db.add_all([admin, maya, ravi])
    db.commit()
