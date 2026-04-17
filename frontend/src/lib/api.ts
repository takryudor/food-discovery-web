import {
  ChatBoxRequest,
  ChatBoxResponse,
  ApiError,
  FiltersOptionsResponse,
  SearchRequest,
  SearchResponse,
  MapMarkerRequest,
  GeoJSONFeatureCollection,
  RestaurantDetail,
  FulltextSearchResponse,
  RestaurantSuggestion,
} from "./types";
import {
  MOCK_FILTERS,
  MOCK_RESTAURANTS,
  MOCK_MARKERS,
  MOCK_SUGGESTIONS,
  filterRestaurants,
  getMarkersByIds,
  searchFulltext,
  getMockRestaurantDetail,
} from "./mockData";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Flag để bật/tắt mock data - mặc định BẬT (true) để user thấy dữ liệu ngay
// Chỉ tắt khi localStorage có giá trị "false"
const localStorageMockValue = typeof window !== "undefined" ? localStorage.getItem("USE_MOCK_DATA") : null;
let USE_MOCK_DATA = localStorageMockValue !== null
  ? localStorageMockValue === "true"
  : true; // Mặc định bật mock data

// Export function để toggle mock data từ UI
export function setUseMockData(value: boolean) {
  USE_MOCK_DATA = value;
  if (typeof window !== "undefined") {
    localStorage.setItem("USE_MOCK_DATA", value.toString());
  }
}

export function getUseMockData(): boolean {
  return USE_MOCK_DATA;
}

// Helper function to handle API errors
async function handleApiError(response: Response): Promise<never> {
  let errorMessage = `Lỗi ${response.status}: Không thể thực hiện yêu cầu`;

  if (response.status === 404) {
    errorMessage = "Không tìm thấy dữ liệu.";
  } else if (response.status === 422) {
    errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
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

// AI Chatbox API
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
      await handleApiError(response);
    }

    const data: ChatBoxResponse = await response.json();
    return data;
  } catch (error) {
    if ((error as ApiError).status) {
      throw error;
    }

    const networkError: ApiError = {
      message: "Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.",
    };
    throw networkError;
  }
}

// Filters API
export async function getFiltersOptions(): Promise<FiltersOptionsResponse> {
  const url = `${API_BASE_URL}/api/v1/filters/options`;

  // Sử dụng mock data nếu được bật
  if (USE_MOCK_DATA) {
    console.log("[MOCK] Using mock data for filters");
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_FILTERS), 300);
    });
  }

  try {
    console.log(`[API] Fetching filters from: ${url}`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(`[API] Filters response status: ${response.status}`);

    if (!response.ok) {
      await handleApiError(response);
    }

    const data: FiltersOptionsResponse = await response.json();
    console.log("[API] Filters data received:", data);

    // Kiểm tra dữ liệu trả về
    if (!data.concepts || !Array.isArray(data.concepts)) {
      console.warn("[API] Response missing concepts array, using empty array");
      data.concepts = [];
    }
    if (!data.purposes || !Array.isArray(data.purposes)) {
      console.warn("[API] Response missing purposes array, using empty array");
      data.purposes = [];
    }
    if (!data.amenities || !Array.isArray(data.amenities)) {
      console.warn("[API] Response missing amenities array, using empty array");
      data.amenities = [];
    }

    return data;
  } catch (error) {
    console.error("[API] Failed to load filters:", error);

    if ((error as ApiError).status) {
      throw error;
    }

    const networkError: ApiError = {
      message: "Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa (port 8000)\n2. CORS đã được cấu hình đúng",
    };
    throw networkError;
  }
}

// Search API
export async function searchRestaurants(
  request: SearchRequest
): Promise<SearchResponse> {
  const url = `${API_BASE_URL}/api/v1/search`;

  // Sử dụng mock data nếu được bật
  if (USE_MOCK_DATA) {
    console.log("[MOCK] Using mock data for search:", request);
    return new Promise((resolve) => {
      const results = filterRestaurants(
        request.concept_ids,
        request.purpose_ids,
        request.amenity_ids,
        request.budget_range_ids,
        request.query
      );
      setTimeout(() => resolve(results), 300);
    });
  }

  try {
    console.log(`[API] Searching restaurants:`, request);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    console.log(`[API] Search response status: ${response.status}`);

    if (!response.ok) {
      await handleApiError(response);
    }

    const data: SearchResponse = await response.json();
    console.log("[API] Search results:", data);

    // Đảm bảo items luôn là array
    if (!data.items || !Array.isArray(data.items)) {
      console.warn("[API] Response missing items array, using empty array");
      data.items = [];
    }

    return data;
  } catch (error) {
    console.error("[API] Search failed:", error);

    if ((error as ApiError).status) {
      throw error;
    }

    const networkError: ApiError = {
      message: "Không thể thực hiện tìm kiếm. Vui lòng kiểm tra kết nối backend.",
    };
    throw networkError;
  }
}

// Map Markers API
export async function getMapMarkers(
  request: MapMarkerRequest
): Promise<GeoJSONFeatureCollection> {
  const url = `${API_BASE_URL}/api/v1/map-markers`;

  // Sử dụng mock data nếu được bật
  if (USE_MOCK_DATA) {
    console.log("[MOCK] Using mock data for map markers:", request);
    return new Promise((resolve) => {
      const markers = getMarkersByIds(request.restaurant_ids);
      setTimeout(() => resolve(markers), 200);
    });
  }

  try {
    console.log(`[API] Fetching map markers:`, request);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    console.log(`[API] Map markers response status: ${response.status}`);

    if (!response.ok) {
      await handleApiError(response);
    }

    const data: GeoJSONFeatureCollection = await response.json();
    console.log("[API] Map markers received:", data);

    // Đảm bảo features luôn là array
    if (!data.features || !Array.isArray(data.features)) {
      console.warn("[API] Response missing features array, using empty array");
      data.features = [];
    }

    return data;
  } catch (error) {
    console.error("[API] Failed to load map markers:", error);

    if ((error as ApiError).status) {
      throw error;
    }

    const networkError: ApiError = {
      message: "Không thể tải markers cho bản đồ. Vui lòng kiểm tra kết nối.",
    };
    throw networkError;
  }
}

// Restaurant Detail API
export async function getRestaurantDetail(
  restaurantId: number
): Promise<RestaurantDetail> {
  const url = `${API_BASE_URL}/api/v1/restaurants/${restaurantId}`;

  // Sử dụng mock data nếu được bật
  if (USE_MOCK_DATA) {
    console.log("[MOCK] Using mock data for restaurant detail:", restaurantId);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const detail = getMockRestaurantDetail(restaurantId);
        if (detail) {
          resolve(detail);
        } else {
          const error: ApiError = {
            message: "Không tìm thấy nhà hàng.",
            status: 404,
          };
          reject(error);
        }
      }, 200);
    });
  }

  try {
    console.log(`[API] Fetching restaurant detail: ${url}`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(`[API] Restaurant detail response status: ${response.status}`);

    if (!response.ok) {
      await handleApiError(response);
    }

    const data: RestaurantDetail = await response.json();
    return data;
  } catch (error) {
    console.error("[API] Failed to load restaurant detail:", error);

    if ((error as ApiError).message) {
      throw error;
    }

    const networkError: ApiError = {
      message: "Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.",
    };
    throw networkError;
  }
}

// Fulltext Search API (Autocomplete)
export async function searchRestaurantsFulltext(
  query: string,
  limit: number = 8
): Promise<RestaurantSuggestion[]> {
  const url = `${API_BASE_URL}/api/v1/restaurants/search/fulltext?q=${encodeURIComponent(query)}&limit=${limit}`;

  // Sử dụng mock data nếu được bật
  if (USE_MOCK_DATA) {
    console.log("[MOCK] Using mock data for fulltext search:", query);
    return new Promise((resolve) => {
      const results = searchFulltext(query, limit);
      setTimeout(() => resolve(results), 150);
    });
  }

  try {
    console.log(`[API] Fulltext search: "${query}"`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(`[API] Fulltext search response status: ${response.status}`);

    if (!response.ok) {
      await handleApiError(response);
    }

    const data: FulltextSearchResponse = await response.json();
    console.log("[API] Fulltext search results:", data);

    // Đảm bảo items luôn là array
    if (!data.items || !Array.isArray(data.items)) {
      console.warn("[API] Response missing items array, using empty array");
      return [];
    }

    return data.items;
  } catch (error) {
    console.error("[API] Fulltext search failed:", error);

    if ((error as ApiError).status) {
      throw error;
    }

    // Trả về mảng rỗng thay vì throw error cho autocomplete
    return [];
  }
}
