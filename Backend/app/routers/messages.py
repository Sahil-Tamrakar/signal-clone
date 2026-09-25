from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Message, ConversationMember
from ..schemas import MessageCreate, MessageResponse
from ..websocket import manager

router = APIRouter(prefix="/messages", tags=["Messages"])

# 1. GET messages for a conversation (Fixes old messages not loading)
@router.get("/{conversation_id}", response_model=List[MessageResponse])
def get_conversation_messages(conversation_id: int, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).all()
    
    return messages

# 2. POST create a new message (Fixes sending hi message)
@router.post("/", response_model=MessageResponse)
async def create_message(
    payload: MessageCreate, 
    sender_id: int, 
    db: Session = Depends(get_db)
):
    new_msg = Message(
        conversation_id=payload.conversation_id,
        sender_id=sender_id,
        content=payload.content,
        reply_to_id=payload.reply_to_id,
        status="sent"
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

# 3. PUT mark messages as read
@router.put("/read/{conversation_id}")
async def mark_messages_as_read(
    conversation_id: int, 
    user_id: int, 
    db: Session = Depends(get_db)
):
    unread_messages = db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != user_id,
        Message.status != "read"
    ).all()

    if unread_messages:
        for msg in unread_messages:
            msg.status = "read"
        db.commit()

        members = db.query(ConversationMember).filter(
            ConversationMember.conversation_id == conversation_id
        ).all()
        member_ids = [m.user_id for m in members]

        await manager.broadcast_to_users(
            {
                "type": "messages_read",
                "conversation_id": conversation_id,
                "read_by": user_id
            },
            member_ids
        )

    return {"status": "success", "updated_count": len(unread_messages)}