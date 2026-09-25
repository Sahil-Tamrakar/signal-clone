from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, contacts, conversations, messages, websocket

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Signal Clone API", version="1.0.0")

# Setup CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from Next.js (http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],  # Allows OPTIONS, POST, GET, etc.
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(contacts.router)
app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(websocket.router)

@app.get("/")
def root():
    return {"status": "ok", "message": "Signal Messenger Backend API is running"}