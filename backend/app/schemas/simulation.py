from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class ScenarioCreate(BaseModel):
    name: str
    description: str
    scenario_type: str


class ScenarioOut(BaseModel):
    id: str
    name: str
    description: str
    scenario_type: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SimulationToggleRequest(BaseModel):
    scenario_id: str
    activate: bool
    notes: Optional[str] = None


class SimulationRunOut(BaseModel):
    id: str
    scenario_id: str
    scenario_name: Optional[str] = None
    activated_by_id: str
    started_at: datetime
    stopped_at: Optional[datetime]
    notes: Optional[str]

    class Config:
        from_attributes = True
