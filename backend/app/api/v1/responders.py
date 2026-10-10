from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.repositories.incident_repo import IncidentRepository
from app.schemas.incident import (
    IncidentOut,
    IncidentTransitionRequest,
    IncidentAssignmentCreate,
    IncidentAssignmentOut,
    IncidentPublicUpdateCreate,
    IncidentPublicUpdateOut,
)
from app.schemas.common import PaginatedResponse
from app.api.dependencies import require_role
from app.core.permissions import UserRole
from app.db.models.user import User

router = APIRouter(prefix="/responders", tags=["Responder Operations"])


@router.get("/queue", response_model=PaginatedResponse[IncidentOut])
def get_responder_incident_queue(
    status: Optional[str] = None,
    is_simulated: Optional[bool] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(require_role([UserRole.RESPONDER, UserRole.ADMINISTRATOR])),
    db: Session = Depends(get_db),
):
    """Retrieves operational incident triage queue for responders with full internal notes."""
    repo = IncidentRepository(db)
    offset = (page - 1) * page_size
    items, total = repo.list_incidents(
        status=status,
        is_simulated=is_simulated,
        limit=page_size,
        offset=offset,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse[IncidentOut](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/incidents/{incident_id}/transition", response_model=IncidentOut)
def transition_incident_state(
    incident_id: str,
    req: IncidentTransitionRequest,
    current_user: User = Depends(require_role([UserRole.RESPONDER, UserRole.ADMINISTRATOR])),
    db: Session = Depends(get_db),
):
    """
    Enforces atomic server-side state transitions (SUBMITTED -> ACKNOWLEDGED -> ASSISTANCE_EN_ROUTE -> RESOLVED).
    Writes immutable audit history event atomically with status update.
    """
    repo = IncidentRepository(db)
    return repo.transition_state(
        incident_id=incident_id,
        to_status=req.to_status,
        actor_id=current_user.id,
        note=req.note,
        is_internal=req.is_internal,
    )


@router.post("/incidents/{incident_id}/assign", response_model=IncidentAssignmentOut)
def assign_responder(
    incident_id: str,
    req: IncidentAssignmentCreate,
    current_user: User = Depends(require_role([UserRole.RESPONDER, UserRole.ADMINISTRATOR])),
    db: Session = Depends(get_db),
):
    repo = IncidentRepository(db)
    assignment = repo.assign_responder(
        incident_id=incident_id,
        responder_id=req.responder_id,
        notes=req.notes,
    )
    res = IncidentAssignmentOut.model_validate(assignment)
    res.responder_name = current_user.full_name
    return res


@router.post("/incidents/{incident_id}/broadcast", response_model=IncidentPublicUpdateOut)
def broadcast_public_update(
    incident_id: str,
    req: IncidentPublicUpdateCreate,
    current_user: User = Depends(require_role([UserRole.RESPONDER, UserRole.ADMINISTRATOR])),
    db: Session = Depends(get_db),
):
    repo = IncidentRepository(db)
    return repo.add_public_update(incident_id=incident_id, update_text=req.update_text)
