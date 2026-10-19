from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Transaction
from app.schemas.explanation import ExplanationResponse
from app.ml.shap_explanation import ShapExplainer

router = APIRouter(prefix="/api/explanation", tags=["Explainable AI (SHAP)"])

explainer = ShapExplainer()

@router.get("/{transaction_id}", response_model=ExplanationResponse)
def get_transaction_explanation(transaction_id: str, db: Session = Depends(get_db)):
    """
    Returns SHAP-based feature attributions for a given transaction.
    Visualizes positive and negative forces acting on fraud probability.
    """
    tx = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    
    if not tx:
        # Fallback simulated transaction structure if ID not yet committed
        tx_dict = {
            "transaction_id": transaction_id,
            "amount": 42000.0,
            "device_id": "DEV_4102",
            "merchant_id": "MERCH_902",
            "payment_method": "Credit Card",
            "location": "Hyderabad",
            "timestamp": "2026-09-28 02:22:10"
        }
        risk_score = 95.0
    else:
        tx_dict = {
            "transaction_id": tx.transaction_id,
            "amount": tx.amount,
            "device_id": tx.device_id,
            "merchant_id": tx.merchant_id,
            "payment_method": tx.payment_method,
            "location": tx.location,
            "timestamp": tx.timestamp
        }
        risk_score = tx.hybrid_risk_score or 10.0

    res = explainer.explain_transaction(tx_dict, risk_score)
    return res
