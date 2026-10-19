import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_user_data_isolation_transactions():
    """Verify strict user ownership isolation on transaction endpoints."""
    # USR_1001 (Rahul Sharma)
    resp_1001 = client.get("/api/user/transactions?user_id=USR_1001")
    assert resp_1001.status_code == 200
    txns_1001 = resp_1001.json()
    assert len(txns_1001) > 0
    for tx in txns_1001:
        assert tx["user_id"] == "USR_1001"
        assert tx["user_id"] != "USR_2041"

    # USR_2041 (Vikram Malhotra)
    resp_2041 = client.get("/api/user/transactions?user_id=USR_2041")
    assert resp_2041.status_code == 200
    txns_2041 = resp_2041.json()
    assert len(txns_2041) > 0
    for tx in txns_2041:
        assert tx["user_id"] == "USR_2041"
        assert tx["user_id"] != "USR_1001"

    # Missing user_id should be rejected
    resp_empty = client.get("/api/user/transactions?user_id=")
    assert resp_empty.status_code == 400

def test_user_data_isolation_alerts():
    """Verify strict user ownership isolation on alerts endpoints."""
    resp_1001 = client.get("/api/user/alerts?user_id=USR_1001")
    assert resp_1001.status_code == 200
    alerts_1001 = resp_1001.json()
    assert len(alerts_1001) > 0
    for a in alerts_1001:
        assert a["user_id"] == "USR_1001"
        assert a["user_id"] != "USR_2041"

    # Missing user_id should be rejected
    resp_err = client.get("/api/user/alerts?user_id=")
    assert resp_err.status_code == 400

def test_transactions_crud_and_stats():
    """Verify transactions listing, stats calculation, and creation."""
    # Stats
    stats_resp = client.get("/api/transactions/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert "total_transactions" in stats
    assert "fraud_transactions" in stats
    assert "fraud_rate" in stats
    assert "risk_distribution" in stats

    # Single transaction retrieval
    all_resp = client.get("/api/transactions?limit=1")
    assert all_resp.status_code == 200
    tx_list = all_resp.json()
    assert len(tx_list) > 0
    tx_id = tx_list[0]["transaction_id"]

    single_resp = client.get(f"/api/transactions/{tx_id}")
    assert single_resp.status_code == 200
    assert single_resp.json()["transaction_id"] == tx_id

    # Create transaction
    payload = {
        "user_id": "USR_1001",
        "merchant_id": "MERCH_104",
        "device_id": "DEV_1102",
        "amount": 1850.0,
        "currency": "INR",
        "payment_method": "UPI",
        "location": "Mumbai",
        "transaction_type": "POS"
    }
    create_resp = client.post("/api/transactions", json=payload)
    assert create_resp.status_code == 201
    created_tx = create_resp.json()
    assert created_tx["amount"] == 1850.0
    assert created_tx["currency"] == "INR"
    assert created_tx["hybrid_prediction"] in ["Safe", "Suspicious", "Fraud"]

def test_alerts_admin_and_update():
    """Verify alerts retrieval and status updates."""
    resp = client.get("/api/alerts?limit=5")
    assert resp.status_code == 200
    alerts = resp.json()
    assert len(alerts) > 0
    target_alert = alerts[0]

    # Patch read status
    patch_resp = client.patch(f"/api/alerts/{target_alert['alert_id']}", json={"is_read": True})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["is_read"] is True

def test_investigations_dossier_and_workflow():
    """Verify investigation dossier, SHAP attribution, notes, and status updates."""
    # List
    list_resp = client.get("/api/investigations")
    assert list_resp.status_code == 200
    inv_list = list_resp.json()
    assert len(inv_list) > 0
    target_txn_id = inv_list[0]["transaction_id"]

    # Dossier
    dossier_resp = client.get(f"/api/investigations/{target_txn_id}")
    assert dossier_resp.status_code == 200
    dossier = dossier_resp.json()
    assert dossier["transaction_id"] == target_txn_id
    assert "ml_score" in dossier
    assert "gnn_score" in dossier
    assert "hybrid_risk_score" in dossier
    assert "connected_users" in dossier
    assert "connected_devices" in dossier
    assert "shap_contributions" in dossier
    assert len(dossier["shap_contributions"]) >= 3

    # Add note
    note_resp = client.post(
        f"/api/investigations/{target_txn_id}/notes",
        json={"notes": "Investigated IP routing and device fingerprint.", "analyst_name": "Senior Analyst"}
    )
    assert note_resp.status_code == 200
    assert note_resp.json()["status"] == "success"

    # Update verdict
    status_resp = client.patch(
        f"/api/investigations/{target_txn_id}/status",
        json={"status": "Confirmed Fraud", "notes": "Confirmed malicious spoofing.", "analyst_name": "Senior Analyst"}
    )
    assert status_resp.status_code == 200
    assert status_resp.json()["analyst_status"] == "Confirmed Fraud"

def test_simulation_controls_and_generation():
    """Verify simulation stream control and instant generation."""
    # Status
    status_resp = client.get("/api/simulation/status")
    assert status_resp.status_code == 200
    data = status_resp.json()
    assert "state" in data
    assert "interval_ms" in data

    # State transitions
    start_resp = client.post("/api/simulation/start")
    assert start_resp.json()["state"] == "running"

    pause_resp = client.post("/api/simulation/pause")
    assert pause_resp.json()["state"] == "paused"

    resume_resp = client.post("/api/simulation/resume")
    assert resume_resp.json()["state"] == "running"

    stop_resp = client.post("/api/simulation/stop")
    assert stop_resp.json()["state"] == "stopped"

    # Generate single transaction
    gen_resp = client.post("/api/simulation/generate?scenario=Fraud")
    assert gen_resp.status_code == 201
    gen_tx = gen_resp.json()
    assert gen_tx["hybrid_prediction"] == "Fraud"
    assert gen_tx["currency"] == "INR"

def test_users_api():
    """Verify user account discovery and detailed profiles."""
    users_resp = client.get("/api/users")
    assert users_resp.status_code == 200
    users = users_resp.json()
    assert len(users) >= 5

    # Check profile
    profile_resp = client.get("/api/users/USR_1001")
    assert profile_resp.status_code == 200
    p = profile_resp.json()
    assert p["user_id"] == "USR_1001"
    assert p["name"] == "Rahul Sharma"
    assert "primary_device" in p
    assert "stats" in p

def test_models_governance_and_training():
    """Verify model registry, performance reporting, training, and activation."""
    # Models list
    models_resp = client.get("/api/models")
    assert models_resp.status_code == 200
    models = models_resp.json()
    assert len(models) >= 2

    # Active model
    active_resp = client.get("/api/models/active")
    assert active_resp.status_code == 200
    assert active_resp.json()["is_active"] is True

    # Performance
    perf_resp = client.get("/api/models/performance")
    assert perf_resp.status_code == 200
    perf = perf_resp.json()
    assert "metrics" in perf
    assert "confusion_matrix" in perf
    assert "feature_importances" in perf
    assert "pr_curve" in perf

    # Train candidate model
    train_resp = client.post("/api/models/train", json={"description": "Candidate model test"})
    assert train_resp.status_code == 201
    cand_model = train_resp.json()
    assert cand_model["is_active"] is False

    # Activate candidate model
    act_resp = client.post(f"/api/models/{cand_model['version']}/activate")
    assert act_resp.status_code == 200
    assert act_resp.json()["is_active"] is True

    # Check that candidate model is now active
    active_now = client.get("/api/models/active").json()
    assert active_now["version"] == cand_model["version"]
    assert "hybrid" in active_now["version"].lower()

    # Restore v1.0.0-hybrid as active model
    client.post("/api/models/v1.0.0-hybrid/activate")

def test_zero_demo_words_in_backend_responses():
    """Audit backend responses to ensure zero occurrences of 'demo'."""
    endpoints = [
        "/",
        "/api/dashboard/stats",
        "/api/transactions/stats",
        "/api/users",
        "/api/models/performance",
        "/api/simulation/status"
    ]
    for ep in endpoints:
        resp = client.get(ep)
        assert resp.status_code == 200
        text = resp.text.lower()
        assert "demo" not in text, f"Endpoint {ep} contained forbidden word 'demo'"

if __name__ == "__main__":
    print("Running Phase 3 Test Suite...")
    test_user_data_isolation_transactions()
    print("✓ test_user_data_isolation_transactions PASSED")
    test_user_data_isolation_alerts()
    print("✓ test_user_data_isolation_alerts PASSED")
    test_transactions_crud_and_stats()
    print("✓ test_transactions_crud_and_stats PASSED")
    test_alerts_admin_and_update()
    print("✓ test_alerts_admin_and_update PASSED")
    test_investigations_dossier_and_workflow()
    print("✓ test_investigations_dossier_and_workflow PASSED")
    test_simulation_controls_and_generation()
    print("✓ test_simulation_controls_and_generation PASSED")
    test_users_api()
    print("✓ test_users_api PASSED")
    test_models_governance_and_training()
    print("✓ test_models_governance_and_training PASSED")
    test_zero_demo_words_in_backend_responses()
    print("✓ test_zero_demo_words_in_backend_responses PASSED")
    print("\nALL PHASE 3 BACKEND TESTS COMPLETED SUCCESSFULLY!")
