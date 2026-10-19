from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    alert_id: str
    transaction_id: str
    user_id: str
    alert_type: str
    risk_level: str
    message: str
    is_read: bool
    created_at: Optional[datetime] = None

class AlertUpdate(BaseModel):
    is_read: Optional[bool] = True
