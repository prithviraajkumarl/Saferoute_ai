from typing import Optional, List, Dict, Any
import httpx
from app.core.config import settings
from app.core.logging import logger


class NominatimClient:
    def __init__(self, base_url: str = settings.NOMINATIM_BASE_URL):
        self.base_url = base_url

    async def geocode(self, query: str) -> List[Dict[str, Any]]:
        headers = {"User-Agent": "SafeRouteAI-DisasterRescue/1.0 (contact@saferoute.ai)"}
        params = {
            "q": query,
            "format": "json",
            "limit": 5,
            "countrycodes": "in",
        }
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(f"{self.base_url}/search", params=params, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    results = []
                    for item in data:
                        results.append({
                            "display_name": item.get("display_name"),
                            "latitude": float(item.get("lat")),
                            "longitude": float(item.get("lon")),
                        })
                    return results
        except Exception as e:
            logger.info(f"Nominatim geocoding failed ({e}). Returning local landmark lookup.")

        # Local fallback landmarks for Chennai region
        landmarks = {
            "marina": {"display_name": "Marina Beach, Chennai, Tamil Nadu", "latitude": 13.0499, "longitude": 80.2824},
            "central": {"display_name": "Puratchi Thalaivar Dr. M.G.R. Central Railway Station, Chennai", "latitude": 13.0827, "longitude": 80.2755},
            "airport": {"display_name": "Chennai International Airport (MAA), Meenambakkam", "latitude": 12.9941, "longitude": 80.1709},
            "tambaram": {"display_name": "Tambaram Sanatorium, Chennai, Tamil Nadu", "latitude": 12.9249, "longitude": 80.1240},
            "velachery": {"display_name": "Velachery Vijaya Nagar, Chennai, Tamil Nadu", "latitude": 12.9759, "longitude": 80.2212},
            "omr": {"display_name": "Old Mahabalipuram Road (OMR / IT Corridor), Thoraipakkam", "latitude": 12.9372, "longitude": 80.2346},
            "ecr": {"display_name": "East Coast Road (ECR), Injambakkam / Akkarai", "latitude": 12.9150, "longitude": 80.2520},
        }

        q_lower = query.lower()
        for k, v in landmarks.items():
            if k in q_lower:
                return [v]

        return [{"display_name": f"{query}, Tamil Nadu", "latitude": settings.DEFAULT_LAT, "longitude": settings.DEFAULT_LNG}]
