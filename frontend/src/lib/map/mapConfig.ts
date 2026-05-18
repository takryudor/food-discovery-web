import type { LatLngTuple } from "leaflet";

/** Vietnam bounding box — keeps pan/zoom inside VN for compliance review. */
export const VIETNAM_BOUNDS: [LatLngTuple, LatLngTuple] = [
  [8.0, 102.0],
  [23.7, 109.9],
];

export type MapProvider = "osm" | "goong";

// Carto Voyager: raster basemap, commonly used when OSM default shows unwanted sea boundaries.
const DEFAULT_OSM_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const DEFAULT_OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * Map provider selection (Phase 1 — clean map / compliance).
 *
 * - Default `osm`: safe baseline for Vietnam (no Goong key required).
 * - `goong`: only when explicitly enabled AND `NEXT_PUBLIC_GOONG_MAPTILES_KEY` is set.
 */
export function getMapProvider(): MapProvider {
  const raw = (process.env.NEXT_PUBLIC_MAP_PROVIDER ?? "osm").trim().toLowerCase();
  return raw === "goong" ? "goong" : "osm";
}

export function getGoongMaptilesKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY?.trim();
  return key || undefined;
}

export function shouldUseGoongBasemap(): boolean {
  return getMapProvider() === "goong" && getGoongMaptilesKey() != null;
}

export function getOsmTileConfig(): { url: string; attribution: string } {
  return {
    url: process.env.NEXT_PUBLIC_MAP_TILE_URL?.trim() || DEFAULT_OSM_URL,
    attribution:
      process.env.NEXT_PUBLIC_MAP_ATTRIBUTION?.trim() || DEFAULT_OSM_ATTRIBUTION,
  };
}
