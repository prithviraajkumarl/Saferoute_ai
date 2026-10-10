import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Integer, Boolean, ForeignKey, DateTime, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class HazardReport(Base, TimestampMixin):
    __tablename__ = "hazard_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reporter_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True, nullable=True)
    hazard_type: Mapped[str] = mapped_column(String(64), index=True, nullable=False)  # flood, road_closure, fallen_tree, landslide, tidal_surge, powerline
    latitude: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    severity: Mapped[str] = mapped_column(String(32), default="MODERATE", nullable=False)  # ADVISORY, MODERATE, SEVERE, CRITICAL
    description: Mapped[str] = mapped_column(Text, nullable=True)
    
    status: Mapped[str] = mapped_column(
        String(32),
        default="PENDING_VERIFICATION",
        index=True,
        nullable=False,
    )  # PENDING_VERIFICATION, VERIFIED, REJECTED, RESOLVED

    upvotes: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    verified_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    source: Mapped[str] = mapped_column(String(64), default="COMMUNITY", nullable=False)  # COMMUNITY, NDMA_OFFICIAL, IMD, TRAFFIC_POLICE, SIMULATION
    source_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="hazard_reports")
    verified_by = relationship("User", foreign_keys=[verified_by_id])
    events = relationship("HazardReportEvent", back_populates="hazard", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_hazard_geo", "latitude", "longitude"),
        Index("idx_hazard_status_type", "status", "hazard_type"),
    )


class HazardReportEvent(Base):
    __tablename__ = "hazard_report_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hazard_id: Mapped[str] = mapped_column(String(36), ForeignKey("hazard_reports.id"), index=True, nullable=False)
    actor_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)  # SUBMIT, VERIFY, REJECT, RESOLVE, UPVOTE
    note: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    hazard = relationship("HazardReport", back_populates="events")
    actor = relationship("User", foreign_keys=[actor_id])
