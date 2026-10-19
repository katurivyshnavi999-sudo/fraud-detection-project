from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    name: str
    email: str
    phone: Optional[str] = None
    city: str
    account_type: str
    upi_vpa: Optional[str] = None
    risk_level: str
    created_at: Optional[datetime] = None
