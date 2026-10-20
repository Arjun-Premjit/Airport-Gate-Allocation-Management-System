import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
elif "mysql" in settings.DATABASE_URL:
    # TLS is enabled without requiring a local CA certificate.
    # Configure CA verification only when MYSQL_SSL_CA is provided.
    if settings.MYSQL_SSL_CA:
        ca_path = os.path.abspath(os.path.expanduser(settings.MYSQL_SSL_CA))
        if not os.path.isfile(ca_path):
            raise RuntimeError(
                "MYSQL_SSL_CA is set, but the certificate file does not exist."
            )
        connect_args["ssl"] = {"ca": ca_path}
    else:
        connect_args["ssl"] = {}


engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
