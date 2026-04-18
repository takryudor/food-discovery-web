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

    def get_restaurant_recommendations(self, prompt: str) -> list[dict]:
        """
        Sends a prompt to Groq (llama3) asking for restaurant recommendations in JSON format.
        If no API key is provided, returns mock data.

        Args:
            prompt (str): The user's input/query for restaurant recommendations.

        Returns:
            list[dict]: A list of dictionaries, each containing 'name', 'address', and 'reason'.
        """
        if not self.client:
            return [
                {
                    "name": "Phở Gia Truyền Bát Đàn (Mock)",
                    "address": "49 Bát Đàn, Hoàn Kiếm, Hà Nội",
                    "reason": "Phở bò ngon, đậm vị truyền thống, là địa chỉ quen thuộc."
                },
                {
                    "name": "Quán Phở Thìn Lò Đúc (Mock)",
                    "address": "13 Lò Đúc, Hai Bà Trưng, Hà Nội",
                    "reason": "Nổi tiếng với phở bò tái lăn nhiều hành."
                }
            ]

        system_prompt = (
            "You are a helpful AI food recommendation assistant. "
            "Based on the user's message, recommend some restaurants. "
            "Respond ONLY with a JSON array containing objects with keys: "
            "'name', 'address', and 'reason'. Do not use markdown blocks like ```json. "
            "Return only the raw JSON array, nothing else."
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

