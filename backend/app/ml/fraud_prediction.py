"""
Master Hybrid Fraud Prediction Service.
Integrates Siamese Representation, Attention Sequences, Graph Neural Network proximity,
and Preprocessing into a cohesive fraud scoring pipeline.
"""

from typing import Dict, Any, List
from pathlib import Path
from app.config import settings, MODELS_DIR
from app.ml.base import BaseFraudDetector
from app.ml.preprocessing import TransactionPreprocessor
from app.ml.feature_engineering import FeatureEngineer
from app.ml.siamese_network import SiameseModelManager
from app.ml.attention_network import AttentionModelManager
from app.ml.gnn_model import HeteroGraphFraudDetector
from app.ml.shap_explanation import ShapExplainer

class FraudPredictionOrchestrator(BaseFraudDetector):
    """
    Main inference engine for digital payment fraud detection.
    Coordinates hybrid components and switches gracefully between mock demo and trained models.
    """

    def __init__(self):
        self.preprocessor = TransactionPreprocessor()
        self.feature_engineer = FeatureEngineer()
        self.siamese_mgr = SiameseModelManager(settings.MODEL_CHECKPOINT_PATH)
        self.attention_mgr = AttentionModelManager()
        self.gnn_detector = HeteroGraphFraudDetector()
        self.shap_explainer = ShapExplainer()
        
        # Check if actual trained weights file exists
        self.model_weights_file = Path(settings.MODEL_CHECKPOINT_PATH)
        self.has_trained_weights = self.model_weights_file.is_file() and settings.ENABLE_TRAINED_MODEL

    def is_trained_model_loaded(self) -> bool:
        return self.has_trained_weights

    def predict(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes hybrid inference pipeline.
        Returns prediction, risk score, confidence, feature attribution, and suggested action.
        """
        # Step 1: Preprocessing & cyclical transforms
        preprocessed = self.preprocessor.transform(transaction_data)
        
        # Step 2: Feature engineering & graph relational indicators
        engineered = self.feature_engineer.compute_features(transaction_data, preprocessed)
        
        # Step 3: Siamese behavioral distance
        siamese_dist = self.siamese_mgr.compute_behavior_deviation(engineered)
        
        # Step 4: Temporal sequence attention
        attention_score = self.attention_mgr.compute_temporal_attention(engineered)
        
        # Step 5: GNN multi-hop graph embedding risk
        user_id = str(transaction_data.get("user_id", ""))
        device_id = str(transaction_data.get("device_id", ""))
        merchant_id = str(transaction_data.get("merchant_id", ""))
        gnn_risk = self.gnn_detector.compute_graph_embedding_risk(user_id, device_id, merchant_id)
        
        # Step 6: Hybrid Fusion
        # In actual production: Final MLP combines [siamese_emb, attn_vector, gnn_emb]
        # In demo prototype: Weighted ensemble combining representation scores
        combined_prob = (
            0.35 * gnn_risk +           # Relational GNN syndicate score
            0.25 * siamese_dist +       # Behavior anomaly distance
            0.20 * attention_score +    # Temporal sequence attention
            0.20 * engineered.get("device_risk_prior", 0.1) # Device prior
        )
        
        # Scale to 0-100 risk score
        risk_score = round(min(100.0, max(0.0, combined_prob * 100)), 1)
        
        # Decision threshold (50.0)
        is_fraud = risk_score >= 50.0
        prediction_label = "Fraudulent" if is_fraud else "Legitimate"
        
        # Confidence calculation
        confidence = round(75.0 + (abs(risk_score - 50.0) / 50.0) * 23.5, 1)
        
        # Determine risk level
        if risk_score >= 85.0:
            risk_level = "CRITICAL"
            action = "Block transaction immediately & notify cardholder; freeze device token."
        elif risk_score >= 65.0:
            risk_level = "HIGH"
            action = "Escalate for manual fraud analyst review; step-up biometric verification."
        elif risk_score >= 40.0:
            risk_level = "MEDIUM"
            action = "Challenge transaction via Out-of-Band SMS/Email OTP."
        else:
            risk_level = "LOW"
            action = "Approve transaction automatically through fast-path clearance."

        # Compute SHAP explanation
        explanation_data = self.shap_explainer.explain_transaction(transaction_data, risk_score)

        # Convert top features to response schema format
        top_features_list = []
        for feat in explanation_data["features"][:4]:
            top_features_list.append({
                "feature_name": feat["display_name"],
                "value": feat["feature_value"],
                "contribution": feat["shap_value"],
                "direction": "fraud_positive" if feat["shap_value"] > 0 else "fraud_negative",
                "description": feat["impact_description"]
            })

        tx_id = transaction_data.get("transaction_id") or "TXN_PENDING"

        return {
            "transaction_id": tx_id,
            "prediction": prediction_label,
            "is_fraud": is_fraud,
            "risk_score": risk_score,
            "confidence": confidence,
            "risk_level": risk_level,
            "is_demo_mode": not self.has_trained_weights,
            "top_features": top_features_list,
            "explanation": explanation_data["summary_text"],
            "suggested_action": action
        }

# Global singleton instance
fraud_detector = FraudPredictionOrchestrator()
