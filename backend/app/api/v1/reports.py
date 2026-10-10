from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.repositories.hazard_repo import HazardRepository
from app.schemas.hazard import HazardModerateRequest, HazardOut
from app.schemas.common import PaginatedResponse
from app.api.dependencies import require_role
from app.core.permissions import UserRole
from app.db.models.user import User

router = APIRouter(prefix="/reports", tags=["Hazard Moderation"])


@router.post("/{hazard_id}/moderate", response_model=HazardOut)
def moderate_hazard_report(
    hazard_id: str,
    req: HazardModerateRequest,
    current_user: User = Depends(require_role([UserRole.RESPONDER, UserRole.ADMINISTRATOR])),
    db: Session = Depends(get_db),
):
    """Enforces server-side responder authorization for hazard verification and status transitions."""
    repo = HazardRepository(db)
    return repo.moderate(
        hazard_id=hazard_id,
        action=req.action,
        actor_id=current_user.id,
        note=req.note,
    )


@router.get("/queue", response_model=PaginatedResponse[HazardOut])
def get_moderation_queue(
    current_user: User = Depends(require_role([UserRole.RESPONDER, UserRole.ADMINISTRATOR])),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    repo = HazardRepository(db)
    offset = (page - 1) * page_size
    items, total = repo.list_hazards(status="PENDING_VERIFICATION", limit=page_size, offset=offset)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse[HazardOut](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
