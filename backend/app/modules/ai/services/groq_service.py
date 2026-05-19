from sqlalchemy.orm import Session
from app.infrastructure.groq_client import GroqClient
from app.modules.ai.schemas import ChatBoxRequest, ChatBoxResponse, RestaurantRecommendation
from app.services.review_service import get_relevant_reviews
from app.services.search_service import search_places
from app.db.models import Place, User
import re
import logging


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
        # Bỏ các từ khoá chung chung không mang tính định danh món ăn/địa điểm
        stop_words = [
            "tìm", "cho", "tôi", "quán", "nhà", "hàng", "ở", "tại", "có", "nào", "ngon", 
            "rẻ", "phục", "vụ", "nhiệt", "tình", "giúp", "với", "đâu"
        ]
        pattern = r"\b(" + "|".join(stop_words) + r")\b"
        sanitized = re.sub(pattern, " ", sanitized)

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

    def _is_unsupported_location(self, text: str) -> bool:
        """
        Kiểm tra xem câu hỏi có đề cập đến các tỉnh thành khác ngoài TP.HCM hay không.
        Sử dụng Early Exit để tiết kiệm chi phí API.
        """
        unsupported_patterns = [
            r"\bhà nội\b", r"\bhanoi\b", r"\bđà nẵng\b", r"\bda nang\b",
            r"\bhải phòng\b", r"\bhai phong\b", r"\bcần thơ\b", r"\bcan tho\b",
            r"\bnha trang\b", r"\bđà lạt\b", r"\bda lat\b", r"\bvũng tàu\b", r"\bvung tau\b",
            r"\bphú quốc\b", r"\bphu quoc\b"
        ]
        # Chế độ kiểm tra đặc biệt cho Huế - tránh nhầm lẫn với món "Bún bò Huế"
        text_lower = text.lower()
        if re.search(r"\bhuế\b", text_lower):
            # Nếu có "huế" nhưng KHÔNG có "bún bò", thì có khả năng là hỏi về địa danh Huế
            if not re.search(r"\bbún bò\b", text_lower):
                return True
        
        return any(re.search(pattern, text_lower) for pattern in unsupported_patterns)

    def process_chat(self, request: ChatBoxRequest, db: Session) -> ChatBoxResponse:
        """
        Processes the incoming chat request using a Hybrid Retrieval approach:
        1. Extract structured intent (location, query) using AI.
        2. Search for matching places based on extracted intent.
        3. Search for relevant reviews based on core query.
        4. Send rich context to AI and enrich the final response.
        """
        # Early Exit: Chặn các vùng miền không hỗ trợ
        if self._is_unsupported_location(request.message):
            return ChatBoxResponse(
                recommendations=[],
                message="Data hiện tại của chúng tôi chưa hỗ trợ cho khu vực này"
            )

        # Step 1: Trích xuất Intent bằng AI
        intent = self.client.extract_intent(request.message)
        extracted_location = intent.get("location", "")
        extracted_query = intent.get("query", "")
        
        # Kết hợp location và query để search DB hiệu quả hơn
        search_query = f"{extracted_query} {extracted_location}".strip() or request.message

        # Step 2: Lấy danh sách quán tiềm năng dựa trên intent
        _, candidate_places = search_places(
            db=db,
            query=search_query,
            location=None,
            radius_km=None,
            concept_ids=[],
            purpose_ids=[],
            amenity_ids=[]
        )

        # BROADENING FALLBACK: Nếu candidate quá ít (< 5 quán), thử mở rộng search
        if len(candidate_places) < 5:
            broad_queries = []
            if extracted_query and extracted_query != search_query:
                broad_queries.append(extracted_query)
            
            if extracted_query and "huế" in extracted_query.lower():
                broad_queries.append(extracted_query.lower().replace("huế", "").strip())
            
            seen_ids = {p.get('id') if isinstance(p, dict) else p.id for p in candidate_places}
            for bq in broad_queries:
                if len(candidate_places) >= 10: break
                _, extra = search_places(db=db, query=bq, location=None, radius_km=None, concept_ids=[], purpose_ids=[], amenity_ids=[])
                for p in extra:
                    pid = p.get('id') if isinstance(p, dict) else p.id
                    if pid not in seen_ids:
                        candidate_places.append(p)
                        seen_ids.add(pid)
        
        # Lọc chỉ những quán ở TP.HCM và lấy thông tin chi tiết để làm ngữ cảnh
        hcm_places_details = []
        for p in candidate_places[:20]:
            place_id = p.get('id') if isinstance(p, dict) else p.id
            place = db.query(Place).filter(Place.id == place_id).first()
            if place and self._is_hcm_location(place.ward, place.address):
                cuisine = ", ".join([c.name for c in place.concepts] + [d.name for d in place.dishes])
                hcm_places_details.append({
                    "id": place.id,
                    "name": place.name,
                    "address": place.address,
                    "price_range": place.price_range or "Chưa cập nhật",
                    "cuisine": cuisine or "Đa dạng"
                })

        places_context = "\n".join([
            f"[ID: {p['id']}] {p['name']} - Đ/c: {p['address']} - Giá: {p['price_range']} - Món: {p['cuisine']}" 
            for p in hcm_places_details
        ])

        # Step 3: Lấy các đánh giá liên quan
        reviews = get_relevant_reviews(db, extracted_query or request.message, limit=10)
        reviews_context = "\n".join(reviews) if reviews else "Không có đánh giá đặc thù."

        # Step 4: Tổng hợp ngữ cảnh và gọi AI
        full_context = (
            f"--- DANH SÁCH NHÀ HÀNG HIỆN CÓ ---\n{places_context}\n\n"
            f"--- CÁC ĐÁNH GIÁ LIÊN QUAN ---\n{reviews_context}"
        )

        ai_recommendations = self.client.get_restaurant_recommendations(
            request.message, 
            context=full_context,
            user_location="Ho Chi Minh City",
            extracted_intent=intent
        )

        if isinstance(ai_recommendations, dict):
            if isinstance(ai_recommendations.get("recommendations"), list):
                ai_recommendations = ai_recommendations["recommendations"]
            else:
                ai_recommendations = [ai_recommendations]

        recommendations = []
        notification_message = None

        # Xử lý response từ AI
        for rec in ai_recommendations:
            if "message" in rec and "recommendations" in rec:
                notification_message = rec["message"]
                continue

            res_id = rec.get("restaurant_id")
            reason = rec.get("reason", "")
            lat = rec.get("latitude")
            lng = rec.get("longitude")

            if res_id and res_id > 0:
                place = db.query(Place).filter(Place.id == res_id).first()
                if place and self._is_hcm_location(place.ward, place.address):
                    recommendations.append(
                        RestaurantRecommendation(
                            name=place.name,
                            address=place.address or "Địa chỉ đang cập nhật",
                            reason=reason,
                            restaurant_id=res_id,
                            latitude=place.latitude if place.latitude is not None else lat,
                            longitude=place.longitude if place.longitude is not None else lng
                        )
                    )
                else:
                    matched_place = self._find_hcm_place_by_name(db, hcm_places_details, rec.get("name"))
                    if matched_place:
                        recommendations.append(
                            RestaurantRecommendation(
                                name=matched_place.name,
                                address=matched_place.address or "Địa chỉ đang cập nhật",
                                reason=reason,
                                restaurant_id=matched_place.id,
                                latitude=matched_place.latitude if matched_place.latitude is not None else lat,
                                longitude=matched_place.longitude if matched_place.longitude is not None else lng
                            )
                        )
                    elif lat and lng:
                        recommendations.append(
                            RestaurantRecommendation(
                                name=rec.get("name", "Quán ăn tại TP.HCM"),
                                address=rec.get("address") or "TP. Hồ Chí Minh",
                                reason=f"{reason} (Hiện tại thông tin của quán chưa được cập nhật)",
                                restaurant_id=0,
                                latitude=lat,
                                longitude=lng
                            )
                        )
            elif res_id == 0 or (not res_id and rec.get("name")):
                matched_place = self._find_hcm_place_by_name(db, hcm_places_details, rec.get("name"))
                if matched_place:
                    recommendations.append(
                        RestaurantRecommendation(
                            name=matched_place.name,
                            address=matched_place.address or "Địa chỉ đang cập nhật",
                            reason=reason,
                            restaurant_id=matched_place.id,
                            latitude=matched_place.latitude if matched_place.latitude is not None else lat,
                            longitude=matched_place.longitude if matched_place.longitude is not None else lng
                        )
                    )
                elif lat and lng:
                    recommendations.append(
                        RestaurantRecommendation(
                            name=rec.get("name", "Quán ăn tại TP.HCM"),
                            address=rec.get("address") or "TP. Hồ Chí Minh",
                            reason=f"{reason} (Hiện tại thông tin của quán chưa được cập nhật)",
                            restaurant_id=0,
                            latitude=lat,
                            longitude=lng
                        )
                    )

        # BỔ SUNG: Nếu AI trả về ít hơn 3 quán, hãy bổ sung cho đủ 3 từ danh sách context
        if len(recommendations) < 3 and hcm_places_details:
            seen_ids = {r.restaurant_id for r in recommendations if r.restaurant_id > 0}
            for p in hcm_places_details:
                if len(recommendations) >= 3: break
                if p['id'] not in seen_ids:
                    place = db.query(Place).filter(Place.id == p['id']).first()
                    if place:
                        recommendations.append(
                            RestaurantRecommendation(
                                name=place.name,
                                address=place.address or "Địa chỉ đang cập nhật",
                                reason="Gợi ý bổ sung từ hệ thống dựa trên yêu cầu của bạn.",
                                restaurant_id=place.id,
                                latitude=place.latitude,
                                longitude=place.longitude
                            )
                        )
                        seen_ids.add(place.id)

            if recommendations:
                notification_message = None

        if not recommendations and not notification_message:
            notification_message = "Data hiện tại của chúng tôi chưa hỗ trợ cho khu vực này"

        return ChatBoxResponse(
            recommendations=recommendations,
            message=notification_message
        )
