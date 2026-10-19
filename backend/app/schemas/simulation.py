from pydantic import BaseModel
from typing import Optional

class SimulationStatusResponse(BaseModel):
    state: str  # "running", "paused", "stopped"
    interval_ms: int
    speed_factor: str
    safe_proportion: int
    suspicious_proportion: int
    fraud_proportion: int
    safe_threshold: float = 40.0
    fraud_threshold: float = 75.0
    total_generated: int = 0
    safe_generated: int = 0
    suspicious_generated: int = 0
    fraud_generated: int = 0
    transactions_per_minute: float = 30.0
    last_event_time: Optional[str] = None
    database_total_transactions: Optional[int] = 0

class SimulationSettingsUpdate(BaseModel):
    interval_ms: Optional[int] = None
    speed_factor: Optional[str] = None
    safe_proportion: Optional[int] = None
    suspicious_proportion: Optional[int] = None
    fraud_proportion: Optional[int] = None
    safe_threshold: Optional[float] = None
    fraud_threshold: Optional[float] = None
    transactions_per_minute: Optional[float] = None
