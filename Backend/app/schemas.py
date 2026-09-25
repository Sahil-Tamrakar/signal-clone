from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    phone_number: str
    username: str
    display_name: str
    avatar_url: Optional[str] = None
    status_text: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    is_online: bool
    last_seen: datetime

    class Config:
        from_attributes = True

# Authentication / OTP Schemas
class OTPVerifyRequest(BaseModel):
    phone_number: str
    otp: str

class CheckPhoneRequest(BaseModel):
    phone_number: str

class UserRegisterRequest(BaseModel):
    phone_number: str
    display_name: str
    username: str

# Conversation Schemas
class ConversationBase(BaseModel):
    is_group: bool
    title: Optional[str] = None
    avatar_url: Optional[str] = None

class ConversationResponse(BaseModel):
    id: int
    is_group: bool
    title: Optional[str] = None
    avatar_url: Optional[str] = None
    updated_at: Optional[datetime] = None
    other_user: Optional[UserResponse] = None
    members: Optional[List[UserResponse]] = []
    unread_count: int = 0

    class Config:
        orm_mode = True

# Message Schemas
class MessageCreate(BaseModel):
    conversation_id: int
    content: str
    reply_to_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    status: str
    reply_to_id: Optional[int] = None
    created_at: datetime
    sender: UserResponse

    class Config:
        from_attributes = True