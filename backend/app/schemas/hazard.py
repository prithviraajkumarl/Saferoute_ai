from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class HazardCreate(BaseModel):
    hazard_type: str = Field(..., description="flood, road_closure, fallen_tree, landslide, tidal_surge, powerline")
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    severity: str = Field(default="MODERATE", description="ADVISORY, MODERATE, SEVERE, CRITICAL")
    description: Optional[str] = None
    source: str = Field(default="COMMUNITY", description="COMMUNITY, NDMA_OFFICIAL, IMD, TRAFFIC_POLICE, SIMULATION")
    is_simulated: bool = False


class HazardModerateRequest(BaseModel):
    action: str = Field(..., description="VERIFY, REJECT, RESOLVE")
    note: Optional[str] = None


class HazardEventOut(BaseModel):
    id: str
    hazard_id: str
    actor_id: str
    action: str
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class HazardOut(BaseModel):
    id: str
    reporter_id: Optional[str]
    hazard_type: str
    latitude: float
    longitude: float
    severity: str
    description: Optional[str]
    status: str
    upvotes: int
    is_simulated: bool
    verified_by_id: Optional[str]
    source: str
    source_timestamp: datetime
    created_at: datetime
    events: List[HazardEventOut] = []

    class Config:
        from_attributes = True
