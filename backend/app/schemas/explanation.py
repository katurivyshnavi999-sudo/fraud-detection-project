from pydantic import BaseModel
from typing import List, Optional, Any

class FeatureAttribution(BaseModel):
    feature: str
    display_name: str
    feature_value: Any
    shap_value: float
    direction: str  # "push_fraud" or "push_legitimate"
    relative_importance: float  # 0 to 100
    impact_description: str

class ExplanationResponse(BaseModel):
    transaction_id: str
    prediction: str
    risk_score: float
    base_value: float  # E[f(x)] base expected value in SHAP
    model_output: float  # f(x)
    is_demo_data: bool = True
    notice: str
    features: List[FeatureAttribution]
    positive_fraud_push: float
    negative_fraud_push: float
    summary_text: str
