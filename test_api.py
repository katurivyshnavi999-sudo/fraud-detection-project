import urllib.request
import json

def test_api():
    base_url = "http://127.0.0.1:8000"
    endpoints = [
        "/",
        "/api/dashboard/stats",
        "/api/graph",
        "/api/graph/DEV_4102",
        "/api/explanation/TXN_1001",
        "/api/model/status",
        "/api/dataset/sample",
        "/api/analytics",
        "/api/project/info"
    ]

    for ep in endpoints:
        url = base_url + ep
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            print(f"[OK] GET {ep} -> Status {resp.status}")

    # Test POST Predict
    pred_url = base_url + "/api/transactions/predict"
    payload = {
        "user_id": "USR_2041",
        "merchant_id": "MERCH_902",
        "device_id": "DEV_4102",
        "amount": 1450.0,
        "payment_method": "Credit Card",
        "location": "Lagos",
        "transaction_type": "Online"
    }
    req = urllib.request.Request(
        pred_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        pred_data = json.loads(resp.read().decode())
        print(f"[OK] POST /api/transactions/predict -> Prediction: {pred_data['prediction']}, Risk Score: {pred_data['risk_score']}")

    # Test POST Model Update
    update_url = base_url + "/api/model/update"
    req = urllib.request.Request(
        update_url,
        data=json.dumps({"sample_batch_size": 500}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        up_data = json.loads(resp.read().decode())
        print(f"[OK] POST /api/model/update -> New Version: {up_data['new_version']}, Drift Index: {up_data['new_drift_index']}")

    print("\n>>> ALL 11 API ENDPOINTS AND ML PIPELINES VERIFIED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    test_api()
