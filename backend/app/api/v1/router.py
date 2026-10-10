from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.weather import router as weather_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.routes import router as routes_router
from app.api.v1.hazards import router as hazards_router
from app.api.v1.reports import router as reports_router
from app.api.v1.shelters import router as shelters_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.responders import router as responders_router
from app.api.v1.simulations import router as simulations_router
from app.api.v1.guidance import router as guidance_router
from app.api.v1.admin import router as admin_router

api_v1_router = APIRouter()

api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(weather_router)
api_v1_router.include_router(alerts_router)
api_v1_router.include_router(routes_router)
api_v1_router.include_router(hazards_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(shelters_router)
api_v1_router.include_router(incidents_router)
api_v1_router.include_router(responders_router)
api_v1_router.include_router(simulations_router)
api_v1_router.include_router(guidance_router)
api_v1_router.include_router(admin_router)
