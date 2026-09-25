from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User
from ..schemas import UserResponse

router = APIRouter(prefix="/contacts", tags=["Contacts"])

@router.get("/", response_model=List[UserResponse])
def get_all_contacts(db: Session = Depends(get_db)):
    """Fetch all registered users from signal.db to display in the New Chat modal."""
    return db.query(User).order_by(User.display_name.asc()).all()