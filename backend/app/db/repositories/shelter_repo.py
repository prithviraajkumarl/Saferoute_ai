import math
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.db.models.shelter import Shelter, ShelterVerification
from app.core.exceptions import EntityNotFoundError


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class ShelterRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, shelter_id: str) -> Optional[Shelter]:
        return self.db.execute(select(Shelter).where(Shelter.id == shelter_id)).scalar_one_or_none()

    def create(self, shelter: Shelter) -> Shelter:
        self.db.add(shelter)
        self.db.commit()
        self.db.refresh(shelter)
        return shelter

    def update_occupancy(self, shelter_id: str, current_occupancy: int, status: Optional[str] = None) -> Shelter:
        shelter = self.get_by_id(shelter_id)
        if not shelter:
            raise EntityNotFoundError("Shelter", shelter_id)

        shelter.current_occupancy = current_occupancy
        if status:
            shelter.status = status
        elif shelter.current_occupancy >= shelter.capacity:
            shelter.status = "FULL"
        else:
            shelter.status = "OPEN"

        self.db.add(shelter)
        self.db.commit()
        self.db.refresh(shelter)
        return shelter

    def list_shelters(
        self,
        district: Optional[str] = None,
        status: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        limit: int = 50,
    ) -> List[Shelter]:
        query = select(Shelter)
        if district:
            query = query.where(Shelter.district.ilike(f"%{district}%"))
        if status:
            query = query.where(Shelter.status == status)

        shelters = list(self.db.execute(query).scalars().all())

        # If lat and lng are provided, sort by nearest distance
        if lat is not None and lng is not None:
            shelters.sort(key=lambda s: haversine_km(lat, lng, s.latitude, s.longitude))

        return shelters[:limit]
