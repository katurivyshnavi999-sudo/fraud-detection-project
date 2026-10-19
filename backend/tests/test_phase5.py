import os
import json
import torch
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.config import MODELS_DIR
from app.gnn.hetero_graph_builder import HeteroGraphBuilder
from app.gnn.model import PayGuardHeteroGNN, HeteroGNNTrainer
from app.gnn.service import GNNInferenceService, gnn_service
from app.ml.dataset_generator import generate_synthetic_payment_dataset
from app.database.connection import SessionLocal
from app.database.models import ModelVersionRecord

client = TestClient(app)

def test_hetero_graph_builder():
    """Verify HeteroGraphBuilder builds valid PyG HeteroData with all entity types and relational edges."""
    df = generate_synthetic_payment_dataset(n_samples=300, random_seed=42)
    builder = HeteroGraphBuilder()
    data = builder.build_from_dataframe(df)

    # Check node types
    assert "user" in data.node_types
    assert "device" in data.node_types
    assert "merchant" in data.node_types
    assert "transaction" in data.node_types

    # Check node feature dimensions
    assert data["user"].x.shape[1] == 3
    assert data["device"].x.shape[1] == 3
    assert data["merchant"].x.shape[1] == 3
    assert data["transaction"].x.shape[1] == 8
    assert data["transaction"].y.shape[0] == 300

    # Check edge relations
    edge_types = data.edge_types
    assert ("user", "uses", "device") in edge_types
    assert ("device", "used_by", "user") in edge_types
    assert ("user", "performs", "transaction") in edge_types
    assert ("transaction", "performed_by", "user") in edge_types
    assert ("transaction", "on_device", "device") in edge_types
    assert ("device", "hosts", "transaction") in edge_types
    assert ("transaction", "at_merchant", "merchant") in edge_types
    assert ("merchant", "receives", "transaction") in edge_types

    # Ensure no NaN values in tensors
    for nt in data.node_types:
        assert not torch.isnan(data[nt].x).any(), f"NaN found in {nt} node features"

def test_gnn_model_forward_pass():
    """Verify PayGuardHeteroGNN executes multi-hop forward pass and returns embeddings."""
    df = generate_synthetic_payment_dataset(n_samples=200, random_seed=42)
    builder = HeteroGraphBuilder()
    data = builder.build_from_dataframe(df)

    metadata = data.metadata()
    model = PayGuardHeteroGNN(metadata, hidden_dim=32)
    model.eval()

    with torch.no_grad():
        logits, embeddings = model(data.x_dict, data.edge_index_dict)

    # Check output shapes
    assert logits.shape == (200, 1)
    assert not torch.isnan(logits).any()

    # Check embedding dictionary
    for nt in metadata[0]:
        assert nt in embeddings
        assert embeddings[nt].shape[1] == 32
        assert not torch.isnan(embeddings[nt]).any()

def test_gnn_training_and_checkpoints():
    """Verify HeteroGNNTrainer trains model, computes metrics, and persists checkpoint."""
    df = generate_synthetic_payment_dataset(n_samples=400, random_seed=42)
    builder = HeteroGraphBuilder()
    data = builder.build_from_dataframe(df)

    trainer = HeteroGNNTrainer()
    metrics = trainer.train_and_evaluate(data, epochs=10, lr=0.01, hidden_dim=32)

    assert "accuracy" in metrics
    assert "roc_auc" in metrics
    assert metrics["roc_auc"] >= 0.85
    assert metrics["test_sample_count"] > 0

    # Verify saved files
    model_pt = MODELS_DIR / "hetero_gnn.pt"
    metrics_json = MODELS_DIR / "gnn_metrics.json"

    assert model_pt.exists()
    assert metrics_json.exists()

def test_gnn_database_registration():
    """Verify GNN model record is stored in SQLite database."""
    trainer = HeteroGNNTrainer()
    trainer.metrics = {
        "accuracy": 0.988,
        "precision": 0.925,
        "recall": 0.932,
        "f1_score": 0.928,
        "roc_auc": 0.985,
        "test_sample_count": 400
    }

    db = SessionLocal()
    try:
        trainer.register_in_database(db)
        rec = db.query(ModelVersionRecord).filter(ModelVersionRecord.version == "v1.0.0-gnn-alone").first()
        assert rec is not None
        assert rec.roc_auc == 0.985
    finally:
        db.close()

def test_gnn_inference_service():
    """Verify GNNInferenceService scores relational patterns and detects syndicates."""
    service = GNNInferenceService()

    # Legitimate transaction
    safe_tx = {
        "user_id": "USR_1001",
        "device_id": "DEV_1102",
        "merchant_id": "MERCH_101",
        "amount": 750.0
    }
    safe_out = service.score_transaction_graph(safe_tx)
    assert "gnn_score" in safe_out
    assert safe_out["gnn_score"] < 40.0
    assert safe_out["syndicate_detected"] is False
    assert len(safe_out["gnn_embedding"]) == 32

    # Fraudulent emulator syndicate transaction
    fraud_tx = {
        "user_id": "USR_2041",
        "device_id": "DEV_4102",
        "merchant_id": "MERCH_999",
        "amount": 85000.0,
        "is_emulator": True
    }
    fraud_out = service.score_transaction_graph(fraud_tx)
    assert fraud_out["gnn_score"] >= 80.0
    assert fraud_out["syndicate_detected"] is True
    assert len(fraud_out["connected_accounts"]) > 0

def test_gnn_api_endpoints():
    """Verify graph API endpoints for GNN statistics and real-time graph scoring."""
    # Stats
    stats_resp = client.get("/api/graph/gnn-stats")
    assert stats_resp.status_code == 200
    assert "architecture" in stats_resp.json()

    # Score
    score_resp = client.post("/api/graph/score", json={
        "user_id": "USR_2041",
        "device_id": "DEV_4102",
        "merchant_id": "MERCH_999",
        "amount": 92000.0
    })
    assert score_resp.status_code == 200
    data = score_resp.json()
    assert "gnn_score" in data
    assert "gnn_embedding" in data
    assert len(data["gnn_embedding"]) == 32

def test_zero_demo_words_phase5():
    """Verify zero occurrences of 'demo' in Phase 5 API outputs."""
    resp = client.get("/api/graph/gnn-stats")
    assert "demo" not in resp.text.lower()

if __name__ == "__main__":
    print("Running Phase 5 Verification Tests...")
    test_hetero_graph_builder()
    print("✓ test_hetero_graph_builder PASSED")
    test_gnn_model_forward_pass()
    print("✓ test_gnn_model_forward_pass PASSED")
    test_gnn_training_and_checkpoints()
    print("✓ test_gnn_training_and_checkpoints PASSED")
    test_gnn_database_registration()
    print("✓ test_gnn_database_registration PASSED")
    test_gnn_inference_service()
    print("✓ test_gnn_inference_service PASSED")
    test_gnn_api_endpoints()
    print("✓ test_gnn_api_endpoints PASSED")
    test_zero_demo_words_phase5()
    print("✓ test_zero_demo_words_phase5 PASSED")
    print("\nALL PHASE 5 BACKEND TESTS PASSED SUCCESSFULLY!")
