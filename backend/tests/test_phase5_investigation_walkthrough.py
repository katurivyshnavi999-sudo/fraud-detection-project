import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_investigation_dossier_retrieval():
    """Verify that a valid transaction returns a comprehensive dossier with all multimodal metrics."""
    response = client.get("/api/investigations/TXN_1014")
    assert response.status_code == 200
    data = response.json()
    assert data["transaction_id"] == "TXN_1014"
    assert "user_id" in data
    assert "device_id" in data
    assert "merchant_id" in data
    assert "amount" in data
    assert "hybrid_risk_score" in data
    assert "ml_score" in data
    assert "gnn_score" in data
    assert "shap_contributions" in data
    assert isinstance(data["shap_contributions"], list)
    assert len(data["shap_contributions"]) > 0

def test_investigation_dossier_connected_entities():
    """Verify that the dossier includes connected users, devices, and merchants."""
    response = client.get("/api/investigations/TXN_1014")
    assert response.status_code == 200
    data = response.json()
    assert "connected_users" in data
    assert "connected_devices" in data
    assert "connected_merchants" in data
    assert isinstance(data["connected_users"], list)
    assert isinstance(data["connected_devices"], list)

def test_investigation_status_update():
    """Verify that human-in-the-loop analyst verdicts are saved and persisted."""
    payload = {
        "status": "Confirmed Fraud",
        "notes": "Verified shared rooted emulator DEV_4102 across multiple accounts.",
        "analyst_name": "Lead Fraud Investigator"
    }
    response = client.patch("/api/investigations/TXN_1017/status", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["analyst_status"] == "Confirmed Fraud"
    assert "Lead Fraud Investigator" in data["analyst_notes"]

    # Re-fetch dossier to verify DB persistence
    verify_res = client.get("/api/investigations/TXN_1017")
    assert verify_res.status_code == 200
    assert verify_res.json()["analyst_status"] == "Confirmed Fraud"

def test_investigation_add_note():
    """Verify appending forensic analyst notes."""
    payload = {
        "notes": "Follow-up audit confirmed mule bank account link.",
        "analyst_name": "Chief Investigator"
    }
    response = client.post("/api/investigations/TXN_1017/notes", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "Chief Investigator" in data["analyst_notes"]

def test_investigation_invalid_transaction_404():
    """Verify that requesting an unknown transaction returns 404."""
    response = client.get("/api/investigations/TXN_NON_EXISTENT_9999")
    assert response.status_code == 404

def test_investigation_invalid_status_400():
    """Verify that an invalid verdict status returns 400 Bad Request."""
    payload = {
        "status": "INVALID_VERDICT_XYZ",
        "notes": "Invalid test."
    }
    response = client.patch("/api/investigations/TXN_1014/status", json=payload)
    assert response.status_code == 400
