from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "MediClinic - Medical Management System"
    APP_VERSION: str = "2.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "sqlite:////home/nacho/Trainity/backend/mediclinic.db"  # SQLite for local development
    
    # Security - MUST be set in .env or environment variables
    SECRET_KEY: str = "dev-secret-key-minimum-32-chars-longsecure-change-this"  # Default for development
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # Reduced from 1440 to 15 minutes
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
    ]
    
    # Features
    ENABLE_AUDIT_LOGGING: bool = True
    ENABLE_2FA: bool = False
    MAX_LOGIN_ATTEMPTS: int = 5
    
    # Email (for future notifications)
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str = "noreply@mediclinic.app"
    
    # Stripe (for future payments)
    STRIPE_API_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None

    # LLM providers
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-4.1"
    ANTHROPIC_API_KEY: str | None = None
    ANTHROPIC_MODEL: str = "claude-sonnet-4-5"
    LLM_TIMEOUT_SECONDS: float = 30.0

    @field_validator("DEBUG", mode="before")
    @classmethod
    def normalize_debug(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "prod", "production"}:
                return False
            if normalized in {"debug", "dev", "development"}:
                return True
        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()
