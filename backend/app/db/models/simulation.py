import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class SimulationScenario(Base, TimestampMixin):
    __tablename__ = "simulation_scenarios"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    scenario_type: Mapped[str] = mapped_column(String(64), nullable=False)  # MONSOON_CYCLONE, FLASH_FLOOD, WATERLOGGING_ECR
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    runs = relationship("SimulationRun", back_populates="scenario", cascade="all, delete-orphan")


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scenario_id: Mapped[str] = mapped_column(String(36), ForeignKey("simulation_scenarios.id"), nullable=False)
    activated_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    stopped_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    scenario = relationship("SimulationScenario", back_populates="runs")
    activated_by = relationship("User", foreign_keys=[activated_by_id])
    simulated_hazards = relationship("SimulatedHazardEvent", back_populates="run", cascade="all, delete-orphan")


class SimulatedHazardEvent(Base):
    __tablename__ = "simulated_hazard_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey("simulation_runs.id"), nullable=False)
    hazard_id: Mapped[str] = mapped_column(String(36), ForeignKey("hazard_reports.id"), nullable=False)

    run = relationship("SimulationRun", back_populates="simulated_hazards")
    hazard = relationship("HazardReport")
