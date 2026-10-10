from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from app.db.models.incident import Incident, IncidentEvent, IncidentAssignment, IncidentPublicUpdate
from app.core.exceptions import IncidentStateTransitionError, EntityNotFoundError


class IncidentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, incident_id: str) -> Optional[Incident]:
        return self.db.execute(select(Incident).where(Incident.id == incident_id)).scalar_one_or_none()

    def get_by_reference_code(self, reference_code: str) -> Optional[Incident]:
        return self.db.execute(select(Incident).where(Incident.reference_code == reference_code.strip().upper())).scalar_one_or_none()

    def get_by_idempotency_key(self, idempotency_key: str) -> Optional[Incident]:
        if not idempotency_key:
            return None
        return self.db.execute(select(Incident).where(Incident.idempotency_key == idempotency_key)).scalar_one_or_none()

    def create(self, incident: Incident, initial_note: Optional[str] = "Emergency SOS created by user") -> Incident:
        # Atomic commit of incident creation and initial event
        self.db.add(incident)
        self.db.flush()  # obtain incident.id

        event = IncidentEvent(
            incident_id=incident.id,
            actor_id=incident.user_id,
            from_status=None,
            to_status=incident.status,
            note=initial_note,
            is_internal=False,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(incident)
        return incident

    def transition_state(
        self,
        incident_id: str,
        to_status: str,
        actor_id: str,
        note: Optional[str] = None,
        is_internal: bool = False,
    ) -> Incident:
        incident = self.get_by_id(incident_id)
        if not incident:
            raise EntityNotFoundError("Incident", incident_id)

        # Enforce server-side valid state transitions
        valid_transitions = {
            "SUBMITTED": ["ACKNOWLEDGED", "CANCELLED", "UNABLE_TO_RESPOND"],
            "ACKNOWLEDGED": ["ASSISTANCE_EN_ROUTE", "RESOLVED", "CANCELLED", "UNABLE_TO_RESPOND"],
            "ASSISTANCE_EN_ROUTE": ["RESOLVED", "UNABLE_TO_RESPOND", "CANCELLED"],
            "RESOLVED": [],  # Terminal state
            "CANCELLED": [],  # Terminal state
            "UNABLE_TO_RESPOND": ["ACKNOWLEDGED"],  # Can re-open if resources arrive
        }

        current = incident.status
        allowed = valid_transitions.get(current, [])
        if to_status not in allowed:
            raise IncidentStateTransitionError(
                current_state=current,
                attempted_state=to_status,
                reason=f"Permitted next transitions from '{current}' are: {', '.join(allowed) if allowed else 'None (Terminal state)'}"
            )

        # Atomic state change and event log
        from_status = incident.status
        incident.status = to_status
        self.db.add(incident)

        event = IncidentEvent(
            incident_id=incident.id,
            actor_id=actor_id,
            from_status=from_status,
            to_status=to_status,
            note=note,
            is_internal=is_internal,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(incident)
        return incident

    def assign_responder(self, incident_id: str, responder_id: str, notes: Optional[str] = None) -> IncidentAssignment:
        incident = self.get_by_id(incident_id)
        if not incident:
            raise EntityNotFoundError("Incident", incident_id)

        assignment = IncidentAssignment(
            incident_id=incident_id,
            responder_id=responder_id,
            status="ASSIGNED",
        )
        self.db.add(assignment)
        
        # Also auto-log as internal event
        event = IncidentEvent(
            incident_id=incident_id,
            actor_id=responder_id,
            from_status=incident.status,
            to_status=incident.status,
            note=f"Assigned to responder {responder_id}. {notes or ''}".strip(),
            is_internal=True,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def add_public_update(self, incident_id: str, update_text: str) -> IncidentPublicUpdate:
        incident = self.get_by_id(incident_id)
        if not incident:
            raise EntityNotFoundError("Incident", incident_id)

        pub_update = IncidentPublicUpdate(
            incident_id=incident_id,
            update_text=update_text,
        )
        self.db.add(pub_update)
        self.db.commit()
        self.db.refresh(pub_update)
        return pub_update

    def list_incidents(
        self,
        status: Optional[str] = None,
        user_id: Optional[str] = None,
        is_simulated: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Incident], int]:
        query = select(Incident)
        count_query = select(func.count(Incident.id))

        if status:
            query = query.where(Incident.status == status)
            count_query = count_query.where(Incident.status == status)
        if user_id:
            query = query.where(Incident.user_id == user_id)
            count_query = count_query.where(Incident.user_id == user_id)
        if is_simulated is not None:
            query = query.where(Incident.is_simulated == is_simulated)
            count_query = count_query.where(Incident.is_simulated == is_simulated)

        total = self.db.execute(count_query).scalar_one()
        query = query.order_by(desc(Incident.created_at)).limit(limit).offset(offset)
        items = list(self.db.execute(query).scalars().all())
        return items, total
