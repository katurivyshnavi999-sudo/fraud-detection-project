# Graph-Enhanced Adaptive Hybrid Learning for Digital Payment Fraud Detection

A comprehensive, production-grade academic prototype and cybersecurity intelligence dashboard for detecting digital payment fraud across UPI, credit cards, net banking, and digital wallets.

Developed as a BTech Final-Year Capstone Project in the **Department of Artificial Intelligence & Machine Learning**.

---

## Academic Project Credentials

- **Project Title**: Graph-Enhanced Adaptive Hybrid Learning for Digital Payment Fraud Detection
- **Department**: Department of Artificial Intelligence & Machine Learning
- **Project Coordinator**: Ms. B. Poojitha
- **Project Guide**: Mr. K. Chiranjeevi
- **Project Student Team**:
  1. Bellamkonda Pallavi (Siamese Contrastive Architecture & Metric Learning)
  2. Dasari Raju Kavya (Graph Neural Networks & Relational Topology)
  3. Kachi Venkata Sudha Vyshnavi (Continual Learning & Concept Drift Pipeline)
  4. Katuru Vyshnavi (Full-Stack Dashboard & Explainable AI - SHAP)

> [!NOTE]
> Student roll numbers are securely maintained in `backend/app/config.py` to safeguard identity privacy on the public dashboard.

---

## System Architecture

```
                       [ Incoming Transaction Stream ]
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
        [ Behavioral Baseline ]               [ Heterogeneous Graph ]
                 │                                       │
        ┌────────┴────────┐                              │
        ▼                 ▼                              │
[ Siamese Network ] [ Attention Net ]                    ▼
(Twin Embedding)   (Sequence Bursts)         [ Graph Neural Network ]
        │                 │                  (Multi-Hop Relational GNN)
        └────────┬────────┘                              │
                 ▼                                       ▼
           [ Representation ]                      [ Syndicate ]
           [ Distance Score ]                      [ Risk Score ]
                 └───────────────────┬───────────────────┘
                                     ▼
                      [ Hybrid Fusion Classifier ]
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
            [ Risk Score 0-100 ]            [ Continual Replay Buffer ]
            [ Action Recommendation ]       (ADWIN Drift & EWC Adapt)
                     │
                     ▼
            [ Explainable AI (SHAP) ]
            (Shapley Feature Decomposition)
```

---

## Technology Stack

- **Frontend**: React.js 18, Vite, Tailwind CSS, React Router DOM v6, Lucide React, Recharts, Interactive SVG/Canvas Graph Visualizer, Axios
- **Backend**: Python, FastAPI, Uvicorn, SQLAlchemy, Pydantic v2, SQLite / PostgreSQL / MongoDB compliant
- **Machine Learning & Graph Analysis**: PyTorch / PyTorch Geometric architecture interfaces, NetworkX, SHAP attribution engine, Scikit-learn preprocessing
- **Database**: SQLite (built-in out-of-the-box, zero configuration required)

---

## 1. How to Install Dependencies

### Prerequisites
- Node.js (v18+ recommended)
- Python (v3.10+ recommended)

### Backend Dependencies
Open PowerShell or Command Prompt in the `backend/` directory:
```bash
cd backend
python -m pip install -r requirements.txt
```
*Core installed packages: `fastapi`, `uvicorn`, `pydantic`, `python-multipart`, `sqlalchemy`, `networkx`.*

### Frontend Dependencies
Open a second terminal in the `frontend/` directory:
```bash
cd frontend
npm install
# or on Windows PowerShell:
npm.cmd install
```

---

## 2. How to Start the Backend

In your `backend` directory, run:
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API will be live at: **http://127.0.0.1:8000**
- Interactive Swagger API Documentation: **http://127.0.0.1:8000/docs**
- ReDoc API Documentation: **http://127.0.0.1:8000/redoc**

*On initial startup, the backend automatically seeds the SQLite database with 35 realistic digital payment transactions, 20 users, and 11 merchants.*

---

## 3. How to Start the Frontend

In your `frontend` directory, run:
```bash
npm run dev
# or on Windows PowerShell:
npm.cmd run dev
```
- Frontend application will open at: **http://localhost:5173**
- The frontend automatically proxies API calls to the backend on port 8000.

---

## 4. How to Configure the Database

The project is pre-configured with **SQLite** out of the box (`fraud_shield.db`), requiring zero setup or installation of external server daemons.

To switch to **PostgreSQL** or **MongoDB**:
1. Copy `.env.example` to `.env` in the root folder.
2. Edit `DATABASE_URL`:
   - For PostgreSQL:
     ```env
     DATABASE_URL=postgresql://user:password@localhost:5432/fraud_shield
     ```
   - For SQLite (Default):
     ```env
     DATABASE_URL=sqlite:///fraud_shield.db
     ```

---

## 5. Where to Put the Dataset

- Place transaction CSV files in the `data/` directory.
- The pre-packaged academic evaluation dataset is located at:
  `data/sample_transactions.csv`
- The heterogeneous graph relations (Users, Merchants, Devices, Transactions) are in:
  `data/fraud_network_edges.json`
- You can also upload any custom `.csv` dataset dynamically via the **Dataset Page** (`/dataset`) on the web dashboard.

---

## 6. Where to Put Trained ML Models

Model checkpoints and serialization artifacts should be placed in the `models/` directory:

1. **Hybrid Siamese / Attention Neural Model**:
   - Save trained PyTorch state dictionary to: `models/hybrid_fraud_model.pt`
2. **Graph Neural Network (GNN)**:
   - Save PyTorch Geometric checkpoint to: `models/gnn_fraud_detector.pt`
3. **SHAP Tree/Kernel Explainer**:
   - Save serialized explainer object to: `models/shap_explainer.pkl`

To activate trained weights, configure your `.env`:
```env
ENABLE_TRAINED_MODEL=true
MODEL_CHECKPOINT_PATH=models/hybrid_fraud_model.pt
```

---

## 7. How the Fraud Prediction API Works

### Endpoint: `POST /api/transactions/predict`

#### Sample Request:
```json
{
  "user_id": "USR_2041",
  "merchant_id": "MERCH_902",
  "device_id": "DEV_4102",
  "amount": 1250.00,
  "currency": "USD",
  "timestamp": "2026-09-18 02:14:08",
  "payment_method": "Credit Card",
  "location": "Lagos",
  "transaction_type": "Online"
}
```

#### Sample Response:
```json
{
  "transaction_id": "TXN_ATO_4812",
  "prediction": "Fraudulent",
  "is_fraud": true,
  "risk_score": 88.5,
  "confidence": 92.4,
  "risk_level": "CRITICAL",
  "is_demo_mode": true,
  "top_features": [
    {
      "feature_name": "Device Identity & Reuse",
      "value": "DEV_4102",
      "contribution": 0.32,
      "direction": "fraud_positive",
      "description": "Device DEV_4102 is associated with multiple user identities and emulator fingerprints."
    }
  ],
  "explanation": "SHAP attribution indicates the prediction is primarily driven by Device Identity & Reuse (+0.32) and Transaction Amount (+0.28).",
  "suggested_action": "Block transaction immediately & notify cardholder; freeze device token."
}
```

---

## 8. How to Replace Demo Prediction with the Real Model

The system utilizes an **Abstract Factory / Strategy Pattern**:
1. All fraud detectors inherit from `BaseFraudDetector` (`backend/app/ml/base.py`).
2. The orchestrator `FraudPredictionOrchestrator` (`backend/app/ml/fraud_prediction.py`) checks whether `has_trained_weights` is True.
3. If weights are found, `predict()` loads the PyTorch tensor forward pass:
   ```python
   # Inside backend/app/ml/fraud_prediction.py
   if self.is_trained_model_loaded():
       tensor_x = self.preprocessor.to_tensor(transaction_data)
       with torch.no_grad():
           risk_prob = self.trained_model(tensor_x).item()
           risk_score = risk_prob * 100.0
   ```
4. If no trained weights are found, it falls back to domain fraud heuristics and transparently tags the output with `is_demo_mode = True`.

---

## 9. How the GNN Component Works

- The GNN component constructs a heterogeneous bipartite graph:
  $\mathcal{G} = (\mathcal{V}, \mathcal{E})$
- **Nodes $\mathcal{V}$**: Users, Devices, Merchants, and Transactions.
- **Edges $\mathcal{E}$**:
  - `User → Device` (USES_DEVICE / SHARES_DEVICE)
  - `User → Transaction` (INITIATED)
  - `Device → Transaction` (ORIGINATED_FROM)
  - `Transaction → Merchant` (PAID_TO)
- **Message-Passing**:
  Each node aggregates representations from its $k$-hop neighborhood:
  $$h_v^{(k)} = \sigma\left(W \cdot \text{CONCAT}\left(h_v^{(k-1)}, \text{AGG}\left(\{h_u^{(k-1)} : u \in \mathcal{N}(v)\}\right)\right)\right)$$
- If a device (e.g. `DEV_4102`) connects to multiple distinct user IDs initiating rapid transfers, the risk score propagates across the entire sub-network, unmasking organized fraud rings.

---

## 10. How SHAP Explanations are Integrated

- Every transaction decision undergoes Shapley attribution decomposition:
  $$f(x) = \mathbb{E}[f(x)] + \sum_{i=1}^M \phi_i(x)$$
- $\mathbb{E}[f(x)]$: Base expected background fraud rate ($8.0\%$).
- $\phi_i > 0$ (**Red**): Pushes the transaction probability toward **Fraudulent** (e.g. Unfamiliar Device, High Velocity, Off-Hours).
- $\phi_i < 0$ (**Green**): Pushes the transaction probability toward **Legitimate** (e.g. Trusted Merchant, Consistent Location, Verified Profile).
- Visualized on the **Explainable AI Page** using horizontal divergent waterfall bar charts and automated natural-language analyst summaries.

---

## 11. How Continual Learning is Connected

- Streaming transactions are ingested into an in-memory **Rehearsal Buffer** ($N=5,000$).
- An **ADWIN (Adaptive Windowing)** algorithm continuously checks for Concept Drift ($\delta > 0.08$).
- When drift occurs, an adaptation update is simulated or executed using **Elastic Weight Consolidation (EWC)**:
  $$\mathcal{L}(\theta) = \mathcal{L}_{new}(\theta) + \sum_{i} \frac{\lambda}{2} F_i (\theta_i - \theta_{i,old}^*)^2$$
- $F_i$ is the diagonal Fisher Information matrix that preserves critical weights from past fraud patterns while adapting to new attack variations.
- The **Continual Learning Page** provides a one-click "Simulate Model Update" trigger to observe version iteration, audit logs, and drift index recalibration.

---

## Application Pages Quick Reference

| # | Page Name | Route | Description |
|---|---|---|---|
| 1 | **Login Page** | `/login` | Cybersecurity analyst sign-in with 1-click demo login |
| 2 | **Home Page** | `/` | Project overview, fraud challenges, architecture highlights |
| 3 | **Main Dashboard** | `/dashboard` | KPI threat cards, Recharts time trends, recent transactions |
| 4 | **Fraud Detection** | `/detect` | Live transaction submission, risk meter gauge, recommendations |
| 5 | **Network Graph** | `/network` | Interactive GNN canvas with zoom, pan, search, entity inspector |
| 6 | **Explainable AI** | `/explainable-ai`| SHAP horizontal waterfall chart and positive/negative forces |
| 7 | **Continual Learning**| `/continual-learning`| Streaming buffer, drift monitor, version audit, update trigger |
| 8 | **Dataset Manager** | `/dataset` | CSV upload, schema stats, class imbalance ratio, preview |
| 9 | **Deep Analytics** | `/analytics` | Multi-dimensional analytics: merchants, devices, locations |
| 10| **Model Pipeline** | `/architecture` | 8-stage pipeline viva defense guide with equations & tips |
| 11| **About Project** | `/about` | Faculty coordinator, mentor guide, student team details |
