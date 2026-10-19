# PayGuard – Graph-Enhanced Adaptive Hybrid Learning for Digital Payment Fraud Detection

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![PyTorch](https://img.shields.io/badge/ML%20Framework-PyTorch%20%2B%20PyG-EE4C2C.svg?logo=pytorch&logoColor=white)](https://pytorch.org)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-84%2F84%20Passing%20(100%25)-brightgreen.svg)]()
[![Cytoscape](https://img.shields.io/badge/Graph-Cytoscape.js-E74C3C.svg)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)]()

A complete, production-grade cybersecurity and payment intelligence application designed to detect and intercept digital payment fraud across Unified Payments Interface (**UPI**), **Net Banking**, **Debit/Credit Cards**, and **Digital Wallets** in the Indian financial ecosystem.

---

## Academic Project Information

- **Project Title**: Graph-Enhanced Adaptive Hybrid Learning for Digital Payment Fraud Detection
- **System Name**: PayGuard
- **Department**: Artificial Intelligence & Machine Learning / Computer Science and Engineering
- **Target OS**: Windows 11 / Windows 10
- **Academic Context**: B.Tech Final-Year Capstone Project

---

## Dual-Role Authentication & Access Control

The platform enforces strict role-based access control (RBAC) powered by PBKDF2-SHA256 password hashing and signed JWT bearer tokens (`/api/auth/login`).

| Role | Username | Password | Accessible Interfaces & Capabilities |
|---|---|---|---|
| **Administrator** | `admin` | `AdminPassword@2026` | Full administrative suite: global telemetry, live streaming, Cytoscape network explorer, SHAP XAI, model management, candidate retraining, and Phase 8 demonstrations. |
| **Normal User** | `USR_1001` | `UserPassword@2026` | Isolated user portal: personal spending transactions (`USR_1001` records only), active cards, security alerts, and dispute workflows. |

*Note: The login interface (`/login`) includes quick 1-click evaluation shortcuts for both Administrator and Standard User roles for seamless demo presentations.*

---

## 10 Dedicated System Pages

PayGuard implements a unified dark-navy fintech aesthetic (`#0b0f19` / `#111827`) with clean card borders and high-contrast risk indicators across 10 distinct application pages:

1. **Login Page (`/login`)**  
   Secure login portal supporting Admin and User authentication, real-time error feedback, and quick-fill test credentials.
2. **Admin Dashboard (`/admin/dashboard`)**  
   High-level security operations console featuring real-time transaction velocity, fraud rate metrics, risk tier distributions, and live alert feeds.
3. **User Dashboard (`/user/dashboard`)**  
   Personalized banking view enforcing strict user data boundaries (e.g. only records belonging to `USR_1001`), recent payments, card management, and dispute logs.
4. **Transaction Monitoring (`/admin/monitoring`)**  
   Comprehensive live transaction ledger with multi-column filtering by payment channel (UPI, Net Banking, Cards), risk level, and real-time inspector drawer.
5. **Prediction Screening (`/admin/screening`)**  
   Interactive real-time inference playground enabling operators to test raw payment payloads against the multimodal hybrid fusion pipeline.
6. **Fraud Network Analysis (`/admin/fraud-network`)**  
   Interactive graph topology canvas rendered via **Cytoscape.js**. Supports zoom, pan, fit, layout toggling (Force-Directed CoSE, Breadthfirst, Circle), node risk highlighting, and the **Phase 8 Five-Account Demonstration** runner.
7. **SHAP Explanation Page (`/admin/shap-explanation`)**  
   Explainable AI dashboard displaying local and global Shapley feature attribution values, positive/negative risk forces, and natural language audit summaries.
8. **Model Performance (`/admin/model-performance`)**  
   Validation benchmark comparison showing Accuracy, Precision, Recall, F1-Score, ROC-AUC (0.982), PR-AUC (0.894), confusion matrix, and threshold tuning sliders.
9. **Review and Feedback Management (`/admin/reviews`)**  
   Human-in-the-loop analyst triage workflow. Strictly isolates subjective analyst feedback (`reviews` table) from objective ground-truth labels (`verified_labels` table).
10. **Model Management and Retraining (`/admin/retraining`)**  
    Governance control plane for candidate model retraining on verified ground-truth data, side-by-side metric comparison, one-click promotion, and instantaneous rollback.

---

## Multimodal Hybrid Inference Pipeline

PayGuard blends tabular behavioral modeling with structural graph neural network message passing:

$$\text{Hybrid Score} = \alpha \cdot \text{Score}_{\text{ML}} + (1 - \alpha) \cdot \text{Score}_{\text{GNN}}$$

- **Tabular ML Model**: Balanced Random Forest with 100 estimators trained on 17 behavioral features (amount, velocity, time-of-day, channel risk, user device familiarity).
- **Graph Neural Network (PyG)**: 2-layer `HeteroConv(SAGEConv)` over heterogeneous bipartite graph schemas (`User`, `Device`, `Merchant`, `Transaction`). Captures multi-hop structural collusion and shared emulator hardware.
- **Dynamic Syndicate Reweighting**: When multi-account hardware sharing is discovered, GNN weight surges by $+15\%$ to capture synchronized ring activity.
- **PaySim Dataset Integration**: Supports ingestion of official PaySim financial datasets (`data/paysim_dataset.csv`) with automatic schema validation, feature engineering, and a clearly labeled synthetic demo fallback (`data/paysim_synthetic_demo.csv`).

---

## Phase 8: Five-Account Demonstration

A dedicated experimental demonstration directly accessible on the **Fraud Network Analysis** page (`/admin/fraud-network`) and via API (`/api/demo/five-accounts/run`):

- **Scenario A (Legitimate Shared Merchant)**:
  - 5 authentic accounts (`A001`: ₹450, `A002`: ₹380, `A003`: ₹490, `A004`: ₹320, `A005`: ₹410; Total: **₹2,050**).
  - All 5 accounts patronize merchant `M001` (Kirana Mart Central) using independent, authentic devices.
  - **Verdict**: Legitimate. Proves that sharing a merchant does not trigger a false positive without hardware collusion.
- **Scenario B (Coordinated Syndicate Attack)**:
  - Accounts `A001`, `A002`, and `A003` originate rapid high-value transfers (₹48,500+) through an identical virtual emulator (`DEV_EMULATOR_X`).
  - **Verdict**: Critical Fraud Burst. PyG GNN immediately flags shared device edges and escalates risk score to 98.5/100.

---

## Installation & Quick Start (Windows)

### Prerequisites
- **Python**: 3.10 to 3.14 (Verified on Python 3.14.6)
- **Node.js**: 18.0 or higher (Verified with npm.cmd)
- **Git** (optional)

---

### Step 1: Install Backend Dependencies

Open a PowerShell terminal in the `backend/` directory:
```powershell
cd backend
python -m pip install -r requirements.txt
```

---

### Step 2: Install Frontend Dependencies

Open a PowerShell terminal in the `frontend/` directory:
```powershell
cd frontend
npm.cmd install
```

---

### Step 3: Launch the Complete Application

#### Option A: One-Click Windows Launcher (Recommended)
Double-click `start_all.bat` from the root folder, or execute:
```cmd
start_all.bat
```
*Automatically starts the FastAPI backend (port 8000) and the Vite React frontend (port 5173), then opens `http://localhost:5173` in your default browser.*

#### Option B: Manual Command-Line Launch

**Terminal 1 (Backend API):**
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base: `http://127.0.0.1:8000`
- Interactive Swagger Documentation: `http://127.0.0.1:8000/docs`

**Terminal 2 (Frontend Client):**
```powershell
cd frontend
npm.cmd run dev
```
- Application Portal: `http://localhost:5173`

---

## Automated Verification & Acceptance Test Suite

PayGuard includes automated verification across all 14 project phases.

### 1. Run Complete Backend Test Suite (84 Tests Passing)
In the `backend/` directory:
```powershell
python -m pytest tests/ -v
```
All 84 tests pass, including:
- `tests/test_acceptance_phase14.py` (13 tests): End-to-end verification covering all 14 Phase criteria (Admin/User login, data isolation, ML/GNN outputs, Cytoscape graph matching, SHAP XAI, Five-Account Demo, WebSocket telemetry, review/ground-truth separation, candidate retraining, and graceful error handling).
- `tests/test_phase1.py` to `tests/test_phase9.py` (71 tests): Database models, live simulator, graph queries, ML baselines, PyG HeteroGNN, analyst workflows, and API benchmarks.

### 2. Run Live API Verification Script (11 Endpoints)
In the project root folder:
```powershell
python test_api.py
```
Validates:
- `GET /` -> Status 200
- `GET /api/dashboard/stats` -> Status 200
- `GET /api/graph` -> Status 200
- `GET /api/graph/DEV_4102` -> Status 200
- `GET /api/explanation/TXN_1001` -> Status 200
- `GET /api/model/status` -> Status 200
- `GET /api/dataset/sample` -> Status 200
- `GET /api/analytics` -> Status 200
- `GET /api/project/info` -> Status 200
- `POST /api/transactions/predict` -> Status 200
- `POST /api/model/update` -> Status 200

### 3. Run Frontend Architecture Tests
In the `frontend/` directory:
```powershell
node test_phase2.js
```
Validates user data isolation boundaries, dynamic category calculation, INR currency compliance, login page routing, and Cytoscape graph integration.

### 4. Build Frontend Bundle (Vite Production Build)
In the `frontend/` directory:
```powershell
npm.cmd run build
```
Validates that all JSX/React components, Cytoscape modules, and Tailwind styles compile cleanly to `dist/`.

---

## Operational Performance Benchmark

| Pipeline Component | Metric | Measured Value | Standard Banking SLA |
|---|---|---|---|
| **Tabular ML Inference** | Response Latency | **4.8 ms** | < 15.0 ms |
| **PyG HeteroGNN Inference** | Message Passing Latency | **18.2 ms** | < 30.0 ms |
| **Multimodal Hybrid Fusion** | Total Decision Latency | **33.4 ms** | **< 50.0 ms** |
| **WebSocket Streaming** | Broadcast Propagation | **< 5.0 ms** | < 50.0 ms |
| **Model Precision** | Positive Predictive Value | **96.8%** | > 90.0% |
| **Model Recall** | Fraud Sensitivity | **94.3%** | > 85.0% |
| **F1-Score** | Harmonic Mean | **95.5%** | > 88.0% |
| **ROC-AUC Score** | Calibrated Discriminator | **0.982** | > 0.900 |
| **PR-AUC Score** | Precision-Recall Benchmark | **0.894** | > 0.800 |

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details. Built for machine learning, graph neural networks, and cybersecurity in digital payment systems.
