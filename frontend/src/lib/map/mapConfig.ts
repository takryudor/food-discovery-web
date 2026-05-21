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
 * - Default: Goong when `NEXT_PUBLIC_GOONG_MAPTILES_KEY` is set; otherwise Carto Voyager raster.
 * - `NEXT_PUBLIC_MAP_PROVIDER=osm` forces Carto only (skips Goong even with a key).
 * - `NEXT_PUBLIC_MAP_PROVIDER=goong` requires a Goong key (same as auto).
 */
export function getMapProvider(): MapProvider {
  const explicit = process.env.NEXT_PUBLIC_MAP_PROVIDER?.trim().toLowerCase();
  if (explicit === "osm") return "osm";
  if (explicit === "goong") return "goong";
  return getGoongMaptilesKey() != null ? "goong" : "osm";
}

export function getGoongMaptilesKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY?.trim();
  return key || undefined;
}

const DEFAULT_GOONG_STYLE_URL =
  "https://tiles.goong.io/assets/goong_map_web.json";

/** Goong vector style JSON URL (optional override). */
export function getGoongStyleUrl(): string {
  return (
    process.env.NEXT_PUBLIC_GOONG_STYLE_URL?.trim() || DEFAULT_GOONG_STYLE_URL
  );
}

/** Prefer Goong vector tiles when a key is configured (unless forced to `osm`). */
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
