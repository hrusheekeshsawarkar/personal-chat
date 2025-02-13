from fastapi import APIRouter, HTTPException, Depends
from app.models.chat import ChatSession, Message
from typing import List, Optional
from openai import OpenAI
import os
from dotenv import load_dotenv
from loguru import logger
load_dotenv()

router = APIRouter()
_openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def get_chat_completion(messages: List[dict]):
        stream = _openai_client.chat.completions.create(
            model="gpt-4o-mini",
            stream=True,
            messages=messages,
        )
        # Print token usage
        # print("Token Usage:", completion.usage)
        # return completion.choices[0].message.content
        try:
            accumulated_response = ""  # Add this to accumulate the full response
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    # print(chunk.choices[0].delta.content, end="")
                    # if flag ==0:
                    #     logger.info("first completionn Time consuming: {:.4f}s".format(time.time()-completionn_time))
                    #     flag=1
                    completionn= chunk.choices[0].delta.content
                    # print(completionn)
                    yield completionn
                    # content = chunk.choices[0].delta.content
                    # accumulated_response += content  # Accumulate the response
                    # # Yield complete sentences or phrases
                    # if any(content.endswith(p) for p in ['.', '!', '?', '\n']):
                    #     yield accumulated_response
                    #     accumulated_response = ""
                
            # Yield any remaining content
            if accumulated_response:
                yield accumulated_response

        except Exception as e:
            logger.error(f"Error in generate_rag: {e}")
            yield "An error occurred while processing your request."


@router.post("/send")
async def send_message(messages: List[dict]):
    try:
        # Get agent's system prompt
        # agent = await get_agent(agent_id)
        
        # Get or create chat session
        # chat_session = await get_or_create_chat_session(chat_id, agent_id)
        
        # Add user message to history
        # user_message = Message(role="user", content=message)
        # chat_session.messages.append(user_message)
        
        # Get AI response
        # messages = [{"role": "system", "content": agent.system_prompt}] + \
                #   [{"role": m.role, "content": m.content} for m in chat_session.messages]
        
        ai_response = await get_chat_completion(messages)
        async def response_generator():
            full_response = ""
            try:
                async for chunk in get_chat_completion(messages):
                    full_response += chunk
                    yield f"data: {json.dumps({'response': chunk})}\n\n"
                    

                    
            except Exception as e:
                logger.error(f"Error in response generation: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            finally:
                yield "data: [DONE]\n\n"

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{chat_id}")
async def get_chat_history(chat_id: str):
    chat_session = await get_chat_session(chat_id)
    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return chat_session 