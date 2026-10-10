import math
from typing import Optional, List, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from app.db.models.hazard import HazardReport, HazardReportEvent
from app.core.exceptions import EntityNotFoundError


class HazardRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, hazard_id: str) -> Optional[HazardReport]:
        return self.db.execute(select(HazardReport).where(HazardReport.id == hazard_id)).scalar_one_or_none()

    def create(self, hazard: HazardReport) -> HazardReport:
        self.db.add(hazard)
        self.db.flush()

        event = HazardReportEvent(
            hazard_id=hazard.id,
            actor_id=hazard.reporter_id or "anonymous",
            action="SUBMIT",
            note=f"Reported hazard {hazard.hazard_type} with severity {hazard.severity}",
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(hazard)
        return hazard

    def moderate(self, hazard_id: str, action: str, actor_id: str, note: Optional[str] = None) -> HazardReport:
        hazard = self.get_by_id(hazard_id)
        if not hazard:
            raise EntityNotFoundError("HazardReport", hazard_id)

        action_status_map = {
            "VERIFY": "VERIFIED",
            "REJECT": "REJECTED",
            "RESOLVE": "RESOLVED",
        }
        new_status = action_status_map.get(action.upper(), "VERIFIED")
        hazard.status = new_status
        if new_status == "VERIFIED":
            hazard.verified_by_id = actor_id
        self.db.add(hazard)

        event = HazardReportEvent(
            hazard_id=hazard.id,
            actor_id=actor_id,
            action=action.upper(),
            note=note,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(hazard)
        return hazard

    def upvote(self, hazard_id: str, actor_id: str) -> HazardReport:
        hazard = self.get_by_id(hazard_id)
        if not hazard:
            raise EntityNotFoundError("HazardReport", hazard_id)

        hazard.upvotes += 1
        self.db.add(hazard)

        event = HazardReportEvent(
            hazard_id=hazard.id,
            actor_id=actor_id,
            action="UPVOTE",
            note=f"Upvoted. Total upvotes now {hazard.upvotes}",
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(hazard)
        return hazard

    def list_hazards(
        self,
        status: Optional[str] = None,
        hazard_type: Optional[str] = None,
        is_simulated: Optional[bool] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius_km: Optional[float] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Tuple[List[HazardReport], int]:
        query = select(HazardReport)
        count_query = select(func.count(HazardReport.id))

        if status:
            query = query.where(HazardReport.status == status)
            count_query = count_query.where(HazardReport.status == status)
        if hazard_type:
            query = query.where(HazardReport.hazard_type == hazard_type)
            count_query = count_query.where(HazardReport.hazard_type == hazard_type)
        if is_simulated is not None:
            query = query.where(HazardReport.is_simulated == is_simulated)
            count_query = count_query.where(HazardReport.is_simulated == is_simulated)

        # Haversine / bounding box filtering in Python or DB
        if lat is not None and lng is not None and radius_km is not None:
            lat_delta = radius_km / 111.0
            lng_delta = radius_km / (111.0 * max(0.1, math.cos(math.radians(lat))))
            query = query.where(
                HazardReport.latitude.between(lat - lat_delta, lat + lat_delta),
                HazardReport.longitude.between(lng - lng_delta, lng + lng_delta)
            )
            count_query = count_query.where(
                HazardReport.latitude.between(lat - lat_delta, lat + lat_delta),
                HazardReport.longitude.between(lng - lng_delta, lng + lng_delta)
            )

        total = self.db.execute(count_query).scalar_one()
        query = query.order_by(desc(HazardReport.created_at)).limit(limit).offset(offset)
        items = list(self.db.execute(query).scalars().all())
        return items, total
