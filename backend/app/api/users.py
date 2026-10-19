from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import User, Transaction, Device
from app.schemas.user import UserOut
from app.schemas.transaction import TransactionOut

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("", response_model=List[UserOut])
def get_all_users(db: Session = Depends(get_db)):
    """
    Returns available user accounts for the User View account switcher.
    Does not require login or credentials.
    """
    return db.query(User).order_by(User.id.asc()).all()

@router.get("/{user_id}")
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    """
    Returns detailed profile metadata, primary device, and transaction metrics for a user account.
    """
    user = db.query(User).filter(User.user_id == user_id.strip()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User account '{user_id}' not found."
        )

    # Calculate user-specific metrics
    txns = db.query(Transaction).filter(Transaction.user_id == user.user_id).all()
    tx_count = len(txns)
    total_spent = sum(t.amount for t in txns)
    flagged_count = sum(1 for t in txns if t.hybrid_prediction in ["Suspicious", "Fraud"])

    # Find most common device used by this user
    device_counts = {}
    for t in txns:
        device_counts[t.device_id] = device_counts.get(t.device_id, 0) + 1
    primary_device_id = max(device_counts, key=device_counts.get) if device_counts else "DEV_1102"
    primary_dev = db.query(Device).filter(Device.device_id == primary_device_id).first()

    return {
        "id": user.id,
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "city": user.city,
        "account_type": user.account_type,
        "upi_vpa": user.upi_vpa,
        "risk_level": user.risk_level,
        "created_at": user.created_at.strftime("%Y-%m-%d %H:%M") if user.created_at else None,
        "primary_device": {
            "device_id": primary_dev.device_id if primary_dev else primary_device_id,
            "device_type": primary_dev.device_type if primary_dev else "Mobile Client",
            "os_name": primary_dev.os_name if primary_dev else "Android",
            "is_emulator": primary_dev.is_emulator if primary_dev else False
        },
        "stats": {
            "total_transactions": tx_count,
            "total_spent_inr": round(total_spent, 2),
            "flagged_transactions": flagged_count
        }
    }

@router.get("/{user_id}/transactions", response_model=List[TransactionOut])
def get_user_transactions_by_path(
    user_id: str,
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """Returns payment transactions strictly belonging to the specified user account."""
    from app.api.transactions import enrich_transactions
    txns = db.query(Transaction).filter(Transaction.user_id == user_id.strip()).order_by(Transaction.id.desc()).offset(offset).limit(limit).all()
    return enrich_transactions(txns, db)

