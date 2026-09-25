from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models import User, Conversation, ConversationMember, Message

def seed_database():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Clearing old data and re-seeding database...")

        # 1. Clear existing database records first so new messages apply
        db.query(Message).delete()
        db.query(ConversationMember).delete()
        db.query(Conversation).delete()
        db.query(User).delete()
        db.commit()

        # 2. Create Seed Users
        users_data = [
            {
                "phone_number": "+1234567890",
                "username": "sahil",
                "display_name": "Sahil Tamrakar",
                "status_text": "Building Signal Clone 🚀",
                "is_online": True,
            },
            {
                "phone_number": "+1983627362",
                "username": "harsh",
                "display_name": "Harsh",
                "status_text": "At work",
                "is_online": True,
            },
            {
                "phone_number": "+1122334455",
                "username": "apoorv",
                "display_name": "Apoorv Raizada",
                "status_text": "Available",
                "is_online": False,
            },
            {
                "phone_number": "+1555666777",
                "username": "shubh",
                "display_name": "Shubh",
                "status_text": "Busy",
                "is_online": False,
            },
            {
                "phone_number": "+1999000111",
                "username": "charlie",
                "display_name": "Charlie Brown",
                "status_text": "On Signal!",
                "is_online": True,
            },
        ]

        created_users = []
        for u in users_data:
            user = User(**u)
            db.add(user)
            created_users.append(user)

        db.commit()

        for u in created_users:
            db.refresh(u)

        sahil, harsh, apoorv, shubh, charlie = created_users

        # 3. Create Conversations
        conv_sahil_harsh = Conversation(is_group=False)
        conv_sahil_apoorv = Conversation(is_group=False)
        conv_group = Conversation(
            is_group=True,
            title="Signal Engineering Team",
            avatar_url=None
        )

        db.add_all([conv_sahil_harsh, conv_sahil_apoorv, conv_group])
        db.commit()

        db.refresh(conv_sahil_harsh)
        db.refresh(conv_sahil_apoorv)
        db.refresh(conv_group)

        # 4. Create Conversation Memberships
        memberships = [
            # Direct Chat: Sahil & Harsh
            ConversationMember(conversation_id=conv_sahil_harsh.id, user_id=sahil.id, is_admin=False),
            ConversationMember(conversation_id=conv_sahil_harsh.id, user_id=harsh.id, is_admin=False),
            
            # Direct Chat: Sahil & Apoorv
            ConversationMember(conversation_id=conv_sahil_apoorv.id, user_id=sahil.id, is_admin=False),
            ConversationMember(conversation_id=conv_sahil_apoorv.id, user_id=apoorv.id, is_admin=False),

            # Group Chat: Sahil (Admin), Harsh, Shubh, Charlie
            ConversationMember(conversation_id=conv_group.id, user_id=sahil.id, is_admin=True),
            ConversationMember(conversation_id=conv_group.id, user_id=harsh.id, is_admin=False),
            ConversationMember(conversation_id=conv_group.id, user_id=shubh.id, is_admin=False),
            ConversationMember(conversation_id=conv_group.id, user_id=charlie.id, is_admin=False),
        ]

        db.add_all(memberships)
        db.commit()

        # 5. Create Seed Messages
        now = datetime.utcnow()

        messages = [
            # Chat with Harsh
            Message(
                conversation_id=conv_sahil_harsh.id,
                sender_id=harsh.id,
                content="hey how are you?",
                status="read",
                created_at=now - timedelta(hours=2)
            ),
            Message(
                conversation_id=conv_sahil_harsh.id,
                sender_id=sahil.id,
                content="I'm doing great, thanks for asking! How about you?",
                status="read",
                created_at=now - timedelta(hours=1, minutes=50)
            ),
            Message(
                conversation_id=conv_sahil_harsh.id,
                sender_id=harsh.id,
                content="I'm good too! Just working on some projects.",
                status="read",
                created_at=now - timedelta(hours=1, minutes=45)
            ),
            Message(
                conversation_id=conv_sahil_harsh.id,
                sender_id=sahil.id,
                content="hi",
                status="read",
                created_at=now - timedelta(minutes=30)
            ),

            # Chat with Apoorv
            Message(
                conversation_id=conv_sahil_apoorv.id,
                sender_id=apoorv.id,
                content="Hey Sahil, did you review the latest WebSocket changes?",
                status="read",
                created_at=now - timedelta(days=1)
            ),
            Message(
                conversation_id=conv_sahil_apoorv.id,
                sender_id=sahil.id,
                content="Yes! Real-time delivery receipts are fully working now.",
                status="read",
                created_at=now - timedelta(hours=23)
            ),

            # Group Chat
            Message(
                conversation_id=conv_group.id,
                sender_id=sahil.id,
                content="Welcome everyone to the Signal Engineering Team group!",
                status="read",
                created_at=now - timedelta(days=2)
            ),
            Message(
                conversation_id=conv_group.id,
                sender_id=shubh.id,
                content="Glad to be here. UI looks super polished!",
                status="read",
                created_at=now - timedelta(days=1, hours=12)
            ),
            Message(
                conversation_id=conv_group.id,
                sender_id=charlie.id,
                content="End-to-end encryption badges are looking clean 🔒",
                status="read",
                created_at=now - timedelta(hours=5)
            ),
        ]

        db.add_all(messages)
        db.commit()

        print("Database seeded successfully with updated messages!")

    except Exception as e:
        db.rollback()
        print(f"Failed to seed database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()