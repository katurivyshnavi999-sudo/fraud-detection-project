import os
from pathlib import Path

# Base directory for the backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"

class Settings:
    PROJECT_TITLE: str = "Graph-Enhanced Adaptive Hybrid Learning for Digital Payment Fraud Detection"
    VERSION: str = "1.0.4-academic-demo"
    DEPARTMENT: str = "Artificial Intelligence & Machine Learning"
    
    # Project Leadership & Mentorship
    PROJECT_COORDINATOR: str = "Ms. B. Poojitha"
    PROJECT_GUIDE: str = "Mr. K. Chiranjeevi"
    
    # Project Student Team (Names public; Roll numbers protected in config file)
    PROJECT_TEAM: list = [
        {"name": "Bellamkonda Pallavi", "role": "ML & Siamese Architecture", "roll_number_confidential": "21A91A6106"},
        {"name": "Dasari Raju Kavya", "role": "GNN & Network Analysis", "roll_number_confidential": "21A91A6112"},
        {"name": "Kachi Venkata Sudha Vyshnavi", "role": "Continual Learning & Pipeline", "roll_number_confidential": "21A91A6125"},
        {"name": "Katuru Vyshnavi", "role": "Full-Stack Dashboard & XAI (SHAP)", "roll_number_confidential": "21A91A6127"}
    ]
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'fraud_shield.db'}")
    
    # Security & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "btech-aiml-fraud-detection-secret-token-key-2026")
    DEMO_USER_EMAIL: str = "analyst@fraudshield.ai"
    DEMO_USER_PASSWORD: str = "CyberShield#2026"
    DEMO_USER_NAME: str = "Chief Fraud Analyst"
    DEMO_USER_ROLE: str = "Lead Cybersecurity Specialist"
    
    # ML & Simulation Settings
    IS_DEMO_MODE: bool = os.getenv("IS_DEMO_MODE", "True").lower() == "true"
    ENABLE_TRAINED_MODEL: bool = os.getenv("ENABLE_TRAINED_MODEL", "False").lower() == "true"
    MODEL_CHECKPOINT_PATH: str = str(MODELS_DIR / "hybrid_fraud_model.pt")
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
