import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import SessionLocal
from app.database.models import User, Transaction, Merchant, Device, Alert, ModelVersionRecord

client = TestClient(app)

def test_root_endpoint():
    """Verify that root returns PayGuard project metadata without demo flags."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["project"] == "PayGuard"
    assert "demo" not in str(data).lower()

def test_auth_route_security():
    """Verify frontend /login is not served as REST API and /api/auth/login enforces authentication."""
    login_resp = client.get("/login")
    assert login_resp.status_code in [404, 405]
    auth_resp = client.post("/api/auth/login", json={"username": "unknown_user", "password": "wrong_password"})
    assert auth_resp.status_code == 401

def test_database_seeded_properly():
    """Verify database has Indian payment records, users, and models."""
    db = SessionLocal()
    try:
        users_count = db.query(User).count()
        assert users_count >= 5, f"Expected at least 5 users, got {users_count}"

        # Verify Rahul Sharma (USR_1001) exists
        usr1 = db.query(User).filter(User.user_id == "USR_1001").first()
        assert usr1 is not None
        assert usr1.name == "Rahul Sharma"
        assert usr1.city == "Mumbai"

        # Verify Transactions exist with INR currency
        tx_count = db.query(Transaction).count()
        assert tx_count > 0
        tx1 = db.query(Transaction).first()
        assert tx1.currency == "INR"
        assert tx1.payment_method in ["UPI", "Debit Card", "Credit Card", "Net Banking", "Wallet"]

        # Verify ground truth is stored separately from predictions
        assert hasattr(tx1, 'ground_truth_label')
        assert hasattr(tx1, 'ml_prediction')
        assert hasattr(tx1, 'gnn_score')
        assert hasattr(tx1, 'hybrid_prediction')
        assert hasattr(tx1, 'analyst_status')

        # Verify model versions
        active_model = db.query(ModelVersionRecord).filter(ModelVersionRecord.is_active == True).first()
        assert active_model is not None
        assert "hybrid" in active_model.version.lower()
    finally:
        db.close()

def test_user_data_isolation_integrity():
    """Verify distinct user accounts exist and records can be filtered by user_id."""
    db = SessionLocal()
    try:
        user_1001_txns = db.query(Transaction).filter(Transaction.user_id == "USR_1001").all()
        user_2041_txns = db.query(Transaction).filter(Transaction.user_id == "USR_2041").all()

        assert len(user_1001_txns) > 0
        assert len(user_2041_txns) > 0

        # Ensure no cross-over in query results
        for t in user_1001_txns:
            assert t.user_id == "USR_1001"
            assert t.user_id != "USR_2041"

        for t in user_2041_txns:
            assert t.user_id == "USR_2041"
            assert t.user_id != "USR_1001"
    finally:
        db.close()

if __name__ == "__main__":
    print("Running Phase 1 Verification Tests...")
    test_root_endpoint()
    print("✓ test_root_endpoint PASSED")
    test_no_login_routes()
    print("✓ test_no_login_routes PASSED")
    test_database_seeded_properly()
    print("✓ test_database_seeded_properly PASSED")
    test_user_data_isolation_integrity()
    print("✓ test_user_data_isolation_integrity PASSED")
    print("\nALL PHASE 1 BACKEND TESTS PASSED SUCCESSFULLY!")
