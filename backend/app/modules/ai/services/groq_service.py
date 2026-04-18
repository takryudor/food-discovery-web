from sqlalchemy.orm import Session
from app.infrastructure.external_apis.groq_client import GroqClient
from app.modules.ai.schemas import ChatBoxRequest, ChatBoxResponse, RestaurantRecommendation
from app.services.review_service import get_relevant_reviews
from app.services.search_service import search_places
from app.db.models import Place


class GroqService:
    """
    Service responsible for handling business logic specifically using Groq API via the GroqClient.
    """
    def __init__(self):
        """
        Initializes the GroqService with a GroqClient instance.
        """
        self.client = GroqClient()

    def process_chat(self, request: ChatBoxRequest, db: Session) -> ChatBoxResponse:
        """
        Processes the incoming chat request using a Hybrid Retrieval approach:
        1. Search for matching places based on keywords (Name, Location, Category).
        2. Search for relevant reviews based on sentiment/query.
        3. Send rich context to AI and enrich the final response.
        """
        # Step 1: Lấy danh sách quán tiềm năng dựa trên từ khóa (Vị trí, tên...)
        candidate_places = search_places(
            db=db,
            query=request.message,
            location=None,
            radius_km=None,
            concept_ids=[],
            purpose_ids=[],
            amenity_ids=[]
        )
        places_context = "\n".join([f"[Restaurant ID: {p['id']}] {p['name']} - Địa chỉ: {p['address']}" for p in candidate_places[:10]])

        # Step 2: Lấy các đánh giá liên quan
        reviews = get_relevant_reviews(db, request.message, limit=10)
        reviews_context = "\n".join(reviews) if reviews else "Không có đánh giá đặc thù."

        # Step 3: Tổng hợp ngữ cảnh
        full_context = (
            f"--- DANH SÁCH NHÀ HÀNG HIỆN CÓ ---\n{places_context}\n\n"
            f"--- CÁC ĐÁNH GIÁ LIÊN QUAN ---\n{reviews_context}"
        )

        # Step 4: Gửi cho AI để chọn ID và viết lý do
        ai_recommendations = self.client.get_restaurant_recommendations(request.message, context=full_context)

        recommendations = []
        for rec in ai_recommendations:
            res_id = rec.get("restaurant_id")
            reason = rec.get("reason", "")
            
            if res_id and res_id > 0:
                # Trường hợp: Quán có trong Database
                place = db.query(Place).filter(Place.id == res_id).first()
                if place:
                    recommendations.append(
                        RestaurantRecommendation(
                            name=place.name,
                            address=place.address or "Địa chỉ đang cập nhật",
                            reason=reason
                        )
                    )
            else:
                # Trường hợp: AI tự gợi ý quán ngoài Database
                name = rec.get("name", "Unknown Restaurant")
                address = rec.get("address", "Địa chỉ đang cập nhật")
                recommendations.append(
                    RestaurantRecommendation(
                        name=name,
                        address=address,
                        reason=reason
                    )
                )

        return ChatBoxResponse(recommendations=recommendations)
