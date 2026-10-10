from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.repositories.incident_repo import IncidentRepository
from app.db.models.incident import Incident
from app.schemas.incident import (
    IncidentCreate,
    IncidentOut,
    IncidentEventOut,
)
from app.schemas.common import PaginatedResponse
from app.api.dependencies import get_current_user_optional, get_current_user
from app.db.models.user import User

router = APIRouter(prefix="/incidents", tags=["SOS Incidents"])


@router.post("", response_model=IncidentOut)
def create_sos_incident(
    req: IncidentCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Submits emergency SOS beacon. Enforces idempotency to prevent duplicate triggers.
    Initial state is strictly SUBMITTED.
    """
    repo = IncidentRepository(db)

    # Check idempotency
    if req.idempotency_key:
        existing = repo.get_by_idempotency_key(req.idempotency_key)
        if existing:
            return filter_incident_privacy(existing, current_user)

    user_id = current_user.id if current_user else "anonymous-tourist"

    incident = Incident(
        user_id=user_id,
        latitude=req.latitude,
        longitude=req.longitude,
        address=req.address,
        severity=req.severity,
        status="SUBMITTED",
        contact_phone=req.contact_phone,
        description=req.description,
        person_count=req.person_count,
        is_simulated=req.is_simulated,
        idempotency_key=req.idempotency_key,
    )
    created = repo.create(incident, initial_note="Emergency SOS beacon broadcast")
    return filter_incident_privacy(created, current_user)


@router.get("/code/{reference_code}", response_model=IncidentOut)
def get_incident_by_reference_code(
    reference_code: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    repo = IncidentRepository(db)
    incident = repo.get_by_reference_code(reference_code)
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOS Incident reference not found.")
    return filter_incident_privacy(incident, current_user)


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident_by_id(
    incident_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    repo = IncidentRepository(db)
    incident = repo.get_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")

    # Access control: If tourist is logged in and not an admin/responder, enforce ownership
    if current_user and current_user.role == "tourist" and incident.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this incident.")

    return filter_incident_privacy(incident, current_user)


@router.get("", response_model=PaginatedResponse[IncidentOut])
def list_my_incidents(
    current_user: User = Depends(get_current_user),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    repo = IncidentRepository(db)
    offset = (page - 1) * page_size
    # Tourists only view their own incidents
    user_filter = current_user.id if current_user.role == "tourist" else None
    items, total = repo.list_incidents(user_id=user_filter, limit=page_size, offset=offset)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    sanitized = [filter_incident_privacy(i, current_user) for i in items]
    return PaginatedResponse[IncidentOut](
        items=sanitized,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


def filter_incident_privacy(incident: Incident, current_user: Optional[User]) -> IncidentOut:
    """Strips internal responder notes for non-responders / tourists."""
    out = IncidentOut.model_validate(incident)
    is_privileged = current_user and current_user.role in ["responder", "administrator"]
    if not is_privileged:
        out.events = [ev for ev in out.events if not ev.is_internal]
    return out
