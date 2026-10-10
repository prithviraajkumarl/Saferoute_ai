import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timezone, timedelta
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.db.models.user import User
from app.db.models.incident import Incident, IncidentEvent, IncidentAssignment, IncidentPublicUpdate
from app.db.models.hazard import HazardReport, HazardReportEvent
from app.db.models.shelter import Shelter
from app.db.models.simulation import SimulationScenario
from app.core.security import get_password_hash


def seed_database():
    print("Beginning SafeRoute AI database seeding...")
    import app.db.models  # ensure models registered
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Demonstration Users
        demo_users = [
            {
                "email": "tourist@saferoute.ai",
                "password": "TouristPass2026!",
                "full_name": "Arun Kumar (Tourist)",
                "phone": "+91 98401 12345",
                "role": "tourist",
            },
            {
                "email": "responder@saferoute.ai",
                "password": "ResponderPass2026!",
                "full_name": "Inspector S. Meenakshi (TNDRF First Responder)",
                "phone": "+91 94440 54321",
                "role": "responder",
            },
            {
                "email": "admin@saferoute.ai",
                "password": "AdminPass2026!",
                "full_name": "Dr. K. Ramanathan (Disaster Operations Commander)",
                "phone": "+91 98840 99999",
                "role": "administrator",
            },
        ]

        user_objects = {}
        for u in demo_users:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                user = User(
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    full_name=u["full_name"],
                    phone_number=u["phone"],
                    role=u["role"],
                    is_active=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                user_objects[u["role"]] = user
                print(f"Created user: {u['email']} [{u['role']}]")
            else:
                user_objects[u["role"]] = existing
                print(f"User exists: {u['email']}")

        tourist_user = user_objects.get("tourist")
        responder_user = user_objects.get("responder")

        # 2. Shelters
        shelters_data = [
            {
                "name": "Chennai Trade Centre Emergency Relief Hub",
                "name_ta": "சென்னை வர்த்தக மைய அவசர நிவாரண மையம்",
                "address": "Nandambakkam, Mount Poonamallee Road, Chennai",
                "district": "Chennai",
                "latitude": 13.0116,
                "longitude": 80.1788,
                "capacity": 1200,
                "current_occupancy": 320,
                "contact_phone": "044-22315600",
                "has_medical": True,
                "has_food": True,
                "has_power_backup": True,
            },
            {
                "name": "Loyola Evacuation & Medical Relief Camp",
                "name_ta": "லயோலா மருத்துவ நிவாரண முகாம்",
                "address": "Sterling Road, Nungambakkam, Chennai",
                "district": "Chennai",
                "latitude": 13.0626,
                "longitude": 80.2338,
                "capacity": 850,
                "current_occupancy": 190,
                "contact_phone": "044-28178200",
                "has_medical": True,
                "has_food": True,
                "has_power_backup": True,
            },
            {
                "name": "Velachery Govt Higher Secondary School Relief Camp",
                "name_ta": "வேளச்சேரி அரசு மேல்நிலைப் பள்ளி நிவாரண முகாம்",
                "address": "Velachery Main Road, Vijaya Nagar, Chennai",
                "district": "Chennai",
                "latitude": 12.9772,
                "longitude": 80.2185,
                "capacity": 400,
                "current_occupancy": 310,
                "contact_phone": "044-22441122",
                "has_medical": True,
                "has_food": True,
                "has_power_backup": False,
            },
            {
                "name": "Tambaram Municipality Community Relief Center",
                "name_ta": "தாம்பரம் நகராட்சி சமுதாய நலக் கூடம்",
                "address": "GST Road, Tambaram Sanatorium, Chennai",
                "district": "Chengalpattu",
                "latitude": 12.9298,
                "longitude": 80.1264,
                "capacity": 600,
                "current_occupancy": 85,
                "contact_phone": "044-22265432",
                "has_medical": True,
                "has_food": True,
                "has_power_backup": True,
            },
        ]

        for s in shelters_data:
            existing = db.query(Shelter).filter(Shelter.name == s["name"]).first()
            if not existing:
                shelter = Shelter(**s)
                db.add(shelter)
                print(f"Created shelter: {s['name']}")
        db.commit()

        # 3. Hazards
        now = datetime.now(timezone.utc)
        hazards_data = [
            {
                "hazard_type": "flood",
                "latitude": 12.9760,
                "longitude": 80.2210,
                "severity": "CRITICAL",
                "description": "Velachery Vijaya Nagar subway flooded over 4.5 feet. Multiple vehicles trapped.",
                "status": "VERIFIED",
                "source": "TRAFFIC_POLICE",
                "source_timestamp": now - timedelta(minutes=45),
                "is_simulated": False,
            },
            {
                "hazard_type": "road_closure",
                "latitude": 12.8752,
                "longitude": 80.2458,
                "severity": "CRITICAL",
                "description": "East Coast Road (ECR) submerged near Kovalam bridge due to sea water tidal intrusion. Closed by police.",
                "status": "VERIFIED",
                "source": "NDMA_OFFICIAL",
                "source_timestamp": now - timedelta(hours=1),
                "is_simulated": False,
            },
            {
                "hazard_type": "fallen_tree",
                "latitude": 13.0450,
                "longitude": 80.2520,
                "severity": "MODERATE",
                "description": "Large banyan branch blocking left 2 lanes on Anna Salai near Teynampet signal.",
                "status": "VERIFIED",
                "source": "COMMUNITY",
                "source_timestamp": now - timedelta(hours=2),
                "is_simulated": False,
            },
            {
                "hazard_type": "flood",
                "latitude": 12.9630,
                "longitude": 80.1980,
                "severity": "SEVERE",
                "description": "Madipakkam Puzhuthivakkam link road severe waterlogging (2.5 feet). Elevated vehicles only.",
                "status": "PENDING_VERIFICATION",
                "source": "COMMUNITY",
                "source_timestamp": now - timedelta(minutes=20),
                "is_simulated": False,
            },
        ]

        for h in hazards_data:
            existing = db.query(HazardReport).filter(HazardReport.description == h["description"]).first()
            if not existing:
                hazard = HazardReport(
                    reporter_id=tourist_user.id if tourist_user else None,
                    verified_by_id=responder_user.id if (responder_user and h["status"] == "VERIFIED") else None,
                    **h,
                )
                db.add(hazard)
                print(f"Created hazard: {h['hazard_type']} at {h['latitude']},{h['longitude']}")
        db.commit()

        # 4. Simulation Scenarios
        scenarios = [
            {
                "name": "Cyclone Vardha/Michaung Landfall Drill (Surge Level 4)",
                "description": "Full simulation of 110km/h coastal squall, tidal surge along Marina/ECR, and subway inundation.",
                "scenario_type": "MONSOON_CYCLONE",
                "is_active": False,
            },
            {
                "name": "Flash Flood & Urban Adyar Basin Breach Simulation",
                "description": "Rapid flooding scenario affecting Saidapet, Jafferkhanpet, and Velachery corridors.",
                "scenario_type": "FLASH_FLOOD",
                "is_active": False,
            },
        ]

        for sc in scenarios:
            existing = db.query(SimulationScenario).filter(SimulationScenario.name == sc["name"]).first()
            if not existing:
                scenario = SimulationScenario(**sc)
                db.add(scenario)
                print(f"Created scenario: {sc['name']}")
        db.commit()

        # 5. Demonstration Incidents
        demo_incident = db.query(Incident).filter(Incident.reference_code == "SOS-2026-CH01").first()
        if not demo_incident and tourist_user:
            inc = Incident(
                reference_code="SOS-2026-CH01",
                user_id=tourist_user.id,
                latitude=12.9765,
                longitude=80.2225,
                address="Near Vijaya Nagar Bus Stand, Velachery, Chennai",
                severity="CRITICAL",
                status="ASSISTANCE_EN_ROUTE",
                contact_phone="+91 98401 12345",
                description="Car engine stalled in 3.5 ft rising water. 3 passengers inside including 1 elderly person.",
                person_count=3,
                is_simulated=False,
            )
            db.add(inc)
            db.flush()

            # Events
            ev1 = IncidentEvent(
                incident_id=inc.id,
                actor_id=tourist_user.id,
                from_status=None,
                to_status="SUBMITTED",
                note="Emergency SOS triggered via mobile app",
                is_internal=False,
            )
            ev2 = IncidentEvent(
                incident_id=inc.id,
                actor_id=responder_user.id if responder_user else tourist_user.id,
                from_status="SUBMITTED",
                to_status="ACKNOWLEDGED",
                note="Control room acknowledged. TNDRF Boat Unit 4 alerted.",
                is_internal=False,
            )
            ev3 = IncidentEvent(
                incident_id=inc.id,
                actor_id=responder_user.id if responder_user else tourist_user.id,
                from_status="ACKNOWLEDGED",
                to_status="ASSISTANCE_EN_ROUTE",
                note="Inflatable rescue dinghy and paramedic deployed from Guindy station.",
                is_internal=False,
            )
            ev_internal = IncidentEvent(
                incident_id=inc.id,
                actor_id=responder_user.id if responder_user else tourist_user.id,
                from_status="ASSISTANCE_EN_ROUTE",
                to_status="ASSISTANCE_EN_ROUTE",
                note="Internal VHF Radio Channel 4: ETA approximately 8 minutes depending on Inner Ring Road debris.",
                is_internal=True,
            )
            db.add_all([ev1, ev2, ev3, ev_internal])

            # Assignment
            if responder_user:
                asgn = IncidentAssignment(
                    incident_id=inc.id,
                    responder_id=responder_user.id,
                    status="EN_ROUTE",
                )
                db.add(asgn)

            pub_up = IncidentPublicUpdate(
                incident_id=inc.id,
                update_text="Rescue unit has been dispatched and is currently 1.2km away approaching via bypass road.",
            )
            db.add(pub_up)
            db.commit()
            print("Created demonstration incident SOS-2026-CH01")

        print("Database seeding completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
