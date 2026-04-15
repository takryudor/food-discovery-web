import { ChatBoxRequest, ChatBoxResponse, ApiError } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function sendChatboxMessage(
  request: ChatBoxRequest
): Promise<ChatBoxResponse> {
  const url = `${API_BASE_URL}/api/v1/ai/chatbox`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMessage = `Lỗi ${response.status}: Không thể gửi tin nhắn`;

      if (response.status === 422) {
        errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại tin nhắn.";
      } else if (response.status >= 500) {
        errorMessage = "Lỗi server. Vui lòng thử lại sau.";
      }

      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch {
        // Ignore JSON parse error
      }

      const error: ApiError = {
        message: errorMessage,
        status: response.status,
      };
      throw error;
    }

    const data: ChatBoxResponse = await response.json();
    return data;
  } catch (error) {
    if ((error as ApiError).status) {
      throw error;
    }

    // Network error
    const networkError: ApiError = {
      message: "Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.",
    };
    throw networkError;
  }
}
