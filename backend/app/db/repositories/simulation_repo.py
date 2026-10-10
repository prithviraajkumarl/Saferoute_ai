from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.models.simulation import SimulationScenario, SimulationRun, SimulatedHazardEvent
from app.db.models.hazard import HazardReport
from app.core.exceptions import EntityNotFoundError


class SimulationRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_scenarios(self) -> List[SimulationScenario]:
        return list(self.db.execute(select(SimulationScenario)).scalars().all())

    def get_scenario(self, scenario_id: str) -> Optional[SimulationScenario]:
        return self.db.execute(select(SimulationScenario).where(SimulationScenario.id == scenario_id)).scalar_one_or_none()

    def create_scenario(self, scenario: SimulationScenario) -> SimulationScenario:
        self.db.add(scenario)
        self.db.commit()
        self.db.refresh(scenario)
        return scenario

    def toggle_simulation(self, scenario_id: str, activate: bool, user_id: str, notes: Optional[str] = None) -> SimulationRun:
        scenario = self.get_scenario(scenario_id)
        if not scenario:
            raise EntityNotFoundError("SimulationScenario", scenario_id)

        scenario.is_active = activate
        self.db.add(scenario)

        run = SimulationRun(
            scenario_id=scenario_id,
            activated_by_id=user_id,
            notes=notes or f"Simulation {'activated' if activate else 'deactivated'}",
        )
        if not activate:
            run.stopped_at = datetime.now(timezone.utc)

        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def list_runs(self, limit: int = 20) -> List[SimulationRun]:
        return list(self.db.execute(select(SimulationRun).order_by(SimulationRun.started_at.desc()).limit(limit)).scalars().all())
