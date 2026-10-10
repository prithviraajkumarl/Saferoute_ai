from typing import Generic, List, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None


class GeoCoordinates(BaseModel):
    latitude: float
    longitude: float
