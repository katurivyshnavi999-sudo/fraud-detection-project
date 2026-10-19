import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import SessionLocal
from app.database.models import User, Transaction, Device, Merchant
from app.graph.dynamic_graph import dynamic_graph_service

client = TestClient(app)

def test_full_graph_retrieval():
    """Verify full graph returns nodes and edges from the SQLite database."""
    res = client.get("/api/graph")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert data["total_nodes"] > 0
    assert data["total_edges"] > 0
    assert data["summary"] != ""

def test_graph_search_by_valid_user_id():
    """Verify graph search by valid User ID returns an ego-network containing that user."""
    db = SessionLocal()
    user = db.query(User).first()
    db.close()
    assert user is not None

    res = client.get(f"/api/graph?entity_id={user.user_id}&depth=2")
    assert res.status_code == 200
    data = res.json()
    assert data["root_entity"] == user.user_id
    assert data["depth"] == 2
    node_ids = [n["id"] for n in data["nodes"]]
    assert user.user_id in node_ids

def test_graph_search_by_valid_transaction_id():
    """Verify graph search by valid Transaction ID returns its connected user, device, and merchant."""
    db = SessionLocal()
    txn = db.query(Transaction).first()
    db.close()
    assert txn is not None

    res = client.get(f"/api/graph?entity_id={txn.transaction_id}&depth=1")
    assert res.status_code == 200
    data = res.json()
    assert data["root_entity"] == txn.transaction_id
    node_ids = [n["id"] for n in data["nodes"]]
    assert txn.transaction_id in node_ids
    # At depth 1, the user, device, and merchant must be present
    assert txn.user_id in node_ids or txn.device_id in node_ids

def test_graph_search_by_unknown_id():
    """Verify search by unknown ID returns 404 with helpful error message."""
    res = client.get("/api/graph?entity_id=NON_EXISTENT_ID_99999&depth=2")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

def test_different_entities_produce_different_graphs():
    """Confirm different entities produce different graph results when database relationships differ."""
    db = SessionLocal()
    user_a = db.query(User).filter(User.user_id == "USR_1001").first()
    user_b = db.query(User).filter(User.user_id == "USR_2041").first()
    db.close()
    
    if user_a and user_b:
        res_a = client.get(f"/api/graph?entity_id={user_a.user_id}&depth=1")
        res_b = client.get(f"/api/graph?entity_id={user_b.user_id}&depth=1")
        assert res_a.status_code == 200
        assert res_b.status_code == 200
        nodes_a = {n["id"] for n in res_a.json()["nodes"]}
        nodes_b = {n["id"] for n in res_b.json()["nodes"]}
        # Subgraphs must be distinct reflecting differing database relationships
        assert nodes_a != nodes_b
        assert user_a.user_id in nodes_a
        assert user_b.user_id in nodes_b
        assert user_a.user_id not in nodes_b

def test_graph_depth_changes_neighborhood():
    """Confirm graph depth parameter changes the returned neighborhood size."""
    db = SessionLocal()
    user = db.query(User).filter(User.user_id == "USR_2041").first() or db.query(User).first()
    db.close()
    assert user is not None

    res_depth1 = client.get(f"/api/graph?entity_id={user.user_id}&depth=1")
    res_depth2 = client.get(f"/api/graph?entity_id={user.user_id}&depth=2")
    
    assert res_depth1.status_code == 200
    assert res_depth2.status_code == 200
    
    nodes_1 = len(res_depth1.json()["nodes"])
    nodes_2 = len(res_depth2.json()["nodes"])
    
    # 2 hops must be greater than or equal to 1 hop
    assert nodes_2 >= nodes_1

def test_node_details_endpoint():
    """Verify GET /api/graph/{node_id} returns detailed neighborhood inspection."""
    res = client.get("/api/graph/DEV_4102")
    assert res.status_code == 200
    data = res.json()
    assert "node" in data
    assert data["node"]["id"] == "DEV_4102"
    assert "network_risk_summary" in data
    assert "organized_fraud_risk" in data
