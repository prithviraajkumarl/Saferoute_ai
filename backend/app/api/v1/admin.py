from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, select
from app.db.session import get_db
from app.db.repositories.audit_repo import AuditRepository
from app.db.models.incident import Incident
from app.db.models.hazard import HazardReport
from app.db.models.shelter import Shelter
from app.db.models.simulation import SimulationScenario
from app.api.dependencies import require_role
from app.core.permissions import UserRole
from app.db.models.user import User

router = APIRouter(prefix="/admin", tags=["System Administration"])


@router.get("/metrics")
def get_system_metrics(
    current_user: User = Depends(require_role([UserRole.ADMINISTRATOR])),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    total_incidents = db.execute(select(func.count(Incident.id))).scalar_one()
    active_incidents = db.execute(select(func.count(Incident.id)).where(Incident.status.in_(["SUBMITTED", "ACKNOWLEDGED", "ASSISTANCE_EN_ROUTE"]))).scalar_one()
    total_hazards = db.execute(select(func.count(HazardReport.id))).scalar_one()
    verified_hazards = db.execute(select(func.count(HazardReport.id)).where(HazardReport.status == "VERIFIED")).scalar_one()
    total_shelters = db.execute(select(func.count(Shelter.id))).scalar_one()
    open_shelters = db.execute(select(func.count(Shelter.id)).where(Shelter.status == "OPEN")).scalar_one()
    active_scenarios = db.execute(select(func.count(SimulationScenario.id)).where(SimulationScenario.is_active == True)).scalar_one()

    return {
        "incidents": {
            "total": total_incidents,
            "active_unresolved": active_incidents,
        },
        "hazards": {
            "total": total_hazards,
            "verified": verified_hazards,
        },
        "shelters": {
            "total": total_shelters,
            "open": open_shelters,
        },
        "simulations": {
            "active_drills": active_scenarios,
        },
    }


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(require_role([UserRole.ADMINISTRATOR])),
    db: Session = Depends(get_db),
):
    repo = AuditRepository(db)
    return repo.list_audit_events(limit=limit)


@router.get("/provider-health")
def get_provider_health_history(
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_role([UserRole.ADMINISTRATOR])),
    db: Session = Depends(get_db),
):
    repo = AuditRepository(db)
    return repo.list_provider_health(limit=limit)
