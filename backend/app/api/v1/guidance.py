from typing import List, Dict, Any
from fastapi import APIRouter

router = APIRouter(prefix="/guidance", tags=["Safety Guidance & Protocols"])


@router.get("/protocols")
def get_emergency_protocols() -> Dict[str, Any]:
    return {
        "emergency_contacts": [
            {"service": "Tamil Nadu State Emergency Operations (SEOC)", "number": "1070", "description": "Statewide disaster assistance & cyclone rescue"},
            {"service": "District Emergency Operations Centre (DEOC)", "number": "1077", "description": "District Collectorate emergency desk"},
            {"service": "National Emergency Helpline", "number": "112", "description": "All-in-one Police, Fire & Medical dispatch"},
            {"service": "Greater Chennai Corporation Flood Control", "number": "1913", "description": "Tree clearing, pump deployment, waterlogging removal"},
            {"service": "Ambulance Emergency Response", "number": "108", "description": "Medical transport"},
            {"service": "Coastal Security Group (CSG)", "number": "1093", "description": "Marine search and rescue"},
        ],
        "protocols": [
            {
                "id": "flood_safety",
                "title_en": "Urban Inundation & Subway Crossing Rules",
                "title_ta": "நகர்ப்புற வெள்ளம் & சுரங்கப்பாதை பாதுகாப்பு விதிமுறைகள்",
                "steps_en": [
                    "Never enter flooded road underpasses or subways; water depth is frequently deceptive.",
                    "If your vehicle stalls in rising water, abandon it immediately and seek elevated terrain.",
                    "Keep away from fallen electrical wires and submerged utility junction boxes.",
                    "Follow verified SafeRoute AI elevated bypass corridors.",
                ],
                "steps_ta": [
                    "வெள்ளம் சூழ்ந்த சுரங்கப்பாதைகளில் செல்ல வேண்டாம்; ஆழம் ஏமாற்றக்கூடும்.",
                    "வாகனம் நீரில் நின்றால், உடனடியாக வெளியேறி உயரமான பகுதிக்கு செல்லவும்.",
                    "அறுந்து விழுந்த மின் கம்பிகள் மற்றும் டிரான்ஸ்பார்மர்களை தொடாதீர்கள்.",
                    "SafeRoute AI பரிந்துரைக்கும் மேம்பால பாதைகளை மட்டுமே பயன்படுத்தவும்.",
                ],
            },
            {
                "id": "cyclone_precaution",
                "title_en": "Severe Cyclone & Coastal Wind Advisory",
                "title_ta": "கடும் புயல் & பலத்த காற்று முன்னெச்சரிக்கை",
                "steps_en": [
                    "Stay strictly indoors during eye of cyclone landfall; calm weather is temporary.",
                    "Park vehicles away from aged trees, metal tin sheds, and loose billboards.",
                    "Charge power banks, flashlights, and keep essential medicines sealed in waterproof bags.",
                ],
                "steps_ta": [
                    "புயல் கரையை கடக்கும் போது வெளியே செல்ல வேண்டாம்.",
                    "பழைய மரங்கள், விளம்பர பலகைகள் அருகில் வாகனங்களை நிறுத்த வேண்டாம்.",
                    "மின் சாதனங்கள் மற்றும் மருந்துப் பொருட்களை பாதுகாப்பாக வைக்கவும்.",
                ],
            },
        ],
    }
