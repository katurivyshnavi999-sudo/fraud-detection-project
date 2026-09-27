from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.seed_data import seed_database_if_empty
from app.api import auth, dashboard, transactions, graph, explanation, continual, dataset, analytics, project_info

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed initial realistic database if empty
    print("Initializing Fraud Detection Database...")
    seed_database_if_empty()
    print("Backend ready to receive API requests.")
    yield
    print("Backend shutting down.")

app = FastAPI(
    title="Digital Payment Fraud Detection System API",
    description="Backend API for BTech final-year project: Graph-Enhanced Adaptive Hybrid Learning for Digital Payment Fraud Detection",
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
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(transactions.router)
app.include_router(graph.router)
app.include_router(explanation.router)
app.include_router(continual.router)
app.include_router(dataset.router)
app.include_router(analytics.router)
app.include_router(project_info.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "project": settings.PROJECT_TITLE,
        "department": settings.DEPARTMENT,
        "version": settings.VERSION,
        "is_demo_mode": settings.IS_DEMO_MODE,
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
