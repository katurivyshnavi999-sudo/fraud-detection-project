from typing import Dict, Any

class FeatureEngineer:
    """
    Computes higher-order behavioral, graph relational, and velocity features.
    In production, these pull from feature stores (Redis/Feast) or live graph aggregations.
    """
    
    # Known high-risk devices from fraud intelligence database
    SUSPICIOUS_DEVICES = {
        "DEV_4102": {"degree": 5, "is_emulator": True, "risk_prior": 0.95},
        "DEV_8801": {"degree": 3, "is_emulator": False, "risk_prior": 0.88},
        "DEV_9910": {"degree": 4, "is_emulator": True, "risk_prior": 0.92}
    }
    
    HIGH_RISK_MERCHANTS = {
        "MERCH_902": 0.65,  # High ATO target
        "MERCH_999": 0.94,  # P2P money wire / laundering
        "MERCH_771": 0.75,  # Luxury jewelry testing
        "MERCH_660": 0.82   # Crypto off-ramp
    }

    @classmethod
    def compute_features(cls, raw: Dict[str, Any], preprocessed: Dict[str, Any]) -> Dict[str, Any]:
        device_id = str(raw.get("device_id", ""))
        merchant_id = str(raw.get("merchant_id", ""))
        user_id = str(raw.get("user_id", ""))
        amount = float(raw.get("amount", 0.0))
        location = str(raw.get("location", ""))
        
        # 1. Device network degree & emulation risk
        device_info = cls.SUSPICIOUS_DEVICES.get(device_id, {"degree": 1, "is_emulator": False, "risk_prior": 0.05})
        device_sharing_score = device_info["degree"]
        is_emulator = 1.0 if device_info["is_emulator"] else 0.0
        device_risk_prior = device_info["risk_prior"]
        
        # 2. Merchant risk prior
        merchant_risk_prior = cls.HIGH_RISK_MERCHANTS.get(merchant_id, 0.08)
        
        # 3. Transaction Velocity (Simulated transaction frequency within last 1 hour)
        if device_id in ["DEV_4102", "DEV_8801"] or user_id in ["USR_2041", "USR_3099"]:
            velocity_1h = 4.0
            velocity_24h = 9.0
        else:
            velocity_1h = 1.0
            velocity_24h = 2.0
            
        # 4. Amount anomaly relative to threshold ($1,000 threshold)
        amount_anomaly = 1.0 if amount > 1000.0 else (0.5 if amount > 500.0 else 0.1)
        
        # 5. Geolocation risk prior
        geo_risk = 0.85 if location in ["Lagos", "Cayman", "Offshore"] else 0.12

        return {
            **preprocessed,
            "device_sharing_degree": device_sharing_score,
            "is_emulator": is_emulator,
            "device_risk_prior": device_risk_prior,
            "merchant_risk_prior": merchant_risk_prior,
            "velocity_1h": velocity_1h,
            "velocity_24h": velocity_24h,
            "amount_anomaly": amount_anomaly,
            "geo_risk": geo_risk
        }
