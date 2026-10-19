import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_01_five_accounts_present():
    """Requirement 1: Verify all five accounts (A001..A005) are present."""
    resp = client.get("/api/demo/five-accounts/scenario")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    accounts = [t["user_id"] for t in data["transactions"]]
    assert set(accounts) == {"A001", "A002", "A003", "A004", "A005"}
    assert len(data["transactions"]) == 5

def test_02_all_five_transactions_connect_to_m001():
    """Requirement 2: Verify all 5 transactions connect to common merchant M001."""
    # Check scenario transactions
    resp = client.get("/api/demo/five-accounts/scenario")
    assert resp.status_code == 200
    data = resp.json()
    for tx in data["transactions"]:
        assert tx["merchant_id"] == "M001"

    # Check graph edges connect each transaction to M001
    graph_resp = client.get("/api/demo/five-accounts/graph?scenario=legitimate_shared_merchant")
    assert graph_resp.status_code == 200
    g_data = graph_resp.json()
    m001_incoming_edges = [
        e for e in g_data["edges"]
        if e["data"]["target"] == "M001" and e["data"]["label"] == "PAID_TO"
    ]
    assert len(m001_incoming_edges) == 5

def test_03_amounts_and_total_2050():
    """Requirement 3: Verify individual amounts (450, 380, 490, 320, 410) and total is ₹2,050."""
    resp = client.get("/api/demo/five-accounts/scenario")
    assert resp.status_code == 200
    data = resp.json()
    expected_amounts = {
        "A001": 450.0,
        "A002": 380.0,
        "A003": 490.0,
        "A004": 320.0,
        "A005": 410.0
    }
    for tx in data["transactions"]:
        acc = tx["user_id"]
        assert tx["amount"] == expected_amounts[acc]

    total_amount = sum(tx["amount"] for tx in data["transactions"])
    assert total_amount == 2050.0
    assert data["total_amount"] == 2050.0

def test_04_graph_matches_transaction_records():
    """Requirement 4: Verify graph is generated from the exact same transaction records used for analysis."""
    run_resp = client.post("/api/demo/five-accounts/run?scenario=legitimate_shared_merchant")
    assert run_resp.status_code == 200
    run_data = run_resp.json()

    graph_resp = client.get("/api/demo/five-accounts/graph?scenario=legitimate_shared_merchant")
    assert graph_resp.status_code == 200
    graph_data = graph_resp.json()

    tx_ids_from_run = {t["transaction_id"] for t in run_data["transactions"]}
    tx_nodes_from_graph = {
        n["data"]["id"] for n in graph_data["nodes"]
        if n["data"]["type"] == "transaction"
    }
    assert tx_ids_from_run == tx_nodes_from_graph

    # Verify amounts match in graph labels
    for tx in run_data["transactions"]:
        t_node = next(n for n in graph_data["nodes"] if n["data"]["id"] == tx["transaction_id"])
        assert t_node["data"]["amount"] == tx["amount"]

def test_05_selecting_transaction_displays_correct_details():
    """Requirement 5: Selecting a transaction displays its correct sender, recipient, and explanation details."""
    explain_resp = client.get("/api/demo/five-accounts/explain/TXN_DEMO_A001?scenario=legitimate_shared_merchant")
    assert explain_resp.status_code == 200
    explain_data = explain_resp.json()
    assert explain_data["transaction_id"] == "TXN_DEMO_A001"
    assert explain_data["sender_account"] == "A001"
    assert explain_data["recipient_merchant"] == "M001"
    assert explain_data["amount"] == 450.0
    assert "connected_accounts" in explain_data
    assert "A002" in explain_data["connected_accounts"]
    assert "presentation_rationale" in explain_data
    assert "Five separate accounts made payments to the same merchant" in explain_data["presentation_rationale"]

def test_06_existing_single_transaction_page_still_works():
    """Requirement 6: Verify existing single-transaction inference API continues to work."""
    payload = {
        "user_id": "USR_1001",
        "merchant_id": "MERCH_104",
        "device_id": "DEV_1102",
        "amount": 450.0,
        "payment_method": "UPI",
        "location": "Mumbai",
        "transaction_type": "Purchase"
    }
    resp = client.post("/api/transactions/predict", json=payload)
    assert resp.status_code == 200
    pred = resp.json()
    assert "prediction" in pred
    assert "final_classification" in pred
    assert "ml_score" in pred
    assert "gnn_score" in pred
    assert "hybrid_score" in pred
    assert pred["prediction"] in ["Safe", "Suspicious", "Fraud"]

def test_07_real_predictions_used_for_scenario():
    """Requirement 7: Verify real ML and GNN pipeline outputs are computed for each transaction."""
    resp = client.post("/api/demo/five-accounts/run?scenario=legitimate_shared_merchant")
    assert resp.status_code == 200
    data = resp.json()
    for tx in data["transactions"]:
        assert "ml_score" in tx
        assert "gnn_score" in tx
        assert "hybrid_score" in tx
        assert "ml_prediction" in tx
        assert "gnn_prediction" in tx
        assert "hybrid_prediction" in tx
        assert 0.0 <= tx["ml_score"] <= 100.0
        assert 0.0 <= tx["gnn_score"] <= 100.0
        assert 0.0 <= tx["hybrid_score"] <= 100.0

def test_08_demo_mode_clearly_identified():
    """Requirement 8: Verify demonstration data is clearly identified with demo flags and labels."""
    resp = client.post("/api/demo/five-accounts/run?scenario=legitimate_shared_merchant")
    assert resp.status_code == 200
    data = resp.json()
    assert "Synthetic" in data["summary"]["demonstration_label"] and "Clearly Labelled" in data["summary"]["demonstration_label"]
    for tx in data["transactions"]:
        assert tx["is_synthetic_demonstration"] is True
        assert tx["demo_mode"] is True

def test_09_no_hardcoded_fraud_for_shared_merchant():
    """Requirement 9: Shared merchant is NOT classified as fraud merely because accounts converge on M001."""
    resp = client.post("/api/demo/five-accounts/run?scenario=legitimate_shared_merchant")
    assert resp.status_code == 200
    data = resp.json()
    for tx in data["transactions"]:
        # When distinct authentic devices are used, legitimate commerce must not be falsely flagged as fraud
        assert tx["final_classification"] != "Potentially suspicious"
        assert tx["final_classification"] == "Legitimate"

    # In contrast, when coordinated emulator collusion is explicitly simulated, the GNN flags the syndicate
    syn_resp = client.post("/api/demo/five-accounts/run?scenario=coordinated_syndicate")
    assert syn_resp.status_code == 200
    syn_data = syn_resp.json()
    assert syn_data["summary"]["forensic_verdict"] == "CRITICAL_FRAUD_BURST"
    assert syn_data["summary"]["device_sharing_detected"] is True
