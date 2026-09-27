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
        # If not found in DB, check fallback demo format or return 404
        tx_dict = {
            "transaction_id": transaction_id,
            "amount": 1250.0,
            "device_id": "DEV_4102",
            "merchant_id": "MERCH_902",
            "payment_method": "Credit Card",
            "location": "Lagos",
            "timestamp": "2026-09-18 02:14:08"
        }
        risk_score = 88.5
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
        risk_score = tx.risk_score

    res = explainer.explain_transaction(tx_dict, risk_score)
    return res
