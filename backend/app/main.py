
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.seed_data import init_db_seed
from app.models import all_models

# Import routers
from app.auth.router import router as auth_router
from app.gates.router import router as gates_router
from app.allocations.router import router as allocations_router
from app.flights.router import router as flights_router
from app.maintenance.router import router as maintenance_router
from app.analytics.router import router as analytics_router
from app.common.router import router as common_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize and seed only local SQLite development databases.
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
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        # Add your actual production frontend origin here if needed.
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
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
        "database": settings.DATABASE_URL.split("://")[0],
    }
