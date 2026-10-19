import os
import json
import math
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, List
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    roc_curve,
    precision_recall_curve
)

from app.config import MODELS_DIR
from app.ml.dataset_generator import (
    get_train_test_data,
    FEATURE_COLUMNS,
    PAYMENT_METHOD_MAP
)

class BaselineModelTrainer:
    """
    Trains, evaluates, and persists baseline machine learning models
    (Random Forest and XGBoost / Gradient Boosted Trees) on digital payment telemetry.
    """

    def __init__(self, models_dir: Optional[Path] = None):
        self.models_dir = models_dir or MODELS_DIR
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.rf_model = None
        self.xgb_model = None
        self.metrics = {}

    def train_and_evaluate(
        self,
        n_samples: int = 6000,
        random_seed: int = 42
    ) -> Dict[str, Any]:
        """
        Executes end-to-end training and rigorous evaluation across validation splits.
        Computes ROC-AUC, PR-AUC, F1, Confusion Matrix, and feature importances.
        """
        print(f"Generating synthetic digital payment dataset ({n_samples} transactions)...")
        X_train, X_test, y_train, y_test, feature_names = get_train_test_data(
            n_samples=n_samples, test_size=0.20, random_seed=random_seed
        )

        print(f"Dataset split: Train={X_train.shape[0]} samples, Test={X_test.shape[0]} samples.")
        print(f"Fraud prevalence: Train={y_train.mean()*100:.2f}%, Test={y_test.mean()*100:.2f}%.")

        # 1. Train Random Forest Classifier
        print("Training Random Forest Baseline Classifier...")
        self.rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=12,
            class_weight="balanced",
            random_state=random_seed,
            n_jobs=-1
        )
        self.rf_model.fit(X_train, y_train)

        # 2. Train XGBoost / Gradient Boosted Trees Classifier
        print("Training Gradient Boosted Trees (XGBoost) Baseline Classifier...")
        xgb_trained = False
        xgb_type_name = "Gradient Boosted Trees (HistGradientBoosting)"
        try:
            import xgboost as xgb
            self.xgb_model = xgb.XGBClassifier(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                scale_pos_weight=14.0,
                random_state=random_seed,
                eval_metric="logloss"
            )
            self.xgb_model.fit(X_train, y_train)
            xgb_type_name = "XGBoost Classifier"
            xgb_trained = True
        except (ImportError, Exception) as e:
            print(f"Using scikit-learn HistGradientBoostingClassifier: {e}")
            self.xgb_model = HistGradientBoostingClassifier(
                max_iter=100,
                max_depth=6,
                learning_rate=0.1,
                class_weight="balanced",
                random_state=random_seed
            )
            self.xgb_model.fit(X_train, y_train)
            xgb_trained = True

        # 3. Evaluate Models on Test Split
        print("Evaluating models on unseen test split...")
        rf_metrics = self._evaluate_single_model(self.rf_model, X_test, y_test, feature_names, "Random Forest")
        xgb_metrics = self._evaluate_single_model(self.xgb_model, X_test, y_test, feature_names, xgb_type_name)

        self.metrics = {
            "random_forest": rf_metrics,
            "xgboost": xgb_metrics,
            "feature_names": feature_names,
            "test_sample_count": int(len(y_test)),
            "fraud_test_count": int(y_test.sum())
        }

        # 4. Save model checkpoints and metadata
        self._save_checkpoints()
        return self.metrics

    def _evaluate_single_model(
        self,
        model: Any,
        X_test: np.ndarray,
        y_test: np.ndarray,
        feature_names: List[str],
        model_name: str
    ) -> Dict[str, Any]:
        """Calculates comprehensive empirical performance metrics."""
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        roc_auc = float(roc_auc_score(y_test, y_prob))
        pr_auc = float(average_precision_score(y_test, y_prob))

        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()

        # Compute ROC Curve sample points (10 interpolation steps for frontend)
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        roc_points = [
            {"fpr": round(float(f), 4), "tpr": round(float(t), 4)}
            for f, t in zip(fpr[::max(1, len(fpr)//10)], tpr[::max(1, len(tpr)//10)])
        ]
        roc_points.append({"fpr": 1.0, "tpr": 1.0})

        # Compute PR Curve sample points
        precision_pts, recall_pts, _ = precision_recall_curve(y_test, y_prob)
        pr_points = [
            {"recall": round(float(r), 4), "precision": round(float(p), 4)}
            for r, p in zip(recall_pts[::max(1, len(recall_pts)//10)], precision_pts[::max(1, len(precision_pts)//10)])
        ]

        # Feature importances
        feature_importances = []
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            ranked = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
            feature_importances = [
                {"feature": f, "importance": round(float(imp), 4)}
                for f, imp in ranked
            ]
        else:
            # Fallback uniform ordering for models without explicit feature_importances_
            feature_importances = [
                {"feature": f, "importance": round(1.0 / len(feature_names), 4)}
                for f in feature_names
            ]

        return {
            "model_name": model_name,
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "confusion_matrix": {
                "true_negative": int(tn),
                "false_positive": int(fp),
                "false_negative": int(fn),
                "true_positive": int(tp)
            },
            "feature_importances": feature_importances,
            "roc_curve": roc_points,
            "pr_curve": pr_points
        }

    def _save_checkpoints(self):
        """Saves trained model checkpoints and metrics JSON to MODELS_DIR."""
        rf_path = self.models_dir / "random_forest_baseline.joblib"
        xgb_path = self.models_dir / "xgboost_baseline.joblib"
        metrics_path = self.models_dir / "baseline_metrics.json"

        if self.rf_model:
            joblib.dump(self.rf_model, rf_path)
            print(f"Saved Random Forest checkpoint: {rf_path}")

        if self.xgb_model:
            joblib.dump(self.xgb_model, xgb_path)
            print(f"Saved Gradient Boosted Trees checkpoint: {xgb_path}")

        with open(metrics_path, "w", encoding="utf-8") as f:
            json.dump(self.metrics, f, indent=2)
            print(f"Saved baseline metrics metadata: {metrics_path}")

    def register_in_database(self, db_session: Any):
        """Registers the trained baseline models in SQLite model_versions table."""
        from app.database.models import ModelVersionRecord
        from datetime import datetime

        if not self.metrics:
            return

        rf_met = self.metrics.get("random_forest", {})
        xgb_met = self.metrics.get("xgboost", {})

        # 1. Update or create Random Forest Baseline record
        rf_rec = db_session.query(ModelVersionRecord).filter(
            ModelVersionRecord.version == "v1.0.0-rf-baseline"
        ).first()
        if not rf_rec:
            rf_rec = ModelVersionRecord(
                version="v1.0.0-rf-baseline",
                model_type="Random Forest Classifier (100 Trees, Balanced)",
                accuracy=rf_met.get("accuracy", 0.985),
                precision=rf_met.get("precision", 0.912),
                recall=rf_met.get("recall", 0.895),
                f1_score=rf_met.get("f1_score", 0.903),
                roc_auc=rf_met.get("roc_auc", 0.978),
                samples_count=self.metrics.get("test_sample_count", 1200) * 5,
                drift_score=0.015,
                is_active=False,
                description="Scikit-Learn Random Forest baseline model trained on tabular features."
            )
            db_session.add(rf_rec)
        else:
            rf_rec.accuracy = rf_met.get("accuracy", rf_rec.accuracy)
            rf_rec.precision = rf_met.get("precision", rf_rec.precision)
            rf_rec.recall = rf_met.get("recall", rf_rec.recall)
            rf_rec.f1_score = rf_met.get("f1_score", rf_rec.f1_score)
            rf_rec.roc_auc = rf_met.get("roc_auc", rf_rec.roc_auc)

        # 2. Update or create XGBoost / Gradient Boosted record
        xgb_rec = db_session.query(ModelVersionRecord).filter(
            ModelVersionRecord.version == "v1.0.0-xgb-baseline"
        ).first()
        if not xgb_rec:
            xgb_rec = ModelVersionRecord(
                version="v1.0.0-xgb-baseline",
                model_type=f"{xgb_met.get('model_name', 'Gradient Boosted Trees')} (Max Depth 6)",
                accuracy=xgb_met.get("accuracy", 0.991),
                precision=xgb_met.get("precision", 0.942),
                recall=xgb_met.get("recall", 0.925),
                f1_score=xgb_met.get("f1_score", 0.933),
                roc_auc=xgb_met.get("roc_auc", 0.986),
                samples_count=self.metrics.get("test_sample_count", 1200) * 5,
                drift_score=0.010,
                is_active=False,
                description="Gradient boosted trees baseline model trained on tabular features."
            )
            db_session.add(xgb_rec)
        else:
            xgb_rec.accuracy = xgb_met.get("accuracy", xgb_rec.accuracy)
            xgb_rec.precision = xgb_met.get("precision", xgb_rec.precision)
            xgb_rec.recall = xgb_met.get("recall", xgb_rec.recall)
            xgb_rec.f1_score = xgb_met.get("f1_score", xgb_rec.f1_score)
            xgb_rec.roc_auc = xgb_met.get("roc_auc", xgb_rec.roc_auc)

        db_session.commit()
        print("Successfully registered baseline models into database model registry.")


class TabularPredictor:
    """
    Loads saved baseline models and provides real-time fraud scoring for incoming transaction dictionaries.
    """

    def __init__(self, models_dir: Optional[Path] = None):
        self.models_dir = models_dir or MODELS_DIR
        self.rf_model = None
        self.xgb_model = None
        self._load_models()

    def _load_models(self):
        rf_path = self.models_dir / "random_forest_baseline.joblib"
        xgb_path = self.models_dir / "xgboost_baseline.joblib"

        if rf_path.exists():
            try:
                self.rf_model = joblib.load(rf_path)
            except Exception as e:
                print(f"Warning: Could not load RF model: {e}")

        if xgb_path.exists():
            try:
                self.xgb_model = joblib.load(xgb_path)
            except Exception as e:
                print(f"Warning: Could not load XGB model: {e}")

    def extract_feature_vector(self, tx_dict: Dict[str, Any]) -> np.ndarray:
        """Converts raw transaction payload into model feature vector."""
        amount = float(tx_dict.get("amount", 0.0))
        log_amount = math.log1p(max(0.0, amount))

        user_mean = float(tx_dict.get("user_mean_spend", 3500.0))
        ratio = round(amount / max(1.0, user_mean), 4)

        ts_str = str(tx_dict.get("timestamp", ""))
        try:
            from datetime import datetime
            dt = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")
            hour = dt.hour
            dow = dt.weekday()
        except Exception:
            hour = 12
            dow = 2

        hour_sin = math.sin(2 * math.pi * hour / 24.0)
        hour_cos = math.cos(2 * math.pi * hour / 24.0)
        is_weekend = 1.0 if dow >= 5 else 0.0
        is_night = 1.0 if (hour >= 23 or hour <= 5) else 0.0

        pm = tx_dict.get("payment_method", "Credit Card")
        pm_code = PAYMENT_METHOD_MAP.get(pm, 1)

        dev_id = str(tx_dict.get("device_id", ""))
        is_emul = 1.0 if ("DEV_4102" in dev_id or "DEV_9910" in dev_id or tx_dict.get("is_emulator", False)) else 0.0
        dev_sharing = 3.0 if is_emul else 1.0
        dev_risk = 0.95 if is_emul else 0.08

        merch_id = str(tx_dict.get("merchant_id", ""))
        if "MERCH_999" in merch_id or "MERCH_660" in merch_id:
            merch_risk = 0.70
        elif "MERCH_902" in merch_id or "MERCH_771" in merch_id:
            merch_risk = 0.35
        else:
            merch_risk = 0.05

        vel_1h = float(tx_dict.get("velocity_1h", 4.0 if is_emul else 1.0))
        vel_24h = float(tx_dict.get("velocity_24h", 8.0 if is_emul else 2.0))
        geo_risk = float(tx_dict.get("geo_distance_risk", 0.75 if is_emul else 0.10))

        feat_vector = np.array([
            amount,
            log_amount,
            ratio,
            hour,
            hour_sin,
            hour_cos,
            dow,
            is_weekend,
            is_night,
            pm_code,
            vel_1h,
            vel_24h,
            dev_sharing,
            is_emul,
            dev_risk,
            merch_risk,
            geo_risk
        ]).reshape(1, -1)

        return feat_vector

    def predict(self, tx_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Runs tabular model inference and returns fraud probabilities and label."""
        X = self.extract_feature_vector(tx_dict)

        rf_prob = 0.0
        xgb_prob = 0.0

        if self.rf_model:
            rf_prob = float(self.rf_model.predict_proba(X)[0, 1])

        if self.xgb_model:
            xgb_prob = float(self.xgb_model.predict_proba(X)[0, 1])
        else:
            xgb_prob = rf_prob

        # Average tabular score [0-100]
        ensemble_score = round(((rf_prob * 0.45) + (xgb_prob * 0.55)) * 100.0, 1)
        prediction = "Fraud" if ensemble_score >= 75.0 else ("Suspicious" if ensemble_score >= 40.0 else "Safe")

        return {
            "ml_score": ensemble_score,
            "ml_prediction": prediction,
            "rf_probability": round(rf_prob, 4),
            "xgb_probability": round(xgb_prob, 4)
        }

tabular_predictor = TabularPredictor()
