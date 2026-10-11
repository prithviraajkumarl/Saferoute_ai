SafeRoute AI 🌍

Disaster-Aware Navigation, Route Risk Assessment & Emergency Coordination

Navigate with awareness. Respond with confidence.

""Live Demo" (https://img.shields.io/badge/Live%20Demo-Open%20App-0A7B83?style=for-the-badge)" (https://saferoute-wired-in.vercel.app/)
""GitHub Repository" (https://img.shields.io/badge/Source-GitHub-181717?style=for-the-badge&logo=github)" (https://github.com/prithviraajkumarl/Saferoute_ai)
""Presentation" (https://img.shields.io/badge/Presentation-Google%20Drive-4285F4?style=for-the-badge&logo=google-drive)" (https://drive.google.com/drive/folders/1M4_MOVI5nDY9IDSMED_CVw8Lpemh3GxY?usp=sharing)
""Python" (https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)" (https://www.python.org/)
""FastAPI" (https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)" (https://fastapi.tiangolo.com/)
""React" (https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black)" (https://react.dev/)
""TypeScript" (https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)" (https://www.typescriptlang.org/)

---

🌐 Overview

SafeRoute AI is a disaster-aware navigation and emergency coordination prototype designed to help users make more informed travel decisions during severe weather and other hazardous situations.

The platform combines candidate route generation, hazard information, weather context, official-alert integrations, and a deterministic route-risk assessment engine. It evaluates available routes, explains contributing risk factors, and provides risk summaries in English and Tamil.

Beyond navigation, the backend includes APIs for hazard reporting, incidents, shelters, responders, simulations, and administration.

The project focuses on making disaster-related information easier to interpret through a geospatial interface and structured emergency workflows.

«Safety disclaimer: SafeRoute AI is a decision-support prototype. It does not guarantee a safe route, replace official evacuation instructions, or substitute for emergency services.»

Project Links

- Live application: https://saferoute-wired-in.vercel.app/
- GitHub repository: https://github.com/prithviraajkumarl/Saferoute_ai
- Presentation materials: "Open the Google Drive folder" (https://drive.google.com/drive/folders/1M4_MOVI5nDY9IDSMED_CVw8Lpemh3GxY?usp=sharing)
- Local API documentation: http://127.0.0.1:8000/docs

 Key Features

🗺️ Disaster-Aware Route Assessment

- Evaluates candidate routes using a deterministic, rule-based risk engine.
- Considers hazard severity, verification status, freshness, proximity, weather context, and configured geographic vulnerability rules.
- Produces route-risk categories and explanations.
- Identifies candidate routes affected by qualifying critical road closures.

🌦️ Weather and Hazard Context

- Weather integration configured for Open-Meteo.
- Routing integration configured for OSRM.
- Geocoding integration configured for Nominatim.
- Official-alert integration configured for the NDMA SACHET/CAP feed.
- Hazard and report APIs support structured emergency information.

External feeds may be delayed, unavailable, incomplete, or subject to provider limitations.

🚨 Emergency Incident Coordination

The backend includes APIs for:

- Incident creation and management.
- Hazard and incident reports.
- Responder coordination.
- Shelter information.
- Simulations and administrative operations.

🌐 Bilingual Experience

- English and Tamil route explanations.
- Translation dictionaries in the frontend.
- Designed to make disaster-related information more accessible to a wider range of users.

🔐 Authentication and Service Health

- Registration and login endpoints.
- Bearer-token authentication.
- Authenticated user profile endpoint.
- API liveness and readiness checks.

Privileged roles must be provisioned securely. Public registration must not allow users to assign themselves administrator or responder privileges.

🧠 How Route Risk Assessment Works

The route assessment endpoint is:

"POST /api/v1/routes/assess"

The current implementation follows this workflow:

1. Requests candidate routes from the routing integration.
2. Retrieves relevant hazard records near the route origin.
3. Collects available weather forecast and official-alert context.
4. Evaluates candidate routes using the versioned "RouteRiskEngine".
5. Stores the resulting route assessment and contributing hazard evidence.
6. Returns route-risk categories, explanations, weather context, data provenance, and known limitations.

Risk Factors

The deterministic risk engine considers:

- Hazard severity and verification status.
- Hazard type and configured penalty weights.
- Distance between route geometry and relevant hazards.
- Hazard freshness and stale-data decay.
- Rainfall and wind thresholds.
- Active-alert counts.
- Configured geographic vulnerability rules.
- Qualifying verified critical road closures.

Risk categories include:

- "LOW"
- "ELEVATED"
- "HIGH"
- "CRITICAL"

The risk engine produces heuristic estimates, not calibrated probabilities. The project should not be described as a trained machine-learning prediction system unless a separately implemented and evaluated model supports that claim.

Some geographic vulnerability rules currently use hard-coded coordinate ranges and representative elevation values. They should not be interpreted as a comprehensive, live elevation-data service.

🏗️ System Architecture

┌─────────────────────────────────────────────┐
│         React + TypeScript Frontend          │
│                                             │
│  Map Interface | Risk Display | Incidents   │
│  English/Tamil | API Client | User Views     │
└──────────────────────┬──────────────────────┘
                       │ REST API
                       ▼
┌─────────────────────────────────────────────┐
│                FastAPI Backend               │
│                                             │
│ Authentication | Routes | Weather | Alerts  │
│ Hazards | Reports | Incidents | Shelters     │
│ Responders | Simulations | Guidance | Admin  │
└──────────────────────┬──────────────────────┘
                       │
          ┌────────────┼─────────────┐
          ▼            ▼             ▼
   Risk Assessment  Data Storage  External APIs
   Shapely Engine   SQLAlchemy    Open-Meteo
                    Alembic       OSRM
                    SQLite /      Nominatim
                    PostgreSQL    NDMA SACHET/CAP

The backend registers 13 functional API routers covering health, authentication, weather, alerts, routes, hazards, reports, shelters, incidents, responders, simulations, guidance, and administration.

 Technology Stack

Component| Technologies
Frontend| React 19, TypeScript, Vite
UI and styling| Tailwind CSS 4, Lucide React
Mapping| Leaflet
Navigation| React Router
Backend| Python, FastAPI, Uvicorn
Validation| Pydantic v2
Database layer| SQLAlchemy 2.x
Database migrations| Alembic
Local database| SQLite configuration
Container database| PostgreSQL/PostGIS configuration
Geospatial processing| Shapely
Weather| Open-Meteo integration
Routing| OSRM integration
Geocoding| Nominatim integration
Official alerts| NDMA SACHET/CAP integration
Optional caching| Redis
Deployment tooling| Docker and Docker Compose

Repository Structure

Saferoute_ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   ├── core/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── main.py
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── seed.py
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── .env.example
├── .gitignore
├── docker-compose.yml
└── run_dev.ps1

See the "repository browser" (https://github.com/prithviraajkumarl/Saferoute_ai) for the authoritative current directory structure.

 Run Locally

Prerequisites

- Python 3.12 recommended.
- Node.js compatible with the frontend dependencies.
- Git.
- Optional: Docker Desktop.

1. Clone the repository

git clone https://github.com/prithviraajkumarl/Saferoute_ai.git
cd Saferoute_ai

2. Set up the backend

cd backend
python -m venv .venv

Activate the virtual environment.

Windows PowerShell:

.\.venv\Scripts\Activate.ps1

macOS/Linux:

source .venv/bin/activate

Install dependencies:

python -m pip install --upgrade pip
pip install -r requirements.txt

Review the backend configuration and supply development-safe environment variables as needed. Do not use committed example secrets in a public deployment.

Start the API:

uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

Open the API documentation:

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
- Liveness: http://127.0.0.1:8000/api/v1/health/liveness
- Readiness: http://127.0.0.1:8000/api/v1/health/readiness

«Demo-data warning: Review "backend/seed.py" before running it. Do not run the demo seed script against a production database. Seeded scenarios must be clearly labelled as simulated.»

3. Set up the frontend

Open another terminal:

cd frontend
npm install
npm run dev

Open the local address displayed by Vite, normally:

http://localhost:5173

The development Vite configuration proxies "/api" requests to the local backend.

4. Build and test

Frontend commands declared in "frontend/package.json":

npm run build
npm test
npm run lint

Run backend tests from the backend directory:

pytest

These are the commands to validate the project locally. Test counts and successful build results should only be advertised when supported by actual test output or continuous-integration results.

🔌 API Highlights

The backend exposes versioned routes under "/api/v1".

Method| Endpoint| Purpose
"GET"| "/api/v1/health/liveness"| Process liveness
"GET"| "/api/v1/health/readiness"| Service/database readiness
"POST"| "/api/v1/auth/register"| Account registration
"POST"| "/api/v1/auth/login"| User authentication
"GET"| "/api/v1/auth/me"| Authenticated profile
"GET"| "/api/v1/routes/policy"| Route-risk policy
"POST"| "/api/v1/routes/assess"| Candidate route-risk assessment
"GET"| "/api/v1/routes/geocode?query=..."| Place geocoding

Inspect the running Swagger UI for the latest request schemas, response models, authentication requirements, and the remaining endpoints.

🖼️ Screenshots and Demo

- "Launch the live application" (https://saferoute-wired-in.vercel.app/)
- "View the presentation materials" (https://drive.google.com/drive/folders/1M4_MOVI5nDY9IDSMED_CVw8Lpemh3GxY?usp=sharing)


🔒 Security and Safety

SafeRoute AI is a prototype and requires further security and operational validation before production use.

Before public deployment:

- Generate and configure a strong JWT signing secret outside source control.
- Replace fixed database passwords with environment-managed secrets.
- Never publish working administrator or responder passwords in a public README.
- Ensure public registration cannot assign privileged roles.
- Restrict PostgreSQL and Redis ports to trusted networks.
- Avoid exposing the Vite development server to untrusted networks.
- Label all generated, seeded, and fallback emergency records as simulated.
- Display a clear unavailable/offline state when live feeds or the backend cannot be reached.
- Validate authorization, incident privacy, rate limits, and input handling.
- Remove tracked virtual-environment files and keep generated environments excluded from Git.

If any committed secrets or demonstration passwords have already been used on a deployed service, rotate them; deleting them from the latest README alone is insufficient.

⚠️ Limitations

- Route-risk scores are heuristic estimates, not calibrated probabilities.
- Geographic vulnerability rules are currently limited and include hard-coded areas.
- External data feeds may be delayed, incomplete, or unavailable.
- Frontend fallback/demo data may differ from backend-persisted records.
- The application cannot guarantee route safety or replace official emergency instructions.
- End-to-end production reliability and field effectiveness require further validation.

🚨 Emergency Notice

SafeRoute AI is not a replacement for official emergency services.

In India, call 112 for national emergency assistance. Follow official government alerts, evacuation orders, and local emergency instructions.

👥 Team

- Abishek 
- Prithvi Raaj Kumar 
Add a concise, accurate description of each member's specific contributions before using this repository as a recruiter portfolio.

📄 License

Add a "LICENSE" file to the repository and update this section to match the license actually selected. Do not claim an MIT license unless the repository includes the corresponding license.

---

<div align="center">SafeRoute AI

Navigate with awareness. Respond with confidence.

"Live Demo" (https://saferoute-wired-in.vercel.app/) · "GitHub Repository" (https://github.com/prithviraajkumarl/Saferoute_ai)

</div>