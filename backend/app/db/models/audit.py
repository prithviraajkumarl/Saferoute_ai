import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Boolean, ForeignKey, DateTime, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)  # INCIDENT, HAZARD, SHELTER, SIMULATION, AUTH
    entity_id: Mapped[str] = mapped_column(String(64), nullable=True)
    ip_address: Mapped[str] = mapped_column(String(64), nullable=True)
    details_json: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )

    actor = relationship("User", foreign_keys=[actor_id])


class ProviderHealthEvent(Base):
    __tablename__ = "provider_health_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    provider_name: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    is_healthy: Mapped[bool] = mapped_column(Boolean, nullable=False)
    response_time_ms: Mapped[float] = mapped_column(Float, nullable=False)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )
