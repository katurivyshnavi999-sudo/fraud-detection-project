from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import ModelVersionRecord
from app.schemas.continual import ModelStatusResponse, SimulateUpdateRequest, SimulateUpdateResponse, ModelVersionItem
from app.ml.continual_learning import continual_engine

router = APIRouter(prefix="/api/model", tags=["Continual Learning"])

@router.get("/status", response_model=ModelStatusResponse)
def get_model_status(db: Session = Depends(get_db)):
    """Returns active model version, drift metrics, and version history."""
    payload = continual_engine.get_status_payload()
    
    # Query database for version history
    versions = db.query(ModelVersionRecord).order_by(ModelVersionRecord.id.desc()).all()
    v_items = [
        ModelVersionItem(
            version=v.version,
            samples_count=v.samples_count,
            drift_score=v.drift_score,
            is_active=v.is_active,
            description=v.description or "",
            created_at=v.created_at.strftime("%Y-%m-%d %H:%M") if v.created_at else ""
        )
        for v in versions
    ]
    
    return ModelStatusResponse(
        **payload,
        version_history=v_items
    )

@router.post("/update", response_model=SimulateUpdateResponse)
def simulate_model_update(req: SimulateUpdateRequest = None, db: Session = Depends(get_db)):
    """
    Triggers a simulated Continual Learning adaptation cycle.
    Updates model version, logs adaptation metrics, and stores to history.
    """
    res = continual_engine.adapt()
    
    # Update database versions
    try:
        # Mark previous as inactive
        db.query(ModelVersionRecord).update({ModelVersionRecord.is_active: False})
        
        # Insert new record
        new_rec = ModelVersionRecord(
            version=res["new_version"],
            samples_count=res["samples_adapted"],
            drift_score=res["new_drift_index"],
            is_active=True,
            description=f"Continual update: {req.adaptation_strategy if req else 'EWC Replay'} on {res['samples_adapted']} streaming samples."
        )
        db.add(new_rec)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Warning: Could not update DB for continual learning: {e}")

    return res
