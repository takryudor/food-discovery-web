import { ApiError, FiltersOptionsResponse } from "@/lib/types";
import { MOCK_FILTERS } from "@/lib/mockData";
import {
  apiFetch,
  isMockDataEnabled,
} from "@/lib/api/client";

export async function getFiltersOptions(): Promise<FiltersOptionsResponse> {
  if (isMockDataEnabled()) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_FILTERS), 300);
    });
  }

  try {
    const data = await apiFetch<FiltersOptionsResponse>({
      path: "/filters/options",
      method: "GET",
    });

    if (!data.concepts || !Array.isArray(data.concepts)) {
      data.concepts = [];
    }
    if (!data.purposes || !Array.isArray(data.purposes)) {
      data.purposes = [];
    }
    if (!data.amenities || !Array.isArray(data.amenities)) {
      data.amenities = [];
    }

    return data;
  } catch (error) {
    if ((error as ApiError).status) {
      throw error;
    }

    const networkError: ApiError = {
      message:
        "Khong the ket noi den server. Vui long kiem tra backend va CORS.",
    };
    throw networkError;
  }
}
