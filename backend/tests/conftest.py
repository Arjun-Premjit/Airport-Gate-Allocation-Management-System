import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.seed_data import init_db_seed
from app.main import app

TEST_DATABASE_URL = "sqlite:///./test_agams_suite.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    init_db_seed(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(autouse=True)
def override_db():
    def _override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    yield
    # Keep override consistent across the session

@pytest.fixture
def client():
    return TestClient(app)
