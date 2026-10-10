import uuid
import secrets
from datetime import datetime, timezone
from sqlalchemy import String, Float, Integer, Boolean, ForeignKey, DateTime, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


def generate_sos_reference() -> str:
    suffix = secrets.token_hex(3).upper()
    return f"SOS-2026-{suffix}"


class Incident(Base, TimestampMixin):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference_code: Mapped[str] = mapped_column(String(32), unique=True, index=True, default=generate_sos_reference)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    address: Mapped[str] = mapped_column(String(512), nullable=True)
    
    severity: Mapped[str] = mapped_column(String(32), default="CRITICAL", nullable=False)  # ADVISORY, MODERATE, SEVERE, CRITICAL
    status: Mapped[str] = mapped_column(
        String(32),
        default="SUBMITTED",
        index=True,
        nullable=False,
    )  # SUBMITTED, ACKNOWLEDGED, ASSISTANCE_EN_ROUTE, RESOLVED, CANCELLED, UNABLE_TO_RESPOND
    
    contact_phone: Mapped[str] = mapped_column(String(32), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    person_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(128), unique=True, nullable=True, index=True)

    # Relationships
    user = relationship("User", back_populates="incidents", foreign_keys=[user_id])
    events = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan", order_by="IncidentEvent.created_at.asc()")
    assignments = relationship("IncidentAssignment", back_populates="incident", cascade="all, delete-orphan")
    public_updates = relationship("IncidentPublicUpdate", back_populates="incident", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_incident_status_created", "status", "created_at"),
    )


class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id: Mapped[str] = mapped_column(String(36), ForeignKey("incidents.id"), index=True, nullable=False)
    actor_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    from_status: Mapped[str] = mapped_column(String(32), nullable=True)
    to_status: Mapped[str] = mapped_column(String(32), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=True)
    is_internal: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # Internal responder notes hidden from tourists
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )

    incident = relationship("Incident", back_populates="events")
    actor = relationship("User", foreign_keys=[actor_id])


class IncidentAssignment(Base, TimestampMixin):
    __tablename__ = "incident_assignments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id: Mapped[str] = mapped_column(String(36), ForeignKey("incidents.id"), index=True, nullable=False)
    responder_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="ASSIGNED", nullable=False)  # ASSIGNED, EN_ROUTE, COMPLETED, REASSIGNED
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    incident = relationship("Incident", back_populates="assignments")
    responder = relationship("User", foreign_keys=[responder_id])


class IncidentPublicUpdate(Base):
    __tablename__ = "incident_public_updates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id: Mapped[str] = mapped_column(String(36), ForeignKey("incidents.id"), index=True, nullable=False)
    update_text: Mapped[str] = mapped_column(Text, nullable=False)
    broadcast_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    incident = relationship("Incident", back_populates="public_updates")
