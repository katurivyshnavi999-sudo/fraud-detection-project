from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/api/project", tags=["Project Information"])

@router.get("/info")
def get_project_metadata():
    """
    Returns official BTech project metadata, mentorship info, and team information.
    """
    return {
        "title": settings.PROJECT_TITLE,
        "department": settings.DEPARTMENT,
        "coordinator": settings.PROJECT_COORDINATOR,
        "guide": settings.PROJECT_GUIDE,
        "team": [
            {"name": m["name"], "role": m["role"]}
            for m in settings.PROJECT_TEAM
        ],
        "architecture_pipeline": [
            {
                "step": 1,
                "name": "Input Transaction Data",
                "role": "Streaming ingestion of monetary amount, time, user identity, merchant, device fingerprint, and geographic metadata."
            },
            {
                "step": 2,
                "name": "Hybrid Contrastive Learning",
                "role": "Pre-trains representations that maximize similarity between genuine user habits while pushing fraudulent patterns far apart."
            },
            {
                "step": 3,
                "name": "Siamese Neural Network",
                "role": "Twin parameter-sharing encoders computing Euclidean/cosine distance between real-time transaction vectors and historical user profiles."
            },
            {
                "step": 4,
                "name": "Attention-Based Neural Network",
                "role": "Multi-head temporal self-attention capturing bursts, velocity spikes, and sequential anomalies across transaction history windows."
            },
            {
                "step": 5,
                "name": "Graph Neural Network (GNN)",
                "role": "Heterogeneous message passing over User-Device-Merchant-Transaction bipartite topologies to detect organized fraud rings and shared emulators."
            },
            {
                "step": 6,
                "name": "Continual Learning Engine",
                "role": "Experience replay buffer with Elastic Weight Consolidation (EWC) to adapt to emerging zero-day attack tactics without catastrophic forgetting."
            },
            {
                "step": 7,
                "name": "Fraud Prediction & Decision Engine",
                "role": "Unified risk score calibration [0-100], confidence calculation, and automated classification (Approved, Flagged, Blocked)."
            },
            {
                "step": 8,
                "name": "SHAP Explainable AI (XAI)",
                "role": "Game-theoretic Shapley value decomposition attributing positive and negative feature forces to ensure auditability and compliance."
            }
        ]
    }
