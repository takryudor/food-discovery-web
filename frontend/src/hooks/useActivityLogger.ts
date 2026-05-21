"use client";

import { useCallback } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { logActivity } from "@/lib/api/activity";

/**
 * Hook cung cấp các hàm log hành vi người dùng.
 *
 * Cách dùng:
 *   const { logView, logSearch, logShare, logRouteRequest } = useActivityLogger();
 *
 * Quy tắc:
 * - Tất cả hàm đều là fire-and-forget: void logView(id)
 * - Nếu user chưa đăng nhập → tự động bỏ qua, không báo lỗi
 */
export function useActivityLogger() {
  const { isAuthenticated } = useAuth();

  /**
   * Gọi khi user mở xem chi tiết một quán ăn.
   * @param placeId - ID của quán trong DB
   */
  const logView = useCallback(
    (placeId: number) => {
      if (!isAuthenticated) return;
      void logActivity({
        action_type: "VIEW",
        place_id: placeId,
      });
    },
    [isAuthenticated],
  );

  /**
   * Gọi khi user thực hiện một lượt tìm kiếm.
   * @param query - Từ khóa tìm kiếm
   * @param filterCount - Số lượng bộ lọc đang được kích hoạt
   */
  const logSearch = useCallback(
    (query: string, filterCount?: number) => {
      if (!isAuthenticated) return;
      // Không log khi chuỗi tìm kiếm rỗng
      if (!query.trim()) return;
      void logActivity({
        action_type: "SEARCH",
        activity_metadata: {
          query: query.trim(),
          filter_count: filterCount ?? 0,
        },
      });
    },
    [isAuthenticated],
  );

  /**
   * Gọi khi user nhấn nút chia sẻ một quán ăn.
   * @param placeId - ID của quán
   */
  const logShare = useCallback(
    (placeId: number) => {
      if (!isAuthenticated) return;
      void logActivity({
        action_type: "SHARE",
        place_id: placeId,
      });
    },
    [isAuthenticated],
  );

  /**
   * Gọi khi user bấm "Chỉ đường" đến một quán.
   * @param placeId - ID của quán
   */
  const logRouteRequest = useCallback(
    (placeId: number) => {
      if (!isAuthenticated) return;
      void logActivity({
        action_type: "ROUTE_REQUEST",
        place_id: placeId,
      });
    },
    [isAuthenticated],
  );

  return {
    logView,
    logSearch,
    logShare,
    logRouteRequest,
  };
}