from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import User, AuditEvent
from app.auth.security import verify_password, create_access_token
from app.auth.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

class UserProfileOut(BaseModel):
    user_id: str
    username: str
    name: str
    email: str
    role: str
    account_type: str
    risk_level: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileOut

@router.post("/login", response_model=LoginResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates administrator or regular user credentials.
    Returns signed JWT access token and user profile.
    """
    uname = creds.username.strip()
    user = db.query(User).filter(
        (User.username == uname) | (User.user_id == uname) | (User.email == uname)
    ).first()

    if not user or not user.password_hash or not verify_password(creds.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({
        "sub": user.user_id,
        "username": user.username or user.user_id,
        "role": user.role,
        "name": user.name
    })

    # Log audit event
    audit = AuditEvent(
        user_id=user.user_id,
        action="USER_LOGIN",
        entity_type="user",
        entity_id=user.user_id,
        status="SUCCESS",
        details=f"User {user.user_id} ({user.role}) authenticated successfully."
    )
    db.add(audit)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user.user_id,
            "username": user.username or user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "account_type": user.account_type or "Savings",
            "risk_level": user.risk_level or "Low"
        }
    }

@router.get("/me", response_model=UserProfileOut)
def get_current_profile(current_user: User = Depends(get_current_user)):
    """Returns currently authenticated user profile."""
    return {
        "user_id": current_user.user_id,
        "username": current_user.username or current_user.user_id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "account_type": current_user.account_type or "Savings",
        "risk_level": current_user.risk_level or "Low"
    }

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logs out user and writes audit event."""
    audit = AuditEvent(
        user_id=current_user.user_id,
        action="USER_LOGOUT",
        entity_type="user",
        entity_id=current_user.user_id,
        status="SUCCESS",
        details=f"User {current_user.user_id} logged out."
    )
    db.add(audit)
    db.commit()
    return {"status": "success", "message": "Successfully logged out."}
