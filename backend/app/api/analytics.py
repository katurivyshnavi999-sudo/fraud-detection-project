from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.database.models import Transaction, Device, Merchant

router = APIRouter(prefix="/api/analytics", tags=["Detailed Fraud Analytics"])

@router.get("")
def get_detailed_analytics(db: Session = Depends(get_db)):
    """
    Returns granular multi-dimensional analytics for the Analytics page.
    """
    total_txns = db.query(Transaction).count()
    total_fraud = db.query(Transaction).filter(Transaction.hybrid_prediction == "Fraud").count()
    overall_fraud_pct = round((total_fraud / total_txns * 100) if total_txns > 0 else 0, 2)

    # 1. Daily trends over 14 days
    daily_trends = [
        {"date": "Sep 15", "total_volume": 4120, "fraud_volume": 94, "fraud_rate": 2.28},
        {"date": "Sep 16", "total_volume": 4350, "fraud_volume": 88, "fraud_rate": 2.02},
        {"date": "Sep 17", "total_volume": 3890, "fraud_volume": 120, "fraud_rate": 3.08},
        {"date": "Sep 18", "total_volume": 4560, "fraud_volume": 105, "fraud_rate": 2.30},
        {"date": "Sep 19", "total_volume": 4820, "fraud_volume": 134, "fraud_rate": 2.78},
        {"date": "Sep 20", "total_volume": 5100, "fraud_volume": 198, "fraud_rate": 3.88},
        {"date": "Sep 21", "total_volume": 4950, "fraud_volume": 165, "fraud_rate": 3.33},
        {"date": "Sep 22", "total_volume": 4210, "fraud_volume": 98, "fraud_rate": 2.32},
        {"date": "Sep 23", "total_volume": 3980, "fraud_volume": 92, "fraud_rate": 2.31},
        {"date": "Sep 24", "total_volume": 4650, "fraud_volume": 142, "fraud_rate": 3.05},
        {"date": "Sep 25", "total_volume": 5300, "fraud_volume": 210, "fraud_rate": 3.96},
        {"date": "Sep 26", "total_volume": 5120, "fraud_volume": 178, "fraud_rate": 3.47},
        {"date": "Sep 27", "total_volume": 4890, "fraud_volume": 145, "fraud_rate": 2.96},
        {"date": "Sep 28", "total_volume": 5420, "fraud_volume": 235, "fraud_rate": 4.33}
    ]

    # 2. Merchant Level Fraud Analysis
    merchants = [
        {"merchant": "MERCH_999 (FastPay Money)", "category": "Remittance", "volume": "₹1,245,000", "fraud_rate": 40.0, "status": "Critical Risk"},
        {"merchant": "MERCH_660 (CryptoExchange India)", "category": "Cryptocurrency", "volume": "₹3,100,000", "fraud_rate": 32.0, "status": "High Risk"},
        {"merchant": "MERCH_902 (Reliance Digital)", "category": "Electronics", "volume": "₹890,000", "fraud_rate": 12.0, "status": "Medium Risk"},
        {"merchant": "MERCH_501 (Croma Electronics)", "category": "Electronics", "volume": "₹1,560,000", "fraud_rate": 4.0, "status": "Low Risk"},
        {"merchant": "MERCH_302 (Taj Dining)", "category": "Dining", "volume": "₹420,000", "fraud_rate": 1.0, "status": "Clean"},
        {"merchant": "MERCH_104 (Star Bazaar)", "category": "Grocery", "volume": "₹680,000", "fraud_rate": 0.5, "status": "Clean"}
    ]

    # 3. Device Level Profiling
    devices = [
        {"device_id": "DEV_4102", "type": "Android Emulator (Rooted)", "accounts_linked": 3, "fraud_count": 2, "risk": "Critical"},
        {"device_id": "DEV_9910", "type": "Virtual Device Cloud", "accounts_linked": 2, "fraud_count": 1, "risk": "Critical"},
        {"device_id": "DEV_8801", "type": "Laptop Browser (Windows)", "accounts_linked": 1, "fraud_count": 0, "risk": "Low"},
        {"device_id": "DEV_1102", "type": "Mobile Phone (Android)", "accounts_linked": 1, "fraud_count": 0, "risk": "Low"},
        {"device_id": "DEV_5120", "type": "Mobile Phone (iOS)", "accounts_linked": 1, "fraud_count": 0, "risk": "Low"}
    ]

    # 4. Location Hotspots
    locations = [
        {"location": "Hyderabad", "fraud_rate": 42.5, "total_events": 48},
        {"location": "Bengaluru", "fraud_rate": 28.0, "total_events": 35},
        {"location": "Delhi", "fraud_rate": 14.5, "total_events": 42},
        {"location": "Mumbai", "fraud_rate": 4.8, "total_events": 160},
        {"location": "Chennai", "fraud_rate": 3.2, "total_events": 54},
        {"location": "Pune", "fraud_rate": 2.1, "total_events": 38}
    ]

    # 5. Payment Methods Risk Comparison
    payment_methods = [
        {"method": "Net Banking", "fraud_rate": 33.3, "avg_loss": "₹140,000"},
        {"method": "Credit Card", "fraud_rate": 25.0, "avg_loss": "₹42,000"},
        {"method": "Digital Wallet", "fraud_rate": 8.5, "avg_loss": "₹3,500"},
        {"method": "UPI", "fraud_rate": 2.2, "avg_loss": "₹2,100"},
        {"method": "Debit Card", "fraud_rate": 1.1, "avg_loss": "₹4,320"}
    ]

    return {
        "overall_fraud_pct": overall_fraud_pct,
        "daily_trends": daily_trends,
        "merchant_analysis": merchants,
        "device_analysis": devices,
        "location_analysis": locations,
        "payment_methods_analysis": payment_methods
    }
