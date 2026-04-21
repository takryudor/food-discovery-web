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

    def get_restaurant_recommendations(self, prompt: str, context: str = "", user_location: str = "") -> list[dict]:
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
                    "reason": "Nổi tiếng với phở bò tái lăn. Đánh giá: 'Thơm mùi gừng, hành, rất đặc trưng'."
                }
            ]

        system_prompt = (
            "Bạn là một trợ lý AI đề xuất món ăn chuyên nghiệp cho ứng dụng 'Foodyssey'. "
            "Bạn có quyền truy cập vào hai nguồn ngữ cảnh:\n"
            "1. --- DANH SÁCH NHÀ HÀNG HIỆN CÓ ---: Đây là nguồn chính. Chỉ đề xuất từ danh sách này.\n"
            "2. --- CÁC ĐÁNH GIÁ LIÊN QUAN ---: Sử dụng để hỗ trợ lý do giới thiệu.\n\n"
            "🌍 PHẠM VI HOẠT ĐỘNG: Web hiện chỉ hỗ trợ khu vực TP.HCM.\n\n"
            f"NGỮ CẢNH TỪ CƠ SỞ DỮ LIỆU:\n{context}\n\n"
            "📋 HƯỚNG DẪN NGHIÊM NGẶT:\n"
            "1. CHỈ đề xuất nhà hàng từ danh sách 'DANH SÁCH NHÀ HÀNG HIỆN CÓ'. Trả về 'restaurant_id' của chúng.\n"
            "2. Tối đa 3 nhà hàng cho mỗi yêu cầu.\n"
            "3. Nếu danh sách trống hoặc không có nhà hàng phù hợp, hãy trả về JSON: {\"message\": \"Data hiện tại của chúng tôi chưa hỗ trợ cho khu vực này\", \"recommendations\": []}\n"
            "4. Nếu người dùng hỏi về khu vực ngoài TP.HCM, hãy trả về JSON: {\"message\": \"Data hiện tại của chúng tôi chưa hỗ trợ cho khu vực này\", \"recommendations\": []}\n"
            "5. Trả lời CHỈ bằng JSON với khóa: 'restaurant_id', 'name', 'address', 'reason'. Hoặc 'message' + 'recommendations' nếu không có kết quả.\n"
            "6. KHÔNG được chế tạo hoặc gợi ý nhà hàng không có trong danh sách.\n"
            "7. Lý do giới thiệu phải rõ ràng, chuyên nghiệp và dựa trên đánh giá từ người dùng.\n"
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
        pretty_raw = raw
        try:
            pretty_raw = json.dumps(json.loads(raw), ensure_ascii=False, indent=2)
        except json.JSONDecodeError:
            pass
        logging.warning("[GroqClient] raw response: %s", pretty_raw)

        candidates: list[str] = []

        # 1) Ưu tiên JSON trong fenced code block ```json ... ```
        fenced = re.findall(r"```(?:json)?\s*([\s\S]*?)\s*```", raw, flags=re.IGNORECASE)
        candidates.extend([c.strip() for c in fenced if c.strip()])

        # 2) Fallback: lấy từng object JSON độc lập (non-greedy) để tránh dính 2 object + text
        object_matches = re.findall(r"\{[\s\S]*?\}", raw)
        candidates.extend([c.strip() for c in object_matches if c.strip()])

        # 3) Cuối cùng thử parse cả raw nếu model trả JSON thuần
        candidates.append(raw.strip())

        for idx, json_str in enumerate(candidates):
            try:
                parsed = json.loads(json_str)

                if isinstance(parsed, list):
                    return parsed

                if isinstance(parsed, dict):
                    # Trường hợp có message (ngoài phạm vi/không đủ dữ liệu)
                    if "message" in parsed:
                        recommendations = parsed.get("recommendations")
                        if isinstance(recommendations, list) and recommendations:
                            return recommendations
                        return [parsed]

                    # Trường hợp chuẩn: {"recommendations": [...]}
                    for key in ("recommendations", "restaurants", "results", "data", "items"):
                        value = parsed.get(key)
                        if isinstance(value, list):
                            return value

                    # Trường hợp object đơn lẻ có đủ field 1 nhà hàng
                    if "restaurant_id" in parsed:
                        return [parsed]
            except json.JSONDecodeError:
                continue

            # Nếu parse thành công nhưng không đúng schema thì thử candidate tiếp theo.
            logging.warning("[GroqClient] Parsed candidate %s but unsupported schema", idx)

        logging.warning("[GroqClient] Unable to parse usable JSON, raw=%s", raw)
        return []

