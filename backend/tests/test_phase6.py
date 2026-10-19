import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ml.hybrid_fusion import hybrid_fusion_engine
from app.ml.continual_learning import (
    continual_engine,
    RehearsalMemoryBuffer,
    EWCController
)
from app.ml.fraud_prediction import fraud_detector
from app.database.connection import SessionLocal
from app.database.models import ModelVersionRecord

client = TestClient(app)

def test_hybrid_fusion_layer_modalities():
    """Verify that HybridFusionEngine unifies Tabular ML, PyG GNN, Siamese, and Attention."""
    # 1. Normal legitimate payment
    safe_tx = {
        "transaction_id": "TXN_TEST_SAFE",
        "user_id": "USR_1001",
        "device_id": "DEV_1102",
        "merchant_id": "MERCH_101",
        "amount": 850.0,
        "payment_method": "UPI",
        "timestamp": "2026-09-28 11:30:00"
    }
    safe_fused = hybrid_fusion_engine.fuse_transaction(safe_tx)
    assert safe_fused["hybrid_risk_score"] < 40.0
    assert safe_fused["hybrid_prediction"] == "Safe"
    assert safe_fused["risk_tier"] == "LOW"

    # Verify all 4 modalities are represented
    modalities = safe_fused["modalities"]
    assert "tabular_ml" in modalities
    assert "graph_neural_network" in modalities
    assert "siamese_representation" in modalities
    assert "temporal_attention" in modalities

    # Verify standard weights sum to 1.0
    total_weights = (
        modalities["tabular_ml"]["weight"] +
        modalities["graph_neural_network"]["weight"] +
        modalities["siamese_representation"]["weight"] +
        modalities["temporal_attention"]["weight"]
    )
    assert abs(total_weights - 1.0) < 0.01

    # 2. Nocturnal emulator syndicate payment
    fraud_tx = {
        "transaction_id": "TXN_TEST_FRAUD",
        "user_id": "USR_2041",
        "device_id": "DEV_4102",
        "merchant_id": "MERCH_999",
        "amount": 92000.0,
        "payment_method": "Net Banking",
        "timestamp": "2026-09-28 02:45:00",
        "is_emulator": True,
        "velocity_1h": 5.0
    }
    fraud_fused = hybrid_fusion_engine.fuse_transaction(fraud_tx)
    assert fraud_fused["hybrid_risk_score"] >= 75.0
    assert fraud_fused["hybrid_prediction"] == "Fraud"
    assert fraud_fused["risk_tier"] in ["HIGH", "CRITICAL"]

    # Verify dynamic weight adjustment boosted GNN weight
    fraud_mods = fraud_fused["modalities"]
    assert fraud_mods["graph_neural_network"]["weight"] == 0.45

def test_continual_learning_rehearsal_and_ewc():
    """Verify experience replay buffering and Elastic Weight Consolidation (EWC) penalty."""
    # Test buffer
    buffer = RehearsalMemoryBuffer(capacity=200)
    for i in range(50):
        buffer.add({"tx_id": f"TX_{i}", "is_fraud": 1 if i % 5 == 0 else 0})
    assert len(buffer) == 50
    batch = buffer.sample_batch(16)
    assert len(batch) == 16

    # Test EWC
    ewc = EWCController(lambda_reg=400.0)
    penalty_small = ewc.compute_penalty_metric(parameter_delta=0.01)
    penalty_large = ewc.compute_penalty_metric(parameter_delta=0.05)
    assert penalty_large > penalty_small
    assert penalty_small > 0.0

def test_drift_detection_and_adaptation():
    """Verify concept drift monitoring and continual adaptation."""
    drift_info = continual_engine.check_drift()
    assert "drift_index" in drift_info
    assert "drift_status" in drift_info
    assert "threshold" in drift_info
    assert "ewc_regularization_penalty" in drift_info

    # Trigger adaptation
    initial_ver = continual_engine.active_version
    adapt_res = continual_engine.adapt([{"tx_id": "TX_ADAPT_1"}, {"tx_id": "TX_ADAPT_2"}])
    assert adapt_res["success"] is True
    assert adapt_res["previous_version"] == initial_ver
    assert adapt_res["new_version"] != initial_ver
    assert "ewc_penalty" in adapt_res

    # Test rollback
    rollback_res = continual_engine.rollback_to_previous_version()
    assert rollback_res["success"] is True
    assert continual_engine.active_version == initial_ver

def test_fraud_prediction_orchestrator():
    """Verify master FraudPredictionOrchestrator pipeline."""
    sample_tx = {
        "transaction_id": "TXN_ORCHESTRATOR",
        "user_id": "USR_1001",
        "device_id": "DEV_1102",
        "merchant_id": "MERCH_101",
        "amount": 1200.0,
        "payment_method": "UPI",
        "timestamp": "2026-09-28 15:00:00"
    }
    result = fraud_detector.predict(sample_tx)
    assert "hybrid_risk_score" in result
    assert "hybrid_prediction" in result
    assert "confidence" in result
    assert "modalities" in result
    assert "top_features" in result
    assert "suggested_action" in result
    assert "is_simulated_mode" in result
    assert "demo" not in str(result).lower()

def test_api_predict_and_continual():
    """Verify API endpoints for live prediction and continual learning status."""
    # Test POST /api/transactions/predict
    pred_resp = client.post("/api/transactions/predict", json={
        "user_id": "USR_1001",
        "merchant_id": "MERCH_101",
        "device_id": "DEV_1102",
        "amount": 2500.0,
        "payment_method": "UPI",
        "location": "Mumbai",
        "transaction_type": "POS"
    })
    assert pred_resp.status_code == 200
    pred_data = pred_resp.json()
    assert "hybrid_risk_score" in pred_data
    assert "prediction" in pred_data
    assert "confidence" in pred_data
    assert "risk_level" in pred_data
    assert "top_features" in pred_data

    # Test GET /api/model/status
    status_resp = client.get("/api/model/status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert "current_model" in status_data
    assert "drift_index" in status_data
    assert "version_history" in status_data

    # Test POST /api/model/update
    update_resp = client.post("/api/model/update", json={
        "sample_batch_size": 200,
        "adaptation_strategy": "Experience Replay + EWC"
    })
    assert update_resp.status_code == 200
    update_data = update_resp.json()
    assert update_data["success"] is True

def test_zero_demo_words_phase6():
    """Verify zero occurrences of 'demo' in Phase 6 outputs."""
    res = fraud_detector.predict({
        "user_id": "USR_1001",
        "device_id": "DEV_1102",
        "merchant_id": "MERCH_101",
        "amount": 500.0
    })
    assert "demo" not in str(res).lower()

    status_resp = client.get("/api/model/status")
    assert "demo" not in status_resp.text.lower()

if __name__ == "__main__":
    print("Running Phase 6 Verification Tests...")
    test_hybrid_fusion_layer_modalities()
    print("✓ test_hybrid_fusion_layer_modalities PASSED")
    test_continual_learning_rehearsal_and_ewc()
    print("✓ test_continual_learning_rehearsal_and_ewc PASSED")
    test_drift_detection_and_adaptation()
    print("✓ test_drift_detection_and_adaptation PASSED")
    test_fraud_prediction_orchestrator()
    print("✓ test_fraud_prediction_orchestrator PASSED")
    test_api_predict_and_continual()
    print("✓ test_api_predict_and_continual PASSED")
    test_zero_demo_words_phase6()
    print("✓ test_zero_demo_words_phase6 PASSED")
    print("\nALL PHASE 6 BACKEND TESTS PASSED SUCCESSFULLY!")
