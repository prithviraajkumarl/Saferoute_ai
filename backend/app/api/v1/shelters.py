from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.repositories.shelter_repo import ShelterRepository
from app.db.models.shelter import Shelter
from app.schemas.shelter import ShelterCreate, ShelterOut, ShelterCapacityUpdate
from app.api.dependencies import require_role
from app.core.permissions import UserRole
from app.db.models.user import User

router = APIRouter(prefix="/shelters", tags=["Shelters"])


@router.get("", response_model=List[ShelterOut])
def list_shelters(
    district: Optional[str] = None,
    status: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    repo = ShelterRepository(db)
    shelters = repo.list_shelters(district=district, status=status, lat=lat, lng=lng, limit=limit)
    out = []
    for s in shelters:
        occ_pct = round((s.current_occupancy / max(1, s.capacity)) * 100, 1)
        item = ShelterOut.model_validate(s)
        item.occupancy_percentage = occ_pct
        out.append(item)
    return out


@router.post("", response_model=ShelterOut)
def create_shelter(
    req: ShelterCreate,
    current_user: User = Depends(require_role([UserRole.ADMINISTRATOR, UserRole.RESPONDER])),
    db: Session = Depends(get_db),
):
    repo = ShelterRepository(db)
    shelter = Shelter(
        name=req.name,
        name_ta=req.name_ta,
        address=req.address,
        district=req.district,
        latitude=req.latitude,
        longitude=req.longitude,
        capacity=req.capacity,
        current_occupancy=req.current_occupancy,
        contact_phone=req.contact_phone,
        has_medical=req.has_medical,
        has_food=req.has_food,
        has_power_backup=req.has_power_backup,
        is_official=req.is_official,
    )
    saved = repo.create(shelter)
    res = ShelterOut.model_validate(saved)
    res.occupancy_percentage = round((saved.current_occupancy / max(1, saved.capacity)) * 100, 1)
    return res


@router.patch("/{shelter_id}/occupancy", response_model=ShelterOut)
def update_shelter_occupancy(
    shelter_id: str,
    req: ShelterCapacityUpdate,
    current_user: User = Depends(require_role([UserRole.RESPONDER, UserRole.ADMINISTRATOR])),
    db: Session = Depends(get_db),
):
    repo = ShelterRepository(db)
    updated = repo.update_occupancy(shelter_id, current_occupancy=req.current_occupancy, status=req.status)
    res = ShelterOut.model_validate(updated)
    res.occupancy_percentage = round((updated.current_occupancy / max(1, updated.capacity)) * 100, 1)
    return res
