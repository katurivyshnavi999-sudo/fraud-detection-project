from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.database.models import Transaction, User, Merchant, Device

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Returns high-level KPI cards and chart aggregations computed directly
    from actual SQLite database records for the main cybersecurity dashboard.
    """
    total_txns = db.query(Transaction).count()
    fraud_txns = db.query(Transaction).filter(Transaction.hybrid_prediction == "Fraud").count()
    suspicious_txns = db.query(Transaction).filter(Transaction.hybrid_prediction == "Suspicious").count()
    legit_txns = db.query(Transaction).filter(Transaction.hybrid_prediction == "Safe").count()
    
    fraud_rate = round((fraud_txns / total_txns * 100.0) if total_txns > 0 else 0.0, 1)
    high_risk_count = db.query(Transaction).filter(Transaction.hybrid_risk_score >= 75.0).count()
    avg_risk = round(float(db.query(func.avg(Transaction.hybrid_risk_score)).scalar() or 0.0), 1)
    total_amount = round(float(db.query(func.sum(Transaction.amount)).scalar() or 0.0), 2)
    avg_amount = round(float(db.query(func.avg(Transaction.amount)).scalar() or 0.0), 2)
    
    # 1. Payment Method Breakdown & Merchant Breakdown
    all_transactions = db.query(Transaction).order_by(Transaction.id.desc()).all()
    
    pm_stats = {}
    merch_stats = {}
    
    for t in all_transactions:
        # PM aggregation
        pm = t.payment_method or "Other"
        if pm not in pm_stats:
            pm_stats[pm] = {"total": 0, "fraud": 0}
        pm_stats[pm]["total"] += 1
        if t.hybrid_prediction == "Fraud":
            pm_stats[pm]["fraud"] += 1
            
        # Merchant aggregation
        m = t.merchant_id or "Unknown"
        if m not in merch_stats:
            merch_stats[m] = {"total": 0, "fraud": 0}
        merch_stats[m]["total"] += 1
        if t.hybrid_prediction in ["Fraud", "Suspicious"]:
            merch_stats[m]["fraud"] += 1

    fraud_by_payment_method = [
        {"method": pm, "total": data["total"], "fraud": data["fraud"], "fraud_count": data["fraud"], "legit": data["total"] - data["fraud"]}
        for pm, data in pm_stats.items()
    ]

    # Ensure all standard channels appear
    standard_channels = ["UPI", "Credit Card", "Debit Card", "Net Banking", "Wallet"]
    existing_channels = {item["method"] for item in fraud_by_payment_method}
    for sc in standard_channels:
        if sc not in existing_channels:
            fraud_by_payment_method.append({"method": sc, "total": 0, "fraud": 0, "fraud_count": 0, "legit": 0})

    sorted_merchants = sorted(merch_stats.items(), key=lambda x: x[1]["total"], reverse=True)[:5]
    top_merchants = [
        {"name": m, "total": data["total"], "fraudCount": data["fraud"], "category": "Retail"}
        for m, data in sorted_merchants
    ]

    # 2. Risk Tiers
    risk_tiers = [
        {"tier": "Low (0-39)", "count": db.query(Transaction).filter(Transaction.hybrid_risk_score < 40).count(), "fill": "#10b981"},
        {"tier": "Moderate (40-74)", "count": db.query(Transaction).filter(Transaction.hybrid_risk_score >= 40, Transaction.hybrid_risk_score < 75).count(), "fill": "#f59e0b"},
        {"tier": "High (75-100)", "count": db.query(Transaction).filter(Transaction.hybrid_risk_score >= 75).count(), "fill": "#ef4444"},
    ]

    # 3. Amount Distribution (Brackets)
    amount_tiers = [
        {"range": "₹0 - ₹2k", "count": db.query(Transaction).filter(Transaction.amount < 2000).count()},
        {"range": "₹2k - ₹10k", "count": db.query(Transaction).filter(Transaction.amount >= 2000, Transaction.amount < 10000).count()},
        {"range": "₹10k - ₹50k", "count": db.query(Transaction).filter(Transaction.amount >= 10000, Transaction.amount < 50000).count()},
        {"range": "₹50k+", "count": db.query(Transaction).filter(Transaction.amount >= 50000).count()},
    ]

    # 4. Hourly Trends over Time (Grouped from real transactions where possible)
    hourly_counts = {}
    for h in ["00:00", "02:00", "04:00", "08:00", "12:00", "16:00", "18:00", "20:00", "22:00"]:
        hourly_counts[h] = {"time": h, "safe": 0, "suspicious": 0, "fraud": 0, "total": 0}

    for t in all_transactions:
        try:
            # timestamp format: "YYYY-MM-DD HH:MM:SS"
            hour = int(t.timestamp.split()[1].split(":")[0])
            matched_slot = f"{(hour // 2) * 2:02d}:00"
            if matched_slot in hourly_counts:
                hourly_counts[matched_slot]["total"] += 1
                if t.hybrid_prediction == "Safe":
                    hourly_counts[matched_slot]["safe"] += 1
                elif t.hybrid_prediction == "Suspicious":
                    hourly_counts[matched_slot]["suspicious"] += 1
                elif t.hybrid_prediction == "Fraud":
                    hourly_counts[matched_slot]["fraud"] += 1
        except Exception:
            pass

    hourly_volume = list(hourly_counts.values())

    # 5. Recent transactions
    recent_records = db.query(Transaction).order_by(Transaction.id.desc()).limit(15).all()
    recent_transactions = [
        {
            "id": t.id,
            "transaction_id": t.transaction_id,
            "user_id": t.user_id,
            "merchant_id": t.merchant_id,
            "device_id": t.device_id,
            "amount": t.amount,
            "currency": t.currency or "INR",
            "timestamp": t.timestamp,
            "payment_method": t.payment_method,
            "location": t.location,
            "ml_score": t.ml_score,
            "gnn_score": t.gnn_score,
            "risk_score": t.hybrid_risk_score,
            "hybrid_risk_score": t.hybrid_risk_score,
            "prediction": t.hybrid_prediction,
            "hybrid_prediction": t.hybrid_prediction,
            "is_fraud": t.hybrid_prediction == "Fraud",
            "analyst_status": t.analyst_status,
            "status": "Blocked" if t.hybrid_risk_score >= 85 else ("Flagged" if t.hybrid_prediction == "Fraud" else ("Under Review" if t.hybrid_prediction == "Suspicious" else "Approved"))
        }
        for t in recent_records
    ]

    risk_composition = [
        {"name": "Safe", "value": legit_txns, "color": "#10b981"},
        {"name": "Suspicious", "value": suspicious_txns, "color": "#f59e0b"},
        {"name": "Fraud", "value": fraud_txns, "color": "#ef4444"},
    ]

    return {
        # Flat convenience properties for frontend components
        "total": total_txns,
        "safe": legit_txns,
        "suspicious": suspicious_txns,
        "fraud": fraud_txns,
        "fraudRate": fraud_rate,
        "avgRisk": avg_risk,
        "total_amount": total_amount,
        "avg_amount": avg_amount,
        "hourlyVolume": hourly_volume,
        "riskComposition": risk_composition,
        "fraudByChannel": fraud_by_payment_method,
        "riskTiers": risk_tiers,
        "amountTiers": amount_tiers,
        "topMerchants": top_merchants,
        "recentTxns": recent_transactions,
        # Sectional grouped properties for backwards compatibility
        "cards": {
            "total_transactions": total_txns,
            "fraudulent_transactions": fraud_txns,
            "suspicious_transactions": suspicious_txns,
            "legitimate_transactions": legit_txns,
            "fraud_detection_rate": f"{fraud_rate}%",
            "model_status": "Active (Continuous Evaluation)",
            "model_status_note": "Real-time hybrid inference active",
            "high_risk_transactions": high_risk_count,
            "total_amount": total_amount,
            "avg_amount": avg_amount
        },
        "charts": {
            "fraud_vs_legitimate": risk_composition,
            "fraud_trends_over_time": hourly_volume,
            "amount_distribution": amount_tiers,
            "fraud_by_payment_method": fraud_by_payment_method,
            "fraud_by_merchant": top_merchants
        },
        "recent_transactions": recent_transactions
    }
