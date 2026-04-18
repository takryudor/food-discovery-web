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
            "You are provided with two types of context:\n"
            "1. --- DANH SÁCH NHÀ HÀNG HIỆN CÓ ---: This is the source of truth for restaurant existence and IDs.\n"
            "2. --- CÁC ĐÁNH GIÁ LIÊN QUAN ---: This provides sentiment and specific details about the dishes and service.\n\n"
            f"CONTEXT FROM DATABASE:\n{context}\n\n"
            "INSTRUCTIONS:\n"
            "1. Recommend maximum 3 restaurants based on the user's query.\n"
            "2. You MUST select restaurants from the 'DANH SÁCH NHÀ HÀNG HIỆN CÓ' using their 'Restaurant ID'.\n"
            "3. Use the 'CÁC ĐÁNH GIÁ LIÊN QUAN' to write a compelling 'reason' for each recommendation.\n"
            "4. If no specific reviews match, use the restaurant's general information to justify.\n"
            "5. Respond ONLY with a JSON array of objects with keys: 'restaurant_id' and 'reason'.\n"
            "6. Do not use markdown blocks. Return only raw JSON array."
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
            parsed = json.loads(raw)
            # Groq with json_object mode always returns a dict wrapper
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                # Try common wrapper keys
                for key in ("recommendations", "restaurants", "results", "data", "items"):
                    if key in parsed and isinstance(parsed[key], list):
                        return parsed[key]
                # Fallback: return the first list value found
                for val in parsed.values():
                    if isinstance(val, list):
                        return val
            logging.warning(f"[GroqClient] Could not extract list from: {parsed}")
            return []
        except json.JSONDecodeError as e:
            logging.warning(f"[GroqClient] JSON decode error: {e}, raw={raw}")
            return []

