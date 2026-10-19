import json
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.websocket.connection_manager import ws_manager
from app.simulator.generator import simulation_manager
from app.database.connection import SessionLocal
from app.database.models import Transaction, Alert

client = TestClient(app)

def test_websocket_admin_live_connection_and_handshake():
    """Verify WebSocket connection and initial handshake event."""
    with client.websocket_connect("/ws/admin/live") as websocket:
        data = websocket.receive_text()
        msg = json.loads(data)
        assert msg["event"] == "connection_established"
        assert msg["stream"] == "admin_live"
        assert msg["status"] == "connected"

        # Test ping-pong
        websocket.send_text("ping")
        resp = websocket.receive_text()
        pong = json.loads(resp)
        assert pong["event"] == "pong"

def test_websocket_stream_aliases():
    """Verify alias WebSocket endpoints (/ws/live, /ws/transactions, /ws/stream)."""
    aliases = ["/ws/live", "/ws/transactions", "/ws/stream"]
    for path in aliases:
        with client.websocket_connect(path) as ws:
            data = ws.receive_text()
            msg = json.loads(data)
            assert msg["event"] == "connection_established"

def test_websocket_broadcast_delivery():
    """Verify that ws_manager.broadcast() delivers messages to connected clients."""
    with client.websocket_connect("/ws/admin/live") as websocket:
        # Discard handshake
        _ = websocket.receive_text()

        # Generate sample payload and broadcast asynchronously
        sample_event = {
            "transaction_id": "TXN_WS_TEST_001",
            "amount": 45000.0,
            "currency": "INR",
            "hybrid_prediction": "Fraud",
            "risk_score": 92.5
        }

        import asyncio
        asyncio.run(ws_manager.broadcast(sample_event))

        # Client receives broadcast
        received_raw = websocket.receive_text()
        received_msg = json.loads(received_raw)
        assert received_msg["transaction_id"] == "TXN_WS_TEST_001"
        assert received_msg["hybrid_prediction"] == "Fraud"

def test_simulation_stream_controls_and_speed():
    """Verify simulation engine state transitions and speed multipliers."""
    # Test start, pause, resume, stop
    s_start = simulation_manager.start()
    assert s_start["state"] == "running"

    s_pause = simulation_manager.pause()
    assert s_pause["state"] == "paused"

    s_resume = simulation_manager.resume()
    assert s_resume["state"] == "running"

    s_stop = simulation_manager.stop()
    assert s_stop["state"] == "stopped"

    # Test speed multipliers
    simulation_manager.speed_factor = "Slow (0.5x)"
    assert simulation_manager.get_speed_multiplier() == 0.5

    simulation_manager.speed_factor = "Normal (1x)"
    assert simulation_manager.get_speed_multiplier() == 1.0

    simulation_manager.speed_factor = "Fast (2x)"
    assert simulation_manager.get_speed_multiplier() == 2.0

    simulation_manager.speed_factor = "Ultra (5x)"
    assert simulation_manager.get_speed_multiplier() == 5.0

def test_simulated_transaction_persistence_and_alerts():
    """Verify generated transaction is saved in DB with hybrid scoring and generates alert if high risk."""
    db = SessionLocal()
    try:
        # Force a fraud scenario
        fraud_tx = simulation_manager.generate_single_transaction(db, target_scenario="Fraud")
        assert fraud_tx.transaction_id.startswith("TXN_")
        assert fraud_tx.currency == "INR"
        assert fraud_tx.hybrid_prediction == "Fraud"
        assert fraud_tx.hybrid_risk_score >= 70.0

        # Verify persisted in DB
        persisted = db.query(Transaction).filter(Transaction.transaction_id == fraud_tx.transaction_id).first()
        assert persisted is not None

        # Verify alert created for fraud
        alert = db.query(Alert).filter(Alert.transaction_id == fraud_tx.transaction_id).first()
        assert alert is not None
        assert alert.risk_level in ["High", "Critical"]
        assert "Simulated Transaction" in alert.message

        # Verify appears in investigations queue
        inv_resp = client.get("/api/investigations")
        assert inv_resp.status_code == 200
        inv_ids = [tx["transaction_id"] for tx in inv_resp.json()]
        assert fraud_tx.transaction_id in inv_ids
    finally:
        db.close()

def test_zero_demo_words_phase7():
    """Verify zero occurrences of 'demo' in WebSocket messages and simulation responses."""
    with client.websocket_connect("/ws/admin/live") as ws:
        data = ws.receive_text()
        assert "demo" not in data.lower()

    status_resp = client.get("/api/simulation/status")
    assert "demo" not in status_resp.text.lower()

if __name__ == "__main__":
    print("Running Phase 7 Verification Tests...")
    test_websocket_admin_live_connection_and_handshake()
    print("✓ test_websocket_admin_live_connection_and_handshake PASSED")
    test_websocket_stream_aliases()
    print("✓ test_websocket_stream_aliases PASSED")
    test_websocket_broadcast_delivery()
    print("✓ test_websocket_broadcast_delivery PASSED")
    test_simulation_stream_controls_and_speed()
    print("✓ test_simulation_stream_controls_and_speed PASSED")
    test_simulated_transaction_persistence_and_alerts()
    print("✓ test_simulated_transaction_persistence_and_alerts PASSED")
    test_zero_demo_words_phase7()
    print("✓ test_zero_demo_words_phase7 PASSED")
    print("\nALL PHASE 7 BACKEND TESTS PASSED SUCCESSFULLY!")
