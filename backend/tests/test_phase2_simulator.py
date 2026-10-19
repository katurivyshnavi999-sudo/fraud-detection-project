import asyncio
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import SessionLocal
from app.database.models import Transaction, Alert
from app.simulator.generator import simulation_manager

client = TestClient(app)

def test_simulator_status_endpoint():
    """Verify simulator status endpoint returns all necessary metrics."""
    res = client.get("/api/simulation/status")
    assert res.status_code == 200
    data = res.json()
    assert "state" in data
    assert "interval_ms" in data
    assert "speed_factor" in data
    assert "total_generated" in data
    assert "transactions_per_minute" in data
    assert "safe_proportion" in data
    assert "fraud_proportion" in data

def test_unique_transaction_generation():
    """Verify transactions generated have unique IDs and varied records."""
    db = SessionLocal()
    try:
        count_before = db.query(Transaction).count()
        tx1 = simulation_manager.generate_single_transaction(db, target_scenario="Safe")
        tx2 = simulation_manager.generate_single_transaction(db, target_scenario="Suspicious")
        tx3 = simulation_manager.generate_single_transaction(db, target_scenario="Fraud")
        
        # Verify IDs are distinct and follow the format TXN_XXXXXXXX
        assert tx1.transaction_id != tx2.transaction_id
        assert tx2.transaction_id != tx3.transaction_id
        assert tx1.transaction_id.startswith("TXN_")
        assert len(tx1.transaction_id) >= 10
        
        # Verify amounts, payment methods, and timestamps
        assert tx1.amount > 0
        assert tx3.amount > 0
        assert tx1.payment_method in ["UPI", "Debit Card", "Credit Card", "Net Banking", "Wallet"]
        
        # Verify database persistence
        count_after = db.query(Transaction).count()
        assert count_after == count_before + 3
        
        # Verify hybrid prediction and risk scores
        assert tx1.hybrid_prediction in ["Safe", "Suspicious", "Fraud"]
        assert 0.0 <= tx1.hybrid_risk_score <= 100.0
        assert tx3.hybrid_risk_score > 0
    finally:
        db.close()

def test_simulator_start_pause_resume_stop():
    """Test full lifecycle of simulator controls."""
    # Start
    res_start = client.post("/api/simulation/start")
    assert res_start.status_code == 200
    assert res_start.json()["state"] == "running"
    assert simulation_manager.state == "running"

    # Pause
    res_pause = client.post("/api/simulation/pause")
    assert res_pause.status_code == 200
    assert res_pause.json()["state"] == "paused"
    assert simulation_manager.state == "paused"

    # Resume
    res_resume = client.post("/api/simulation/resume")
    assert res_resume.status_code == 200
    assert res_resume.json()["state"] == "running"
    assert simulation_manager.state == "running"

    # Stop
    res_stop = client.post("/api/simulation/stop")
    assert res_stop.status_code == 200
    assert res_stop.json()["state"] == "stopped"
    assert simulation_manager.state == "stopped"

def test_speed_settings_and_tpm():
    """Verify speed factor settings update interval and transactions per minute."""
    db = SessionLocal()
    try:
        # Test Normal (1x)
        status1 = simulation_manager.update_settings({"interval_ms": 2000, "speed_factor": "Normal (1x)"}, db)
        assert status1["transactions_per_minute"] == 30.0
        
        # Test Fast (2x)
        status2 = simulation_manager.update_settings({"interval_ms": 2000, "speed_factor": "Fast (2x)"}, db)
        assert status2["transactions_per_minute"] == 60.0

        # Test Slow (0.5x)
        status3 = simulation_manager.update_settings({"interval_ms": 2000, "speed_factor": "Slow (0.5x)"}, db)
        assert status3["transactions_per_minute"] == 15.0
    finally:
        db.close()

def test_fraud_alert_creation():
    """Verify that transactions classified as Fraud trigger alert creation."""
    db = SessionLocal()
    try:
        alerts_before = db.query(Alert).count()
        tx_fraud = simulation_manager.generate_single_transaction(db, target_scenario="Fraud")
        alerts_after = db.query(Alert).count()
        
        if tx_fraud.hybrid_prediction in ["Fraud", "Suspicious"]:
            assert alerts_after >= alerts_before + 1
            created_alert = db.query(Alert).filter(Alert.transaction_id == tx_fraud.transaction_id).first()
            assert created_alert is not None
            assert created_alert.user_id == tx_fraud.user_id
    finally:
        db.close()
