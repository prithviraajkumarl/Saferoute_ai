from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel


class WeatherCurrentOut(BaseModel):
    temperature_c: float
    relative_humidity: float
    precipitation_mm: float
    wind_speed_kmh: float
    wind_direction_deg: float
    weather_code: int
    condition_description: str
    condition_ta: str
    is_cyclone_risk: bool
    is_flood_risk: bool
    data_source: str
    fetched_at: datetime
    is_cached: bool


class HourlyWeatherItem(BaseModel):
    time: str
    temperature_c: float
    precipitation_mm: float
    wind_speed_kmh: float


class WeatherForecastOut(BaseModel):
    latitude: float
    longitude: float
    current: WeatherCurrentOut
    hourly: List[HourlyWeatherItem] = []
    generated_at: datetime
