from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.database import Base, SessionLocal, engine
from app.database.seed import seed_database
from app.routes import audit_logs, auth, dashboard, payouts, sales, transactions, users, withdrawals

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(sales.router, prefix="/api")
app.include_router(payouts.router, prefix="/api")
app.include_router(withdrawals.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(audit_logs.router, prefix="/api")
