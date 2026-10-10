from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import logger
from app.core.middleware import RequestTrackingMiddleware
from app.api.v1.router import api_v1_router
from app.db.base import Base
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Safe startup initialization: create tables if they do not exist
    logger.info("Initializing SafeRoute AI database schema...")
    try:
        # Import all models to ensure metadata registration
        import app.db.models  # noqa
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema verification complete.")
    except Exception as e:
        logger.error(f"Error initializing database schema: {e}")
    yield
    logger.info("SafeRoute AI service shutting down cleanly.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Tactical Mission-Control Disaster Route-Risk Assessment & Multi-Agency Emergency Response Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Request Tracking and Timing Middleware
app.add_middleware(RequestTrackingMiddleware)

# Mount API v1
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health/readiness",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
