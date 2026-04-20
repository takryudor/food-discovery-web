import { ApiError, GeoJSONFeatureCollection, MapMarkerRequest } from "@/lib/types";
import { getMarkersByIds } from "@/lib/mockData";
import {
  apiFetch,
  isMockDataEnabled,
} from "@/lib/api/client";

export async function getMapMarkers(
  request: MapMarkerRequest,
): Promise<GeoJSONFeatureCollection> {
  if (isMockDataEnabled()) {
    return new Promise((resolve) => {
      const markers = getMarkersByIds(request.restaurant_ids);
      setTimeout(() => resolve(markers), 200);
    });
  }

  try {
    const data = await apiFetch<GeoJSONFeatureCollection>({
      path: "/map-markers",
      method: "POST",
      body: request,
    });

    if (!data.features || !Array.isArray(data.features)) {
      data.features = [];
    }

    return data;
  } catch (error) {
    if ((error as ApiError).status) {
      throw error;
    }

    const networkError: ApiError = {
      message: "Khong the tai markers cho ban do. Vui long kiem tra ket noi.",
    };
    throw networkError;
  }
}
