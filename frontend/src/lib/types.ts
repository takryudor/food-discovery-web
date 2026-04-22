// Types for AI Chatbox API

export interface RestaurantRecommendation {
  name: string;
  address: string;
  reason: string;
  restaurant_id?: number; // ID trong DB để sử dụng nếu cần
}

export interface ChatBoxRequest {
  message: string;
  language?: string;
}

export interface ChatBoxResponse {
  recommendations: RestaurantRecommendation[];
  message?: string; // Thông báo khi không đủ dữ liệu hoặc ngoài phạm vi
}

export interface ApiError {
  message: string;
  status?: number;
}

// Types for Filters API

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface FiltersOptionsResponse {
  concepts: Tag[];
  purposes: Tag[];
  amenities: Tag[];
  budget_ranges: Tag[];
}

// Types for Search API

export interface SearchRequest {
  query?: string;
  location?: {
    lat: number;
    lng: number;
  };
  radius_km?: number;
  concept_ids?: number[];
  purpose_ids?: number[];
  amenity_ids?: number[];
  budget_range_ids?: number[];
  /** "smart" (default): Postgres FTS + ts_rank; "default": ILIKE + sort by id */
  ranking?: "default" | "smart";
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: number;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  distance_km?: number | null;
  match_score: number;
}

export interface SearchResponse {
  items: SearchResult[];
  total: number;
  limit: number;
  offset: number;
}

// Types for Map Markers API

export interface MapMarkerRequest {
  restaurant_ids: number[];
  user_lat?: number;
  user_lng?: number;
}

export interface GeoJSONProperties {
  id: number;
  name: string;
  address: string;
  /** Odysseus / client-only pins — skip backend detail fetch */
  is_ai_suggestion?: boolean;
  cuisine?: string;
  rating?: number;
  price_hint?: string;
  distance?: number;
  distance_km?: number;
  eta?: number;
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: GeoJSONProperties;
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// Types for Restaurant Detail API

export interface RestaurantDetail {
  id: number;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  phone?: string;
  open_hours?: string;
  price_range?: string;
  cover_image?: string;
  concepts: Tag[];
  purposes: Tag[];
  amenities: Tag[];
}

// Types for Fulltext Search API

export interface RestaurantSuggestion {
  id: number;
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface FulltextSearchResponse {
  items: RestaurantSuggestion[];
}

// User location types

export interface UserLocation {
  lat: number;
  lng: number;
}

export type LocationStatus = "loading" | "success" | "denied" | "error";
