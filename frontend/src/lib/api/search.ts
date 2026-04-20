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
  if (isMockDataEnabled()) {
    return new Promise((resolve) => {
      const results = filterRestaurants(
        request.concept_ids,
        request.purpose_ids,
        request.amenity_ids,
        request.budget_range_ids,
        request.query,
      );
      setTimeout(() => resolve(results), 300);
    });
  }

  try {
    const data = await apiFetch<SearchResponse>({
      path: "/search",
      method: "POST",
      body: request,
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
      message: "Khong the thuc hien tim kiem. Vui long kiem tra ket noi backend.",
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
