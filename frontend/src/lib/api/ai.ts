import { ChatBoxRequest, ChatBoxResponse, ApiError } from "@/lib/types";
import { apiFetch } from "@/lib/api/client";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toChatBoxResponse(data: Record<string, unknown>): ChatBoxResponse {
  const recommendations = Array.isArray(data.recommendations)
    ? data.recommendations
    : [];
  const message = typeof data.message === "string" ? data.message : undefined;

  return { recommendations, message };
}

export async function sendChatboxMessage(
  request: ChatBoxRequest,
): Promise<ChatBoxResponse> {
  try {
    const data = await apiFetch<unknown>({
      path: "/ai/chatbox",
      method: "POST",
      body: request,
    });

    if (Array.isArray(data)) {
      return { recommendations: data };
    }

    if (isObject(data) && Array.isArray(data.recommendations)) {
      return toChatBoxResponse(data);
    }

    if (isObject(data) && Array.isArray(data.items)) {
      return { recommendations: data.items };
    }

    return { recommendations: [] };
  } catch (error) {
    if ((error as ApiError).status) {
      throw error;
    }

    const networkError: ApiError = {
      message: "Loi ket noi. Vui long kiem tra mang va thu lai.",
    };
    throw networkError;
  }
}
