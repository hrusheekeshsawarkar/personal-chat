from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Message(BaseModel):
    role: str
    content: str
    timestamp: datetime = datetime.now()

class ChatSession(BaseModel):
    id: Optional[str] = None
    agent_id: str
    messages: List[Message]
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now() 