import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.simulator.generator import simulation_manager
from app.schemas.simulation import SimulationStatusResponse, SimulationSettingsUpdate
from app.schemas.transaction import TransactionOut

router = APIRouter(prefix="/api/simulation", tags=["Simulation Control"])

@router.get("/status", response_model=SimulationStatusResponse)
def get_simulation_status(db: Session = Depends(get_db)):
    """
    Returns live state of the background transaction simulator:
    running/paused/stopped, stream interval, risk distribution settings,
    and cumulative generation metrics.
    """
    return simulation_manager.get_status(db)

@router.post("/start", response_model=SimulationStatusResponse)
async def start_simulation():
    """Starts simulated transaction streaming on the active event loop."""
    loop = asyncio.get_running_loop()
    return simulation_manager.start(loop=loop)

@router.post("/pause", response_model=SimulationStatusResponse)
async def pause_simulation():
    """Pauses simulated transaction streaming."""
    return simulation_manager.pause()

@router.post("/resume", response_model=SimulationStatusResponse)
async def resume_simulation():
    """Resumes simulated transaction streaming on the active event loop."""
    loop = asyncio.get_running_loop()
    return simulation_manager.resume(loop=loop)

@router.post("/stop", response_model=SimulationStatusResponse)
async def stop_simulation():
    """Stops simulated transaction streaming cleanly."""
    return simulation_manager.stop()

@router.put("/settings", response_model=SimulationStatusResponse)
def update_simulation_settings(payload: SimulationSettingsUpdate, db: Session = Depends(get_db)):
    """
    Updates simulator interval, generation speed, transactions per minute,
    and risk scenario proportions. Persists configuration in database.
    """
    return simulation_manager.update_settings(payload.model_dump(), db)

@router.post("/generate", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def generate_simulated_transaction(
    scenario: Optional[str] = Query(None, description="Target scenario: Safe, Suspicious, or Fraud"),
    db: Session = Depends(get_db)
):
    """
    Generates an immediate simulated transaction and passes it through the
    hybrid ML + GNN inference pipeline. Returns the scored transaction record.
    """
    return simulation_manager.generate_single_transaction(db, scenario)
