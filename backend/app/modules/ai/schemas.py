from pydantic import BaseModel

class ChatBoxRequest(BaseModel):
    message: str

class RestaurantRecommendation(BaseModel):
    name: str
    address: str
    reason: str

class ChatBoxResponse(BaseModel):
    recommendations: list[RestaurantRecommendation]
