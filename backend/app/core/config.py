import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "SafeRoute AI"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database: Defaults to SQLite in local workspace for immediate zero-config run, or PostgreSQL/PostGIS in Docker
    DATABASE_URL: str = Field(
        default="sqlite:///./saferoute.db",
        description="SQLAlchemy Database URL (supports postgresql+psycopg2://... with PostGIS or sqlite:///...)"
    )

    # Redis (Optional cache and broker, system gracefully degrades if not available)
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"
    CACHE_EXPIRATION_SECONDS: int = 600

    # Security
    SECRET_KEY: str = "saferoute-super-secret-tactical-production-key-2026-secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # External Provider Endpoints
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    OSRM_BASE_URL: str = "https://router.project-osrm.org"
    NOMINATIM_BASE_URL: str = "https://nominatim.openstreetmap.org"
    NDMA_SACHET_ENDPOINT: str = "https://sachet.ndma.gov.in/cap_api"

    # Default Region Focus (Chennai / Tamil Nadu coastal corridor)
    DEFAULT_LAT: float = 13.0827
    DEFAULT_LNG: float = 80.2707

    # Risk Engine Parameters
    RISK_ENGINE_VERSION: str = "2.1.0"
    HAZARD_BUFFER_METERS: float = 1200.0  # Buffer corridor around route paths
    STALE_HAZARD_HOURS: int = 24

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
