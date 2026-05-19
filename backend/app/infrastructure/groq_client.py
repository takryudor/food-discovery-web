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

    def extract_intent(self, user_query: str) -> dict:
        """
        Uses LLM to extract structured intent (location and core query) from user message.
        """
        if not self.client:
            return {"location": "", "query": user_query}

        system_prompt = (
            "Bạn là một chuyên gia phân tích ngôn ngữ tự nhiên. "
            "Nhiệm vụ của bạn là trích xuất 'địa điểm' (location) và 'từ khóa món ăn/loại hình' (query) từ câu hỏi của người dùng. "
            "Trả về DUY NHẤT một JSON object với hai khóa: 'location' và 'query'.\n"
            "Ví dụ:\n"
            "- 'các quán chay ở quận 1' -> {'location': 'quận 1', 'query': 'chay'}\n"
            "- 'tìm nhà hàng gà rán' -> {'location': '', 'query': 'gà rán'}\n"
            "- 'quán bún bò nào ngon gần đây' -> {'location': 'gần đây', 'query': 'bún bò'}\n"
            "KHÔNG giải thích, KHÔNG thêm text ngoài JSON."
        )

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_query},
                ],
                model="llama-3.1-8b-instant",
                temperature=0.0,
            )
            raw = chat_completion.choices[0].message.content
            logging.warning(f"[GroqClient] raw intent: {raw}")
            # Use regex to find JSON block in case AI adds preamble
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                # Replace single quotes with double quotes if needed (primitive fix)
                json_str = match.group().replace("'", '"')
                return json.loads(json_str)
            return {"location": "", "query": user_query}
        except Exception as e:
            logging.error(f"[GroqClient] Error extracting intent: {e}")
            return {"location": "", "query": user_query}

    def get_restaurant_recommendations(self, prompt: str, context: str = "", user_location: str = "", user_context: str = "", extracted_intent: dict = None) -> list[dict]:
        """
        Sends a prompt to Groq (llama3) asking for restaurant recommendations.
        """
        if not self.client:
            return []

        intent_info = ""
        if extracted_intent:
            intent_info = f"\nÝ ĐỊNH NGƯỜI DÙNG:\n- Địa điểm: {extracted_intent.get('location')}\n- Món ăn/Loại hình: {extracted_intent.get('query')}\n"

        user_info = f"\nTHÔNG TIN NGƯỜI DÙNG (Sở thích/Lịch sử):\n{user_context}\n" if user_context else ""

        system_prompt = (
            "Bạn là một trợ lý AI đề xuất món ăn chuyên nghiệp cho ứng dụng 'Foodyssey'. "
            "Bạn có quyền truy cập vào hai nguồn ngữ cảnh:\n"
            "1. --- DANH SÁCH NHÀ HÀNG HIỆN CÓ ---: Đây là nguồn chính. Ưu tiên đề xuất từ danh sách này.\n"
            "2. --- CÁC ĐÁNH GIÁ LIÊN QUAN ---: Sử dụng để hỗ trợ lý do giới thiệu.\n\n"
            "🌍 PHẠM VI HOẠT ĐỘNG: Web hiện chỉ hỗ trợ khu vực TP.HCM.\n\n"
            f"NGỮ CẢNH TỪ CƠ SỞ DỮ LIỆU:\n{context}\n{user_info}{intent_info}"
            "\n📋 HƯỚNG DẪN NGHIÊM NGẶT:\n"
            "1. BẮT BUỘC ĐỀ XUẤT ĐÚNG 3 NHÀ HÀNG PHÙ HỢP. Không được trả về ít hơn 3 quán trừ khi người dùng hỏi về khu vực ngoài TP.HCM.\n"
            "2. Ưu tiên đề xuất nhà hàng từ 'DANH SÁCH NHÀ HÀNG HIỆN CÓ' nếu chúng thực sự phù hợp với yêu cầu (món ăn, không gian, phong cách VÀ ĐỊA ĐIỂM).\n"
            "3. TUYỆT ĐỐI KHÔNG gượng ép đề xuất từ danh sách nếu chúng không liên quan đến yêu cầu cốt lõi.\n"
            "4. QUAN TRỌNG: Nếu danh sách hiện có không đủ 3 quán phù hợp, bạn PHẢI tự sử dụng kiến thức của mình để đề xuất thêm các quán nổi tiếng khác tại TP.HCM phù hợp với yêu cầu để ĐẢM BẢO LUÔN CÓ ĐỦ 3 KẾT QUẢ. "
            "Với các quán do bạn tự đề xuất (không có trong danh sách), BẮT BUỘC đặt 'restaurant_id': 0 và cung cấp tọa độ 'latitude', 'longitude' chính xác.\n"
            "5. Nếu người dùng hỏi về khu vực ngoài TP.HCM, hãy trả về JSON: {\"message\": \"Data hiện tại của chúng tôi chưa hỗ trợ cho khu vực này\", \"recommendations\": []}\n"
            "6. Trả lời CHỈ bằng JSON với khóa: 'restaurant_id', 'name', 'address', 'reason', 'latitude', 'longitude'. Hoặc 'message' + 'recommendations' nếu hoàn toàn không có kết quả.\n"
            "Lưu ý: Mọi quán KHÔNG nằm trong 'DANH SÁCH NHÀ HÀNG HIỆN CÓ' đều phải có 'restaurant_id': 0.\n"
            "7. KHÔNG được thêm markdown, không thêm ```json, không thêm giải thích trước/sau JSON."
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
