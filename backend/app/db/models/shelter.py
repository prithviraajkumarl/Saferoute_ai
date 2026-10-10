import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Integer, Boolean, ForeignKey, DateTime, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class Shelter(Base, TimestampMixin):
    __tablename__ = "shelters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_ta: Mapped[str] = mapped_column(String(255), nullable=True)  # Tamil name for local population
    address: Mapped[str] = mapped_column(String(512), nullable=False)
    district: Mapped[str] = mapped_column(String(128), default="Chennai", index=True, nullable=False)
    
    latitude: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    
    capacity: Mapped[int] = mapped_column(Integer, default=200, nullable=False)
    current_occupancy: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="OPEN", index=True, nullable=False)  # OPEN, FULL, CLOSED
    
    has_medical: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    has_food: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    has_power_backup: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_official: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    verifications = relationship("ShelterVerification", back_populates="shelter", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_shelter_geo", "latitude", "longitude"),
    )


class ShelterVerification(Base):
    __tablename__ = "shelter_verifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    shelter_id: Mapped[str] = mapped_column(String(36), ForeignKey("shelters.id"), index=True, nullable=False)
    verified_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    verified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    shelter = relationship("Shelter", back_populates="verifications")
    verified_by = relationship("User", foreign_keys=[verified_by_id])
