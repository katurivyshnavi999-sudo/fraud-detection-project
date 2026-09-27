from pydantic import BaseModel, EmailStr
from typing import Optional

class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    email: str
    name: str
    role: str
    is_demo: bool = True
    token: str
