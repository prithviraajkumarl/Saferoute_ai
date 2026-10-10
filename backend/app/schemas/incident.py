from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class IncidentCreate(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    address: Optional[str] = None
    severity: str = Field(default="CRITICAL", description="ADVISORY, MODERATE, SEVERE, CRITICAL")
    description: Optional[str] = None
    contact_phone: Optional[str] = None
    person_count: int = Field(default=1, ge=1, le=500)
    is_simulated: bool = False
    idempotency_key: Optional[str] = None


class IncidentTransitionRequest(BaseModel):
    to_status: str = Field(
        ...,
        description="Target status: ACKNOWLEDGED, ASSISTANCE_EN_ROUTE, RESOLVED, CANCELLED, UNABLE_TO_RESPOND"
    )
    note: Optional[str] = None
    is_internal: bool = Field(default=False, description="Whether this note is restricted to responders")


class IncidentAssignmentCreate(BaseModel):
    responder_id: str
    notes: Optional[str] = None


class IncidentPublicUpdateCreate(BaseModel):
    update_text: str


class IncidentEventOut(BaseModel):
    id: str
    incident_id: str
    actor_id: str
    from_status: Optional[str]
    to_status: str
    note: Optional[str]
    is_internal: bool
    created_at: datetime

    class Config:
        from_attributes = True


class IncidentAssignmentOut(BaseModel):
    id: str
    incident_id: str
    responder_id: str
    responder_name: Optional[str] = None
    status: str
    assigned_at: datetime

    class Config:
        from_attributes = True


class IncidentPublicUpdateOut(BaseModel):
    id: str
    incident_id: str
    update_text: str
    broadcast_time: datetime

    class Config:
        from_attributes = True


class IncidentOut(BaseModel):
    id: str
    reference_code: str
    user_id: str
    latitude: float
    longitude: float
    address: Optional[str]
    severity: str
    status: str
    contact_phone: Optional[str]
    description: Optional[str]
    person_count: int
    is_simulated: bool
    created_at: datetime
    updated_at: datetime
    events: List[IncidentEventOut] = []
    assignments: List[IncidentAssignmentOut] = []
    public_updates: List[IncidentPublicUpdateOut] = []

    class Config:
        from_attributes = True
