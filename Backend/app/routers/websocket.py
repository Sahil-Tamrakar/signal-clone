from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from ..websocket import manager
from ..database import get_db
from ..models import ConversationMember

router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            # Broadcast incoming message to all members in the conversation
            if data.get("type") == "send_message":
                msg = data.get("message")
                conv_id = msg.get("conversation_id")
                
                # Fetch all participants in this conversation
                members = db.query(ConversationMember).filter(ConversationMember.conversation_id == conv_id).all()
                member_ids = [m.user_id for m in members]
                
                # Broadcast real-time message payload
                await manager.broadcast_to_users(
                    {"type": "new_message", "message": msg},
                    member_ids
                )
    except WebSocketDisconnect:
        manager.disconnect(user_id)