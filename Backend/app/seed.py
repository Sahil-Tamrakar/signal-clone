from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models import User, Conversation, ConversationMember, Message

def seed_database():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if database is already seeded
        if db.query(User).first():
            print("Database already contains data. Skipping seed process.")
            return

        print("Seeding database...")

        # 1. Create Seed Users
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
                "username": "Apoorb",
                "display_name": "Apoorv Raizada",
                "status_text": "Available",
                "is_online": False,
            },
            {
                "phone_number": "+1555666777",
                "username": "Rohan",
                "display_name": "Rohan Negi",
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

        # Refresh instances to get auto-generated IDs
        for u in created_users:
            db.refresh(u)

        sahil, harsh, alice, bob, charlie = created_users

        # 2. Create Conversations
        # Conversation 1: Direct Chat between Sahil & Harsh
        conv_sahil_harsh = Conversation(is_group=False)
        
        # Conversation 2: Direct Chat between Sahil & Alice
        conv_sahil_alice = Conversation(is_group=False)

        # Conversation 3: Group Chat ("Signal Engineering Team")
        conv_group = Conversation(
            is_group=True,
            title="Signal Engineering Team",
            avatar_url=None
        )

        db.add_all([conv_sahil_harsh, conv_sahil_alice, conv_group])
        db.commit()

        db.refresh(conv_sahil_harsh)
        db.refresh(conv_sahil_alice)
        db.refresh(conv_group)

        # 3. Create Conversation Memberships
        memberships = [
            # Direct Chat: Sahil & Harsh
            ConversationMember(conversation_id=conv_sahil_harsh.id, user_id=sahil.id, is_admin=False),
            ConversationMember(conversation_id=conv_sahil_harsh.id, user_id=harsh.id, is_admin=False),
            
            # Direct Chat: Sahil & Alice
            ConversationMember(conversation_id=conv_sahil_alice.id, user_id=sahil.id, is_admin=False),
            ConversationMember(conversation_id=conv_sahil_alice.id, user_id=alice.id, is_admin=False),

            # Group Chat: Sahil (Admin), Harsh, Bob, Charlie
            ConversationMember(conversation_id=conv_group.id, user_id=sahil.id, is_admin=True),
            ConversationMember(conversation_id=conv_group.id, user_id=harsh.id, is_admin=False),
            ConversationMember(conversation_id=conv_group.id, user_id=bob.id, is_admin=False),
            ConversationMember(conversation_id=conv_group.id, user_id=charlie.id, is_admin=False),
        ]

        db.add_all(memberships)
        db.commit()

        # 4. Create Seed Messages
        now = datetime.utcnow()

        messages = [
            # Chat with Harsh
            Message(
                conversation_id=conv_sahil_harsh.id,
                sender_id=harsh.id,
                content="aur chomu",
                status="read",
                created_at=now - timedelta(hours=2)
            ),
            Message(
                conversation_id=conv_sahil_harsh.id,
                sender_id=sahil.id,
                content="bsdk",
                status="read",
                created_at=now - timedelta(hours=1, minutes=50)
            ),
            Message(
                conversation_id=conv_sahil_harsh.id,
                sender_id=harsh.id,
                content="tmkc",
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

            # Chat with Alice
            Message(
                conversation_id=conv_sahil_alice.id,
                sender_id=alice.id,
                content="Hey Sahil, did you review the latest WebSocket changes?",
                status="read",
                created_at=now - timedelta(days=1)
            ),
            Message(
                conversation_id=conv_sahil_alice.id,
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
                sender_id=bob.id,
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

        print("Database seeded successfully with 5 users, 3 conversations, and message history!")

    except Exception as e:
        db.rollback()
        print(f"Failed to seed database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()