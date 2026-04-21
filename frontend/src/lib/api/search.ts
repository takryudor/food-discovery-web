import {
  ApiError,
  FulltextSearchResponse,
  RestaurantSuggestion,
  SearchRequest,
  SearchResponse,
} from "@/lib/types";
import { filterRestaurants, searchFulltext } from "@/lib/mockData";
import {
  apiFetch,
  isMockDataEnabled,
} from "@/lib/api/client";

export async function searchRestaurants(
  request: SearchRequest,
): Promise<SearchResponse> {
  const payload: SearchRequest = {
    ...request,
    concept_ids: request.concept_ids ?? [],
    purpose_ids: request.purpose_ids ?? [],
    amenity_ids: request.amenity_ids ?? [],
    budget_range_ids: request.budget_range_ids ?? [],
  };

  if (isMockDataEnabled()) {
    return new Promise((resolve) => {
      const results = filterRestaurants(
        payload.concept_ids,
        payload.purpose_ids,
        payload.amenity_ids,
        payload.budget_range_ids,
        payload.query,
      );
      setTimeout(() => resolve(results), 300);
    });
  }

  try {
    const data = await apiFetch<SearchResponse>({
      path: "/search",
      method: "POST",
      body: payload,
    });

    if (!data.items || !Array.isArray(data.items)) {
      data.items = [];
    }

    return data;
  } catch (error) {
    if ((error as ApiError).status) {
      throw error;
    }

    const networkError: ApiError = {
      message: "Không thể thực hiện tìm kiếm. Vui lòng kiểm tra kết nối backend.",
    };
    throw networkError;
  }
}

export async function searchRestaurantsFulltext(
  query: string,
  limit: number = 8,
): Promise<RestaurantSuggestion[]> {
  if (isMockDataEnabled()) {
    return new Promise((resolve) => {
      const results = searchFulltext(query, limit);
      setTimeout(() => resolve(results), 150);
    });
  }

  try {
    const data = await apiFetch<FulltextSearchResponse>({
      path: "/restaurants/search/fulltext",
      method: "GET",
      query: {
        q: query,
        limit,
      },
    });

    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    return data.items;
  } catch {
    return [];
  }
}
