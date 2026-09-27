import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Transaction
from app.schemas.transaction import TransactionOut, PredictRequest, PredictResponse
from app.ml.fraud_prediction import fraud_detector

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("", response_model=list[TransactionOut])
def get_transactions(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    is_fraud: bool = None
):
    """Retrieves paginated transactions list with optional fraud filter."""
    query = db.query(Transaction)
    if is_fraud is not None:
        query = query.filter(Transaction.is_fraud == is_fraud)
    return query.order_by(Transaction.id.desc()).offset(offset).limit(limit).all()

@router.post("/predict", response_model=PredictResponse)
def predict_fraud(payload: PredictRequest, db: Session = Depends(get_db)):
    """
    Submits a transaction for fraud evaluation.
    Evaluates using hybrid architecture (GNN + Siamese + Attention + SHAP).
    Saves prediction to database audit trail and returns response with mock/demo flag.
    """
    tx_dict = payload.model_dump()
    if not tx_dict.get("transaction_id"):
        tx_dict["transaction_id"] = f"TXN_{uuid.uuid4().hex[:6].upper()}"
    if not tx_dict.get("timestamp"):
        tx_dict["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Run inference orchestrator
    result = fraud_detector.predict(tx_dict)

    # Save to database
    try:
        new_tx = Transaction(
            transaction_id=result["transaction_id"],
            user_id=payload.user_id,
            merchant_id=payload.merchant_id,
            device_id=payload.device_id,
            amount=payload.amount,
            currency=payload.currency,
            timestamp=tx_dict["timestamp"],
            payment_method=payload.payment_method,
            location=payload.location,
            transaction_type=payload.transaction_type,
            risk_score=result["risk_score"],
            is_fraud=result["is_fraud"],
            fraud_type="Model Flagged Suspicious" if result["is_fraud"] else "Legitimate",
            explanation_summary=result["explanation"]
        )
        db.add(new_tx)
        db.commit()
        db.refresh(new_tx)
    except Exception as e:
        db.rollback()
        print(f"Warning: Could not save transaction to DB: {e}")

    return result
