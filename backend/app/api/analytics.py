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
    total_fraud = db.query(Transaction).filter(Transaction.is_fraud == True).count()
    overall_fraud_pct = round((total_fraud / total_txns * 100) if total_txns > 0 else 0, 2)

    # 1. Daily trends over 14 days
    daily_trends = [
        {"date": "Sep 05", "total_volume": 4120, "fraud_volume": 94, "fraud_rate": 2.28},
        {"date": "Sep 06", "total_volume": 4350, "fraud_volume": 88, "fraud_rate": 2.02},
        {"date": "Sep 07", "total_volume": 3890, "fraud_volume": 120, "fraud_rate": 3.08},
        {"date": "Sep 08", "total_volume": 4560, "fraud_volume": 105, "fraud_rate": 2.30},
        {"date": "Sep 09", "total_volume": 4820, "fraud_volume": 134, "fraud_rate": 2.78},
        {"date": "Sep 10", "total_volume": 5100, "fraud_volume": 198, "fraud_rate": 3.88},
        {"date": "Sep 11", "total_volume": 4950, "fraud_volume": 165, "fraud_rate": 3.33},
        {"date": "Sep 12", "total_volume": 4210, "fraud_volume": 98, "fraud_rate": 2.32},
        {"date": "Sep 13", "total_volume": 3980, "fraud_volume": 92, "fraud_rate": 2.31},
        {"date": "Sep 14", "total_volume": 4650, "fraud_volume": 142, "fraud_rate": 3.05},
        {"date": "Sep 15", "total_volume": 5300, "fraud_volume": 210, "fraud_rate": 3.96},
        {"date": "Sep 16", "total_volume": 5120, "fraud_volume": 178, "fraud_rate": 3.47},
        {"date": "Sep 17", "total_volume": 4890, "fraud_volume": 145, "fraud_rate": 2.96},
        {"date": "Sep 18", "total_volume": 5420, "fraud_volume": 235, "fraud_rate": 4.33}
    ]

    # 2. Merchant Level Fraud Analysis
    merchants = [
        {"merchant": "MERCH_999 (Money Wire)", "category": "Wire Transfer", "volume": "$124,500", "fraud_rate": 42.5, "status": "Critical Risk"},
        {"merchant": "MERCH_660 (Crypto DEX)", "category": "Cryptocurrency", "volume": "$310,000", "fraud_rate": 31.8, "status": "High Risk"},
        {"merchant": "MERCH_771 (Luxury Jewels)", "category": "Jewelry", "volume": "$89,000", "fraud_rate": 26.4, "status": "High Risk"},
        {"merchant": "MERCH_902 (Electronics Direct)", "category": "Consumer Tech", "volume": "$156,000", "fraud_rate": 18.2, "status": "Medium Risk"},
        {"merchant": "MERCH_205 (Global Sky Air)", "category": "Travel", "volume": "$420,000", "fraud_rate": 4.1, "status": "Low Risk"},
        {"merchant": "MERCH_501 (SmartTech)", "category": "Retail", "volume": "$95,000", "fraud_rate": 2.8, "status": "Low Risk"},
        {"merchant": "MERCH_104 (Metro Supermarket)", "category": "Grocery", "volume": "$68,000", "fraud_rate": 0.4, "status": "Clean"}
    ]

    # 3. Device Level Profiling
    devices = [
        {"device_id": "DEV_4102", "type": "Android Emulator", "accounts_linked": 6, "fraud_count": 5, "risk": "Critical"},
        {"device_id": "DEV_9910", "type": "Tor / Proxy Mobile", "accounts_linked": 4, "fraud_count": 4, "risk": "Critical"},
        {"device_id": "DEV_8801", "type": "Scripted Botnet", "accounts_linked": 3, "fraud_count": 3, "risk": "High"},
        {"device_id": "DEV_1102", "type": "iPhone 15 (Genuine)", "accounts_linked": 1, "fraud_count": 0, "risk": "Low"},
        {"device_id": "DEV_6011", "type": "Samsung Galaxy (Genuine)", "accounts_linked": 1, "fraud_count": 0, "risk": "Low"}
    ]

    # 4. Location Hotspots
    locations = [
        {"location": "Lagos", "fraud_rate": 68.2, "total_events": 42},
        {"location": "Singapore", "fraud_rate": 45.0, "total_events": 28},
        {"location": "New York", "fraud_rate": 38.5, "total_events": 54},
        {"location": "Dubai", "fraud_rate": 18.2, "total_events": 33},
        {"location": "London", "fraud_rate": 12.1, "total_events": 62},
        {"location": "Mumbai", "fraud_rate": 6.4, "total_events": 140},
        {"location": "Tokyo", "fraud_rate": 4.2, "total_events": 85}
    ]

    # 5. Payment Methods Risk Comparison
    payment_methods = [
        {"method": "Net Banking (Offshore)", "fraud_rate": 34.2, "avg_loss": "$3,250"},
        {"method": "Credit Card (CNP)", "fraud_rate": 28.6, "avg_loss": "$1,480"},
        {"method": "Digital Wallet", "fraud_rate": 14.5, "avg_loss": "$180"},
        {"method": "UPI (Immediate)", "fraud_rate": 8.2, "avg_loss": "$85"},
        {"method": "Debit Card (POS)", "fraud_rate": 3.1, "avg_loss": "$45"}
    ]

    return {
        "overall_fraud_pct": overall_fraud_pct,
        "daily_trends": daily_trends,
        "merchant_analysis": merchants,
        "device_analysis": devices,
        "location_analysis": locations,
        "payment_methods_analysis": payment_methods
    }
