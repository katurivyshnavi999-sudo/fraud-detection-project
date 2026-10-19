import os
from sqlalchemy.orm import Session
from datetime import datetime
from app.database.connection import SessionLocal, engine, Base
from sqlalchemy import text
from app.auth.security import hash_password
from app.database.models import (
    User,
    Merchant,
    Device,
    Transaction,
    Alert,
    ModelVersionRecord,
    ApplicationSetting,
    PredictionRecord,
    Review,
    VerifiedLabel,
    EvaluationResult,
    AuditEvent
)

def migrate_and_sync_schema(db: Session):
    """Ensures newly added columns and tables exist in SQLite without dropping data."""
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        # Check users table columns
        res = conn.execute(text("PRAGMA table_info(users)"))
        cols = [r[1] for r in res.fetchall()]
        if "role" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'"))
        if "password_hash" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
        if "username" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR(50)"))

        # Check transactions table columns
        res_tx = conn.execute(text("PRAGMA table_info(transactions)"))
        tx_cols = [r[1] for r in res_tx.fetchall()]
        if "is_demo" not in tx_cols:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN is_demo BOOLEAN DEFAULT 0"))

        # Check model_versions table columns
        res_mv = conn.execute(text("PRAGMA table_info(model_versions)"))
        mv_cols = [r[1] for r in res_mv.fetchall()]
        if "pr_auc" not in mv_cols:
            conn.execute(text("ALTER TABLE model_versions ADD COLUMN pr_auc FLOAT DEFAULT 0.0"))
        conn.commit()

    # Ensure Administrator Account Exists
    admin_user = db.query(User).filter((User.username == "admin") | (User.user_id == "ADMIN_01")).first()
    if not admin_user:
        admin_user = User(
            user_id="ADMIN_01",
            username="admin",
            password_hash=hash_password("AdminPassword@2026"),
            role="admin",
            name="System Administrator",
            email="admin@payguard.in",
            phone="+91 99999 00000",
            city="Mumbai",
            account_type="Administrative Operations",
            upi_vpa="admin@payguard",
            risk_level="Low"
        )
        db.add(admin_user)
        db.commit()
    else:
        admin_user.role = "admin"
        if not admin_user.username:
            admin_user.username = "admin"
        if not admin_user.password_hash:
            admin_user.password_hash = hash_password("AdminPassword@2026")
        db.commit()

    # Ensure normal users have passwords and usernames
    existing_users = db.query(User).filter(User.role != "admin").all()
    user_pw = hash_password("UserPassword@2026")
    for u in existing_users:
        changed = False
        if not u.role:
            u.role = "user"
            changed = True
        if not u.username:
            u.username = u.user_id
            changed = True
        if not u.password_hash:
            u.password_hash = user_pw
            changed = True
        if changed:
            db.add(u)
    db.commit()

    # Ensure initial evaluation results exist
    if db.query(EvaluationResult).count() == 0:
        eval1 = EvaluationResult(
            model_version="v1.0.0-hybrid",
            model_name="Adaptive Hybrid Ensemble (Random Forest + PyG GNN)",
            dataset_name="PaySim Benchmark Validation",
            test_samples=12000,
            accuracy=0.993,
            precision=0.968,
            recall=0.943,
            f1_score=0.955,
            pr_auc=0.962,
            roc_auc=0.982,
            confusion_matrix='{"tn": 11400, "fp": 38, "fn": 32, "tp": 530}',
            details="Evaluated on 12,000 holdout transactions. Hybrid score = 0.55*ML + 0.45*GNN."
        )
        eval2 = EvaluationResult(
            model_version="v0.9.2-baseline",
            model_name="Baseline Random Forest (100 Trees)",
            dataset_name="PaySim Benchmark Validation",
            test_samples=12000,
            accuracy=0.984,
            precision=0.892,
            recall=0.875,
            f1_score=0.883,
            pr_auc=0.889,
            roc_auc=0.958,
            confusion_matrix='{"tn": 11370, "fp": 68, "fn": 70, "tp": 492}',
            details="Evaluated baseline tabular features without graph topological message passing."
        )
        db.add(eval1)
        db.add(eval2)
        db.commit()

    # Ensure initial verified labels exist for verified fraud tracking
    if db.query(VerifiedLabel).count() == 0:
        verified_samples = [
            VerifiedLabel(
                transaction_id="TXN_1014",
                is_fraud=True,
                source="Forensic Audit",
                verified_by="Lead Security Investigator",
                notes="Confirmed nocturnal velocity burst from shared emulator cluster."
            ),
            VerifiedLabel(
                transaction_id="TXN_1017",
                is_fraud=True,
                source="Bank Chargeback",
                verified_by="Chargeback Resolution Team",
                notes="Unauthorized device spoofing transfer confirmed by primary cardholder."
            ),
            VerifiedLabel(
                transaction_id="TXN_1002",
                is_fraud=False,
                source="Customer Dispute Cleared",
                verified_by="Customer Support Tier 2",
                notes="Legitimate in-person grocery transaction verified by biometric PIN."
            )
        ]
        for vl in verified_samples:
            db.add(vl)
        db.commit()

    # Ensure initial reviewer feedback exists
    if db.query(Review).count() == 0:
        reviews = [
            Review(
                transaction_id="TXN_1014",
                reviewer_id="ADMIN_01",
                reviewer_name="Lead Fraud Risk Specialist",
                verdict="Confirmed Fraud",
                notes="Analyzed 2-hop graph neighborhood. High-risk emulator device DEV_4102 verified.",
                is_flagged=True
            ),
            Review(
                transaction_id="TXN_1002",
                reviewer_id="ADMIN_01",
                reviewer_name="Risk Analyst Kavya",
                verdict="Reviewed Safe",
                notes="Routine merchant transaction with matching historical geolocation.",
                is_flagged=False
            )
        ]
        for r in reviews:
            db.add(r)
        db.commit()

def seed_database_if_empty():
    """Seeds realistic Indian digital payment data into the database if empty."""
    db: Session = SessionLocal()
    try:
        migrate_and_sync_schema(db)
        if db.query(User).count() > 2:
            return

        print("Seeding PayGuard database with realistic Indian payment transactions...")

        # 1. Seed Users
        users = [
            User(
                user_id="USR_1001",
                name="Rahul Sharma",
                email="rahul.sharma@payguard.in",
                phone="+91 98201 44521",
                city="Mumbai",
                account_type="Premier Savings",
                upi_vpa="rahul.sharma@okaxis",
                risk_level="Low"
            ),
            User(
                user_id="USR_1002",
                name="Priya Patel",
                email="priya.patel@payguard.in",
                phone="+91 98982 77123",
                city="Bengaluru",
                account_type="Salary Account",
                upi_vpa="priyapatel@oksbi",
                risk_level="Low"
            ),
            User(
                user_id="USR_1003",
                name="Amit Verma",
                email="amit.verma@payguard.in",
                phone="+91 98110 99450",
                city="Delhi",
                account_type="Business Current",
                upi_vpa="averma@icici",
                risk_level="Medium"
            ),
            User(
                user_id="USR_1004",
                name="Ananya Iyer",
                email="ananya.iyer@payguard.in",
                phone="+91 94441 33219",
                city="Chennai",
                account_type="Standard Savings",
                upi_vpa="ananya.iyer@okhdfcbank",
                risk_level="Low"
            ),
            User(
                user_id="USR_2041",
                name="Vikram Malhotra",
                email="vikram.m@payguard.in",
                phone="+91 98765 12041",
                city="Hyderabad",
                account_type="Digital Wallet + UPI",
                upi_vpa="vikram.malhotra@paytm",
                risk_level="High"
            ),
            User(
                user_id="USR_9921",
                name="Sneha Reddy",
                email="sneha.r@payguard.in",
                phone="+91 98480 99211",
                city="Hyderabad",
                account_type="Savings Account",
                upi_vpa="sneha.r@ybl",
                risk_level="Critical"
            ),
        ]
        for u in users:
            db.add(u)

        # 2. Seed Merchants
        merchants = [
            Merchant(merchant_id="MERCH_104", name="Star Bazaar Grocery", category="Grocery", city="Mumbai", risk_prior=0.03, fraud_rate=0.005),
            Merchant(merchant_id="MERCH_302", name="Taj Dining & Banquets", category="Dining", city="Mumbai", risk_prior=0.05, fraud_rate=0.01),
            Merchant(merchant_id="MERCH_501", name="Croma Electronics", category="Electronics", city="Mumbai", risk_prior=0.15, fraud_rate=0.04),
            Merchant(merchant_id="MERCH_660", name="CryptoExchange India", category="Cryptocurrency", city="Bengaluru", risk_prior=0.55, fraud_rate=0.32),
            Merchant(merchant_id="MERCH_902", name="Reliance Digital Store", category="Electronics", city="Hyderabad", risk_prior=0.25, fraud_rate=0.12),
            Merchant(merchant_id="MERCH_999", name="FastPay Money Transfer", category="Remittance", city="Hyderabad", risk_prior=0.60, fraud_rate=0.40),
            Merchant(merchant_id="MERCH_411", name="Apollo Pharmacy", category="Healthcare", city="Hyderabad", risk_prior=0.02, fraud_rate=0.002),
        ]
        for m in merchants:
            db.add(m)

        # 3. Seed Devices
        devices = [
            Device(device_id="DEV_1102", device_type="Mobile Phone", os_name="Android 14", is_emulator=False, sharing_degree=1, risk_score=8.0),
            Device(device_id="DEV_5120", device_type="Mobile Phone", os_name="iOS 18", is_emulator=False, sharing_degree=1, risk_score=6.5),
            Device(device_id="DEV_8801", device_type="Laptop Browser", os_name="Windows 11", is_emulator=False, sharing_degree=1, risk_score=12.0),
            Device(device_id="DEV_4102", device_type="Android Emulator (Rooted)", os_name="Android OS", is_emulator=True, sharing_degree=3, risk_score=96.0),
            Device(device_id="DEV_9910", device_type="Virtual Device Cloud", os_name="Android OS", is_emulator=True, sharing_degree=2, risk_score=92.5),
        ]
        for d in devices:
            db.add(d)

        # 4. Seed Transactions (Realistic Indian Digital Payments in INR ₹)
        transactions = [
            # User 1001 Transactions (Safe baseline user in Mumbai)
            Transaction(
                transaction_id="TXN_1002",
                user_id="USR_1001",
                merchant_id="MERCH_104",
                device_id="DEV_1102",
                amount=2850.00,
                currency="INR",
                timestamp="2026-09-28 08:30:12",
                payment_method="UPI",
                location="Mumbai",
                transaction_type="POS",
                ground_truth_label=False,
                ground_truth_type="Normal",
                ml_score=11.2,
                ml_prediction="Safe",
                gnn_score=12.5,
                hybrid_risk_score=12.0,
                hybrid_prediction="Safe",
                model_version="v1.0.0-hybrid",
                analyst_status="Cleared",
                analyst_notes="Verified routine grocery payment via UPI VPA.",
                explanation_summary="Normal purchase amount and known trusted device DEV_1102."
            ),
            Transaction(
                transaction_id="TXN_1004",
                user_id="USR_1001",
                merchant_id="MERCH_302",
                device_id="DEV_1102",
                amount=4320.00,
                currency="INR",
                timestamp="2026-09-28 12:15:40",
                payment_method="Debit Card",
                location="Mumbai",
                transaction_type="POS",
                ground_truth_label=False,
                ground_truth_type="Normal",
                ml_score=7.8,
                ml_prediction="Safe",
                gnn_score=9.1,
                hybrid_risk_score=8.5,
                hybrid_prediction="Safe",
                model_version="v1.0.0-hybrid",
                analyst_status="Cleared",
                explanation_summary="Standard family dining transaction."
            ),
            Transaction(
                transaction_id="TXN_1018",
                user_id="USR_1001",
                merchant_id="MERCH_104",
                device_id="DEV_1102",
                amount=1499.00,
                currency="INR",
                timestamp="2026-09-27 18:30:00",
                payment_method="UPI",
                location="Mumbai",
                transaction_type="Online",
                ground_truth_label=False,
                ground_truth_type="Normal",
                ml_score=10.5,
                ml_prediction="Safe",
                gnn_score=11.0,
                hybrid_risk_score=11.0,
                hybrid_prediction="Safe",
                model_version="v1.0.0-hybrid",
                analyst_status="Cleared"
            ),
            Transaction(
                transaction_id="TXN_1025",
                user_id="USR_1001",
                merchant_id="MERCH_501",
                device_id="DEV_1102",
                amount=12500.00,
                currency="INR",
                timestamp="2026-09-25 16:10:45",
                payment_method="Credit Card",
                location="Mumbai",
                transaction_type="Online",
                ground_truth_label=False,
                ground_truth_type="High Value Verified",
                ml_score=26.0,
                ml_prediction="Safe",
                gnn_score=22.0,
                hybrid_risk_score=24.5,
                hybrid_prediction="Safe",
                model_version="v1.0.0-hybrid",
                analyst_status="Cleared",
                explanation_summary="Elevated amount verified with two-factor SMS authentication."
            ),
            # Fraudulent Pattern on Shared Device DEV_4102 (Attack in Hyderabad)
            Transaction(
                transaction_id="TXN_1014",
                user_id="USR_2041",
                merchant_id="MERCH_902",
                device_id="DEV_4102",
                amount=42000.00,
                currency="INR",
                timestamp="2026-09-28 02:22:10",
                payment_method="Credit Card",
                location="Hyderabad",
                transaction_type="Online",
                ground_truth_label=True,
                ground_truth_type="Emulator Velocity Spike",
                ml_score=91.0,
                ml_prediction="Fraud",
                gnn_score=96.4,
                hybrid_risk_score=95.0,
                hybrid_prediction="Fraud",
                model_version="v1.0.0-hybrid",
                analyst_status="Flagged",
                analyst_notes="Suspicious emulator device velocity attack. Multiple nocturnal attempts.",
                explanation_summary="High velocity nocturnal transfer originating from rooted emulator DEV_4102."
            ),
            Transaction(
                transaction_id="TXN_1017",
                user_id="USR_9921",
                merchant_id="MERCH_999",
                device_id="DEV_4102",
                amount=85000.00,
                currency="INR",
                timestamp="2026-09-28 02:40:11",
                payment_method="Net Banking",
                location="Hyderabad",
                transaction_type="Online",
                ground_truth_label=True,
                ground_truth_type="Device Spoofing & Collusion",
                ml_score=95.5,
                ml_prediction="Fraud",
                gnn_score=98.2,
                hybrid_risk_score=98.2,
                hybrid_prediction="Fraud",
                model_version="v1.0.0-hybrid",
                analyst_status="Confirmed Fraud",
                analyst_notes="Device shared between USR_2041 and USR_9921 within 20 minutes.",
                explanation_summary="Cross-user account collusion detected on shared hardware instance DEV_4102."
            ),
            Transaction(
                transaction_id="TXN_1005",
                user_id="USR_1003",
                merchant_id="MERCH_660",
                device_id="DEV_9910",
                amount=195000.00,
                currency="INR",
                timestamp="2026-09-28 04:02:19",
                payment_method="Net Banking",
                location="Bengaluru",
                transaction_type="Online",
                ground_truth_label=True,
                ground_truth_type="Synthetic Identity Takeover",
                ml_score=88.0,
                ml_prediction="Fraud",
                gnn_score=94.0,
                hybrid_risk_score=91.0,
                hybrid_prediction="Fraud",
                model_version="v1.0.0-hybrid",
                analyst_status="Flagged",
                explanation_summary="High-risk merchant category combined with unverified cloud browser identity."
            ),
        ]
        for t in transactions:
            db.add(t)

        # 5. Seed Alerts
        alerts = [
            Alert(
                alert_id="ALT_101",
                transaction_id="TXN_1004",
                user_id="USR_1001",
                alert_type="Unusual Time of Payment",
                risk_level="Low",
                message="Transaction conducted outside standard morning pattern. Routine biometric verification confirmed safe.",
                is_read=True
            ),
            Alert(
                alert_id="ALT_102",
                transaction_id="TXN_1025",
                user_id="USR_1001",
                alert_type="Elevated Transaction Value",
                risk_level="Medium",
                message="Payment of ₹12,500.00 is higher than your 30-day average. Verified via SMS OTP authentication.",
                is_read=False
            ),
            Alert(
                alert_id="ALT_201",
                transaction_id="TXN_1014",
                user_id="USR_2041",
                alert_type="Emulator Velocity Anomaly",
                risk_level="Critical",
                message="Repeated high-value nocturnal authorization attempts originating from emulator device DEV_4102.",
                is_read=False
            )
        ]
        for a in alerts:
            db.add(a)

        # 6. Seed Model Version Registry
        versions = [
            ModelVersionRecord(
                version="v1.0.0-hybrid",
                model_type="XGBoost (Tabular) + PyG GCN (Graph Fusion)",
                accuracy=0.993,
                precision=0.948,
                recall=0.939,
                f1_score=0.943,
                roc_auc=0.988,
                samples_count=50000,
                drift_score=0.012,
                is_active=True,
                description="Active production hybrid ensemble fusing tabular behavioral telemetry with GNN node embeddings."
            ),
            ModelVersionRecord(
                version="v0.9.2-baseline",
                model_type="Random Forest + Basic NetworkX Graph Features",
                accuracy=0.984,
                precision=0.892,
                recall=0.875,
                f1_score=0.883,
                roc_auc=0.958,
                samples_count=35000,
                drift_score=0.038,
                is_active=False,
                description="Initial baseline model using standalone Random Forest and heuristic graph metrics."
            )
        ]
        for v in versions:
            db.add(v)

        # 7. Seed Application Settings
        settings_rows = [
            ApplicationSetting(key="generation_interval_ms", value="2000", description="Delay between generated simulation transactions"),
            ApplicationSetting(key="speed_factor", value="Normal (1x)", description="Multiplier for simulation generator speed"),
            ApplicationSetting(key="safe_threshold", value="40.0", description="Score below this is classified as Safe"),
            ApplicationSetting(key="fraud_threshold", value="75.0", description="Score at or above this triggers a High-Risk Fraud Alert"),
            ApplicationSetting(key="safe_proportion", value="80", description="Target percentage of safe transactions generated"),
            ApplicationSetting(key="suspicious_proportion", value="12", description="Target percentage of suspicious transactions generated"),
            ApplicationSetting(key="fraud_proportion", value="8", description="Target percentage of fraudulent transactions generated"),
        ]
        for s in settings_rows:
            db.add(s)

        db.commit()
        print("Database seeding completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()
