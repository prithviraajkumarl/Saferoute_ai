from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.db.models.audit import AuditEvent, ProviderHealthEvent


class AuditRepository:
    def __init__(self, db: Session):
        self.db = db

    def log_event(
        self,
        action: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        details_json: Optional[str] = None,
    ) -> AuditEvent:
        event = AuditEvent(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            actor_id=actor_id,
            ip_address=ip_address,
            details_json=details_json,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def log_provider_health(
        self,
        provider_name: str,
        is_healthy: bool,
        response_time_ms: float,
        error_message: Optional[str] = None,
    ) -> ProviderHealthEvent:
        event = ProviderHealthEvent(
            provider_name=provider_name,
            is_healthy=is_healthy,
            response_time_ms=response_time_ms,
            error_message=error_message,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def list_audit_events(self, limit: int = 50) -> List[AuditEvent]:
        return list(self.db.execute(select(AuditEvent).order_by(desc(AuditEvent.created_at)).limit(limit)).scalars().all())

    def list_provider_health(self, limit: int = 20) -> List[ProviderHealthEvent]:
        return list(self.db.execute(select(ProviderHealthEvent).order_by(desc(ProviderHealthEvent.checked_at)).limit(limit)).scalars().all())
