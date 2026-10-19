import os
from pathlib import Path

# Base directory for the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"

class Settings:
    PROJECT_NAME: str = "PayGuard"
    PROJECT_TITLE: str = "PayGuard – Graph-Enhanced Adaptive Hybrid Learning for Digital Payment Fraud Detection"
    TAGLINE: str = "Smart Payments. Safer Tomorrow."
    SUBTITLE: str = "AI + Graph Powered Digital Payment Fraud Detection"
    VERSION: str = "1.0.0"
    DEPARTMENT: str = "Artificial Intelligence & Machine Learning"
    PROJECT_COORDINATOR: str = "Dr. S. K. Ramanathan"
    PROJECT_GUIDE: str = "Prof. Ananya Sen"
    PROJECT_TEAM: list = [
        {"name": "Final Year B.Tech AI/ML Candidate", "role": "Lead ML & Full-Stack Developer"}
    ]
    
    # Currency and Locale
    DEFAULT_CURRENCY: str = "INR"
    CURRENCY_SYMBOL: str = "₹"
    LOCALE: str = "en-IN"

    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'payguard.db'}")

    # ML & GNN Paths
    MODEL_CHECKPOINT_PATH: str = str(MODELS_DIR / "hybrid_fraud_model.pt")
    ENABLE_TRAINED_MODEL: bool = os.getenv("ENABLE_TRAINED_MODEL", "False").lower() == "true"

    # Simulation Default Settings
    DEFAULT_SIM_INTERVAL_MS: int = 2000
    DEFAULT_SAFE_THRESHOLD: float = 40.0
    DEFAULT_FRAUD_THRESHOLD: float = 75.0

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
