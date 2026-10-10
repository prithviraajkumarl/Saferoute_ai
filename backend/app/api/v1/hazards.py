from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.repositories.hazard_repo import HazardRepository
from app.db.models.hazard import HazardReport
from app.schemas.hazard import HazardCreate, HazardOut
from app.schemas.common import PaginatedResponse
from app.api.dependencies import get_current_user_optional, get_current_user

router = APIRouter(prefix="/hazards", tags=["Hazard Reports"])


@router.post("", response_model=HazardOut)
def report_hazard(
    req: HazardCreate,
    current_user = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    repo = HazardRepository(db)
    user_id = current_user.id if current_user else None

    # Official users reporting automatically get VERIFIED status
    is_official = current_user and current_user.role in ["responder", "administrator"]
    status_val = "VERIFIED" if is_official else "PENDING_VERIFICATION"

    hazard = HazardReport(
        reporter_id=user_id,
        hazard_type=req.hazard_type,
        latitude=req.latitude,
        longitude=req.longitude,
        severity=req.severity,
        description=req.description,
        status=status_val,
        source="OFFICIAL" if is_official else req.source,
        is_simulated=req.is_simulated,
        verified_by_id=user_id if is_official else None,
    )
    return repo.create(hazard)


@router.get("", response_model=PaginatedResponse[HazardOut])
def list_hazards(
    status: Optional[str] = None,
    hazard_type: Optional[str] = None,
    is_simulated: Optional[bool] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    repo = HazardRepository(db)
    offset = (page - 1) * page_size
    items, total = repo.list_hazards(
        status=status,
        hazard_type=hazard_type,
        is_simulated=is_simulated,
        lat=lat,
        lng=lng,
        radius_km=radius_km,
        limit=page_size,
        offset=offset,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse[HazardOut](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/{hazard_id}/upvote", response_model=HazardOut)
def upvote_hazard(
    hazard_id: str,
    current_user = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    repo = HazardRepository(db)
    actor_id = current_user.id if current_user else "anonymous"
    return repo.upvote(hazard_id, actor_id=actor_id)
