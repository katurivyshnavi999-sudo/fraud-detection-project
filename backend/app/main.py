from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.seed_data import seed_database_if_empty
from app.api import (
    dashboard,
    transactions,
    alerts,
    investigations,
    simulation,
    users,
    models,
    graph,
    explanation,
    continual,
    dataset,
    analytics,
    project_info,
    auth,
    demo,
    reviews
)
from app.websocket import stream_server

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed initial realistic database if empty
    print("Initializing PayGuard Database...")
    seed_database_if_empty()
    print("PayGuard Backend ready to receive API requests.")
    yield
    print("PayGuard Backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_TITLE,
    description="PayGuard Backend API: Graph-Enhanced Adaptive Hybrid Learning for Digital Payment Fraud Detection",
    version=settings.VERSION,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All API Routers
app.include_router(dashboard.router)
app.include_router(transactions.router)
app.include_router(alerts.router)
app.include_router(investigations.router)
app.include_router(simulation.router)
app.include_router(users.router)
app.include_router(models.router)
app.include_router(graph.router)
app.include_router(explanation.router)
app.include_router(continual.router)
app.include_router(dataset.router)
app.include_router(analytics.router)
app.include_router(project_info.router)
app.include_router(auth.router)
app.include_router(demo.router)
app.include_router(reviews.router)

# Register WebSocket Stream Router
app.include_router(stream_server.router)

@app.get("/")
@app.get("/health")
@app.get("/api/health")
def root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "title": settings.PROJECT_TITLE,
        "tagline": settings.TAGLINE,
        "subtitle": settings.SUBTITLE,
        "department": settings.DEPARTMENT,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
