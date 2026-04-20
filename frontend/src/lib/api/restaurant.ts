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
          message: "Khong tim thay nha hang.",
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
      message: "Loi ket noi. Vui long kiem tra mang va thu lai.",
    };
    throw networkError;
  }
}
