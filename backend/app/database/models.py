from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(50), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(20), default="user")  # "admin" or "user"
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    city = Column(String(50), default="Mumbai")
    account_type = Column(String(50), default="Savings")
    upi_vpa = Column(String(100), nullable=True)
    risk_level = Column(String(20), default="Low")  # Low, Medium, High, Critical
    created_at = Column(DateTime, default=func.now())

class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    city = Column(String(50), default="Mumbai")
    risk_prior = Column(Float, default=0.05)
    fraud_rate = Column(Float, default=0.01)
    created_at = Column(DateTime, default=func.now())

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), unique=True, index=True, nullable=False)
    device_type = Column(String(50), default="Mobile Phone")
    os_name = Column(String(50), default="Android")
    is_emulator = Column(Boolean, default=False)
    sharing_degree = Column(Integer, default=1)
    risk_score = Column(Float, default=10.0)
    created_at = Column(DateTime, default=func.now())

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(String(50), index=True, nullable=False)
    merchant_id = Column(String(50), index=True, nullable=False)
    device_id = Column(String(50), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    timestamp = Column(String(30), nullable=False)
    payment_method = Column(String(50), nullable=False)  # UPI, Debit Card, Credit Card, Net Banking, Wallet
    location = Column(String(100), default="Mumbai")
    transaction_type = Column(String(50), default="Online")

    # 1. Ground Truth / Simulator Label (Never overwritten by prediction)
    ground_truth_label = Column(Boolean, default=False)  # False=Safe, True=Fraud
    ground_truth_type = Column(String(50), default="Legitimate")

    # 2. Baseline ML Output
    ml_score = Column(Float, default=0.0)
    ml_prediction = Column(String(20), default="Safe")  # Safe, Suspicious, Fraud

    # 3. GNN Output
    gnn_score = Column(Float, default=0.0)
    gnn_embedding = Column(Text, nullable=True)

    # 4. Hybrid Fusion Output
    hybrid_risk_score = Column(Float, default=0.0)
    hybrid_prediction = Column(String(20), default="Safe")  # Safe, Suspicious, Fraud
    model_version = Column(String(50), default="v1.0.0-hybrid")
    is_demo = Column(Boolean, default=False)

    # 5. Analyst-Confirmed Outcome (Human-in-the-loop)
    analyst_status = Column(String(30), default="Pending")  # Pending, Reviewed Safe, Suspicious, Confirmed Fraud
    analyst_notes = Column(Text, nullable=True)
    analyst_updated_at = Column(DateTime, nullable=True)

    # XAI & Audit
    explanation_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(50), index=True, nullable=False)
    ml_score = Column(Float, default=0.0)
    gnn_score = Column(Float, default=0.0)
    hybrid_risk_score = Column(Float, default=0.0)
    final_classification = Column(String(50), default="Legitimate")  # Legitimate, Review, Potentially suspicious
    is_demo = Column(Boolean, default=False)
    model_version = Column(String(50), default="v1.0.0-hybrid")
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(50), index=True, nullable=False)
    reviewer_id = Column(String(50), nullable=True)
    reviewer_name = Column(String(100), default="Analyst")
    verdict = Column(String(50), nullable=False)  # Confirmed Fraud, Reviewed Safe, Suspicious, Escalated
    notes = Column(Text, nullable=True)
    is_flagged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

class VerifiedLabel(Base):
    __tablename__ = "verified_labels"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(50), unique=True, index=True, nullable=False)
    is_fraud = Column(Boolean, nullable=False)
    source = Column(String(100), default="Bank Chargeback")  # Customer Dispute, Bank Chargeback, Forensic Audit
    verified_by = Column(String(100), default="Risk Operations")
    verified_at = Column(DateTime, default=func.now())
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(50), unique=True, index=True, nullable=False)
    transaction_id = Column(String(50), index=True, nullable=False)
    user_id = Column(String(50), index=True, nullable=False)
    alert_type = Column(String(100), nullable=False)
    risk_level = Column(String(20), default="Medium")  # Low, Medium, High, Critical
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

class InvestigationRecord(Base):
    __tablename__ = "investigation_records"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(50), index=True, nullable=False)
    analyst_name = Column(String(100), default="System Administrator")
    action_taken = Column(String(50), nullable=False)  # Reviewed Safe, Flagged Suspicious, Confirmed Fraud, Note Added
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

class ModelVersionRecord(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(50), unique=True, nullable=False)
    model_type = Column(String(100), default="Hybrid (XGBoost + GNN)")
    accuracy = Column(Float, default=0.0)
    precision = Column(Float, default=0.0)
    recall = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    pr_auc = Column(Float, default=0.0)
    roc_auc = Column(Float, default=0.0)
    samples_count = Column(Integer, default=0)
    drift_score = Column(Float, default=0.0)
    is_active = Column(Boolean, default=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())

class EvaluationResult(Base):
    __tablename__ = "evaluation_results"

    id = Column(Integer, primary_key=True, index=True)
    model_version = Column(String(50), nullable=False)
    model_name = Column(String(100), nullable=False)
    dataset_name = Column(String(100), default="PaySim Benchmark")
    test_samples = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    precision = Column(Float, default=0.0)
    recall = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    pr_auc = Column(Float, default=0.0)
    roc_auc = Column(Float, default=0.0)
    confusion_matrix = Column(Text, nullable=True)
    evaluated_at = Column(DateTime, default=func.now())
    details = Column(Text, nullable=True)

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String(50), nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    status = Column(String(20), default="SUCCESS")
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

class ApplicationSetting(Base):
    __tablename__ = "application_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
