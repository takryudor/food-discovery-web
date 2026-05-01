import { ApiError, GeoJSONFeatureCollection, MapMarkerRequest, RouteResponse } from "@/lib/types";
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

export async function getRoute(
  restaurantId: number,
  userLat: number,
  userLng: number,
  mode: string = "driving",
): Promise<RouteResponse> {
  if (isMockDataEnabled()) {
    await new Promise((r) => setTimeout(r, 300));
    const etaMap: Record<string, number> = {
      driving: 8,
      walking: 30,
      bicycling: 12,
      transit: 20,
    };
    return {
      distance_km: 2.5,
      eta_minutes: etaMap[mode] ?? 8,
      maps_link: `https://www.google.com/maps/dir/?api=1&destination=${userLat},${userLng}&travelmode=${mode}`,
      mode,
    };
  }

  return apiFetch<RouteResponse>({
    path: `/geo/get-route/${restaurantId}?user_lat=${userLat}&user_lng=${userLng}&mode=${mode}`,
    method: "GET",
  });
}
