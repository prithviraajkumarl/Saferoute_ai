import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Integer, Boolean, ForeignKey, DateTime, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class RouteAssessment(Base, TimestampMixin):
    __tablename__ = "route_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    origin_lat: Mapped[float] = mapped_column(Float, nullable=False)
    origin_lng: Mapped[float] = mapped_column(Float, nullable=False)
    destination_lat: Mapped[float] = mapped_column(Float, nullable=False)
    destination_lng: Mapped[float] = mapped_column(Float, nullable=False)
    
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0 to 100 heuristic
    risk_category: Mapped[str] = mapped_column(String(32), index=True, nullable=False)  # LOW, MODERATE, HIGH, CRITICAL
    engine_version: Mapped[str] = mapped_column(String(32), nullable=False)
    
    distance_meters: Mapped[float] = mapped_column(Float, nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    geometry_json: Mapped[str] = mapped_column(Text, nullable=False)  # GeoJSON LineString coordinates
    
    summary_en: Mapped[str] = mapped_column(Text, nullable=False)
    summary_ta: Mapped[str] = mapped_column(Text, nullable=True)  # Tamil explanation
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)

    evidences = relationship("RouteAssessmentEvidence", back_populates="assessment", cascade="all, delete-orphan")


class RouteAssessmentEvidence(Base):
    __tablename__ = "route_assessment_evidence"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id: Mapped[str] = mapped_column(String(36), ForeignKey("route_assessments.id"), index=True, nullable=False)
    hazard_type: Mapped[str] = mapped_column(String(64), nullable=False)
    proximity_meters: Mapped[float] = mapped_column(Float, nullable=False)
    severity: Mapped[str] = mapped_column(String(32), nullable=False)
    verification_status: Mapped[str] = mapped_column(String(32), nullable=False)
    source: Mapped[str] = mapped_column(String(64), nullable=False)
    source_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    factor_weight: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    assessment = relationship("RouteAssessment", back_populates="evidences")


class DataSnapshot(Base):
    __tablename__ = "data_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    provider_name: Mapped[str] = mapped_column(String(64), index=True, nullable=False)  # OPEN_METEO, NDMA_SACHET, OSRM
    endpoint: Mapped[str] = mapped_column(String(512), nullable=False)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="SUCCESS", nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )
