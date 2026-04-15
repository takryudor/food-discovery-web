// Types for AI Chatbox API

export interface RestaurantRecommendation {
  name: string;
  address: string;
  reason: string;
}

export interface ChatBoxRequest {
  message: string;
}

export interface ChatBoxResponse {
  recommendations: RestaurantRecommendation[];
}

export interface ApiError {
  message: string;
  status?: number;
}
