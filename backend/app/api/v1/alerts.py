from typing import List
from fastapi import APIRouter, Query
from app.integrations.official_alerts.ndma_sachet import NdmaSachetClient
from app.schemas.alert import OfficialAlertOut
from app.core.config import settings

router = APIRouter(prefix="/alerts", tags=["Official Alerts"])

alerts_client = NdmaSachetClient()


@router.get("/active", response_model=List[OfficialAlertOut])
async def get_active_official_alerts(
    lat: float = Query(default=settings.DEFAULT_LAT, ge=-90.0, le=90.0),
    lng: float = Query(default=settings.DEFAULT_LNG, ge=-180.0, le=180.0),
    district: str = Query(default="Chennai"),
):
    """Retrieves authoritative NDMA SACHET and TNSDMA coastal emergency bulletins."""
    return await alerts_client.get_active_alerts(lat, lng, district)
