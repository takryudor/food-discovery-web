from app.modules.ai.services.groq_service import GroqService
from app.modules.ai.schemas import ChatBoxRequest, ChatBoxResponse


class AIFacade:
    def __init__(self):
        self.ai_service = GroqService()

    def handle_chatbox(self, request: ChatBoxRequest) -> ChatBoxResponse:
        return self.ai_service.process_chat(request)


ai_facade = AIFacade()
