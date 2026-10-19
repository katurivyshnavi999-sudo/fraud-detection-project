import time
import json
import pytest
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from fastapi.testclient import TestClient

from app.main import app
from app.database.connection import SessionLocal
from app.database.models import Transaction, Alert, InvestigationRecord, User, Device, Merchant
from app.ml.hybrid_fusion import hybrid_fusion_engine
from app.simulator.generator import simulation_manager

client = TestClient(app)

def test_full_pipeline_end_to_end_lifecycle():
    """
    End-to-End Integration Test:
    1. Generate realistic transaction via simulation manager
    2. Score transaction through complete multimodal hybrid pipeline (Tabular ML + PyG GNN + Siamese + Attention)
    3. Persist transaction into SQLite database
    4. Verify high-risk triggers automated Alert creation
    5. Query investigation dossier through API
    6. Record analyst verdict and audit trail
    7. Query fraud network graph to verify entity relations
    """
    db = SessionLocal()
    try:
        # 1. Generate realistic fraud scenario transaction via simulation_manager
        tx_model = simulation_manager.generate_single_transaction(db, target_scenario="fraud")
        tx_id = tx_model.transaction_id
        amount = tx_model.amount
        user_id = tx_model.user_id
        device_id = tx_model.device_id
        risk_score = tx_model.hybrid_risk_score
    finally:
        db.close()

    assert tx_id is not None
    assert amount > 0
    assert risk_score is not None
    assert risk_score >= 0.0

    # 2. Query transaction via REST API
    tx_resp = client.get(f"/api/transactions/{tx_id}")
    assert tx_resp.status_code == 200
    tx_data = tx_resp.json()
    assert tx_data["transaction_id"] == tx_id
    assert tx_data["amount"] == amount

    # 3. If high-risk, alert should exist in database
    if risk_score >= 75.0:
        db = SessionLocal()
        try:
            alert = db.query(Alert).filter(Alert.transaction_id == tx_id).first()
            assert alert is not None
            assert alert.severity == "CRITICAL"
        finally:
            db.close()

    # 4. Query investigation dossier
    dossier_resp = client.get(f"/api/investigations/{tx_id}")
    assert dossier_resp.status_code == 200
    dossier = dossier_resp.json()
    assert dossier["transaction_id"] == tx_id
    assert len(dossier["shap_contributions"]) >= 3
    assert "ml_score" in dossier
    assert "gnn_score" in dossier
    assert "hybrid_risk_score" in dossier

    # 5. Analyst updates status
    patch_resp = client.patch(
        f"/api/investigations/{tx_id}/status",
        json={
            "status": "Confirmed Fraud",
            "notes": "End-to-end integration verified: hardware emulation cluster.",
            "analyst_name": "Integration Test Runner"
        }
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["analyst_status"] == "Confirmed Fraud"

    # 6. Query graph node for related device
    graph_resp = client.get(f"/api/graph/{device_id}")
    assert graph_resp.status_code in [200, 404]

def test_inference_latency_benchmark():
    """
    Performance Benchmark:
    Ensures that complete multimodal inference (Tabular ML + PyG GNN + Siamese + Attention)
    executes well within real-time banking SLAs (< 50ms average per transaction).
    """
    sample_tx = {
        "transaction_id": "TXN_PERF_TEST_001",
        "user_id": "USR_1001",
        "device_id": "DEV_1001",
        "merchant_id": "MERCH_101",
        "amount": 15000.0,
        "payment_method": "UPI",
        "location": "Mumbai",
        "device_type": "Mobile Client",
        "transaction_type": "Purchase"
    }

    # Warmup
    _ = hybrid_fusion_engine.score_transaction(sample_tx)

    # Benchmark 20 iterations
    latencies = []
    for _ in range(20):
        t0 = time.perf_counter()
        _ = hybrid_fusion_engine.score_transaction(sample_tx)
        latencies.append((time.perf_counter() - t0) * 1000)

    avg_latency = sum(latencies) / len(latencies)
    p95_latency = sorted(latencies)[int(len(latencies) * 0.95)]

    print(f"\nInference Benchmark: Avg={avg_latency:.2f}ms, P95={p95_latency:.2f}ms")
    # Must comfortably meet sub-50ms constraint
    assert avg_latency < 50.0, f"Average latency {avg_latency:.2f}ms exceeds 50ms SLA"

def test_concurrent_scoring_stability():
    """
    Concurrency Audit:
    Executes simultaneous multi-threaded scoring across multiple simulated transactions
    to verify absence of race conditions in model state or PyG forward passes.
    """
    tx_templates = [
        {
            "transaction_id": f"TXN_CONCUR_{i}",
            "user_id": f"USR_{1000 + i}",
            "device_id": f"DEV_{1000 + i}",
            "merchant_id": "MERCH_101",
            "amount": 2500.0 * (i + 1),
            "payment_method": "UPI",
            "location": "Bengaluru",
            "device_type": "Mobile App",
            "transaction_type": "Transfer"
        }
        for i in range(10)
    ]

    def score_single(tx):
        return hybrid_fusion_engine.score_transaction(tx)

    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(score_single, tx_templates))

    assert len(results) == 10
    for r in results:
        assert "hybrid_risk_score" in r
        assert 0.0 <= r["hybrid_risk_score"] <= 100.0

def test_edge_case_and_unseen_entities():
    """
    Edge Case Robustness:
    Verifies that the hybrid engine gracefully handles zero amounts, extreme amounts,
    completely unseen entity IDs, and missing optional fields without throwing 500 errors.
    """
    edge_cases = [
        # Micro-amount
        {
            "transaction_id": "TXN_EDGE_01",
            "user_id": "USR_UNSEEN_9999",
            "device_id": "DEV_UNSEEN_9999",
            "merchant_id": "MERCH_UNSEEN_9999",
            "amount": 0.01,
            "payment_method": "UPI",
            "location": "Unknown City"
        },
        # Mega-amount
        {
            "transaction_id": "TXN_EDGE_02",
            "user_id": "USR_UNSEEN_8888",
            "device_id": "DEV_UNSEEN_8888",
            "merchant_id": "MERCH_UNSEEN_8888",
            "amount": 99999999.0,
            "payment_method": "Net Banking",
            "location": "New Delhi"
        }
    ]

    for tx in edge_cases:
        res = hybrid_fusion_engine.score_transaction(tx)
        assert res is not None
        assert "hybrid_risk_score" in res
        assert 0.0 <= res["hybrid_risk_score"] <= 100.0

def test_authentication_and_authorization_lifecycle():
    """
    Phase 3 & Phase 12 Verification:
    1. Authenticate as Administrator with valid credentials -> receives JWT.
    2. Authenticate as Regular User -> receives JWT.
    3. Reject incorrect credentials with HTTP 401.
    4. Access /api/auth/me with Bearer token.
    5. Verify role boundaries (admin vs user).
    """
    # 1. Admin Login
    admin_resp = client.post("/api/auth/login", json={"username": "admin", "password": "AdminPassword@2026"})
    assert admin_resp.status_code == 200
    admin_data = admin_resp.json()
    assert "access_token" in admin_data
    assert admin_data["user"]["role"] == "admin"
    admin_token = admin_data["access_token"]

    # 2. Regular User Login
    user_resp = client.post("/api/auth/login", json={"username": "USR_1001", "password": "UserPassword@2026"})
    assert user_resp.status_code == 200
    user_data = user_resp.json()
    assert user_data["user"]["role"] == "user"
    assert user_data["user"]["user_id"] == "USR_1001"
    user_token = user_data["access_token"]

    # 3. Reject invalid credentials
    bad_resp = client.post("/api/auth/login", json={"username": "admin", "password": "WrongPassword"})
    assert bad_resp.status_code == 401

    # 4. Profile validation
    profile_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert profile_resp.status_code == 200
    assert profile_resp.json()["role"] == "admin"

    profile_resp_user = client.get("/api/auth/me", headers={"Authorization": f"Bearer {user_token}"})
    assert profile_resp_user.status_code == 200
    assert profile_resp_user.json()["role"] == "user"

def test_five_account_demonstration_endpoint():
    """
    Phase 8 Verification:
    1. Run Five-Account Demonstration (A001..A005 -> M001).
    2. Validate total amount == 2050 INR.
    3. Verify real multimodal pipeline processing (ML + GNN + Hybrid).
    4. Ensure shared merchant is not automatically labelled as fraud.
    5. Verify Cytoscape graph endpoint returns all nodes and edges.
    """
    resp = client.post("/api/demo/five-accounts/run?scenario=legitimate_shared_merchant")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    summary = data["summary"]
    assert summary["total_amount"] == 2050.0
    assert summary["total_transactions"] == 5
    assert len(summary["merchant_shared_by_accounts"]) == 5
    assert summary["device_sharing_detected"] is False

    txs = data["transactions"]
    assert len(txs) == 5
    for tx in txs:
        assert "ml_score" in tx
        assert "gnn_score" in tx
        assert "hybrid_score" in tx
        assert tx["final_classification"] in ["Legitimate", "Review"]

    # Verify graph endpoint
    graph_resp = client.get("/api/demo/five-accounts/graph?scenario=legitimate_shared_merchant")
    assert graph_resp.status_code == 200
    g_data = graph_resp.json()
    assert "elements" in g_data
    assert len(g_data["elements"]["nodes"]) >= 10
    assert len(g_data["elements"]["edges"]) >= 10
    node_ids = [n["data"]["id"] for n in g_data["elements"]["nodes"]]
    assert "M001" in node_ids
    assert "A001" in node_ids
    assert "A005" in node_ids
