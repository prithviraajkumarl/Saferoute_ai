from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class OfficialAlertOut(BaseModel):
    id: str
    headline: str
    headline_ta: Optional[str] = None
    description: str
    description_ta: Optional[str] = None
    severity: str  # ADVISORY, WATCH, WARNING, EXTREME
    urgency: str   # IMMEDIATE, EXPECTED, FUTURE
    area_desc: str
    effective: datetime
    expires: datetime
    sender_name: str
    source: str
    instruction: Optional[str] = None
    instruction_ta: Optional[str] = None
    is_live: bool
