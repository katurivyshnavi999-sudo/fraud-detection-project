import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.database.models import Transaction, Merchant, Device, User
from app.schemas.transaction import TransactionOut, PredictRequest, PredictResponse, FeatureWeight

router = APIRouter(prefix="/api", tags=["Transactions"])

def enrich_transactions(txns: List[Transaction], db: Session) -> List[TransactionOut]:
    """Enriches transaction records with merchant names, categories, and device metadata."""
    if not txns:
        return []
    merchant_ids = {t.merchant_id for t in txns if t.merchant_id}
    device_ids = {t.device_id for t in txns if t.device_id}
    merchants = {m.merchant_id: m for m in db.query(Merchant).filter(Merchant.merchant_id.in_(merchant_ids)).all()} if merchant_ids else {}
    devices = {d.device_id: d for d in db.query(Device).filter(Device.device_id.in_(device_ids)).all()} if device_ids else {}

    results = []
    for t in txns:
        out = TransactionOut.model_validate(t)
        m = merchants.get(t.merchant_id)
        if m:
            out.merchant_name = m.name
            out.merchant_category = m.category
        d = devices.get(t.device_id)
        if d:
            out.device_type = d.device_type
        results.append(out)
    return results

@router.get("/transactions", response_model=List[TransactionOut])
def get_all_transactions(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    status: Optional[str] = None,
    payment_method: Optional[str] = None
):
    """
    Admin View: Retrieves all system-wide payment transactions with optional filtering.
    """
    query = db.query(Transaction)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Transaction.transaction_id.ilike(s)) |
            (Transaction.user_id.ilike(s)) |
            (Transaction.merchant_id.ilike(s)) |
            (Transaction.location.ilike(s))
        )

    if status and status.upper() != "ALL":
        query = query.filter(Transaction.hybrid_prediction.ilike(status))

    if payment_method and payment_method.upper() != "ALL":
        query = query.filter(Transaction.payment_method.ilike(payment_method))

    txns = query.order_by(Transaction.id.desc()).offset(offset).limit(limit).all()
    return enrich_transactions(txns, db)

@router.get("/user/transactions", response_model=List[TransactionOut])
def get_user_transactions(
    user_id: str = Query(..., description="ID of the user whose transactions are requested"),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    payment_method: Optional[str] = None
):
    """
    User View: Strictly filters transactions by user ownership.
    Never returns transactions belonging to other users.
    """
    uid_clean = user_id.strip()
    if not uid_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id query parameter is required for user transaction retrieval."
        )

    query = db.query(Transaction).filter(Transaction.user_id == uid_clean)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Transaction.transaction_id.ilike(s)) |
            (Transaction.merchant_id.ilike(s)) |
            (Transaction.location.ilike(s))
        )

    if payment_method and payment_method.upper() != "ALL":
        query = query.filter(Transaction.payment_method.ilike(payment_method))

    txns = query.order_by(Transaction.id.desc()).offset(offset).limit(limit).all()
    return enrich_transactions(txns, db)


@router.get("/transactions/stats")
def get_transaction_stats(db: Session = Depends(get_db)):
    """
    Computes summary transaction metrics from actual database records.
    """
    total = db.query(Transaction).count()
    if total == 0:
        return {
            "total_transactions": 0,
            "safe_transactions": 0,
            "suspicious_transactions": 0,
            "fraud_transactions": 0,
            "fraud_rate": 0.0,
            "average_risk_score": 0.0,
            "hourly_volume": [],
            "fraud_by_channel": [],
            "risk_distribution": [],
            "amount_distribution": [],
            "top_merchants": []
        }

    safe = db.query(Transaction).filter(Transaction.hybrid_prediction == "Safe").count()
    suspicious = db.query(Transaction).filter(Transaction.hybrid_prediction == "Suspicious").count()
    fraud = db.query(Transaction).filter(Transaction.hybrid_prediction == "Fraud").count()
    fraud_rate = (fraud / total) * 100.0 if total > 0 else 0.0

    avg_risk = db.query(func.avg(Transaction.hybrid_risk_score)).scalar() or 0.0

    # Payment channels aggregation
    channels = ["UPI", "Credit Card", "Debit Card", "Net Banking", "Wallet"]
    fraud_by_channel = []
    for c in channels:
        c_total = db.query(Transaction).filter(Transaction.payment_method == c).count()
        c_fraud = db.query(Transaction).filter(
            Transaction.payment_method == c,
            Transaction.hybrid_prediction == "Fraud"
        ).count()
        fraud_by_channel.append({"method": c, "total": c_total, "fraud_count": c_fraud})

    # Risk tiers
    risk_distribution = [
        {"tier": "Low (0-39)", "count": db.query(Transaction).filter(Transaction.hybrid_risk_score < 40).count()},
        {"tier": "Moderate (40-74)", "count": db.query(Transaction).filter(Transaction.hybrid_risk_score >= 40, Transaction.hybrid_risk_score < 75).count()},
        {"tier": "High (75-100)", "count": db.query(Transaction).filter(Transaction.hybrid_risk_score >= 75).count()},
    ]

    # Amount distribution
    amount_distribution = [
        {"range": "₹0 - ₹2k", "count": db.query(Transaction).filter(Transaction.amount < 2000).count()},
        {"range": "₹2k - ₹10k", "count": db.query(Transaction).filter(Transaction.amount >= 2000, Transaction.amount < 10000).count()},
        {"range": "₹10k - ₹50k", "count": db.query(Transaction).filter(Transaction.amount >= 10000, Transaction.amount < 50000).count()},
        {"range": "₹50k+", "count": db.query(Transaction).filter(Transaction.amount >= 50000).count()},
    ]

    return {
        "total_transactions": total,
        "safe_transactions": safe,
        "suspicious_transactions": suspicious,
        "fraud_transactions": fraud,
        "fraud_rate": round(fraud_rate, 1),
        "average_risk_score": round(float(avg_risk), 1),
        "fraud_by_channel": fraud_by_channel,
        "risk_distribution": risk_distribution,
        "amount_distribution": amount_distribution
    }

@router.get("/transactions/{transaction_id}", response_model=TransactionOut)
def get_transaction_by_id(transaction_id: str, db: Session = Depends(get_db)):
    """Retrieves a single transaction by its unique transaction_id."""
    tx = db.query(Transaction).filter(Transaction.transaction_id == transaction_id.strip()).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID '{transaction_id}' not found."
        )
    return enrich_transactions([tx], db)[0]


@router.post("/transactions", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(payload: PredictRequest, db: Session = Depends(get_db)):
    """
    Submits a new payment transaction into the pipeline.
    Computes ML score, GNN score, and Hybrid final risk score.
    Stores separate ground-truth and prediction attributes.
    """
    tx_id = payload.transaction_id or f"TXN_{uuid.uuid4().hex[:6].upper()}"
    ts = payload.timestamp or datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    dev_id = (payload.device_id.strip() if payload.device_id and payload.device_id.strip() else "DEV_UNSPECIFIED")

    # Evaluate transaction through Adaptive Hybrid Fusion Engine
    tx_dict = {
        "transaction_id": tx_id,
        "user_id": payload.user_id,
        "merchant_id": payload.merchant_id,
        "device_id": dev_id,
        "amount": payload.amount,
        "currency": payload.currency,
        "timestamp": ts,
        "payment_method": payload.payment_method,
        "location": payload.location,
        "transaction_type": payload.transaction_type
    }

    from app.ml.hybrid_fusion import hybrid_fusion_engine
    fused = hybrid_fusion_engine.fuse_transaction(tx_dict)

    ml_score = fused["modalities"]["tabular_ml"]["score"]
    gnn_score = fused["modalities"]["graph_neural_network"]["score"]
    hybrid_score = fused["hybrid_risk_score"]
    hybrid_pred = fused["hybrid_prediction"]
    is_emulator = bool(dev_id and ("DEV_4102" in dev_id or "DEV_9910" in dev_id))

    new_tx = Transaction(
        transaction_id=tx_id,
        user_id=payload.user_id,
        merchant_id=payload.merchant_id,
        device_id=dev_id,
        amount=payload.amount,
        currency=payload.currency,
        timestamp=ts,
        payment_method=payload.payment_method,
        location=payload.location,
        transaction_type=payload.transaction_type,
        ground_truth_label=is_emulator,
        ground_truth_type="Emulator Detected" if is_emulator else "Normal",
        ml_score=ml_score,
        ml_prediction="Fraud" if ml_score >= 75 else ("Suspicious" if ml_score >= 40 else "Safe"),
        gnn_score=gnn_score,
        hybrid_risk_score=hybrid_score,
        hybrid_prediction=hybrid_pred,
        model_version=fused["model_version"],
        analyst_status="Pending",
        explanation_summary=f"Risk assessed at {hybrid_score}/100. {'High velocity or device emulation detected.' if hybrid_score >= 75 else 'Verified normal behavioral payment.'}"
    )

    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    return new_tx

@router.post("/transactions/predict", response_model=PredictResponse)
def predict_transaction_endpoint(payload: PredictRequest):
    """
    Executes real-time inference on an incoming payment payload through the complete
    hybrid fusion pipeline (Tabular ML + PyG GNN + Siamese + Attention + SHAP).
    """
    from app.ml.fraud_prediction import fraud_detector
    tx_dict = payload.model_dump()
    dev_id = tx_dict.get("device_id") or "DEV_UNSPECIFIED"
    if not str(dev_id).strip():
        dev_id = "DEV_UNSPECIFIED"
    tx_dict["device_id"] = dev_id
    result = fraud_detector.predict(tx_dict)

    top_features = [
        FeatureWeight(
            feature_name=f["feature_name"],
            value=f["value"],
            contribution=f["contribution"],
            direction=f["direction"],
            description=f["description"]
        )
        for f in result.get("top_features", [])
    ]

    final_class = "Potentially suspicious" if result["hybrid_prediction"] == "Fraud" else ("Review" if result["hybrid_prediction"] == "Suspicious" else "Legitimate")

    return PredictResponse(
        transaction_id=result["transaction_id"],
        prediction=result["hybrid_prediction"],
        final_classification=final_class,
        is_fraud=result["is_fraud"],
        ml_score=result["modalities"]["tabular_ml"]["score"],
        gnn_score=result["modalities"]["graph_neural_network"]["score"],
        hybrid_risk_score=result["hybrid_risk_score"],
        hybrid_score=result["hybrid_risk_score"],
        risk_score=result["risk_score"],
        confidence=result["confidence"],
        risk_level=result["risk_level"],
        model_version=result["model_version"],
        demo_mode=bool(tx_dict.get("is_demo", False)),
        prediction_timestamp=datetime.now().isoformat(),
        top_features=top_features,
        explanation=result["explanation"],
        suggested_action=result["suggested_action"]
    )
