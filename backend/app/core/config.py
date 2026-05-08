"""Application configuration using Pydantic Settings."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # App
    APP_NAME: str = "HyperScale"
    APP_ENV: str = "development"
    DEBUG: bool = False
    
    # Security
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    BASE_URL: str = "http://localhost:8000"
    SHORT_URL_DOMAIN: str = "http://localhost:8000"
    
    # Database
    DATABASE_URL: str
    SYNC_DATABASE_URL: str
    
    # Redis
    REDIS_URL: str
    
    # Celery
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str
    
    # CORS - Accept comma-separated string
    CORS_ORIGINS: str = "http://localhost:3000"
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # URL shortening
    SHORT_URL_LENGTH: int = 7

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()