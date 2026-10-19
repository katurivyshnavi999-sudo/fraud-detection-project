import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.database.connection import SessionLocal
from app.database.models import Transaction, InvestigationRecord

client = TestClient(app)

def test_get_investigations_list():
    """Verify that flagged transactions are retrieved for the investigation triage queue."""
    resp = client.get("/api/investigations")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Every item should have an ID and a risk score
    for item in data[:5]:
        assert "transaction_id" in item
        assert "hybrid_risk_score" in item
        assert item["hybrid_risk_score"] is not None

def test_get_investigation_dossier():
    """Verify comprehensive investigative dossier retrieval with multimodal predictions and SHAP explainability."""
    # Find a transaction ID from the list
    list_resp = client.get("/api/investigations?limit=1")
    assert list_resp.status_code == 200
    tx_id = list_resp.json()[0]["transaction_id"]

    resp = client.get(f"/api/investigations/{tx_id}")
    assert resp.status_code == 200
    dossier = resp.json()

    assert dossier["transaction_id"] == tx_id
    assert "user_id" in dossier
    assert "merchant_name" in dossier
    assert "device_type" in dossier

    # Multimodal prediction breakdown
    assert "ml_prediction" in dossier
    assert "ml_score" in dossier
    assert "gnn_prediction" in dossier
    assert "gnn_score" in dossier
    assert "hybrid_prediction" in dossier
    assert "hybrid_risk_score" in dossier

    # Connected graph entities
    assert "connected_users" in dossier
    assert "connected_devices" in dossier
    assert "connected_merchants" in dossier
    assert "connected_txns" in dossier
    assert isinstance(dossier["connected_users"], list)

    # SHAP feature contributions
    assert "shap_contributions" in dossier
    assert len(dossier["shap_contributions"]) >= 3
    for shap in dossier["shap_contributions"]:
        assert "feature" in shap
        assert "attribution" in shap
        assert "description" in shap
        assert isinstance(shap["attribution"], (int, float))

def test_investigation_status_update_and_audit_trail():
    """Verify human-in-the-loop analyst verdict updates and audit log recording."""
    db = SessionLocal()
    try:
        tx = db.query(Transaction).filter(Transaction.hybrid_risk_score >= 70.0).first()
        if not tx:
            tx = db.query(Transaction).first()
        tx_id = tx.transaction_id
    finally:
        db.close()

    # Mark as Confirmed Fraud
    payload = {
        "status": "Confirmed Fraud",
        "notes": "Verified unauthorized card testing cluster using emulated device.",
        "analyst_name": "Lead Analyst Sharma"
    }
    resp = client.patch(f"/api/investigations/{tx_id}/status", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert body["analyst_status"] == "Confirmed Fraud"

    # Verify audit record in database
    db = SessionLocal()
    try:
        record = db.query(InvestigationRecord).filter(
            InvestigationRecord.transaction_id == tx_id
        ).order_by(InvestigationRecord.created_at.desc(), InvestigationRecord.id.desc()).first()
        assert record is not None
        assert record.analyst_name == "Lead Analyst Sharma"
        assert "Confirmed Fraud" in record.action_taken
        assert "emulated device" in record.notes
    finally:
        db.close()

    # Update to Reviewed Safe
    payload2 = {
        "status": "Reviewed Safe",
        "notes": "User confirmed transaction via Out-Of-Band OTP verification.",
        "analyst_name": "Lead Analyst Sharma"
    }
    resp2 = client.patch(f"/api/investigations/{tx_id}/status", json=payload2)
    assert resp2.status_code == 200
    assert resp2.json()["analyst_status"] == "Reviewed Safe"

def test_investigation_add_note():
    """Verify analyst note append operation with timestamp and author logging."""
    list_resp = client.get("/api/investigations?limit=1")
    tx_id = list_resp.json()[0]["transaction_id"]

    note_payload = {
        "notes": "Correlated hardware fingerprint with high-risk cluster in Hyderabad node.",
        "analyst_name": "Senior Investigator Patel"
    }
    resp = client.post(f"/api/investigations/{tx_id}/notes", json=note_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "Senior Investigator Patel" in data["analyst_notes"]
    assert "Hyderabad node" in data["analyst_notes"]

def test_fraud_network_graph_endpoint():
    """Verify full heterogeneous graph generation (Users, Devices, Merchants, Transactions)."""
    resp = client.get("/api/graph")
    assert resp.status_code == 200
    graph = resp.json()

    assert "summary" in graph
    assert "nodes" in graph
    assert "edges" in graph
    assert graph["total_nodes"] >= 10
    assert graph["total_edges"] >= 10

    node_types = {n["type"] for n in graph["nodes"]}
    assert "user" in node_types
    assert "device" in node_types
    assert "merchant" in node_types
    assert "transaction" in node_types

def test_node_details_and_syndicate_assessment():
    """Verify deep node neighborhood retrieval and multi-account syndicate detection."""
    # Test emulated device known to be shared by syndicate
    resp = client.get("/api/graph/DEV_4102")
    assert resp.status_code == 200
    detail = resp.json()

    assert detail["node"]["id"] == "DEV_4102"
    assert detail["node"]["type"] == "device"
    assert "CRITICAL" in detail["organized_fraud_risk"].upper() or "SYNDICATE" in detail["organized_fraud_risk"].upper()
    assert "syndicate" in detail["network_risk_summary"].lower() or "cluster" in detail["network_risk_summary"].lower()
    assert len(detail["connected_users"]) >= 2

def test_gnn_stats_endpoint():
    """Verify PyTorch Geometric HeteroGNN performance statistics endpoint."""
    resp = client.get("/api/graph/gnn-stats")
    assert resp.status_code == 200
    stats = resp.json()

    assert "hidden_dim" in stats
    assert stats["hidden_dim"] == 32
    assert "accuracy" in stats
    assert "roc_auc" in stats
    assert stats["accuracy"] >= 0.85
    assert stats["roc_auc"] >= 0.85

def test_zero_occurrences_of_demo_in_investigations_and_graph():
    """Audit source files for Phase 8 to ensure zero instances of forbidden naming."""
    src_paths = [
        Path("app/api/investigations.py"),
        Path("app/api/graph.py"),
        Path("app/schemas/investigation.py"),
        Path("app/schemas/graph.py")
    ]
    for p in src_paths:
        assert p.exists(), f"Source file {p} must exist"
        content = p.read_text(encoding="utf-8").lower()
        import re
        matches = re.findall(r"\bdemo\b", content)
        assert len(matches) == 0, f"Forbidden word 'demo' found in {p}: {matches}"
