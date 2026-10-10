from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ShelterCreate(BaseModel):
    name: str
    name_ta: Optional[str] = None
    address: str
    district: str = "Chennai"
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    capacity: int = Field(default=200, ge=1)
    current_occupancy: int = Field(default=0, ge=0)
    contact_phone: Optional[str] = None
    has_medical: bool = True
    has_food: bool = True
    has_power_backup: bool = True
    is_official: bool = True


class ShelterCapacityUpdate(BaseModel):
    current_occupancy: int = Field(..., ge=0)
    status: Optional[str] = None  # OPEN, FULL, CLOSED
    notes: Optional[str] = None


class ShelterOut(BaseModel):
    id: str
    name: str
    name_ta: Optional[str]
    address: str
    district: str
    latitude: float
    longitude: float
    capacity: int
    current_occupancy: int
    occupancy_percentage: float = 0.0
    contact_phone: Optional[str]
    status: str
    has_medical: bool
    has_food: bool
    has_power_backup: bool
    is_official: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
