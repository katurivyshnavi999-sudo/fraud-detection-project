# Trained Model Storage Directory

This directory hosts model artifacts, checkpoints, and weights for the **Graph-Enhanced Adaptive Hybrid Learning Fraud Detection System**.

## Academic Transparency Notice
By default, the application runs with `is_demo_mode = True`. In this mode, predictions, risk scores, and SHAP attributions are computed by the modular fallback inference engine (`backend/app/ml/fraud_prediction.py`) using domain fraud heuristics. No fabricated model accuracy metrics are claimed.

## How to Connect Real Trained Models:

1. **Siamese / Attention Model Checkpoint**:
   - Save your trained PyTorch state dictionary to:
     `models/hybrid_fraud_model.pt`
   - The architecture definition resides in:
     `backend/app/ml/siamese_network.py` and `backend/app/ml/attention_network.py`

2. **Graph Neural Network (GNN) Model**:
   - Save your PyTorch Geometric GraphSAGE / GAT checkpoint to:
     `models/gnn_fraud_detector.pt`
   - Interface resides in:
     `backend/app/ml/gnn_model.py`

3. **SHAP Tree/Kernel Explainer Model**:
   - Save your trained XGBoost / LightGBM / neural net explainer to:
     `models/shap_explainer.pkl`

4. **Enable Production Inference**:
   - In `.env`, set:
     ```env
     ENABLE_TRAINED_MODEL=true
     MODEL_PATH=models/hybrid_fraud_model.pt
     ```
   - The inference engine `FraudPredictionOrchestrator` in `backend/app/ml/fraud_prediction.py` automatically detects the weights, switches `is_demo_mode = False`, and runs the neural network forward pass.
