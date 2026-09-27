from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class TransactionOut(BaseModel):
    id: int
    transaction_id: str
    user_id: str
    merchant_id: str
    device_id: str
    amount: float
    currency: str = "USD"
    timestamp: str
    payment_method: str
    location: str
    transaction_type: str
    risk_score: float
    is_fraud: bool
    fraud_type: str
    explanation_summary: Optional[str] = None

    class Config:
        from_attributes = True

class PredictRequest(BaseModel):
    transaction_id: Optional[str] = None
    user_id: str = Field(..., example="USR_2041")
    merchant_id: str = Field(..., example="MERCH_902")
    device_id: str = Field(..., example="DEV_4102")
    amount: float = Field(..., example=1250.00)
    currency: str = Field("USD", example="USD")
    timestamp: Optional[str] = Field(None, example="2026-09-18 14:30:00")
    payment_method: str = Field("Credit Card", example="Credit Card")
    location: str = Field("Lagos", example="Lagos")
    transaction_type: str = Field("Online", example="Online")

class FeatureWeight(BaseModel):
    feature_name: str
    value: Any
    contribution: float
    direction: str  # "fraud_positive" or "fraud_negative"
    description: str

class PredictResponse(BaseModel):
    transaction_id: str
    prediction: str  # "Fraudulent" or "Legitimate"
    is_fraud: bool
    risk_score: float  # 0.0 - 100.0
    confidence: float  # 0.0 - 100.0
    risk_level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    is_demo_mode: bool = True
    top_features: List[FeatureWeight]
    explanation: str
    suggested_action: str
