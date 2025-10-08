from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import hashlib
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="LoveLetters API", description="Private messaging for couples")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"

# Helper functions
def hash_password(password: str) -> str:
    # Create a salt and hash the password using SHA-256
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{pwd_hash}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, stored_hash = hashed_password.split(":", 1)
        pwd_hash = hashlib.sha256((plain_password + salt).encode()).hexdigest()
        return pwd_hash == stored_hash
    except:
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"username": username})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def prepare_for_mongo(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    if isinstance(item, dict):
        for key, value in item.items():
            if isinstance(value, str) and key.endswith('_at'):
                try:
                    item[key] = datetime.fromisoformat(value)
                except:
                    pass
    return item

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_seen: Optional[datetime] = None

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender: str
    recipient: str
    content: str
    secret_code: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read_at: Optional[datetime] = None
    is_draft: bool = False
    is_deleted: bool = False

class MessageCreate(BaseModel):
    recipient: str
    content: str
    secret_code: Optional[str] = None
    is_draft: bool = False

class MessageUnlock(BaseModel):
    secret_code: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Health check route
@api_router.get("/")
async def root():
    return {"message": "LoveLetters API is working!", "status": "healthy"}

# Auth Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Create user
    hashed_password = hash_password(user_data.password)
    user = User(username=user_data.username)
    user_dict = prepare_for_mongo(user.dict())
    user_dict["password_hash"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.username})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"username": user_data.username})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Update last seen
    await db.users.update_one(
        {"username": user_data.username},
        {"$set": {"last_seen": datetime.now(timezone.utc).isoformat()}}
    )
    
    user_obj = User(**parse_from_mongo(user))
    access_token = create_access_token(data={"sub": user["username"]})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_obj
    )

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**parse_from_mongo(current_user))

# Message Routes
@api_router.post("/messages", response_model=Message)
async def send_message(message_data: MessageCreate, current_user: dict = Depends(get_current_user)):
    message = Message(
        sender=current_user["username"],
        recipient=message_data.recipient,
        content=message_data.content,
        secret_code=message_data.secret_code,
        is_draft=message_data.is_draft
    )
    
    message_dict = prepare_for_mongo(message.dict())
    await db.messages.insert_one(message_dict)
    
    return message

@api_router.get("/messages/inbox", response_model=List[Message])
async def get_inbox(current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find({
        "recipient": current_user["username"],
        "is_draft": False,
        "is_deleted": False
    }).sort("created_at", -1).to_list(1000)
    
    return [Message(**parse_from_mongo(msg)) for msg in messages]

@api_router.get("/messages/sent", response_model=List[Message])
async def get_sent_messages(current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find({
        "sender": current_user["username"],
        "is_draft": False,
        "is_deleted": False
    }).sort("created_at", -1).to_list(1000)
    
    return [Message(**parse_from_mongo(msg)) for msg in messages]

@api_router.get("/messages/drafts", response_model=List[Message])
async def get_drafts(current_user: dict = Depends(get_current_user)):
    drafts = await db.messages.find({
        "sender": current_user["username"],
        "is_draft": True,
        "is_deleted": False
    }).sort("created_at", -1).to_list(1000)
    
    return [Message(**parse_from_mongo(draft)) for draft in drafts]

@api_router.get("/messages/{message_id}", response_model=Message)
async def get_message(message_id: str, current_user: dict = Depends(get_current_user)):
    message = await db.messages.find_one({
        "id": message_id,
        "$or": [
            {"sender": current_user["username"]},
            {"recipient": current_user["username"]}
        ]
    })
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return Message(**parse_from_mongo(message))

@api_router.post("/messages/{message_id}/unlock")
async def unlock_message(message_id: str, unlock_data: MessageUnlock, current_user: dict = Depends(get_current_user)):
    message = await db.messages.find_one({
        "id": message_id,
        "recipient": current_user["username"]
    })
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message.get("secret_code") != unlock_data.secret_code:
        raise HTTPException(status_code=400, detail="Invalid secret code")
    
    # Mark as read
    await db.messages.update_one(
        {"id": message_id},
        {"$set": {"read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Message unlocked successfully"}

@api_router.post("/messages/{message_id}/read")
async def mark_as_read(message_id: str, current_user: dict = Depends(get_current_user)):
    await db.messages.update_one(
        {
            "id": message_id,
            "recipient": current_user["username"]
        },
        {"$set": {"read_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Message marked as read"}

@api_router.delete("/messages/{message_id}")
async def delete_message(message_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.messages.update_one(
        {
            "id": message_id,
            "$or": [
                {"sender": current_user["username"]},
                {"recipient": current_user["username"]}
            ]
        },
        {"$set": {"is_deleted": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return {"message": "Message deleted successfully"}

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user)):
    users = await db.users.find({
        "username": {"$ne": current_user["username"]}
    }).to_list(1000)
    
    return [User(**parse_from_mongo(user)) for user in users]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()