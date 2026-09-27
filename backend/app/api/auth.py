from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import LoginRequest, UserProfile
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=UserProfile)
def login(creds: LoginRequest):
    """
    Authenticate analyst.
    Supports demo login with analyst@fraudshield.ai or any valid demo credentials.
    """
    # Check demo credentials or accept academic test login
    email_clean = creds.email.strip().lower()
    
    if not email_clean or not creds.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required."
        )

    # Allow official demo account or test logins
    name = settings.DEMO_USER_NAME
    role = settings.DEMO_USER_ROLE
    if email_clean != settings.DEMO_USER_EMAIL.lower():
        name = email_clean.split("@")[0].capitalize() + " (Analyst)"
        role = "Fraud Investigator"

    return UserProfile(
        email=creds.email,
        name=name,
        role=role,
        is_demo=True,
        token="fraudshield_jwt_demo_token_xyz987654321"
    )

@router.get("/me", response_model=UserProfile)
def get_current_user():
    return UserProfile(
        email=settings.DEMO_USER_EMAIL,
        name=settings.DEMO_USER_NAME,
        role=settings.DEMO_USER_ROLE,
        is_demo=True,
        token="fraudshield_jwt_demo_token_xyz987654321"
    )
