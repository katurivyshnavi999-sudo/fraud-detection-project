from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    country = Column(String(50), default="Unknown")
    risk_level = Column(String(20), default="low")  # low, medium, high, critical
    created_at = Column(DateTime, default=func.now())

class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    risk_prior = Column(Float, default=0.05)
    fraud_rate = Column(Float, default=0.01)

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), unique=True, index=True, nullable=False)
    device_type = Column(String(50), default="Mobile")
    os_name = Column(String(50), default="Android")
    is_emulator = Column(Boolean, default=False)
    sharing_degree = Column(Integer, default=1)
    risk_score = Column(Float, default=10.0)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(String(50), index=True, nullable=False)
    merchant_id = Column(String(50), index=True, nullable=False)
    device_id = Column(String(50), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    timestamp = Column(String(30), nullable=False)
    payment_method = Column(String(50), nullable=False)
    location = Column(String(100), default="Unknown")
    transaction_type = Column(String(50), default="Online")
    risk_score = Column(Float, default=0.0)
    is_fraud = Column(Boolean, default=False)
    fraud_type = Column(String(50), default="Legitimate")
    explanation_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

class ModelVersionRecord(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(50), unique=True, nullable=False)
    samples_count = Column(Integer, default=0)
    drift_score = Column(Float, default=0.0)
    is_active = Column(Boolean, default=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())
