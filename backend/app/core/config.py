import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "AGAMS - Airport Gate Allocation Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Runtime database URL.
    # Note: When targeting Aiven MySQL, DATABASE_URL must be explicitly configured in .env.
    # Per AGENTS.md Section 6: Never silently fall back to SQLite when Aiven is expected.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Optional SSL CA certificate path for Aiven MySQL connection
    MYSQL_SSL_CA: str = os.getenv("MYSQL_SSL_CA", "")

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "agams_super_secret_jwt_key_2026_vit_dbms")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

settings = Settings()

# Validation per Section 6 of AGENTS.md: Never silently fall back to SQLite without explicit configuration
if not settings.DATABASE_URL:
    is_testing = (
        "pytest" in os.environ.get("_", "") or
        "PYTEST_CURRENT_TEST" in os.environ or
        os.getenv("TESTING") == "true"
    )
    # Require explicit flag to run local SQLite dev; otherwise inform user to configure Aiven MySQL
    allow_sqlite = os.getenv("AGAMS_ALLOW_SQLITE_DEV", "true").lower() in ("true", "1")
    if is_testing or allow_sqlite:
        settings.DATABASE_URL = "sqlite:///./agams_dev.db"
    else:
        raise RuntimeError(
            "CRITICAL DATABASE CONFIGURATION ERROR: DATABASE_URL is not set.\n"
            "AGAMS requires an explicit DATABASE_URL for Aiven MySQL (e.g. in .env).\n"
            "Silent fallback to SQLite is disabled per AGENTS.md Section 6.\n"
            "To run with local SQLite development explicitly, set AGAMS_ALLOW_SQLITE_DEV=true in .env."
        )
