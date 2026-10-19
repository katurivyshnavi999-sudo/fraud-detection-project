from typing import Dict, Any, List, Optional
from datetime import datetime
from app.ml.baseline_models import tabular_predictor
from app.gnn.service import gnn_service
from app.ml.siamese_network import SiameseModelManager
from app.ml.attention_network import AttentionModelManager
from app.ml.preprocessing import TransactionPreprocessor
from app.ml.feature_engineering import FeatureEngineer
from app.ml.continual_learning import continual_engine
from app.config import settings

class HybridFusionEngine:
    """
    Adaptive Hybrid Learning Fusion Engine.
    Combines:
      1. Tabular Machine Learning (Random Forest & XGBoost / Gradient Boosted Trees)
      2. Heterogeneous Graph Neural Network (PyG HeteroGNN message passing & node embeddings)
      3. Siamese Behavioral Representation (Pairwise distance from historical user profile)
      4. Temporal Sequence Attention Network (Multi-head attention on burst velocities)
    Produces calibrated fraud probability [0-100], risk tier, and explainable feature contributions.
    """

    DEFAULT_WEIGHTS = {
        "w_gnn": 0.30,
        "w_tabular": 0.35,
        "w_siamese": 0.20,
        "w_attention": 0.15
    }

    DEFAULT_THRESHOLDS = {
        "safe_threshold": 40.0,
        "fraud_threshold": 75.0
    }

    def __init__(self):
        self.preprocessor = TransactionPreprocessor()
        self.feature_engineer = FeatureEngineer()
        self.siamese_mgr = SiameseModelManager()
        self.attention_mgr = AttentionModelManager()

        # Calibrated baseline component weights (Sum = 1.0)
        self.w_gnn = self.DEFAULT_WEIGHTS["w_gnn"]
        self.w_tabular = self.DEFAULT_WEIGHTS["w_tabular"]
        self.w_siamese = self.DEFAULT_WEIGHTS["w_siamese"]
        self.w_attention = self.DEFAULT_WEIGHTS["w_attention"]
        self.safe_threshold = self.DEFAULT_THRESHOLDS["safe_threshold"]
        self.fraud_threshold = self.DEFAULT_THRESHOLDS["fraud_threshold"]

    def get_configuration(self) -> Dict[str, Any]:
        """Returns the current configurable fusion parameters and thresholds."""
        return {
            "weights": {
                "w_gnn": round(self.w_gnn, 3),
                "w_tabular": round(self.w_tabular, 3),
                "w_siamese": round(self.w_siamese, 3),
                "w_attention": round(self.w_attention, 3),
                "sum": round(self.w_gnn + self.w_tabular + self.w_siamese + self.w_attention, 3)
            },
            "thresholds": {
                "safe_threshold": self.safe_threshold,
                "fraud_threshold": self.fraud_threshold
            },
            "adaptive_explanation": (
                "PayGuard adaptive fusion combines tabular feature risk with topological graph signals. "
                "When syndicate collusion or emulator reuse is detected, GNN weights are dynamically prioritized. "
                "Authorized administrators can calibrate the fusion blend or decision thresholds for academic evaluation."
            ),
            "defaults": {
                "weights": self.DEFAULT_WEIGHTS,
                "thresholds": self.DEFAULT_THRESHOLDS
            }
        }

    def update_configuration(
        self,
        weights: Optional[Dict[str, float]] = None,
        thresholds: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Updates and validates fusion weights and decision thresholds."""
        if weights:
            new_gnn = weights.get("w_gnn", self.w_gnn)
            new_tab = weights.get("w_tabular", self.w_tabular)
            new_siam = weights.get("w_siamese", self.w_siamese)
            new_attn = weights.get("w_attention", self.w_attention)

            for w_name, val in [("w_gnn", new_gnn), ("w_tabular", new_tab), ("w_siamese", new_siam), ("w_attention", new_attn)]:
                if not (0.0 <= val <= 1.0):
                    raise ValueError(f"Weight {w_name} must be within [0.0, 1.0]. Got {val}")

            self.w_gnn = new_gnn
            self.w_tabular = new_tab
            self.w_siamese = new_siam
            self.w_attention = new_attn

        if thresholds:
            new_safe = thresholds.get("safe_threshold", self.safe_threshold)
            new_fraud = thresholds.get("fraud_threshold", self.fraud_threshold)
            if not (0.0 <= new_safe < new_fraud <= 100.0):
                raise ValueError(f"Thresholds must satisfy 0 <= safe ({new_safe}) < fraud ({new_fraud}) <= 100.")
            self.safe_threshold = new_safe
            self.fraud_threshold = new_fraud

        return self.get_configuration()

    def reset_configuration(self) -> Dict[str, Any]:
        """Resets fusion weights and decision thresholds to calibrated defaults."""
        self.w_gnn = self.DEFAULT_WEIGHTS["w_gnn"]
        self.w_tabular = self.DEFAULT_WEIGHTS["w_tabular"]
        self.w_siamese = self.DEFAULT_WEIGHTS["w_siamese"]
        self.w_attention = self.DEFAULT_WEIGHTS["w_attention"]
        self.safe_threshold = self.DEFAULT_THRESHOLDS["safe_threshold"]
        self.fraud_threshold = self.DEFAULT_THRESHOLDS["fraud_threshold"]
        return self.get_configuration()

    def fuse_transaction(self, tx_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes unified hybrid inference across all model modalities.
        """
        # 1. Tabular Behavioral Features
        preprocessed = self.preprocessor.transform(tx_dict)
        engineered = self.feature_engineer.compute_features(tx_dict, preprocessed)

        # 2. Tabular ML Prediction (Random Forest + XGBoost)
        tabular_res = tabular_predictor.predict(tx_dict)
        tabular_prob = float(tabular_res["ml_score"] / 100.0)

        # 3. Graph Neural Network (PyG HeteroGNN Relational Reasoning)
        gnn_res = gnn_service.score_transaction_graph(tx_dict)
        gnn_prob = float(gnn_res["gnn_score"] / 100.0)

        # 4. Siamese Behavioral Baseline Deviation
        siamese_prob = self.siamese_mgr.compute_behavior_deviation(engineered)

        # 5. Temporal Attention Sequence Risk
        attention_prob = self.attention_mgr.compute_temporal_attention(engineered)

        # 6. Adaptive Weight Calibration:
        # If hardware emulator or multi-account syndicate detected, dynamically boost GNN topological weight
        if gnn_res.get("syndicate_detected", False) or engineered.get("is_emulator", 0.0) > 0.5:
            w_gnn = min(0.60, self.w_gnn + 0.15)
            rem = max(0.01, 1.0 - w_gnn)
            other_sum = self.w_tabular + self.w_siamese + self.w_attention
            if other_sum > 0:
                w_tab = rem * (self.w_tabular / other_sum)
                w_siam = rem * (self.w_siamese / other_sum)
                w_attn = rem * (self.w_attention / other_sum)
            else:
                w_tab = rem / 3.0
                w_siam = rem / 3.0
                w_attn = rem / 3.0
        else:
            w_gnn = self.w_gnn
            w_tab = self.w_tabular
            w_siam = self.w_siamese
            w_attn = self.w_attention

        # Weighted combination [0, 1]
        weight_sum = w_gnn + w_tab + w_siam + w_attn
        if weight_sum > 0:
            fused_prob = (
                (w_gnn * gnn_prob) +
                (w_tab * tabular_prob) +
                (w_siam * siamese_prob) +
                (w_attn * attention_prob)
            ) / weight_sum
        else:
            fused_prob = (tabular_prob + gnn_prob) / 2.0

        # Calibrated risk score [0, 100]
        risk_score = round(min(100.0, max(0.0, fused_prob * 100.0)), 1)

        # Categorical Decision using calibrated or configured thresholds
        if risk_score >= self.fraud_threshold:
            prediction = "Fraud"
            risk_tier = "CRITICAL" if risk_score >= (self.fraud_threshold + 10.0) else "HIGH"
            suggested_action = "Block payment authorization & alert fraud operations center."
        elif risk_score >= self.safe_threshold:
            prediction = "Suspicious"
            risk_tier = "MEDIUM"
            suggested_action = "Prompt step-up biometric / Out-of-Band SMS verification."
        else:
            prediction = "Safe"
            risk_tier = "LOW"
            suggested_action = "Approve payment through low-latency fast-track gateway."

        # Confidence metric
        confidence = round(75.0 + (abs(risk_score - 50.0) / 50.0) * 24.0, 1)

        # Active continual learning version
        active_version = continual_engine.active_version
        ml_score = round(tabular_prob * 100.0, 1)
        gnn_score = round(gnn_prob * 100.0, 1)
        hybrid_score = risk_score
        final_class = "Potentially suspicious" if prediction == "Fraud" else ("Review" if prediction == "Suspicious" else "Legitimate")

        return {
            "transaction_id": tx_dict.get("transaction_id", "TXN_PENDING"),
            "ml_score": ml_score,
            "gnn_score": gnn_score,
            "hybrid_score": hybrid_score,
            "hybrid_risk_score": risk_score,
            "hybrid_prediction": prediction,
            "final_classification": final_class,
            "risk_tier": risk_tier,
            "confidence": confidence,
            "suggested_action": suggested_action,
            "model_version": active_version,
            "prediction_timestamp": datetime.now().isoformat(),
            "demo_mode": bool(tx_dict.get("is_demo", False)),
            "decision_thresholds": {
                "safe_threshold": self.safe_threshold,
                "fraud_threshold": self.fraud_threshold
            },
            "modalities": {
                "tabular_ml": {
                    "score": round(tabular_prob * 100.0, 1),
                    "weight": round(w_tab, 2),
                    "rf_prob": tabular_res.get("rf_probability", 0.0),
                    "xgb_prob": tabular_res.get("xgb_probability", 0.0)
                },
                "graph_neural_network": {
                    "score": round(gnn_prob * 100.0, 1),
                    "weight": round(w_gnn, 2),
                    "syndicate_detected": gnn_res.get("syndicate_detected", False),
                    "embedding": gnn_res.get("gnn_embedding", [])
                },
                "siamese_representation": {
                    "score": round(siamese_prob * 100.0, 1),
                    "weight": round(w_siam, 2),
                    "baseline_distance": round(siamese_prob, 3)
                },
                "temporal_attention": {
                    "score": round(attention_prob * 100.0, 1),
                    "weight": round(w_attn, 2),
                    "velocity_burst_detected": engineered.get("velocity_1h", 1.0) >= 3.0
                }
            }
        }

    score_transaction = fuse_transaction

hybrid_fusion_engine = HybridFusionEngine()
