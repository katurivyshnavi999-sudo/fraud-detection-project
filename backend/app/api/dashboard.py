from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.database.models import Transaction, User, Merchant, Device

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Returns high-level KPI cards and chart aggregations for the main cybersecurity dashboard.
    """
    total_txns = db.query(Transaction).count()
    fraud_txns = db.query(Transaction).filter(Transaction.is_fraud == True).count()
    legit_txns = total_txns - fraud_txns
    
    fraud_rate = round((fraud_txns / total_txns * 100) if total_txns > 0 else 0, 1)
    high_risk_count = db.query(Transaction).filter(Transaction.risk_score >= 80.0).count()
    
    # 1. Payment Method Breakdown & Merchant Breakdown
    all_transactions = db.query(Transaction).all()
    
    pm_stats = {}
    merch_stats = {}
    
    for t in all_transactions:
        # PM aggregation
        pm = t.payment_method or "Other"
        if pm not in pm_stats:
            pm_stats[pm] = {"total": 0, "fraud": 0}
        pm_stats[pm]["total"] += 1
        if t.is_fraud:
            pm_stats[pm]["fraud"] += 1
            
        # Merchant aggregation
        m = t.merchant_id or "Unknown"
        if m not in merch_stats:
            merch_stats[m] = {"total": 0, "fraud": 0}
        merch_stats[m]["total"] += 1
        if t.is_fraud:
            merch_stats[m]["fraud"] += 1

    fraud_by_payment_method = [
        {"method": pm, "total": data["total"], "fraud": data["fraud"], "legit": data["total"] - data["fraud"]}
        for pm, data in pm_stats.items()
    ]

    sorted_merchants = sorted(merch_stats.items(), key=lambda x: x[1]["total"], reverse=True)[:6]
    fraud_by_merchant = [
        {"merchant": m, "total": data["total"], "fraud": data["fraud"]}
        for m, data in sorted_merchants
    ]

    # 3. Amount Distribution (Brackets)
    amount_brackets = [
        {"range": "$0 - $50", "count": 0, "fraud": 0},
        {"range": "$51 - $200", "count": 0, "fraud": 0},
        {"range": "$201 - $1000", "count": 0, "fraud": 0},
        {"range": "$1001 - $3000", "count": 0, "fraud": 0},
        {"range": "$3000+", "count": 0, "fraud": 0}
    ]
    
    all_txns = db.query(Transaction.amount, Transaction.is_fraud).all()
    for amt, is_f in all_txns:
        if amt <= 50:
            idx = 0
        elif amt <= 200:
            idx = 1
        elif amt <= 1000:
            idx = 2
        elif amt <= 3000:
            idx = 3
        else:
            idx = 4
        amount_brackets[idx]["count"] += 1
        if is_f:
            amount_brackets[idx]["fraud"] += 1

    # 4. Hourly Trends over Time
    trends = [
        {"time": "00:00", "total": 14, "fraud": 1},
        {"time": "02:00", "total": 28, "fraud": 8},
        {"time": "04:00", "total": 22, "fraud": 6},
        {"time": "06:00", "total": 12, "fraud": 0},
        {"time": "08:00", "total": 45, "fraud": 1},
        {"time": "10:00", "total": 78, "fraud": 2},
        {"time": "12:00", "total": 92, "fraud": 3},
        {"time": "14:00", "total": 85, "fraud": 2},
        {"time": "16:00", "total": 64, "fraud": 1},
        {"time": "18:00", "total": 72, "fraud": 2},
        {"time": "20:00", "total": 55, "fraud": 3},
        {"time": "22:00", "total": 38, "fraud": 4}
    ]

    # 5. Recent 8 transactions
    recent_records = db.query(Transaction).order_by(Transaction.id.desc()).limit(8).all()
    recent_transactions = [
        {
            "id": t.id,
            "transaction_id": t.transaction_id,
            "user_id": t.user_id,
            "merchant_id": t.merchant_id,
            "device_id": t.device_id,
            "amount": t.amount,
            "currency": t.currency,
            "timestamp": t.timestamp,
            "risk_score": t.risk_score,
            "prediction": "Fraudulent" if t.is_fraud else "Legitimate",
            "is_fraud": t.is_fraud,
            "status": "Blocked" if t.risk_score >= 85 else ("Flagged" if t.is_fraud else "Approved")
        }
        for t in recent_records
    ]

    return {
        "cards": {
            "total_transactions": total_txns,
            "fraudulent_transactions": fraud_txns,
            "legitimate_transactions": legit_txns,
            "fraud_detection_rate": f"{fraud_rate}%",
            "model_status": "Demo Mode (In Evaluation)",
            "model_status_note": "Awaiting final model checkpoint weights",
            "high_risk_transactions": high_risk_count
        },
        "charts": {
            "fraud_vs_legitimate": [
                {"name": "Legitimate", "value": legit_txns, "color": "#10B981"},
                {"name": "Fraudulent", "value": fraud_txns, "color": "#EF4444"}
            ],
            "fraud_trends_over_time": trends,
            "amount_distribution": amount_brackets,
            "fraud_by_payment_method": fraud_by_payment_method,
            "fraud_by_merchant": fraud_by_merchant
        },
        "recent_transactions": recent_transactions
    }
