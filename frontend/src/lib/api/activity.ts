import { ActivityCreate, ActivityResponse } from "@/lib/types";
import { apiFetch, isMockDataEnabled } from "@/lib/api/client";

/**
 * Gửi log hành vi người dùng lên backend.
 *
 * Quy tắc sử dụng:
 * - Luôn gọi bằng `void logActivity(...)` — KHÔNG dùng `await`
 * - Hàm này tự xử lý lỗi nội bộ, sẽ không throw ra ngoài
 * - Nếu mock data đang bật, hàm sẽ tự bỏ qua (không gọi API)
 */
export async function logActivity(payload: ActivityCreate): Promise<void> {
  // Không log khi đang chạy với mock data
  if (isMockDataEnabled()) return;

  try {
    await apiFetch<ActivityResponse>({
      path: "/activities/",
      method: "POST",
      body: payload,
    });
  } catch {
    // Silent fail — lỗi log không được ảnh hưởng UX người dùng
    console.warn("[ActivityLogger] Failed to log:", payload.action_type, payload.place_id);
  }
}