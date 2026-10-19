import os
import json
import numpy as np
import pandas as pd
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.config import MODELS_DIR
from app.ml.dataset_generator import (
    generate_synthetic_payment_dataset,
    get_train_test_data,
    FEATURE_COLUMNS
)
from app.ml.baseline_models import (
    BaselineModelTrainer,
    TabularPredictor,
    tabular_predictor
)
from app.database.connection import SessionLocal
from app.database.models import ModelVersionRecord

client = TestClient(app)

def test_synthetic_dataset_generation():
    """Verify synthetic transaction generator produces valid, clean tabular data."""
    df = generate_synthetic_payment_dataset(n_samples=600, random_seed=42)
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 600

    # Ensure no NaN or infinite values
    assert df[FEATURE_COLUMNS].isna().sum().sum() == 0
    assert not np.isinf(df[FEATURE_COLUMNS].values).any()

    # Verify fraud label distribution
    fraud_count = df["is_fraud"].sum()
    assert 20 <= fraud_count <= 60  # ~6.5% fraud rate

    # Verify Indian payment methods present
    channels = set(df["payment_method"].unique())
    assert "UPI" in channels
    assert "Debit Card" in channels
    assert "Credit Card" in channels
    assert "Net Banking" in channels

    # Verify cyclical hour encoding bounds
    assert (df["hour_sin"] >= -1.0).all() and (df["hour_sin"] <= 1.0).all()
    assert (df["hour_cos"] >= -1.0).all() and (df["hour_cos"] <= 1.0).all()

def test_train_test_split():
    """Verify stratified train/test split."""
    X_train, X_test, y_train, y_test, feats = get_train_test_data(
        n_samples=500, test_size=0.20, random_seed=42
    )
    assert X_train.shape[0] == 400
    assert X_test.shape[0] == 100
    assert X_train.shape[1] == len(FEATURE_COLUMNS)
    assert y_train.sum() > 0
    assert y_test.sum() > 0

def test_baseline_models_training_and_metrics():
    """Verify baseline models train, achieve high performance, and save checkpoints."""
    trainer = BaselineModelTrainer()
    metrics = trainer.train_and_evaluate(n_samples=1000, random_seed=42)

    # Check Random Forest metrics
    rf = metrics["random_forest"]
    assert rf["accuracy"] >= 0.95
    assert rf["roc_auc"] >= 0.95
    assert rf["f1_score"] >= 0.80
    assert len(rf["feature_importances"]) == len(FEATURE_COLUMNS)

    # Check Gradient Boosted Trees / XGBoost metrics
    xgb = metrics["xgboost"]
    assert xgb["accuracy"] >= 0.95
    assert xgb["roc_auc"] >= 0.95
    assert xgb["f1_score"] >= 0.80

    # Check confusion matrix consistency
    cm = rf["confusion_matrix"]
    total_eval = cm["true_negative"] + cm["false_positive"] + cm["false_negative"] + cm["true_positive"]
    assert total_eval == metrics["test_sample_count"]

    # Verify files saved on disk
    rf_file = MODELS_DIR / "random_forest_baseline.joblib"
    xgb_file = MODELS_DIR / "xgboost_baseline.joblib"
    metrics_file = MODELS_DIR / "baseline_metrics.json"

    assert rf_file.exists()
    assert xgb_file.exists()
    assert metrics_file.exists()

def test_database_model_registry_registration():
    """Verify models are registered into the SQLite model_versions table."""
    trainer = BaselineModelTrainer()
    trainer.train_and_evaluate(n_samples=500, random_seed=42)

    db = SessionLocal()
    try:
        trainer.register_in_database(db)

        # Check records exist in DB
        rf_rec = db.query(ModelVersionRecord).filter(ModelVersionRecord.version == "v1.0.0-rf-baseline").first()
        xgb_rec = db.query(ModelVersionRecord).filter(ModelVersionRecord.version == "v1.0.0-xgb-baseline").first()

        assert rf_rec is not None
        assert rf_rec.roc_auc >= 0.95
        assert xgb_rec is not None
        assert xgb_rec.roc_auc >= 0.95

        # Check active model remains active
        active = db.query(ModelVersionRecord).filter(ModelVersionRecord.is_active == True).first()
        assert active is not None
    finally:
        db.close()

def test_tabular_inference_predictor():
    """Verify TabularPredictor inference on simulated transactions."""
    predictor = TabularPredictor()

    # 1. Normal safe transaction
    safe_tx = {
        "amount": 450.0,
        "payment_method": "UPI",
        "device_id": "DEV_1102",
        "merchant_id": "MERCH_101",
        "timestamp": "2026-09-28 14:30:00",
        "user_mean_spend": 2500.0,
        "is_emulator": False,
        "velocity_1h": 1.0,
        "velocity_24h": 2.0
    }
    safe_res = predictor.predict(safe_tx)
    assert "ml_score" in safe_res
    assert safe_res["ml_score"] < 40.0
    assert safe_res["ml_prediction"] == "Safe"

    # 2. Fraudulent nocturnal emulator transaction
    fraud_tx = {
        "amount": 95000.0,
        "payment_method": "Net Banking",
        "device_id": "DEV_4102",
        "merchant_id": "MERCH_999",
        "timestamp": "2026-09-28 02:40:00",
        "user_mean_spend": 3000.0,
        "is_emulator": True,
        "velocity_1h": 5.0,
        "velocity_24h": 10.0
    }
    fraud_res = predictor.predict(fraud_tx)
    assert fraud_res["ml_score"] >= 70.0
    assert fraud_res["ml_prediction"] == "Fraud"

def test_models_api_endpoints():
    """Verify backend API endpoints for models and performance comparison."""
    # Performance endpoint returns models comparison
    perf_resp = client.get("/api/models/performance")
    assert perf_resp.status_code == 200
    perf_data = perf_resp.json()
    assert "models_comparison" in perf_data
    assert len(perf_data["models_comparison"]) >= 3

    # Predict tabular endpoint
    sample_tx = {
        "amount": 1200.0,
        "payment_method": "Debit Card",
        "device_id": "DEV_1102",
        "merchant_id": "MERCH_201",
        "timestamp": "2026-09-28 12:00:00"
    }
    pred_resp = client.post("/api/models/predict-tabular", json=sample_tx)
    assert pred_resp.status_code == 200
    assert "ml_score" in pred_resp.json()

def test_zero_demo_words_phase4():
    """Verify zero occurrences of 'demo' in Phase 4 files and API outputs."""
    p_resp = client.get("/api/models/performance")
    assert "demo" not in p_resp.text.lower()

    m_resp = client.get("/api/models")
    assert "demo" not in m_resp.text.lower()

if __name__ == "__main__":
    print("Running Phase 4 Verification Tests...")
    test_synthetic_dataset_generation()
    print("✓ test_synthetic_dataset_generation PASSED")
    test_train_test_split()
    print("✓ test_train_test_split PASSED")
    test_baseline_models_training_and_metrics()
    print("✓ test_baseline_models_training_and_metrics PASSED")
    test_database_model_registry_registration()
    print("✓ test_database_model_registry_registration PASSED")
    test_tabular_inference_predictor()
    print("✓ test_tabular_inference_predictor PASSED")
    test_models_api_endpoints()
    print("✓ test_models_api_endpoints PASSED")
    test_zero_demo_words_phase4()
    print("✓ test_zero_demo_words_phase4 PASSED")
    print("\nALL PHASE 4 BACKEND TESTS PASSED SUCCESSFULLY!")
