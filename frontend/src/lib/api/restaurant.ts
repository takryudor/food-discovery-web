import { ApiError, RestaurantDetail } from "@/lib/types";
import { getMockRestaurantDetail } from "@/lib/mockData";
import {
  apiFetch,
  isMockDataEnabled,
} from "@/lib/api/client";

export async function getRestaurantDetail(
  restaurantId: number,
): Promise<RestaurantDetail> {
  if (isMockDataEnabled()) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const detail = getMockRestaurantDetail(restaurantId);
        if (detail) {
          resolve(detail);
          return;
        }

        const error: ApiError = {
          message: "Không tìm thấy nhà hàng.",
          status: 404,
        };
        reject(error);
      }, 200);
    });
  }

  try {
    const data = await apiFetch<RestaurantDetail>({
      path: `/restaurants/${restaurantId}`,
      method: "GET",
    });
    return data;
  } catch (error) {
    if ((error as ApiError).message) {
      throw error;
    }

    const networkError: ApiError = {
      message: "Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.",
    };
    throw networkError;
  }
}
