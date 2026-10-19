from pydantic import BaseModel
from typing import List, Optional

class ModelVersionItem(BaseModel):
    version: str
    samples_count: int
    drift_score: float
    is_active: bool
    description: str
    created_at: str

class ModelStatusResponse(BaseModel):
    current_model: str
    status: str
    last_update_time: str
    number_of_new_samples: int
    buffer_capacity: int
    drift_status: str
    drift_index: float
    architecture_summary: str
    timeline_steps: List[dict]
    version_history: List[ModelVersionItem]

class SimulateUpdateRequest(BaseModel):
    sample_batch_size: Optional[int] = 500
    learning_rate: Optional[float] = 0.001
    adaptation_strategy: Optional[str] = "Experience Replay + EWC"

class SimulateUpdateResponse(BaseModel):
    success: bool
    previous_version: str
    new_version: str
    updated_at: str
    samples_adapted: int
    new_drift_index: float
    drift_status: str
    audit_log: str
    message: str
