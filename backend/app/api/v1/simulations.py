from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.repositories.simulation_repo import SimulationRepository
from app.schemas.simulation import (
    ScenarioOut,
    ScenarioCreate,
    SimulationToggleRequest,
    SimulationRunOut,
)
from app.api.dependencies import require_role
from app.core.permissions import UserRole
from app.db.models.user import User
from app.db.models.simulation import SimulationScenario

router = APIRouter(prefix="/simulations", tags=["Disaster Simulation Drills"])


@router.get("/scenarios", response_model=List[ScenarioOut])
def list_scenarios(db: Session = Depends(get_db)):
    repo = SimulationRepository(db)
    return repo.list_scenarios()


@router.post("/scenarios", response_model=ScenarioOut)
def create_scenario(
    req: ScenarioCreate,
    current_user: User = Depends(require_role([UserRole.ADMINISTRATOR])),
    db: Session = Depends(get_db),
):
    repo = SimulationRepository(db)
    scenario = SimulationScenario(
        name=req.name,
        description=req.description,
        scenario_type=req.scenario_type,
        is_active=False,
    )
    return repo.create_scenario(scenario)


@router.post("/toggle", response_model=SimulationRunOut)
def toggle_simulation(
    req: SimulationToggleRequest,
    current_user: User = Depends(require_role([UserRole.ADMINISTRATOR, UserRole.RESPONDER])),
    db: Session = Depends(get_db),
):
    """Activates or stops simulated disaster drill without polluting live production data."""
    repo = SimulationRepository(db)
    run = repo.toggle_simulation(
        scenario_id=req.scenario_id,
        activate=req.activate,
        user_id=current_user.id,
        notes=req.notes,
    )
    res = SimulationRunOut.model_validate(run)
    scenario = repo.get_scenario(req.scenario_id)
    if scenario:
        res.scenario_name = scenario.name
    return res


@router.get("/runs", response_model=List[SimulationRunOut])
def list_simulation_runs(
    current_user: User = Depends(require_role([UserRole.ADMINISTRATOR, UserRole.RESPONDER])),
    db: Session = Depends(get_db),
):
    repo = SimulationRepository(db)
    runs = repo.list_runs()
    out = []
    for r in runs:
        item = SimulationRunOut.model_validate(r)
        if r.scenario:
            item.scenario_name = r.scenario.name
        out.append(item)
    return out
