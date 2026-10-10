import pytest
from app.db.repositories.incident_repo import IncidentRepository
from app.db.models.incident import Incident
from app.core.exceptions import IncidentStateTransitionError


def test_incident_state_machine_valid_transitions(db_session, test_tourist, test_responder):
    repo = IncidentRepository(db_session)
    tourist = test_tourist["user"]
    responder = test_responder["user"]

    inc = Incident(
        user_id=tourist.id,
        latitude=13.0827,
        longitude=80.2707,
        severity="CRITICAL",
        status="SUBMITTED",
        description="Stranded in flooded street",
    )
    created = repo.create(inc)
    assert created.status == "SUBMITTED"
    assert len(created.events) == 1

    # Transition 1: SUBMITTED -> ACKNOWLEDGED
    step1 = repo.transition_state(created.id, "ACKNOWLEDGED", actor_id=responder.id, note="Control desk acknowledged")
    assert step1.status == "ACKNOWLEDGED"
    assert len(step1.events) == 2

    # Transition 2: ACKNOWLEDGED -> ASSISTANCE_EN_ROUTE
    step2 = repo.transition_state(created.id, "ASSISTANCE_EN_ROUTE", actor_id=responder.id, note="Dispatched dinghy")
    assert step2.status == "ASSISTANCE_EN_ROUTE"
    assert len(step2.events) == 3

    # Transition 3: ASSISTANCE_EN_ROUTE -> RESOLVED
    step3 = repo.transition_state(created.id, "RESOLVED", actor_id=responder.id, note="Evacuated to relief shelter")
    assert step3.status == "RESOLVED"
    assert len(step3.events) == 4


def test_incident_state_machine_invalid_transition(db_session, test_tourist, test_responder):
    repo = IncidentRepository(db_session)
    tourist = test_tourist["user"]
    responder = test_responder["user"]

    inc = Incident(
        user_id=tourist.id,
        latitude=13.0827,
        longitude=80.2707,
        severity="CRITICAL",
        status="SUBMITTED",
        description="Test invalid jump",
    )
    created = repo.create(inc)

    # Attempting to jump directly from SUBMITTED to RESOLVED without acknowledgement or dispatch
    with pytest.raises(IncidentStateTransitionError) as exc_info:
        repo.transition_state(created.id, "RESOLVED", actor_id=responder.id)

    assert "Invalid state transition" in str(exc_info.value)
    # Ensure state remained unchanged in database
    refreshed = repo.get_by_id(created.id)
    assert refreshed.status == "SUBMITTED"
