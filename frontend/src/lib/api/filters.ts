import { ApiError, FiltersOptionsResponse } from "@/lib/types";
import { MOCK_FILTERS } from "@/lib/mockData";
import {
  apiFetch,
  isMockDataEnabled,
} from "@/lib/api/client";

type FilterGroupLike = {
  key?: string;
  items?: unknown;
};

function normalizeTagList(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function getGroupItems(data: unknown, key: string) {
  const groups = (data as { groups?: FilterGroupLike[] })?.groups;
  if (!Array.isArray(groups)) return [];

  const group = groups.find((item) => item?.key === key);
  return normalizeTagList(group?.items);
}

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

    data.concepts = normalizeTagList(data.concepts);
    data.purposes = normalizeTagList(data.purposes);
    data.amenities = normalizeTagList(data.amenities);
    data.budget_ranges = normalizeTagList(data.budget_ranges);

    if (data.concepts.length === 0) {
      data.concepts = getGroupItems(data, "concepts");
    }
    if (data.purposes.length === 0) {
      data.purposes = getGroupItems(data, "purposes");
    }
    if (data.amenities.length === 0) {
      data.amenities = getGroupItems(data, "amenities");
    }
    if (data.budget_ranges.length === 0) {
      data.budget_ranges = getGroupItems(data, "budget_ranges");
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
