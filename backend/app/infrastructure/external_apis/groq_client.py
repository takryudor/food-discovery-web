from groq import Groq
import json
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

    def get_restaurant_recommendations(self, prompt: str, context: str = "") -> list[dict]:
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
            "You are a helpful AI food recommendation assistant for 'Foodyssey' app. "
            "You have access to two context sources:\n"
            "1. --- DANH SÁCH NHÀ HÀNG HIỆN CÓ ---: Use this as primary source.\n"
            "2. --- CÁC ĐÁNH GIÁ LIÊN QUAN ---: Use this for sentiment and evidence.\n\n"
            f"CONTEXT FROM DATABASE:\n{context}\n\n"
            "INSTRUCTIONS:\n"
            "1. Recommend maximum 3 restaurants based on the user's query.\n"
            "2. PRIORITIZE restaurants from the 'DANH SÁCH NHÀ HÀNG HIỆN CÓ'. Return their 'Restaurant ID'.\n"
            "3. AUTONOMY MODE: If no restaurant in the provided list matches the user's specific request (e.g., user asks for 'Xôi' but DB list only has 'Phở'), you MUST use your own internal knowledge to suggest the best real-world restaurants for that request.\n"
            "4. For autonomous suggestions (NOT in the list), return 'restaurant_id': 0 and provide the real 'name' and 'address'.\n"
            "5. Respond ONLY with a JSON array of objects with keys: 'restaurant_id', 'name', 'address', and 'reason'.\n"
            "6. Do not lie. If a restaurant in the DB list doesn't match the dish, do not suggest it for that dish."
        )

        chat_completion = self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            model="llama-3.1-8b-instant",
        )

        import logging

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
        logging.warning(f"[GroqClient] raw response: {raw}")

        try:
            # Robust parsing: Tìm khối JSON đầu tiên nếu AI trả về kèm markdown hoặc text thừa
            import re
            json_match = re.search(r'\[.*\]', raw, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                json_str = raw

            parsed = json.loads(json_str)
            
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                for key in ("recommendations", "restaurants", "results", "data", "items"):
                    if key in parsed and isinstance(parsed[key], list):
                        return parsed[key]
                for val in parsed.values():
                    if isinstance(val, list):
                        return val
            return []
        except json.JSONDecodeError as e:
            logging.warning(f"[GroqClient] JSON decode error: {e}, raw={raw}")
            return []

