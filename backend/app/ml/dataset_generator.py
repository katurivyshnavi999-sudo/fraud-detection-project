import math
import random
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any, List
from pathlib import Path

FEATURE_COLUMNS = [
    "amount",
    "log_amount",
    "amount_to_user_avg_ratio",
    "hour",
    "hour_sin",
    "hour_cos",
    "day_of_week",
    "is_weekend",
    "is_night",
    "payment_method_code",
    "velocity_1h",
    "velocity_24h",
    "device_sharing_degree",
    "is_emulator",
    "device_risk_prior",
    "merchant_risk_prior",
    "geo_distance_risk"
]

PAYMENT_METHODS = ["UPI", "Debit Card", "Credit Card", "Net Banking", "Wallet"]
PAYMENT_METHOD_MAP = {pm: i for i, pm in enumerate(PAYMENT_METHODS)}

CITIES = ["Mumbai", "Bengaluru", "Delhi", "Chennai", "Hyderabad", "Pune", "Kolkata"]

MERCHANTS = [
    {"id": "MERCH_101", "name": "Star Bazaar Grocery", "category": "Grocery", "risk_prior": 0.02},
    {"id": "MERCH_102", "name": "Nature Fresh Mart", "category": "Grocery", "risk_prior": 0.03},
    {"id": "MERCH_201", "name": "Taj Banquets & Dining", "category": "Dining", "risk_prior": 0.05},
    {"id": "MERCH_202", "name": "Barbeque Nation", "category": "Dining", "risk_prior": 0.04},
    {"id": "MERCH_301", "name": "Croma Electronics", "category": "Electronics", "risk_prior": 0.15},
    {"id": "MERCH_302", "name": "Reliance Digital Store", "category": "Electronics", "risk_prior": 0.22},
    {"id": "MERCH_401", "name": "Apollo Pharmacy", "category": "Healthcare", "risk_prior": 0.01},
    {"id": "MERCH_501", "name": "Shoppers Stop Retail", "category": "Apparel", "risk_prior": 0.06},
    {"id": "MERCH_660", "name": "CryptoExchange India", "category": "Cryptocurrency", "risk_prior": 0.65},
    {"id": "MERCH_771", "name": "Tanishq Jewels Online", "category": "Jewelry", "risk_prior": 0.35},
    {"id": "MERCH_902", "name": "Direct Tech Marketplace", "category": "Electronics", "risk_prior": 0.40},
    {"id": "MERCH_999", "name": "FastPay Money Remittance", "category": "Remittance", "risk_prior": 0.70},
]

def generate_synthetic_payment_dataset(
    n_samples: int = 6000,
    fraud_rate: float = 0.065,
    random_seed: int = 42
) -> pd.DataFrame:
    """
    Generates a realistic synthetic Indian digital payment dataset with behavioral,
    temporal, categorical, hardware, and relational graph topology features.
    
    Returns a pandas DataFrame ready for feature extraction and model training.
    """
    np.random.seed(random_seed)
    random.seed(random_seed)

    # 1. Establish 100 simulated user spending profiles
    n_users = 100
    user_profiles = {}
    for uid in range(1, n_users + 1):
        user_id = f"USR_{1000 + uid}"
        user_profiles[user_id] = {
            "mean_spend": np.random.uniform(500, 8000),
            "std_spend": np.random.uniform(200, 3000),
            "home_city": random.choice(CITIES),
            "preferred_method": random.choice(["UPI", "UPI", "Debit Card", "Credit Card"])
        }

    # 2. Establish 150 simulated hardware devices
    n_devices = 150
    devices = {}
    for did in range(1, n_devices + 1):
        dev_id = f"DEV_{2000 + did}"
        is_emul = np.random.random() < 0.06
        sharing = np.random.choice([1, 2, 3, 5], p=[0.82, 0.12, 0.04, 0.02])
        risk_prior = 0.90 if is_emul else (0.45 if sharing >= 3 else 0.05)
        devices[dev_id] = {
            "is_emulator": 1.0 if is_emul else 0.0,
            "sharing_degree": int(sharing),
            "risk_prior": risk_prior
        }

    records = []
    user_keys = list(user_profiles.keys())
    device_keys = list(devices.keys())

    n_fraud = int(n_samples * fraud_rate)
    n_legit = n_samples - n_fraud

    # Generate Legitimate Transactions
    for i in range(n_legit):
        u_id = random.choice(user_keys)
        u_prof = user_profiles[u_id]
        
        # Legitimate amount around user baseline
        amount = max(50.0, np.random.normal(u_prof["mean_spend"], u_prof["std_spend"]))
        amount = round(amount, 2)
        log_amount = round(math.log1p(amount), 4)
        amount_ratio = round(amount / max(1.0, u_prof["mean_spend"]), 4)

        # Legitimate diurnal hours (mostly 7 AM - 11 PM)
        if random.random() < 0.88:
            hour = int(np.random.normal(14, 4)) % 24
        else:
            hour = random.randint(0, 23)

        hour_sin = round(math.sin(2 * math.pi * hour / 24.0), 4)
        hour_cos = round(math.cos(2 * math.pi * hour / 24.0), 4)
        day_of_week = random.randint(0, 6)
        is_weekend = 1.0 if day_of_week >= 5 else 0.0
        is_night = 1.0 if (hour >= 23 or hour <= 5) else 0.0

        # Legitimate channels
        if random.random() < 0.65:
            pm = u_prof["preferred_method"]
        else:
            pm = random.choice(PAYMENT_METHODS)
        pm_code = PAYMENT_METHOD_MAP[pm]

        # Legitimate low velocity
        velocity_1h = float(np.random.choice([1, 2, 3], p=[0.85, 0.12, 0.03]))
        velocity_24h = float(np.random.choice([1, 2, 3, 4, 5], p=[0.50, 0.30, 0.12, 0.06, 0.02]))

        # Normal authentic hardware
        dev_id = random.choice(device_keys[:130])  # authentic devices
        dev_info = devices[dev_id]

        # Authentic merchants (mostly grocery/dining/healthcare)
        merch = random.choice(MERCHANTS[:8])  # low-risk merchants
        geo_risk = 0.05 if random.random() < 0.9 else 0.25

        records.append({
            "transaction_id": f"TXN_LEGIT_{i+1:05d}",
            "user_id": u_id,
            "merchant_id": merch["id"],
            "device_id": dev_id,
            "amount": amount,
            "log_amount": log_amount,
            "amount_to_user_avg_ratio": amount_ratio,
            "hour": hour,
            "hour_sin": hour_sin,
            "hour_cos": hour_cos,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "is_night": is_night,
            "payment_method": pm,
            "payment_method_code": pm_code,
            "velocity_1h": velocity_1h,
            "velocity_24h": velocity_24h,
            "device_sharing_degree": dev_info["sharing_degree"],
            "is_emulator": dev_info["is_emulator"],
            "device_risk_prior": dev_info["risk_prior"],
            "merchant_risk_prior": merch["risk_prior"],
            "geo_distance_risk": geo_risk,
            "is_fraud": 0
        })

    # Generate Fraudulent Transactions (Distinct fraud modus operandi)
    for i in range(n_fraud):
        u_id = random.choice(user_keys)
        u_prof = user_profiles[u_id]

        fraud_type = random.choice(["EMULATOR_BURST", "ACCOUNT_TAKEOVER", "SYNDICATE_COLLUSION", "HIGH_VALUE_WIRE"])

        if fraud_type == "EMULATOR_BURST":
            # Rapid nocturnal attempts on rooted emulator
            amount = round(np.random.uniform(15000, 65000), 2)
            hour = random.choice([0, 1, 2, 3, 4, 23])
            velocity_1h = float(random.randint(3, 7))
            velocity_24h = float(random.randint(6, 12))
            is_emul = 1.0
            dev_sharing = random.choice([2, 3, 4])
            dev_risk = 0.95
            merch = random.choice(MERCHANTS[6:])
            pm = random.choice(["Net Banking", "Credit Card", "UPI"])

        elif fraud_type == "ACCOUNT_TAKEOVER":
            # Massive amount deviation to crypto or luxury jewelry
            amount = round(np.random.uniform(45000, 185000), 2)
            hour = random.randint(0, 23)
            velocity_1h = float(random.randint(1, 3))
            velocity_24h = float(random.randint(3, 8))
            is_emul = 1.0 if random.random() < 0.6 else 0.0
            dev_sharing = random.choice([1, 2, 3])
            dev_risk = 0.85 if is_emul else 0.50
            merch = random.choice([MERCHANTS[8], MERCHANTS[9], MERCHANTS[11]])  # Crypto, Jewelry, Remittance
            pm = random.choice(["Net Banking", "Credit Card"])

        elif fraud_type == "SYNDICATE_COLLUSION":
            # Multi-user hardware sharing syndicate
            amount = round(np.random.uniform(25000, 95000), 2)
            hour = random.choice([1, 2, 3, 14, 15, 22])
            velocity_1h = float(random.randint(2, 5))
            velocity_24h = float(random.randint(5, 14))
            is_emul = 1.0 if random.random() < 0.75 else 0.0
            dev_sharing = random.choice([3, 4, 5])
            dev_risk = 0.92
            merch = random.choice([MERCHANTS[10], MERCHANTS[11]])
            pm = random.choice(["Net Banking", "UPI", "Debit Card"])

        else:  # HIGH_VALUE_WIRE
            amount = round(np.random.uniform(85000, 240000), 2)
            hour = random.choice([2, 3, 4, 5, 23])
            velocity_1h = float(random.randint(1, 4))
            velocity_24h = float(random.randint(3, 7))
            is_emul = 1.0 if random.random() < 0.5 else 0.0
            dev_sharing = random.choice([2, 3])
            dev_risk = 0.88
            merch = MERCHANTS[11]  # Remittance
            pm = "Net Banking"

        log_amount = round(math.log1p(amount), 4)
        amount_ratio = round(amount / max(1.0, u_prof["mean_spend"]), 4)
        hour_sin = round(math.sin(2 * math.pi * hour / 24.0), 4)
        hour_cos = round(math.cos(2 * math.pi * hour / 24.0), 4)
        day_of_week = random.randint(0, 6)
        is_weekend = 1.0 if day_of_week >= 5 else 0.0
        is_night = 1.0 if (hour >= 23 or hour <= 5) else 0.0
        pm_code = PAYMENT_METHOD_MAP[pm]
        geo_risk = round(np.random.uniform(0.60, 0.95), 2)

        records.append({
            "transaction_id": f"TXN_FRAUD_{i+1:05d}",
            "user_id": u_id,
            "merchant_id": merch["id"],
            "device_id": random.choice(device_keys[-20:]),
            "amount": amount,
            "log_amount": log_amount,
            "amount_to_user_avg_ratio": amount_ratio,
            "hour": hour,
            "hour_sin": hour_sin,
            "hour_cos": hour_cos,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "is_night": is_night,
            "payment_method": pm,
            "payment_method_code": pm_code,
            "velocity_1h": velocity_1h,
            "velocity_24h": velocity_24h,
            "device_sharing_degree": dev_sharing,
            "is_emulator": is_emul,
            "device_risk_prior": dev_risk,
            "merchant_risk_prior": merch["risk_prior"],
            "geo_distance_risk": geo_risk,
            "is_fraud": 1
        })

    # Shuffle dataset
    random.shuffle(records)
    df = pd.DataFrame(records)
    return df

def get_train_test_data(
    n_samples: int = 6000,
    test_size: float = 0.20,
    random_seed: int = 42
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, List[str]]:
    """
    Generates synthetic payment transactions and splits into X_train, X_test, y_train, y_test.
    """
    df = generate_synthetic_payment_dataset(n_samples=n_samples, random_seed=random_seed)
    
    X = df[FEATURE_COLUMNS].values
    y = df["is_fraud"].values

    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_seed, stratify=y
    )
    
    return X_train, X_test, y_train, y_test, FEATURE_COLUMNS
