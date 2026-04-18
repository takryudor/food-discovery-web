from sqlalchemy.orm import Session
from app.modules.ai.services.groq_service import GroqService
from app.modules.ai.schemas import ChatBoxRequest, ChatBoxResponse


class AIFacade:
    """
    Facade design pattern implementation to provide a simplified interface 
    for AI services, shielding the routes from the underlying AI service logic.
    """
    def __init__(self):
        """
        Initializes the AIFacade with an instance of GroqService.
        """
        self.ai_service = GroqService()

    def handle_chatbox(self, request: ChatBoxRequest, db: Session) -> ChatBoxResponse:
        """
        Handles the chatbox request by delegating it to the underlying AI service.

        Args:
            request (ChatBoxRequest): The chatbox request containing the user's message.
            db (Session): The database session.

        Returns:
            ChatBoxResponse: The AI generated restaurant recommendations.
        """
        return self.ai_service.process_chat(request, db)


ai_facade = AIFacade()
