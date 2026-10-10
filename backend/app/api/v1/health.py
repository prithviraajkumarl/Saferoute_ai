import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health & Diagnostics"])


@router.get("")
@router.get("/")
def get_health(db: Session = Depends(get_db)):
    """Default health check returning operational readiness and database connectivity."""
    return get_readiness(db)


@router.get("/liveness")
def get_liveness():
    """Confirms the FastAPI application process is alive and accepting traffic."""
    return {
        "status": "UP",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": time.time(),
    }


@router.get("/readiness")
def get_readiness(db: Session = Depends(get_db)):
    """Verifies critical database connectivity and operational dependencies."""
    db_status = "UNKNOWN"
    db_latency_ms = 0.0

    start = time.perf_counter()
    try:
        db.execute(text("SELECT 1"))
        db_latency_ms = round((time.perf_counter() - start) * 1000, 2)
        db_status = "HEALTHY"
    except Exception as e:
        db_status = f"UNHEALTHY: {str(e)}"

    return {
        "status": "READY" if db_status == "HEALTHY" else "DEGRADED",
        "database": {
            "status": db_status,
            "latency_ms": db_latency_ms,
            "engine": "PostgreSQL/SQLite",
        },
        "redis_cache": {
            "status": "IN_MEMORY_FALLBACK",
            "note": "Graceful in-memory cache active for zero-downtime operation",
        },
        "environment": settings.ENVIRONMENT,
        "risk_engine_version": settings.RISK_ENGINE_VERSION,
    }
