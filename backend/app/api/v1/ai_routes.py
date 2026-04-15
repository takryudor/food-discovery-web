from fastapi import APIRouter
from app.modules.ai.schemas import ChatBoxRequest, ChatBoxResponse
from app.modules.ai.ai_facade import ai_facade

router = APIRouter(
    prefix="/ai",
    tags=["AI Interactions"]
)

@router.post("/chatbox", response_model=ChatBoxResponse)
def chatbox(request: ChatBoxRequest):
    """
    Takes user text input and prompts Groq AI (or returns mock data)
    to recommend a list of restaurants.
    """
    return ai_facade.handle_chatbox(request)
