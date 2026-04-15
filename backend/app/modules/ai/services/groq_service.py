from app.infrastructure.external_apis.groq_client import GroqClient
from app.modules.ai.schemas import ChatBoxRequest, ChatBoxResponse, RestaurantRecommendation


class GroqService:
    """
    Service responsible for handling business logic specifically using Groq API via the GroqClient.
    """
    def __init__(self):
        """
        Initializes the GroqService with a GroqClient instance.
        """
        self.client = GroqClient()

    def process_chat(self, request: ChatBoxRequest) -> ChatBoxResponse:
        """
        Processes the incoming chat request, fetches recommendations from Groq API, 
        and maps them to strongly typed Pydantic models.

        Args:
            request (ChatBoxRequest): The incoming request payload containing the user's message.

        Returns:
            ChatBoxResponse: A structured response containing a list of RestaurantRecommendation objects.
        """
        recommendation_dicts = self.client.get_restaurant_recommendations(request.message)

        recommendations = []
        for rec in recommendation_dicts:
            recommendations.append(
                RestaurantRecommendation(
                    name=rec.get("name", "Unknown Restaurant"),
                    address=rec.get("address", "Unknown Address"),
                    reason=rec.get("reason", "")
                )
            )

        return ChatBoxResponse(recommendations=recommendations)
