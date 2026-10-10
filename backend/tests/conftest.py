import pytest
import os
import sys

# Ensure backend root is on PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.db.models.user import User
from app.core.security import get_password_hash, create_access_token

TEST_DATABASE_URL = "sqlite:///./test_saferoute.db"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    import app.db.models  # noqa
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_saferoute.db"):
        try:
            os.remove("./test_saferoute.db")
        except Exception:
            pass


@pytest.fixture
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_tourist(db_session):
    user = User(
        email="test_tourist@saferoute.ai",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Test Tourist",
        role="tourist",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    token = create_access_token(subject=user.id, role="tourist")
    return {"user": user, "token": token, "headers": {"Authorization": f"Bearer {token}"}}


@pytest.fixture
def test_responder(db_session):
    user = User(
        email="test_responder@saferoute.ai",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Test Responder",
        role="responder",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    token = create_access_token(subject=user.id, role="responder")
    return {"user": user, "token": token, "headers": {"Authorization": f"Bearer {token}"}}
