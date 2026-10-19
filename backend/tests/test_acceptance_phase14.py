import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import SessionLocal
from app.database.models import Transaction, Review, VerifiedLabel, ModelVersionRecord, Alert
from app.ml.baseline_models import tabular_predictor
from app.gnn.service import gnn_service
from app.ml.hybrid_fusion import hybrid_fusion_engine
from app.ml.shap_explanation import shap_explainer

client = TestClient(app)

def test_acceptance_01_admin_login():
    """Workflow 1: An administrator can log in."""
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "AdminPassword@2026"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"
    assert data["user"]["username"] == "admin"

def test_acceptance_02_user_login_and_data_isolation():
    """Workflow 2: A normal user can log in and only access authorized records."""
    # Login normal user
    resp = client.post("/api/auth/login", json={"username": "USR_1001", "password": "UserPassword@2026"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["role"] == "user"
    assert data["user"]["user_id"] == "USR_1001"
    token = data["access_token"]

    # Profile check
    profile = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert profile.status_code == 200
    assert profile.json()["user_id"] == "USR_1001"

    # User transactions check: returns only USR_1001 records
    user_txs = client.get("/api/users/USR_1001/transactions")
    assert user_txs.status_code == 200
    for tx in user_txs.json():
        assert tx["user_id"] == "USR_1001"

def test_acceptance_03_transactions_loaded():
    """Workflow 3: Transactions can be loaded."""
    resp = client.get("/api/transactions?limit=10")
    assert resp.status_code == 200
    txs = resp.json()
    assert isinstance(txs, list)
    assert len(txs) > 0
    assert "transaction_id" in txs[0]
    assert "amount" in txs[0]

def test_acceptance_04_ml_model_predictions():
    """Workflow 4: The ML model can make predictions."""
    sample_tx = {
        "transaction_id": "TXN_ACC_04",
        "user_id": "USR_1001",
        "merchant_id": "MERCH_101",
        "device_id": "DEV_1001",
        "amount": 2500.0,
        "payment_method": "UPI",
        "location": "Mumbai",
        "timestamp": "2026-10-10 12:00:00"
    }
    ml_res = tabular_predictor.predict(sample_tx)
    assert "ml_score" in ml_res
    assert 0.0 <= ml_res["ml_score"] <= 100.0
    assert "ml_prediction" in ml_res

def test_acceptance_05_gnn_model_transaction_outputs():
    """Workflow 5: The trained GNN can produce transaction-level outputs."""
    sample_tx = {
        "transaction_id": "TXN_ACC_05",
        "user_id": "USR_1001",
        "merchant_id": "MERCH_101",
        "device_id": "DEV_1001",
        "amount": 1200.0,
        "payment_method": "UPI",
        "location": "Mumbai"
    }
    gnn_res = gnn_service.score_transaction_graph(sample_tx)
    assert "gnn_score" in gnn_res
    assert 0.0 <= gnn_res["gnn_score"] <= 100.0
    assert "gnn_embedding" in gnn_res

def test_acceptance_06_hybrid_layer_fusion():
    """Workflow 6: The hybrid layer uses both outputs."""
    sample_tx = {
        "transaction_id": "TXN_ACC_06",
        "user_id": "USR_2041",
        "merchant_id": "MERCH_902",
        "device_id": "DEV_4102",
        "amount": 42000.0,
        "payment_method": "Credit Card",
        "location": "Lagos"
    }
    hybrid_res = hybrid_fusion_engine.score_transaction(sample_tx)
    assert "ml_score" in hybrid_res
    assert "gnn_score" in hybrid_res
    assert "hybrid_score" in hybrid_res
    assert "final_classification" in hybrid_res
    assert hybrid_res["final_classification"] in ["Legitimate", "Review", "Potentially suspicious"]

def test_acceptance_07_and_08_relationship_graph_matches_data():
    """Workflow 7 & 8: Selecting a prediction opens its actual relationship graph matching data."""
    # Get a real transaction from DB
    db = SessionLocal()
    try:
        tx = db.query(Transaction).first()
        tx_id = tx.transaction_id
        user_id = tx.user_id
        merch_id = tx.merchant_id
    finally:
        db.close()

    # Query graph endpoint
    resp = client.get(f"/api/graph?entity_id={tx_id}&depth=2")
    assert resp.status_code == 200
    graph_data = resp.json()
    assert "nodes" in graph_data
    assert "edges" in graph_data

    node_ids = [n["id"] for n in graph_data["nodes"]]
    # The transaction or its connected user/merchant must be present in the returned subgraph
    assert (tx_id in node_ids) or (user_id in node_ids) or (merch_id in node_ids)

def test_acceptance_09_shap_explanations():
    """Workflow 9: SHAP explanations are computed for the supported ML model."""
    sample_tx = {
        "amount": 28000.0,
        "payment_method": "Credit Card",
        "location": "Mumbai",
        "hour_of_day": 3,
        "device_risk_score": 85.0
    }
    explanation = shap_explainer.explain_transaction(sample_tx)
    assert "features" in explanation
    assert len(explanation["features"]) > 0
    top_feature = explanation["features"][0]
    assert "feature" in top_feature
    assert "shap_value" in top_feature
    assert "relative_importance" in top_feature

def test_acceptance_10_five_account_demonstration():
    """Workflow 10: The five-account demonstration renders correctly."""
    resp = client.post("/api/demo/five-accounts/run?scenario=legitimate_shared_merchant")
    assert resp.status_code == 200
    data = resp.json()
    assert data["summary"]["total_amount"] == 2050.0
    assert data["summary"]["total_transactions"] == 5
    assert len(data["transactions"]) == 5
    accounts = [t["sender_account"] for t in data["transactions"]]
    assert set(accounts) == {"A001", "A002", "A003", "A004", "A005"}

def test_acceptance_11_simulated_live_stream_updates():
    """Workflow 11: The simulated live stream updates the dashboard."""
    # Test WebSocket connection and message receipt
    with client.websocket_connect("/ws/admin/live") as ws:
        msg = ws.receive_json()
        assert ("stream" in msg) or ("event" in msg) or ("status" in msg)
        assert msg.get("status") == "connected" or msg.get("stream") == "admin_live"

def test_acceptance_12_review_feedback_separate_from_ground_truth():
    """Workflow 12: Review feedback is separate from ground-truth labels."""
    db = SessionLocal()
    try:
        target_tx = db.query(Transaction).first()
        target_tx_id = target_tx.transaction_id if target_tx else "TXN_1014"

        # Submit subjective reviewer feedback
        rev_resp = client.post("/api/reviews", json={
            "transaction_id": target_tx_id,
            "verdict": "Suspicious",
            "notes": "Analyst flagging for nocturnal IP anomaly.",
            "reviewer_name": "Senior Investigator"
        })
        assert rev_resp.status_code == 200

        # Register objective verified ground-truth label
        ver_resp = client.post("/api/reviews/verified-labels", json={
            "transaction_id": target_tx_id,
            "is_fraud": True,
            "source": "Bank Chargeback",
            "notes": "Confirmed chargeback receipt from issuing bank."
        })
        assert ver_resp.status_code == 200

        # Verify stored in distinct tables
        review_entry = db.query(Review).filter(Review.transaction_id == target_tx_id).order_by(Review.id.desc()).first()
        verified_entry = db.query(VerifiedLabel).filter(VerifiedLabel.transaction_id == target_tx_id).order_by(VerifiedLabel.id.desc()).first()

        assert review_entry is not None
        assert verified_entry is not None
        assert review_entry.verdict == "Suspicious"
        assert verified_entry.is_fraud is True
        assert verified_entry.source == "Bank Chargeback"
    finally:
        db.close()

def test_acceptance_13_candidate_retraining_validation():
    """Workflow 13: Candidate retraining follows the validation workflow."""
    # 1. Inspect candidate dataset stats
    info_resp = client.get("/api/reviews/candidate-info")
    assert info_resp.status_code == 200
    info = info_resp.json()
    assert "candidate_dataset" in info
    assert "current_active_model" in info

    # 2. Train candidate model and compare metrics
    train_resp = client.post("/api/reviews/candidate-train")
    assert train_resp.status_code == 200
    comparison = train_resp.json()
    assert "candidate_version" in comparison
    assert "active_model_metrics" in comparison
    assert "candidate_model_metrics" in comparison
    cand_version = comparison["candidate_version"]

    # 3. Promote candidate to active
    promote_resp = client.post(f"/api/reviews/promote?version={cand_version}")
    assert promote_resp.status_code == 200
    assert promote_resp.json()["active_version"] == cand_version

    # 4. Rollback to previous
    rollback_resp = client.post("/api/reviews/rollback")
    assert rollback_resp.status_code == 200
    assert rollback_resp.json()["status"] == "success"

def test_acceptance_14_graceful_error_handling():
    """Workflow 14: Errors are handled without crashing the application."""
    # 1. 404 for unknown transaction
    resp404 = client.get("/api/transactions/TXN_NON_EXISTENT_999999")
    assert resp404.status_code == 404

    # 2. 422 for malformed prediction payload
    resp422 = client.post("/api/transactions/predict", json={"amount": "invalid_amount_string"})
    assert resp422.status_code == 422

    # 3. 401 for bad auth token
    resp401 = client.get("/api/auth/me", headers={"Authorization": "Bearer bad_token_xyz"})
    assert resp401.status_code == 401
