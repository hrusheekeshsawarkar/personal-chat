from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from app.models.chat import ChatSession, Message
from typing import List, Optional
from openai import OpenAI
import os
import json
from dotenv import load_dotenv
from loguru import logger
load_dotenv()

router = APIRouter()
_openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def get_chat_completion(messages: List[dict]):
    try:
        stream = _openai_client.chat.completions.create(
            model="gpt-4o-mini",
            stream=True,
            messages=messages,
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content

    except Exception as e:
        logger.error(f"Error in generate_rag: {e}")
        yield "An error occurred while processing your request."


@router.post("/send")
async def send_message(request: Request):
    try:
        data = await request.json()
        messages = data.get("messages", [])
        
        async def event_generator():
            try:
                async for chunk in get_chat_completion(messages):
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
            except Exception as e:
                logger.error(f"Error in event generation: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            finally:
                yield "data: [DONE]\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream"
        )

    except Exception as e:
        logger.error(f"Error in send_message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{chat_id}")
async def get_chat_history(chat_id: str):
    chat_session = await get_chat_session(chat_id)
    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return chat_session 