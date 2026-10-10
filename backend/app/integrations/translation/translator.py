from typing import Dict

# Curated Tamil translation dictionary for disaster and emergency route guidance
TRANSLATION_MAP: Dict[str, str] = {
    "Safe Corridor": "பாதுகாப்பான பாதை",
    "Extreme Danger": "மிக ஆபத்தான பகுதி",
    "Moderate Risk": "மிதமான அபாயம்",
    "Low Risk": "குறைந்த அபாயம்",
    "Road Closure": "சாலை அடைப்பு",
    "Severe Waterlogging": "கடும் நீர் தேக்கம்",
    "Fallen Tree": "விழுந்த மரம்",
    "Tidal Surge": "கடல் அலை சீற்றம்",
    "Powerline Down": "அறுந்து விழுந்த மின்கம்பி",
    "Subway Inundation": "சுரங்கப்பாதையில் வெள்ளம்",
    "Emergency Shelter": "அவசர நிவாரண முகாம்",
    "Assistance En Route": "உதவி குழு புறப்பட்டுவிட்டது",
    "Acknowledged": "கோரிக்கை ஏற்கப்பட்டது",
    "Submitted": "பதிவு செய்யப்பட்டது",
    "Resolved": "தீர்க்கப்பட்டது",
    "Cancelled": "ரத்து செய்யப்பட்டது",
    "Unable to Respond": "உடனடி உதவி இயலவில்லை",
    "Avoid waterlogged low-lying areas.": "தாழ்வான வெள்ள பகுதிகளை தவிர்க்கவும்.",
    "Elevated arterial roads are clear.": "மேம்பால சாலைகள் பாதுகாப்பாக உள்ளன.",
}


class TranslationClient:
    def __init__(self):
        self.provider_name = "SafeRoute Tamil NLP Engine"

    def translate_to_tamil(self, text: str) -> str:
        if not text:
            return ""
        # Exact match
        if text in TRANSLATION_MAP:
            return TRANSLATION_MAP[text]
        # Partial substitutions
        translated = text
        for en, ta in TRANSLATION_MAP.items():
            if en.lower() in translated.lower():
                translated = translated.replace(en, f"{ta} ({en})")
        return translated if translated != text else f"{text} (தமிழ் மொழிபெயர்ப்பு கிடைக்கிறது)"
