import uuid
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(32), nullable=True)
    role: Mapped[str] = mapped_column(String(32), default="tourist", index=True, nullable=False)  # tourist, responder, administrator
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    incidents = relationship("Incident", back_populates="user", cascade="all, delete-orphan", foreign_keys="Incident.user_id")
    hazard_reports = relationship("HazardReport", back_populates="reporter", cascade="all, delete-orphan", foreign_keys="HazardReport.reporter_id")
