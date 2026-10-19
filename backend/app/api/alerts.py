from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Alert
from app.schemas.alert import AlertOut, AlertUpdate
import uuid

router = APIRouter(prefix="/api", tags=["Alerts"])

@router.get("/alerts", response_model=List[AlertOut])
def get_all_alerts(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    risk_level: Optional[str] = None,
    is_read: Optional[bool] = None
):
    """
    Admin View: Retrieves all system-wide fraud alerts.
    """
    query = db.query(Alert)
    if risk_level and risk_level.upper() != "ALL":
        query = query.filter(Alert.risk_level.ilike(risk_level))
    if is_read is not None:
        query = query.filter(Alert.is_read == is_read)

    return query.order_by(Alert.id.desc()).offset(offset).limit(limit).all()

@router.get("/user/alerts", response_model=List[AlertOut])
def get_user_alerts(
    user_id: str = Query(..., description="ID of the user whose alerts are requested"),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    is_read: Optional[bool] = None
):
    """
    User View: Strictly returns alerts for the specified user account.
    Data isolation prevents access to other users' alerts.
    """
    uid_clean = user_id.strip()
    if not uid_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id query parameter is required."
        )

    query = db.query(Alert).filter(Alert.user_id == uid_clean)
    if is_read is not None:
        query = query.filter(Alert.is_read == is_read)

    return query.order_by(Alert.id.desc()).offset(offset).limit(limit).all()

@router.patch("/alerts/{alert_id}", response_model=AlertOut)
def update_alert_status(alert_id: str, payload: AlertUpdate, db: Session = Depends(get_db)):
    """
    Updates the read status of an alert.
    """
    alert = db.query(Alert).filter(Alert.alert_id == alert_id.strip()).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_id}' not found."
        )

    if payload.is_read is not None:
        alert.is_read = payload.is_read

    db.commit()
    db.refresh(alert)
    return alert
