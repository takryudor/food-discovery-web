import { ApiError, ToggleFavoriteResponse } from "@/lib/types";
import { apiFetch, isMockDataEnabled } from "@/lib/api/client";

const MOCK_FAVORITES_KEY = "foodyssey_mock_favorites";

function readMockFavorites(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MOCK_FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function writeMockFavorites(ids: number[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_FAVORITES_KEY, JSON.stringify(ids));
  }
}

export async function toggleFavorite(
  restaurantId: number,
): Promise<ToggleFavoriteResponse> {
  if (isMockDataEnabled()) {
    return new Promise((resolve) => {
      const favorites = readMockFavorites();
      let action: ToggleFavoriteResponse["action"];
      if (favorites.includes(restaurantId)) {
        favorites.splice(favorites.indexOf(restaurantId), 1);
        action = "UNFAVORITE";
      } else {
        favorites.push(restaurantId);
        action = "FAVORITE";
      }
      writeMockFavorites(favorites);
      setTimeout(
        () =>
          resolve({
            status: "success",
            action,
            favorites: [...favorites],
          }),
        150,
      );
    });
  }

  try {
    return await apiFetch<ToggleFavoriteResponse>({
      path: `/users/favorite/${restaurantId}`,
      method: "POST",
    });
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
