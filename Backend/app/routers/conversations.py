from fastapi import APIRouter, Depends, HTTPException, status, Query
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


def fetch_conversations_for_user(user_id: int, db: Session):
    # 1. Query all conversation IDs the user belongs to
    memberships = db.query(ConversationMember.conversation_id).filter(
        ConversationMember.user_id == user_id
    ).all()
    conv_ids = [m[0] for m in memberships]

    if not conv_ids:
        return []

    conversations = db.query(Conversation).filter(Conversation.id.in_(conv_ids)).all()

    # 2. Fetch all members across these conversations in a single query
    all_members = (
        db.query(ConversationMember.conversation_id, User)
        .join(User, ConversationMember.user_id == User.id)
        .filter(ConversationMember.conversation_id.in_(conv_ids))
        .all()
    )

    members_by_conv = {}
    for c_id, user_obj in all_members:
        if c_id not in members_by_conv:
            members_by_conv[c_id] = []
        members_by_conv[c_id].append(user_obj)

    # 3. Fetch unread counts grouped by conversation ID in a single query
    unread_counts_raw = (
        db.query(Message.conversation_id, func.count(Message.id))
        .filter(
            Message.conversation_id.in_(conv_ids),
            Message.sender_id != user_id,
            Message.status != "read",
        )
        .group_by(Message.conversation_id)
        .all()
    )
    unread_map = {c_id: count for c_id, count in unread_counts_raw}

    result = []
    for conv in conversations:
        members_list = members_by_conv.get(conv.id, [])
        
        # Find partner user for direct chats
        other_user = None
        if not conv.is_group:
            other_user = next((m for m in members_list if m.id != user_id), None)

        result.append({
            "id": conv.id,
            "is_group": conv.is_group,
            "title": conv.title,
            "avatar_url": getattr(conv, "avatar_url", None),
            "updated_at": conv.updated_at,
            "other_user": other_user,
            "members": members_list,
            "unread_count": unread_map.get(conv.id, 0),
        })

    return result


# Route 1: GET /conversations?user_id=1
@router.get("", response_model=List[ConversationResponse])
@router.get("/", response_model=List[ConversationResponse])
def get_user_conversations_query(
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="user_id query parameter is required")
    return fetch_conversations_for_user(user_id=user_id, db=db)


# Route 2: GET /conversations/user/1
@router.get("/user/{user_id}", response_model=List[ConversationResponse])
def get_user_conversations_path(
    user_id: int,
    db: Session = Depends(get_db)
):
    return fetch_conversations_for_user(user_id=user_id, db=db)


# POST /conversations/direct
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
                other_user_obj = db.query(User).filter(User.id == payload.target_user_id).first()
                members_objs = db.query(User).filter(User.id.in_([payload.user_id, payload.target_user_id])).all()
                return {
                    "id": conv.id,
                    "is_group": conv.is_group,
                    "title": conv.title,
                    "avatar_url": getattr(conv, "avatar_url", None),
                    "updated_at": conv.updated_at,
                    "other_user": other_user_obj,
                    "members": members_objs,
                    "unread_count": 0
                }

    # Create new direct conversation
    new_conv = Conversation(is_group=False)
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)

    m1 = ConversationMember(conversation_id=new_conv.id, user_id=payload.user_id, is_admin=True)
    m2 = ConversationMember(conversation_id=new_conv.id, user_id=payload.target_user_id, is_admin=False)
    db.add_all([m1, m2])
    db.commit()

    other_user_obj = db.query(User).filter(User.id == payload.target_user_id).first()
    members_objs = db.query(User).filter(User.id.in_([payload.user_id, payload.target_user_id])).all()

    return {
        "id": new_conv.id,
        "is_group": new_conv.is_group,
        "title": new_conv.title,
        "avatar_url": getattr(new_conv, "avatar_url", None),
        "updated_at": new_conv.updated_at,
        "other_user": other_user_obj,
        "members": members_objs,
        "unread_count": 0
    }


# POST /conversations/group
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
    
    all_uids = list(set([payload.admin_id] + payload.member_ids))
    members_objs = db.query(User).filter(User.id.in_(all_uids)).all()

    return {
        "id": new_conv.id,
        "is_group": new_conv.is_group,
        "title": new_conv.title,
        "avatar_url": getattr(new_conv, "avatar_url", None),
        "updated_at": new_conv.updated_at,
        "other_user": None,
        "members": members_objs,
        "unread_count": 0
    }


# GET /conversations/{conversation_id}/members
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


# POST /conversations/{conversation_id}/members (Admin only)
@router.post("/{conversation_id}/members")
def add_group_member(
    conversation_id: int, 
    user_id: int, 
    requester_id: int, 
    db: Session = Depends(get_db)
):
    requester_member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == requester_id
    ).first()

    if not requester_member or not requester_member.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can add members")

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


# DELETE /conversations/{conversation_id}/members/{target_user_id} (Admin only)
@router.delete("/{conversation_id}/members/{target_user_id}")
def remove_group_member(
    conversation_id: int, 
    target_user_id: int, 
    requester_id: int, 
    db: Session = Depends(get_db)
):
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