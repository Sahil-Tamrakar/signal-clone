from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import OTPVerifyRequest, UserRegisterRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/verify-otp")
def verify_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    if payload.otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP code. Use fixed OTP '123456'")
    
    clean_phone = payload.phone_number.strip().replace(" ", "")
    formatted_phone = clean_phone if clean_phone.startswith("+") else f"+{clean_phone}"

    user = db.query(User).filter(
        (User.phone_number == clean_phone) | 
        (User.phone_number == formatted_phone)
    ).first()

    if user:
        user.is_online = True
        db.commit()
        db.refresh(user)
        # Account exists -> Return user data
        return {"exists": True, "user": UserResponse.model_validate(user)}
    else:
        # New phone number -> Prompt profile creation in frontend
        return {"exists": False}

@router.post("/register", response_model=UserResponse)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    clean_phone = payload.phone_number.strip().replace(" ", "")
    formatted_phone = clean_phone if clean_phone.startswith("+") else f"+{clean_phone}"

    # Check for duplicate username
    clean_username = payload.username.lower().strip()
    if db.query(User).filter(User.username == clean_username).first():
        raise HTTPException(status_code=400, detail="Username is already taken")

    new_user = User(
        phone_number=formatted_phone,
        display_name=payload.display_name.strip(),
        username=clean_username,
        is_online=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user