from app.infrastructure.external_apis.groq_client import GroqClient
from app.modules.ai.schemas import ChatBoxRequest, ChatBoxResponse, RestaurantRecommendation


class GroqService:
    def __init__(self):
        self.client = GroqClient()

    def process_chat(self, request: ChatBoxRequest) -> ChatBoxResponse:
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
