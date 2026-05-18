import json
import logging
import re

from groq import Groq
from app.core.config import get_settings

settings = get_settings()


class GroqClient:
    """
    Client wrapper for calling the external Groq API to retrieve AI completions.
    """
    def __init__(self):
        """
        Initializes the GroqClient. If an API key is available in the settings, 
        setup the physical Groq client. Otherwise, set it to None to use mock data.
        """
        self.api_key = settings.groq_api_key
        if self.api_key:
            self.client = Groq(api_key=self.api_key)
        else:
            self.client = None

    def get_restaurant_recommendations(self, prompt: str, context: str = "", user_location: str = "", user_context: str = "") -> list[dict]:
        """
        Sends a prompt to Groq (llama3) asking for restaurant recommendations.
        The AI focuses on reasoning and selecting the correct ID from the provided context.
        """
        if not self.client:
            return [
                {
                    "restaurant_id": 1,
                    "reason": "Phở bò ngon, đậm vị truyền thống. Người dùng khen: 'Nước dùng thanh, thịt mềm'."
                },
                {
                    "restaurant_id": 2,
                    "reason": "Nổi tiếng with phở bò tái lăn. Đánh giá: 'Thơm mùi gừng, hành, rất đặc trưng'."
                }
            ]

        user_info = f"\nTHÔNG TIN NGƯỜI DÙNG (Sở thích/Lịch sử):\n{user_context}\n" if user_context else ""

        system_prompt = (
            "Bạn là một trợ lý AI đề xuất món ăn chuyên nghiệp cho ứng dụng 'Foodyssey'. "
            "Bạn có quyền truy cập vào hai nguồn ngữ cảnh:\n"
            "1. --- DANH SÁCH NHÀ HÀNG HIỆN CÓ ---: Đây là nguồn chính. Ưu tiên đề xuất từ danh sách này.\n"
            "2. --- CÁC ĐÁNH GIÁ LIÊN QUAN ---: Sử dụng để hỗ trợ lý do giới thiệu.\n\n"
            "🌍 PHẠM VI HOẠT ĐỘNG: Web hiện chỉ hỗ trợ khu vực TP.HCM.\n\n"
            f"NGỮ CẢNH TỪ CƠ SỞ DỮ LIỆU:\n{context}\n{user_info}"
            "\n📋 HƯỚNG DẪN NGHIÊM NGẶT:\n"
            "1. Ưu tiên đề xuất nhà hàng từ 'DANH SÁCH NHÀ HÀNG HIỆN CÓ'. Trả về 'restaurant_id' của chúng.\n"
            "2. Nếu không có quán phù hợp trong danh sách nhưng bạn biết có quán khác rất nổi tiếng ở TP.HCM phù hợp với yêu cầu, bạn có thể đề xuất thêm (tối đa 2 quán ngoại lai).\n"
            "3. Với các quán KHÔNG có trong danh sách, hãy đặt 'restaurant_id': 0 và BẮT BUỘC cung cấp tọa độ 'latitude' và 'longitude' chính xác.\n"
            "4. Tối đa 3 nhà hàng tổng cộng cho mỗi yêu cầu.\n"
            "5. Nếu người dùng hỏi về khu vực ngoài TP.HCM, hãy trả về JSON: {\"message\": \"Data hiện tại của chúng tôi chưa hỗ trợ cho khu vực này\", \"recommendations\": []}\n"
            "6. Trả lời CHỈ bằng JSON với khóa: 'restaurant_id', 'name', 'address', 'reason', 'latitude', 'longitude'. Hoặc 'message' + 'recommendations' nếu không có kết quả.\n"
            "7. Lý do giới thiệu phải rõ ràng, chuyên nghiệp. Nếu là quán ngoài danh sách, hãy ghi chú thông tin dựa trên kiến thức của bạn.\n"
            "8. KHÔNG được thêm markdown, không thêm ```json, không thêm giải thích trước/sau JSON."
        )

        chat_completion = self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            model="llama-3.1-8b-instant",
            temperature=0.3,  # Giảm temperature để AI tuân thủ instruction chặt chẽ hơn
        )

        choices = getattr(chat_completion, "choices", None)
        if not choices:
            logging.warning("[GroqClient] Empty or missing choices in Groq response")
            return []

        first_choice = choices[0]
        message = getattr(first_choice, "message", None)
        raw = getattr(message, "content", None) if message is not None else None
        if raw is None:
            logging.warning("[GroqClient] Missing message content in Groq response")
            return []
        
        logging.warning("[GroqClient] raw response: %s", raw)

        results = []
        
        # 1) Thử parse toàn bộ raw trước (trường hợp AI trả về JSON array hoặc object bọc list)
        try:
            parsed = json.loads(raw.strip())
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                if "message" in parsed:
                    recommendations = parsed.get("recommendations")
                    if isinstance(recommendations, list) and recommendations:
                        return recommendations
                    return [parsed]
                for key in ("recommendations", "restaurants", "results", "data", "items"):
                    value = parsed.get(key)
                    if isinstance(value, list):
                        return value
                if "restaurant_id" in parsed:
                    return [parsed]
        except json.JSONDecodeError:
            pass

        # 2) Fallback: Trích xuất tất cả các JSON object độc lập {} từ raw
        object_matches = re.findall(r"\{[\s\S]*?\}", raw)
        for json_str in object_matches:
            try:
                parsed = json.loads(json_str.strip())
                if isinstance(parsed, dict):
                    if "message" in parsed and not parsed.get("restaurant_id"):
                        recommendations = parsed.get("recommendations")
                        if isinstance(recommendations, list):
                            results.extend(recommendations)
                        else:
                            results.append(parsed)
                    elif "restaurant_id" in parsed or "name" in parsed:
                        results.append(parsed)
            except json.JSONDecodeError:
                continue

        if results:
            unique_results = []
            seen_ids = set()
            seen_names = set()
            for r in results:
                rid = r.get("restaurant_id")
                name = r.get("name", "").lower()
                if rid and rid > 0:
                    if rid not in seen_ids:
                        unique_results.append(r)
                        seen_ids.add(rid)
                else:
                    if name not in seen_names:
                        unique_results.append(r)
                        seen_names.add(name)
            return unique_results[:3]

        logging.warning("[GroqClient] Unable to parse usable JSON from raw response")
        return []
