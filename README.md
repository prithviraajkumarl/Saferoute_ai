# SafeRoute AI — Tactical Disaster Route Risk & Multi-Agency Emergency HUD

[![Backend Tests](https://img.shields.io/badge/Pytest-12%20Passed-emerald.svg)]()
[![Frontend Tests](https://img.shields.io/badge/Vitest-5%20Passed-cyan.svg)]()
[![Vite Build](https://img.shields.io/badge/Vite-Built%20Clean-blue.svg)]()
[![Alembic Migrations](https://img.shields.io/badge/Alembic-Applied%20Head-purple.svg)]()
[![UI Paradigm](https://img.shields.io/badge/Design-Aegis%20Tactical%20HUD-orange.svg)]()

> **SafeRoute AI** is an advanced full-stack disaster resilience, route-risk assessment, and multi-agency emergency operations platform designed for severe weather, urban inundation, cyclone landfall, and coastal surge events.

---

## 1. Selected UI/UX Design System: Aegis Tactical Geo-HUD

Following the user's explicit Phase 1 selection, SafeRoute AI is built upon **Concept 1: Aegis Tactical Geo-HUD**:
- **Obsidian Dark Mission Control Canvas (`#0B0F19`)** to reduce screen glare and eye fatigue during power cuts and nocturnal storms.
- **Glassmorphic Telemetry Panels (`backdrop-filter: blur(16px)`)** displaying real-time rainfall accumulation, wind shear, and NDMA alerts.
- **Glowing Corridor Polylines:** Neon Cyan (`#06B6D4`) for safe recommendations, Amber (`#F59E0B`) for caution corridors, and Crimson (`#EF4444`) for critical road blockades.
- **Interactive CartoDB Dark Matter Leaflet Map** with live hazard ripples and shelter capacity status.
- **3-Second Hold SOS Trigger** preventing misclicks with GPS broadcast and server-enforced state machine lifecycle tracking.
- **Bilingual Parity:** Seamless English and Tamil (தமிழ்) toggle across all risk dossiers, alerts, and protocols.
- **Multi-Persona Switcher:** Single-click transition between **Tourist Mode**, **Responder Triage Kanban**, and **Admin Command**.

---

## 2. Full Architecture & Technology Stack

```
c:\Aa1 iitdmk\
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI entrypoint & lifespan
│   │   ├── core/                       # Config, Logging, Security, Permissions, Middleware
│   │   ├── api/v1/                     # 13 Versioned REST API Routers
│   │   │   ├── health.py               # Liveness & Readiness checks
│   │   │   ├── auth.py                 # JWT Registration, Login, Profile
│   │   │   ├── weather.py              # Open-Meteo rainfall & wind integration
│   │   │   ├── alerts.py               # NDMA SACHET / TNSDMA CAP alerts
│   │   │   ├── routes.py               # Route risk assessment & geocoding
│   │   │   ├── hazards.py              # Spatial hazard reporting & upvoting
│   │   │   ├── reports.py              # Responder moderation queue
│   │   │   ├── shelters.py             # Capacity tracking & nearest camps
│   │   │   ├── incidents.py            # SOS submission & ownership isolation
│   │   │   ├── responders.py           # Triage state machine transitions
│   │   │   ├── simulations.py          # Disaster drill sandboxing
│   │   │   ├── guidance.py             # SEOC 1070 helpline & safety protocols
│   │   │   └── admin.py                # System metrics & audit logs
│   │   ├── db/
│   │   │   ├── base.py                 # SQLAlchemy 2.x DeclarativeBase
│   │   │   ├── session.py              # SessionLocal & engine
│   │   │   ├── models/                 # Normalized relational models
│   │   │   └── repositories/           # Atomic data access layer
│   │   ├── schemas/                    # Pydantic v2 validation contracts
│   │   ├── services/risk/engine.py     # Deterministic Shapely risk engine
│   │   └── integrations/               # Open-Meteo, NDMA CAP, OSRM, Nominatim, Tamil NLP
│   ├── alembic/                        # Database migration scripts
│   ├── tests/                          # 12 Pytest unit & integration tests
│   ├── seed.py                         # Seed mechanism for realistic demo data
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/                 # Navbar, Map, Telemetry, SOS, Triage, Shelters
│   │   ├── context/                    # AuthContext (persona switch), I18nContext (EN/TA)
│   │   ├── services/api.ts             # Typed REST client
│   │   ├── translations/               # en.ts and ta.ts dictionaries
│   │   ├── types/index.ts              # TypeScript API contracts
│   │   ├── __tests__/                  # Vitest UI & internationalization tests
│   │   ├── index.css                   # Aegis Tactical HUD styles & neon glow tokens
│   │   └── App.tsx                     # Mission-control workspace
│   ├── vite.config.ts
│   └── package.json
├── docker-compose.yml                  # PostGIS, Redis, Backend, Frontend
├── Dockerfile (backend & frontend)
└── README.md
```

---

## 3. Demonstration Credentials

Pre-seeded demonstration accounts are available for instant testing:

| Role | Email | Password | Full Name |
|---|---|---|---|
| **Tourist** | `tourist@saferoute.ai` | `TouristPass2026!` | Arun Kumar (Tourist) |
| **Responder** | `responder@saferoute.ai` | `ResponderPass2026!` | Inspector S. Meenakshi (TNDRF) |
| **Administrator** | `admin@saferoute.ai` | `AdminPass2026!` | Dr. K. Ramanathan (Disaster Operations) |

*Use the **Persona Switcher** in the top navigation bar to seamlessly switch between modes without logging out.*

---

## 4. Quickstart: Local Development

### Prerequisites
- Python 3.12 (`py` or `python`)
- Node.js v20+ and npm

### 1. Backend Setup & Run
```powershell
cd "c:\Aa1 iitdmk\backend"

# Activate virtual environment
.\venv\Scripts\activate

# Run database migrations
alembic upgrade head

# Seed demonstration scenarios & users
python seed.py

# Launch FastAPI backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- Health Readiness Probe: `http://127.0.0.1:8000/api/v1/health/readiness`

### 2. Frontend Setup & Run
```powershell
cd "c:\Aa1 iitdmk\frontend"

# Launch Vite development server
npm run dev
```
- Tactical Mission Control HUD: `http://localhost:5173`

---

## 5. Docker Compose Deployment

To run the complete production stack (PostGIS + Redis + FastAPI + Nginx Frontend):
```bash
docker compose up --build
```
- Web Application: `http://localhost:3000`
- Backend API & Swagger: `http://localhost:8000/docs`

---

## 6. Automated Testing Suite

### Backend Pytest Suite
```powershell
cd "c:\Aa1 iitdmk\backend"
.\venv\Scripts\pytest -v tests/
```
**Results:** `12 passed in 14.8s`
- Route risk calculations (No hazards, 1 verified hazard, multiple hazards, official road closures, stale reports).
- Server-enforced incident state transitions (`SUBMITTED` ➔ `ACKNOWLEDGED` ➔ `ASSISTANCE_EN_ROUTE` ➔ `RESOLVED`).
- Authorization rules (Tourists cannot moderate; Responders can moderate).
- Duplicate SOS idempotency handling.
- Health liveness and readiness diagnostics.

### Frontend Vitest Suite
```powershell
cd "c:\Aa1 iitdmk\frontend"
npm run test
```
**Results:** `5 passed in 3.6s`
- Key parity between English and Tamil translation dictionaries.
- Weather radar telemetry value rendering.
- Shelter directory occupancy and facility progress meters.

### Production Bundle Verification
```powershell
cd "c:\Aa1 iitdmk\frontend"
npm run build
```
**Results:** `Built in 868ms` with zero TypeScript or bundling errors.

---

## 7. Emergency Honesty Protocol

SafeRoute AI internal SOS beacon workflows do **not** replace contacting official emergency services. In a true life-threatening crisis, dial:
- **112**: All-in-One National Emergency Helpline
- **1070**: Tamil Nadu State Emergency Operations Centre (SEOC)
- **1077**: District Disaster Control Room
- **1913**: Greater Chennai Corporation Flood Helpline
