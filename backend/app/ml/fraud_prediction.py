"""
Master Hybrid Fraud Prediction Service.
Integrates Tabular Machine Learning, Siamese Representation, Attention Sequences,
and PyG Heterogeneous Graph Neural Network proximity into a unified adaptive fraud scoring pipeline.
"""

from typing import Dict, Any, List
from pathlib import Path
from app.config import settings, MODELS_DIR
from app.ml.base import BaseFraudDetector
from app.ml.hybrid_fusion import hybrid_fusion_engine
from app.ml.shap_explanation import ShapExplainer

class FraudPredictionOrchestrator(BaseFraudDetector):
    """
    Main inference engine for digital payment fraud detection.
    Coordinates hybrid components across tabular behavioral trees, relational GNN message passing,
    Siamese distance, and temporal sequence attention.
    """

    def __init__(self):
        self.fusion_engine = hybrid_fusion_engine
        self.shap_explainer = ShapExplainer()
        self.model_weights_file = Path(settings.MODEL_CHECKPOINT_PATH)
        self.has_trained_weights = self.model_weights_file.is_file() and settings.ENABLE_TRAINED_MODEL

    def is_trained_model_loaded(self) -> bool:
        return self.has_trained_weights

    def predict(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes unified hybrid inference pipeline.
        Returns prediction, calibrated risk score, confidence, multi-modal breakdown,
        feature attribution, and suggested action.
        """
        # Step 1: Hybrid multi-modal fusion
        fused = self.fusion_engine.fuse_transaction(transaction_data)
        risk_score = fused["hybrid_risk_score"]
        prediction = fused["hybrid_prediction"]
        is_fraud = prediction == "Fraud"

        # Step 2: Game-theoretic SHAP explainability
        explanation_data = self.shap_explainer.explain_transaction(transaction_data, risk_score)

        top_features_list = []
        for feat in explanation_data.get("features", [])[:4]:
            top_features_list.append({
                "feature_name": feat.get("display_name", feat.get("feature", "Feature")),
                "value": feat.get("feature_value", "N/A"),
                "contribution": feat.get("shap_value", 0.0),
                "direction": "fraud_positive" if feat.get("shap_value", 0.0) > 0 else "fraud_negative",
                "description": feat.get("impact_description", "")
            })

        tx_id = transaction_data.get("transaction_id") or "TXN_PENDING"

        return {
            "transaction_id": tx_id,
            "prediction": "Fraudulent" if is_fraud else ("Suspicious" if prediction == "Suspicious" else "Legitimate"),
            "is_fraud": is_fraud,
            "risk_score": risk_score,
            "hybrid_risk_score": risk_score,
            "hybrid_prediction": prediction,
            "confidence": fused["confidence"],
            "risk_level": fused["risk_tier"],
            "modalities": fused["modalities"],
            "model_version": fused["model_version"],
            "is_simulated_mode": not self.has_trained_weights,
            "top_features": top_features_list,
            "explanation": explanation_data.get("summary_text", f"Risk calibrated at {risk_score}/100."),
            "suggested_action": fused["suggested_action"]
        }

# Global singleton instance
fraud_detector = FraudPredictionOrchestrator()
