import csv
import os
from pathlib import Path
from sqlalchemy.orm import Session
from app.config import DATA_DIR
from app.database.models import User, Merchant, Device, Transaction, ModelVersionRecord
from app.database.connection import SessionLocal, engine, Base

def seed_database_if_empty():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Check if transactions already exist
        tx_count = db.query(Transaction).count()
        if tx_count > 0:
            return
        
        csv_file = DATA_DIR / "sample_transactions.csv"
        if not csv_file.exists():
            print(f"Seed file not found at: {csv_file}")
            return
        
        users_set = {}
        merchants_set = {}
        devices_set = {}
        
        with open(csv_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                uid = row["user_id"]
                mid = row["merchant_id"]
                did = row["device_id"]
                is_fraud = int(row.get("is_fraud", 0)) == 1
                risk = float(row.get("risk_score", 15.0))
                
                # Cache user
                if uid not in users_set:
                    user_risk = "critical" if risk > 90 else ("high" if risk > 70 else ("medium" if risk > 40 else "low"))
                    users_set[uid] = User(
                        user_id=uid,
                        name=f"Digital User {uid.replace('USR_', '')}",
                        email=f"user_{uid.lower()}@paymentnetwork.net",
                        country=row.get("location", "Global"),
                        risk_level=user_risk
                    )
                
                # Cache merchant
                if mid not in merchants_set:
                    merchants_set[mid] = Merchant(
                        merchant_id=mid,
                        name=f"Merchant {mid.replace('MERCH_', '')} ({row.get('merchant_category', 'Retail')})",
                        category=row.get("merchant_category", "Retail"),
                        risk_prior=0.45 if is_fraud else 0.05,
                        fraud_rate=0.35 if is_fraud else 0.01
                    )
                
                # Cache device
                if did not in devices_set:
                    is_emul = did in ["DEV_4102", "DEV_9910"]
                    devices_set[did] = Device(
                        device_id=did,
                        device_type="Android Emulator" if is_emul else "Mobile Phone",
                        os_name="Android OS" if is_emul else "iOS/Android",
                        is_emulator=is_emul,
                        sharing_degree=2 if did == "DEV_4102" else 1,
                        risk_score=95.0 if is_emul else 12.0
                    )
                
                # Add transaction
                tx = Transaction(
                    transaction_id=row["transaction_id"],
                    user_id=uid,
                    merchant_id=mid,
                    device_id=did,
                    amount=float(row["amount"]),
                    currency=row.get("currency", "USD"),
                    timestamp=row["timestamp"],
                    payment_method=row["payment_method"],
                    location=row["location"],
                    transaction_type=row.get("transaction_type", "Online"),
                    risk_score=risk,
                    is_fraud=is_fraud,
                    fraud_type=row.get("fraud_type", "Legitimate"),
                    explanation_summary=f"Risk assessed at {risk:.1f}/100. {'High velocity or device risk detected.' if is_fraud else 'Normal user transaction baseline pattern.'}"
                )
                db.add(tx)
        
        # Add all unique users, merchants, devices
        for u in users_set.values():
            db.add(u)
        for m in merchants_set.values():
            db.add(m)
        for d in devices_set.values():
            db.add(d)
            
        # Seed initial model versions
        v1 = ModelVersionRecord(
            version="v1.0.0-base",
            samples_count=5000,
            drift_score=0.012,
            is_active=False,
            description="Base contrastive embedding model with Siamese twin network"
        )
        v2 = ModelVersionRecord(
            version="v1.0.2-gnn-integrated",
            samples_count=10000,
            drift_score=0.028,
            is_active=False,
            description="Added GraphSAGE neighborhood aggregation layers"
        )
        v3 = ModelVersionRecord(
            version="v1.0.4-hybrid-demo",
            samples_count=14250,
            drift_score=0.042,
            is_active=True,
            description="Current active prototype: Adaptive Hybrid Architecture (Demo Mode)"
        )
        db.add_all([v1, v2, v3])
        
        db.commit()
        print(f"Database seeded successfully with {len(users_set)} users, {len(merchants_set)} merchants, and initial transactions.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()
