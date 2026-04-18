from sqlalchemy.orm import Session
from app.infrastructure.external_apis.groq_client import GroqClient
from app.modules.ai.schemas import ChatBoxRequest, ChatBoxResponse, RestaurantRecommendation
from app.services.review_service import get_relevant_reviews
from app.services.search_service import search_places
from app.db.models import Place
import re


class GroqService:
    """
    Service responsible for handling business logic specifically using Groq API via the GroqClient.
    """
    def __init__(self):
        """
        Initializes the GroqService with a GroqClient instance.
        """
        self.client = GroqClient()
        # Các tên tỉnh/thành hỗ trợ - chỉ có TP.HCM
        self.supported_provinces = ["TP.HCM", "Thành phố Hồ Chí Minh", "Ho Chi Minh City", "TP HCM"]

    def _is_hcm_address(self, address: str | None) -> bool:
        if not address:
            return False
        normalized = address.lower()
        tokens = ["tp.hcm", "tp hcm", "hồ chí minh", "ho chi minh", "sai gon", "sài gòn"]
        return any(token in normalized for token in tokens)

    def _normalize_name(self, name: str | None) -> str:
        if not name:
            return ""
        return re.sub(r"\s+", " ", name.lower()).strip()

    def _sanitize_query_for_search(self, text: str) -> str:
        sanitized = (text or "").lower()
        # Bỏ bớt cụm địa danh để tăng recall cho search nội dung món ăn.
        sanitized = re.sub(r"\b(quận|quan|q\.?|phường|phuong|p\.?|tp\.?|thành phố|thanh pho|hcm|hà nội|ha noi)\b", " ", sanitized)
        sanitized = re.sub(r"\b\d+\b", " ", sanitized)
        sanitized = re.sub(r"\s+", " ", sanitized).strip()
        return sanitized

    def _find_hcm_place_by_name(self, db: Session, hcm_places: list, name: str | None):
        target = self._normalize_name(name)
        if not target:
            return None

        for item in hcm_places:
            item_name = item.get("name") if isinstance(item, dict) else getattr(item, "name", None)
            if self._normalize_name(item_name) == target:
                place_id = item.get("id") if isinstance(item, dict) else getattr(item, "id", None)
                if place_id:
                    return db.query(Place).filter(Place.id == place_id).first()

        for item in hcm_places:
            item_name = item.get("name") if isinstance(item, dict) else getattr(item, "name", None)
            normalized_item = self._normalize_name(item_name)
            if target in normalized_item or normalized_item in target:
                place_id = item.get("id") if isinstance(item, dict) else getattr(item, "id", None)
                if place_id:
                    return db.query(Place).filter(Place.id == place_id).first()

        return None

    def _is_hcm_location(self, ward, address: str | None = None) -> bool:
        """
        Kiểm tra xem địa điểm có nằm trong TP.HCM hay không.
        """
        if ward and ward.district and ward.district.province:
            province_name = ward.district.province.name.strip()
            if any(prov.lower() in province_name.lower() for prov in self.supported_provinces):
                return True
        # Fallback cho dữ liệu chưa map đủ ward/district/province.
        return self._is_hcm_address(address)

    def process_chat(self, request: ChatBoxRequest, db: Session) -> ChatBoxResponse:
        """
        Processes the incoming chat request using a Hybrid Retrieval approach:
        1. Search for matching places based on keywords (Name, Location, Category).
        2. Search for relevant reviews based on sentiment/query.
        3. Send rich context to AI and enrich the final response.
        4. Validate recommendations are from DB only (no fake restaurants).
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

        # Fallback nếu query người dùng chứa nhiều thông tin địa danh khiến search trả rỗng.
        if not candidate_places:
            relaxed_query = self._sanitize_query_for_search(request.message)
            if relaxed_query and relaxed_query != request.message.strip().lower():
                candidate_places = search_places(
                    db=db,
                    query=relaxed_query,
                    location=None,
                    radius_km=None,
                    concept_ids=[],
                    purpose_ids=[],
                    amenity_ids=[]
                )
        
        # Lọc chỉ những quán ở TP.HCM
        hcm_places = []
        for p in candidate_places[:10]:
            place_id = p.get('id') if isinstance(p, dict) else p.id
            place = db.query(Place).filter(Place.id == place_id).first()
            if place and self._is_hcm_location(place.ward, place.address):
                hcm_places.append(p)

        places_context = "\n".join([f"[Restaurant ID: {p['id']}] {p['name']} - Địa chỉ: {p['address']}" for p in hcm_places[:10]])

        # Step 2: Lấy các đánh giá liên quan
        reviews = get_relevant_reviews(db, request.message, limit=10)
        reviews_context = "\n".join(reviews) if reviews else "Không có đánh giá đặc thù."

        # Step 3: Tổng hợp ngữ cảnh
        full_context = (
            f"--- DANH SÁCH NHÀ HÀNG HIỆN CÓ ---\n{places_context}\n\n"
            f"--- CÁC ĐÁNH GIÁ LIÊN QUAN ---\n{reviews_context}"
        )

        # Step 4: Gửi cho AI để chọn ID và viết lý do
        ai_recommendations = self.client.get_restaurant_recommendations(
            request.message, 
            context=full_context,
            user_location="Ho Chi Minh City"
        )

        # Defensive normalize: phòng trường hợp client trả về dict chứa recommendations.
        if isinstance(ai_recommendations, dict):
            if isinstance(ai_recommendations.get("recommendations"), list):
                ai_recommendations = ai_recommendations["recommendations"]
            else:
                ai_recommendations = [ai_recommendations]

        recommendations = []
        notification_message = None

        # Xử lý response từ AI
        for rec in ai_recommendations:
            # Case: AI trả về message thông báo (không đủ dữ liệu hoặc ngoài TPHCM)
            if "message" in rec and "recommendations" in rec:
                notification_message = rec["message"]
                # Không thêm recommendation nào nếu có message
                continue

            res_id = rec.get("restaurant_id")
            reason = rec.get("reason", "")
            # Chỉ chấp nhận recommendations từ DB (restaurant_id > 0)
            if res_id and res_id > 0:
                place = db.query(Place).filter(Place.id == res_id).first()
                if place and self._is_hcm_location(place.ward, place.address):
                    # Quán có trong DB và ở TP.HCM
                    recommendations.append(
                        RestaurantRecommendation(
                            name=place.name,
                            address=place.address or "Địa chỉ đang cập nhật",
                            reason=reason,
                            restaurant_id=res_id  # Thêm ID để FE sử dụng nếu cần
                        )
                    )
                else:
                    if not notification_message:
                        notification_message = "Hiện tại chưa có dữ liệu về loại món ăn này trong khu vực được hỗ trợ."
            else:
                # AI tự gợi ý không có ID: thử ghép theo tên từ quán thực trong DB trước khi từ chối.
                matched_place = self._find_hcm_place_by_name(db, hcm_places, rec.get("name"))
                if matched_place:
                    recommendations.append(
                        RestaurantRecommendation(
                            name=matched_place.name,
                            address=matched_place.address or "Địa chỉ đang cập nhật",
                            reason=reason or "Gợi ý dựa trên dữ liệu có sẵn trong hệ thống.",
                            restaurant_id=matched_place.id,
                        )
                    )
                elif not notification_message:
                    notification_message = "Hiện tại chưa có đầy đủ dữ liệu để đề xuất về loại món ăn này."

        # Nếu AI không tuân thủ format nhưng search DB có kết quả, trả fallback từ DB để FE vẫn hiển thị.
        if not recommendations and hcm_places:
            for p in hcm_places[:3]:
                place_id = p.get("id") if isinstance(p, dict) else p.id
                place = db.query(Place).filter(Place.id == place_id).first()
                if not place:
                    continue
                recommendations.append(
                    RestaurantRecommendation(
                        name=place.name,
                        address=place.address or "Địa chỉ đang cập nhật",
                        reason="Gợi ý dựa trên dữ liệu có sẵn trong hệ thống.",
                        restaurant_id=place.id,
                    )
                )

            if recommendations:
                notification_message = None

        # Nếu không có recommendations thực, trả về thông báo
        if not recommendations and not notification_message:
            # Fallback: không có dữ liệu nào
            notification_message = "Hiện tại chưa có đầy đủ dữ liệu để đề xuất. Xin bạn hãy thử lại."

        return ChatBoxResponse(
            recommendations=recommendations,
            message=notification_message
        )
