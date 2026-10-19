from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Dict, Any

class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_id: str
    user_id: str
    merchant_id: str
    device_id: Optional[str] = "DEV_UNSPECIFIED"
    amount: float
    currency: str = "INR"
    timestamp: str
    payment_method: str
    location: str
    transaction_type: str = "Online"
    
    # Ground truth
    ground_truth_label: Optional[bool] = False
    ground_truth_type: Optional[str] = "Normal"
    
    # Model scores
    ml_score: Optional[float] = 0.0
    ml_prediction: Optional[str] = "Safe"
    gnn_score: Optional[float] = 0.0
    hybrid_risk_score: Optional[float] = 0.0
    hybrid_prediction: Optional[str] = "Safe"
    model_version: Optional[str] = "v1.0.0-hybrid"
    
    # Analyst state
    analyst_status: Optional[str] = "Pending"
    analyst_notes: Optional[str] = None
    explanation_summary: Optional[str] = None

    # Enriched entity metadata
    merchant_name: Optional[str] = None
    merchant_category: Optional[str] = None
    device_type: Optional[str] = None


class PredictRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    transaction_id: Optional[str] = None
    user_id: str = Field(..., json_schema_extra={"example": "USR_2041"})
    merchant_id: str = Field(..., json_schema_extra={"example": "MERCH_902"})
    device_id: Optional[str] = Field("DEV_UNSPECIFIED", json_schema_extra={"example": "DEV_4102"})
    amount: float = Field(..., json_schema_extra={"example": 42000.00})
    currency: str = Field("INR", json_schema_extra={"example": "INR"})
    timestamp: Optional[str] = Field(None, json_schema_extra={"example": "2026-09-28 14:30:00"})
    payment_method: str = Field("UPI", json_schema_extra={"example": "UPI"})
    location: str = Field("Mumbai", json_schema_extra={"example": "Mumbai"})
    transaction_type: str = Field("Online", json_schema_extra={"example": "Online"})

    @field_validator("device_id", mode="before")
    @classmethod
    def sanitize_device_id(cls, v):
        if v is None or not str(v).strip():
            return "DEV_UNSPECIFIED"
        return str(v).strip()

class FeatureWeight(BaseModel):
    feature_name: str
    value: Any
    contribution: float
    direction: str  # "fraud_positive" or "fraud_negative"
    description: str

class PredictResponse(BaseModel):
    transaction_id: str
    prediction: str  # "Safe", "Suspicious", "Fraud"
    final_classification: str = "Legitimate"  # "Legitimate", "Review", "Potentially suspicious"
    is_fraud: bool
    ml_score: float = 0.0
    gnn_score: float = 0.0
    hybrid_risk_score: float = 0.0
    hybrid_score: float = 0.0
    risk_score: float  # 0.0 - 100.0
    confidence: float  # 0.0 - 100.0
    risk_level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    model_version: str = "v1.0.0-hybrid"
    demo_mode: bool = False
    prediction_timestamp: str = ""
    top_features: List[FeatureWeight] = []
    explanation: str = ""
    suggested_action: str = ""
