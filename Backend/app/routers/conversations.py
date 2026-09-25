from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_db
from ..models import Conversation, ConversationMember, Message, User
from ..schemas import ConversationResponse, UserResponse

router = APIRouter(prefix="/conversations", tags=["Conversations"])

class CreateDirectChatRequest(BaseModel):
    user_id: int
    target_user_id: int

class CreateGroupChatRequest(BaseModel):
    admin_id: int
    title: str
    member_ids: List[int]

@router.get("/user/{user_id}", response_model=List[ConversationResponse])
def get_user_conversations(user_id: int, db: Session = Depends(get_db)):
    # Fetch all conversations user belongs to
    memberships = db.query(ConversationMember).filter(ConversationMember.user_id == user_id).all()
    conv_ids = [m.conversation_id for m in memberships]

    conversations = db.query(Conversation).filter(Conversation.id.in_(conv_ids)).all()
    
    result = []
    for conv in conversations:
        # Get unread message count (messages not sent by user and status != 'read')
        unread_count = db.query(func.count(Message.id)).filter(
            Message.conversation_id == conv.id,
            Message.sender_id != user_id,
            Message.status != "read"
        ).scalar()

        # Find the other user for 1-on-1 chats
        other_user = None
        if not conv.is_group:
            other_member = db.query(ConversationMember).filter(
                ConversationMember.conversation_id == conv.id,
                ConversationMember.user_id != user_id
            ).first()
            if other_member:
                other_user = db.query(User).filter(User.id == other_member.user_id).first()

        result.append({
            "id": conv.id,
            "is_group": conv.is_group,
            "title": conv.title,
            "avatar_url": conv.avatar_url,
            "updated_at": conv.updated_at,
            "other_user": other_user,
            "unread_count": unread_count or 0
        })

    return result

@router.post("/direct", response_model=ConversationResponse)
def create_direct_conversation(payload: CreateDirectChatRequest, db: Session = Depends(get_db)):
    existing_memberships = db.query(ConversationMember.conversation_id).filter(
        ConversationMember.user_id.in_([payload.user_id, payload.target_user_id])
    ).all()
    
    conv_counts = {}
    for (c_id,) in existing_memberships:
        conv_counts[c_id] = conv_counts.get(c_id, 0) + 1
        if conv_counts[c_id] == 2:
            conv = db.query(Conversation).filter(Conversation.id == c_id, Conversation.is_group == False).first()
            if conv:
                conv_res = ConversationResponse.from_orm(conv)
                other_user_obj = db.query(User).filter(User.id == payload.target_user_id).first()
                if other_user_obj:
                    conv_res.other_user = UserResponse.from_orm(other_user_obj)
                return conv_res

    # Create new direct conversation
    new_conv = Conversation(is_group=False)
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)

    m1 = ConversationMember(conversation_id=new_conv.id, user_id=payload.user_id, is_admin=True)
    m2 = ConversationMember(conversation_id=new_conv.id, user_id=payload.target_user_id, is_admin=False)
    db.add_all([m1, m2])
    db.commit()

    conv_res = ConversationResponse.from_orm(new_conv)
    other_user_obj = db.query(User).filter(User.id == payload.target_user_id).first()
    if other_user_obj:
        conv_res.other_user = UserResponse.from_orm(other_user_obj)

    return conv_res

@router.post("/group", response_model=ConversationResponse)
def create_group_conversation(payload: CreateGroupChatRequest, db: Session = Depends(get_db)):
    new_conv = Conversation(is_group=True, title=payload.title)
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)

    admin_member = ConversationMember(conversation_id=new_conv.id, user_id=payload.admin_id, is_admin=True)
    db.add(admin_member)

    for uid in payload.member_ids:
        if uid != payload.admin_id:
            db.add(ConversationMember(conversation_id=new_conv.id, user_id=uid, is_admin=False))

    db.commit()
    return new_conv

# 1. GET all members of a group
@router.get("/{conversation_id}/members")
def get_group_members(conversation_id: int, db: Session = Depends(get_db)):
    memberships = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id
    ).all()
    
    result = []
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            result.append({
                "user_id": user.id,
                "display_name": user.display_name,
                "username": user.username,
                "is_admin": m.is_admin
            })
    return result

# 2. POST add a member to group (Admin only)
@router.post("/{conversation_id}/members")
def add_group_member(
    conversation_id: int, 
    user_id: int, 
    requester_id: int, 
    db: Session = Depends(get_db)
):
    # Verify requester is an admin
    requester_member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == requester_id
    ).first()

    if not requester_member or not requester_member.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can add members")

    # Check if user is already in group
    existing = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == user_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="User is already in group")

    new_member = ConversationMember(
        conversation_id=conversation_id,
        user_id=user_id,
        is_admin=False
    )
    db.add(new_member)
    db.commit()
    return {"status": "success", "message": "Member added successfully"}

# 3. DELETE remove a member from group (Admin only)
@router.delete("/{conversation_id}/members/{target_user_id}")
def remove_group_member(
    conversation_id: int, 
    target_user_id: int, 
    requester_id: int, 
    db: Session = Depends(get_db)
):
    # Verify requester is an admin
    requester_member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == requester_id
    ).first()

    if not requester_member or not requester_member.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can remove members")

    target_member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == target_user_id
    ).first()

    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found in group")

    db.delete(target_member)
    db.commit()
    return {"status": "success", "message": "Member removed successfully"}