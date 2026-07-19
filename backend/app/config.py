from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "PayFam Payout Management"
    database_url: str = "sqlite:///./payfam.db"
    jwt_secret_key: str = "change-this-secret-for-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 8
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]


settings = Settings()

