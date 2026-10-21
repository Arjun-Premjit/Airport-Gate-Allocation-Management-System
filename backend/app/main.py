import sys
from pathlib import Path

# Keep repository-root imports (backend.app.*) working when Vercel runs this
# service from the backend/ directory.
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.core.seed_data import init_db_seed
from backend.app.models import all_models  # Ensure all canonical models are registered with Base

# Import Routers
from backend.app.auth.router import router as auth_router
from backend.app.gates.router import router as gates_router
from backend.app.allocations.router import router as allocations_router
from backend.app.flights.router import router as flights_router
from backend.app.maintenance.router import router as maintenance_router
from backend.app.analytics.router import router as analytics_router
from backend.app.common.router import router as common_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Only run table check / initial seed for local sqlite development; NEVER overwrite or auto-recreate against Aiven
    if settings.DATABASE_URL.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            init_db_seed(db)
        finally:
            db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all application routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(gates_router, prefix="/api")
app.include_router(allocations_router, prefix="/api")
app.include_router(flights_router, prefix="/api")
app.include_router(maintenance_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(common_router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "application": "AGAMS",
        "version": settings.VERSION,
        "database": settings.DATABASE_URL.split("://")[0]
    }
