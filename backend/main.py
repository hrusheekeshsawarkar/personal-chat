from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from app.routes import chat
from app.config.config import Settings
import os
from dotenv import load_dotenv

load_dotenv()   

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    # app.mongodb_client = AsyncIOMotorClient(Settings.MONGODB_URL)
    app.mongodb_client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    # app.mongodb = app.mongodb_client[Settings.MONGODB_NAME]
    app.mongodb = app.mongodb_client[os.getenv("MONGODB_NAME")]

@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
# app.include_router(agents.router, prefix="/api/agents", tags=["agents"]) 

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
