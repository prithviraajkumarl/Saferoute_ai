from fastapi import APIRouter, Query
from app.integrations.weather.open_meteo import OpenMeteoClient
from app.schemas.weather import WeatherForecastOut
from app.core.config import settings

router = APIRouter(prefix="/weather", tags=["Weather"])

weather_client = OpenMeteoClient()


@router.get("/forecast", response_model=WeatherForecastOut)
async def get_weather_forecast(
    lat: float = Query(default=settings.DEFAULT_LAT, ge=-90.0, le=90.0),
    lng: float = Query(default=settings.DEFAULT_LNG, ge=-180.0, le=180.0),
):
    """Retrieves live weather data and rainfall risk indicators via Open-Meteo with bilingual Tamil summaries."""
    return await weather_client.get_forecast(lat, lng)
