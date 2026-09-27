import math
from datetime import datetime
from typing import Dict, Any, List

class TransactionPreprocessor:
    """
    Modular preprocessor for digital payment transactions.
    Normalizes numerical features, encodes categoricals, and extracts cyclical time features.
    """
    
    PAYMENT_METHOD_MAP = {
        "UPI": 0,
        "Credit Card": 1,
        "Debit Card": 2,
        "Net Banking": 3,
        "Digital Wallet": 4,
        "Cryptocurrency": 5
    }
    
    TRANSACTION_TYPE_MAP = {
        "POS": 0,
        "Online": 1,
        "P2P": 2,
        "P2M": 3
    }
    
    # Amount normalization baseline (log-scaling parameters)
    MEAN_LOG_AMOUNT = 3.8
    STD_LOG_AMOUNT = 1.6

    @classmethod
    def extract_time_features(cls, timestamp_str: str) -> Dict[str, float]:
        """Extracts cyclical hour-of-day and weekend indicator from timestamp string."""
        try:
            # Handle formats like "2026-09-18 14:30:00" or ISO format
            if "T" in timestamp_str:
                dt = datetime.fromisoformat(timestamp_str.replace("Z", ""))
            else:
                dt = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
        except Exception:
            dt = datetime.now()

        hour = dt.hour
        day_of_week = dt.weekday()
        
        # Cyclical transformations: sin and cos representations
        hour_sin = math.sin(2 * math.pi * hour / 24.0)
        hour_cos = math.cos(2 * math.pi * hour / 24.0)
        is_weekend = 1.0 if day_of_week >= 5 else 0.0
        is_night = 1.0 if (hour >= 23 or hour <= 5) else 0.0

        return {
            "hour": float(hour),
            "hour_sin": round(hour_sin, 4),
            "hour_cos": round(hour_cos, 4),
            "day_of_week": float(day_of_week),
            "is_weekend": is_weekend,
            "is_night": is_night
        }

    @classmethod
    def transform(cls, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Transforms a raw transaction into standardized feature dict."""
        amount = float(raw.get("amount", 0.0))
        log_amount = math.log1p(max(0.0, amount))
        norm_amount = (log_amount - cls.MEAN_LOG_AMOUNT) / cls.STD_LOG_AMOUNT
        
        time_feats = cls.extract_time_features(str(raw.get("timestamp", "")))
        
        pm = raw.get("payment_method", "Credit Card")
        tt = raw.get("transaction_type", "Online")
        
        return {
            "amount_raw": amount,
            "amount_normalized": round(norm_amount, 4),
            "payment_method_code": cls.PAYMENT_METHOD_MAP.get(pm, 1),
            "transaction_type_code": cls.TRANSACTION_TYPE_MAP.get(tt, 1),
            **time_feats
        }
