from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any

class NoteRequest(BaseModel):
    notes: str
    analyst_name: Optional[str] = "System Administrator"

class StatusUpdateRequest(BaseModel):
    status: str  # "Reviewed Safe", "Suspicious", "Confirmed Fraud"
    notes: Optional[str] = None
    analyst_name: Optional[str] = "System Administrator"

class InvestigationDossier(BaseModel):
    transaction_id: str
    user_id: str
    merchant_id: str
    merchant_name: str
    merchant_category: str
    device_id: str
    device_type: str
    amount: float
    currency: str
    payment_method: str
    location: str
    timestamp: str
    
    # Model predictions
    ml_prediction: str
    ml_score: float
    ml_category: str
    
    gnn_prediction: str
    gnn_score: float
    gnn_category: str
    
    hybrid_prediction: str
    hybrid_risk_score: float
    hybrid_category: str
    model_version: str
    
    # Graph activity
    connected_users: List[str]
    connected_devices: List[str]
    connected_merchants: List[str]
    connected_txns: List[str]
    
    # Explainability
    shap_contributions: List[Dict[str, Any]]
    
    # Analyst state
    analyst_status: str
    analyst_notes: Optional[str] = None
