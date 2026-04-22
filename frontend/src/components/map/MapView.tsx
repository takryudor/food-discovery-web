"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Home,
  Sparkles,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  RefreshCw,
  Crosshair,
  Check,
  Plus,
  Minus,
  ChevronRight,
} from "lucide-react";
import type { Map as LeafletMap } from "leaflet";
import { useLanguage } from "@/components/providers/LanguageContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import SettingsDropdown from "@/components/common/SettingsDropdown";
import OdysseusAI from "@/components/restaurant/components/OdysseusAI";
import type { SuggestedRestaurant } from "@/components/restaurant/components/OdysseusAI";
import { getFiltersOptions } from "@/lib/api/filters";
import { getMapMarkers } from "@/lib/api/geo";
import {
  getUseMockData,
  setUseMockData as setApiMockData,
} from "@/lib/api/client";
import { searchRestaurants, searchRestaurantsFulltext } from "@/lib/api/search";
import {
  Tag,
  GeoJSONFeature,
  RestaurantDetail,
  RestaurantSuggestion,
  type UserLocation,
} from "@/lib/types";
import { useFilterStore } from "@/store/filterStore";
import { useMapStore } from "@/store/mapStore";
import { useSearchStore } from "@/store/searchStore";

const PICK_LOCATION_OFFSET_PX = 44;

// Load Leaflet map only on client to avoid `window is not defined` during SSR.
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-neutral-600">Đang tải bản đồ...</p>
      </div>
    </div>
  ),
});

interface MapViewProps {
  onBackHome: () => void;
  aiRecommendations?: Array<{
    name: string;
    address: string;
    reason: string;
  }>;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}

export default function MapView({
  onBackHome,
  aiRecommendations = [],
  theme,
  onThemeChange,
}: MapViewProps) {
  const { t } = useLanguage();
  const { location: gpsLocation, status: locationStatus } = useUserLocation();
  const [manualLocation, setManualLocation] = useState<UserLocation | null>(
    null,
  );
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [isMapLocked, setIsMapLocked] = useState(false);
  const [restorableMapMarkers, setRestorableMapMarkers] =
    useState<GeoJSONFeature[] | null>(null);
  const mapLeafletRef = useRef<LeafletMap | null>(null);

  const userLocation = manualLocation ?? gpsLocation;

  const handleConfirmPickedLocation = useCallback(() => {
    const map = mapLeafletRef.current;
    if (!map) return;
    const size = map.getSize();
    const selectedPoint: [number, number] = [
      size.x / 2,
      size.y / 2 + PICK_LOCATION_OFFSET_PX,
    ];
    const c = map.containerPointToLatLng(selectedPoint);
    setManualLocation({ lat: c.lat, lng: c.lng });
    setIsSettingLocation(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    const map = mapLeafletRef.current;
    if (!map) return;
    map.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    const map = mapLeafletRef.current;
    if (!map) return;
    map.zoomOut();
  }, []);

  // Data states
  const [conceptsList, setConceptsList] = useState<Tag[]>([]);
  const [purposesList, setPurposesList] = useState<Tag[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<Tag[]>([]);
  const [budgetRangesList, setBudgetRangesList] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    selectedConcepts,
    selectedPurposes,
    selectedAmenities,
    selectedBudgetRanges,
    radius,
    numberOfPlaces,
    setRadius,
    setNumberOfPlaces,
    toggleConcept,
    togglePurpose,
    toggleAmenity,
    toggleBudgetRange,
  } = useFilterStore();
  const { searchResults, setSearchResults, clearSearchResults } = useSearchStore();
  const {
    mapMarkers,
    selectedMarkerId,
    setMapMarkers,
    setSelectedMarkerId,
    clearMapState,
  } = useMapStore();
  const [odysseusMarkers, setOdysseusMarkers] = useState<GeoJSONFeature[]>([]);

  const markersForMap = useMemo(
    () => (isMapLocked ? [] : [...mapMarkers, ...odysseusMarkers]),
    [mapMarkers, odysseusMarkers, isMapLocked],
  );

  const handleOdysseusRestaurants = useCallback(
    (rows: SuggestedRestaurant[]) => {
      const mapped: GeoJSONFeature[] = rows.map((r) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [r.lng, r.lat],
        },
        properties: {
          id: 9_000_000 + (Math.abs(r.id) % 999_999),
          name: r.name,
          address: r.address,
          is_ai_suggestion: true,
          cuisine: r.cuisine,
          rating: r.rating,
          price_hint: r.price,
        },
      }));
      setOdysseusMarkers(mapped);
    },
    [],
  );

  // UI states
  const [showFilters, setShowFilters] = useState(true);
  const [showEmptyMessage, setShowEmptyMessage] = useState(true);
  const [showAiRecommendations, setShowAiRecommendations] = useState(
    aiRecommendations.length > 0,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<
    RestaurantSuggestion[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Keep SSR and first client render consistent, then sync from localStorage on mount.
  const [useMockData, setUseMockData] = useState(true);
  const [mockSwitchMessage, setMockSwitchMessage] = useState<string | null>(
    null,
  );

  const radiusOptions = [3, 5, 8, 10];

  useEffect(() => {
    setUseMockData(getUseMockData());
  }, []);

  // Clear markers when mock mode changes
  const handleMockToggle = () => {
    const newValue = !useMockData;
    setUseMockData(newValue);
    setApiMockData(newValue);
    setIsMapLocked(false);
    setRestorableMapMarkers(null);

    clearSearchResults();
    clearMapState();

    // Show message to user
    setMockSwitchMessage(t("switchMockPrompt"));

    // Clear message after 3 seconds
    setTimeout(() => setMockSwitchMessage(null), 3000);

    // Reload filters with new setting
    loadFilters();
  };

  // Refresh/Reload map data
  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setIsMapLocked(false);
      setRestorableMapMarkers(null);
      clearSearchResults();
      clearMapState();

      // Reload filters
      await loadFilters();

      // Show filters panel
      setShowFilters(true);
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilters = useCallback(async () => {
    setIsLoadingFilters(true);
    setError(null);
    console.log("[DEBUG] Loading filters...");
    try {
      const filters = await getFiltersOptions();
      console.log("[DEBUG] Filters loaded:", filters);

      // Validate and set data
      const concepts = filters.concepts || [];
      const purposes = filters.purposes || [];
      const amenities = filters.amenities || [];
      const budgetRanges = filters.budget_ranges || [];

      console.log(
        `[DEBUG] Loaded: ${concepts.length} concepts, ${purposes.length} purposes, ${amenities.length} amenities, ${budgetRanges.length} budget ranges`,
      );

      setConceptsList(concepts);
      setPurposesList(purposes);
      setAmenitiesList(amenities);
      setBudgetRangesList(budgetRanges);

      // Warning nếu không có dữ liệu nào
      if (
        concepts.length === 0 &&
        purposes.length === 0 &&
        amenities.length === 0 &&
        budgetRanges.length === 0
      ) {
        console.warn("[DEBUG] All filter lists are empty!");
      }
    } catch (err) {
      console.error("[DEBUG] Failed to load filters:", err);
      const errorMsg = (err as Error).message || "Unknown error";
      setError(`${t("filterError")}: ${errorMsg}`);
    } finally {
      setIsLoadingFilters(false);
    }
  }, [t]);

  // Load filter options on mount.
  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  // Debounced search for autocomplete
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        try {
          const suggestions = await searchRestaurantsFulltext(
            searchQuery.trim(),
            8,
          );
          setSearchSuggestions(suggestions);
          setShowSuggestions(true);
        } catch (err) {
          // Silent fail for autocomplete
          console.error("Autocomplete error:", err);
        }
      } else {
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    setShowFilters(false);
    setShowSuggestions(false);
    setShowEmptyMessage(true);
    setIsMapLocked(false);
    setRestorableMapMarkers(null);

    try {
      console.log("[DEBUG] Starting search with params:", {
        query: searchQuery.trim() || undefined,
        location: userLocation,
        radius_km: radius,
        concept_ids: selectedConcepts.length > 0 ? selectedConcepts : undefined,
        purpose_ids: selectedPurposes.length > 0 ? selectedPurposes : undefined,
        amenity_ids:
          selectedAmenities.length > 0 ? selectedAmenities : undefined,
        budget_range_ids:
          selectedBudgetRanges.length > 0 ? selectedBudgetRanges : undefined,
        limit: numberOfPlaces,
      });

      // Search restaurants
      const response = await searchRestaurants({
        query: searchQuery.trim() || undefined,
        location: {
          lat: userLocation.lat,
          lng: userLocation.lng,
        },
        radius_km: radius,
        concept_ids: selectedConcepts.length > 0 ? selectedConcepts : undefined,
        purpose_ids: selectedPurposes.length > 0 ? selectedPurposes : undefined,
        amenity_ids:
          selectedAmenities.length > 0 ? selectedAmenities : undefined,
        budget_range_ids:
          selectedBudgetRanges.length > 0 ? selectedBudgetRanges : undefined,
        limit: numberOfPlaces,
        offset: 0,
      });

      console.log("[DEBUG] Search results:", response);
      setSearchResults(response.items);

      // Get map markers for found restaurants
      if (response.items.length > 0) {
        const restaurantIds = response.items.map((item) => item.id);
        console.log(
          "[DEBUG] Fetching markers for restaurant IDs:",
          restaurantIds,
        );

        const markers = await getMapMarkers({
          restaurant_ids: restaurantIds,
        });
        console.log("[DEBUG] Map markers received:", markers);
        setMapMarkers(markers.features);
      } else {
        console.log("[DEBUG] No search results, clearing markers");
        setMapMarkers([]);
      }
    } catch (err) {
      const debugError =
        err instanceof Error
          ? {
              name: err.name,
              message: err.message,
              stack: err.stack,
            }
          : err;

      const errorMessage =
        typeof err === "string"
          ? err
          : err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Có lỗi xảy ra khi tìm kiếm";
      console.error("[DEBUG] Search error:", debugError);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkerClick = useCallback(
    (feature: GeoJSONFeature) => {
      setSelectedMarkerId(feature.properties?.id || null);
    },
    [setSelectedMarkerId],
  );

  const handleConfirmRestaurant = useCallback(
    (restaurant: RestaurantDetail) => {
      if (!restorableMapMarkers) {
        setRestorableMapMarkers(mapMarkers);
      }
      setIsMapLocked(true);
      setSelectedMarkerId(null);
      clearMapState();
      setShowFilters(false);
      setShowSuggestions(false);
      setShowEmptyMessage(false);
      console.log("[DEBUG] Restaurant confirmed:", restaurant);
    },
    [
      clearMapState,
      mapMarkers,
      restorableMapMarkers,
      setSelectedMarkerId,
    ],
  );

  const handleViewOtherRestaurants = useCallback(() => {
    setSelectedMarkerId(null);
    if (restorableMapMarkers) {
      setMapMarkers(restorableMapMarkers);
      setIsMapLocked(false);
      setRestorableMapMarkers(null);
    }
  }, [restorableMapMarkers, setMapMarkers, setSelectedMarkerId]);

  const handleSuggestionClick = (suggestion: RestaurantSuggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Top-Left: Navigation Control Group (Home + Refresh) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="absolute top-6 left-6 z-50 flex gap-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-full shadow-lg border border-neutral-200/50 dark:border-neutral-800/50 p-1.5"
      >
        {/* Back home button */}
        <motion.button
          onClick={onBackHome}
          className="p-2.5 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800/90 transition-all"
          title={t("backHome")}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Home className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
        </motion.button>

        {/* Divider */}
        <div className="w-px bg-neutral-200 dark:bg-neutral-700/50" />

        {/* Refresh button */}
        <motion.button
          onClick={handleRefresh}
          className="p-2.5 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800/90 transition-all"
          title={t("refreshMap")}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          disabled={isLoading}
        >
          <RefreshCw
            className={`w-5 h-5 text-neutral-700 dark:text-neutral-300 ${isLoading ? "animate-spin" : ""}`}
          />
        </motion.button>
      </motion.div>

      {/* Map container with real Leaflet map */}
      <div className="absolute inset-0">
        <MapComponent
          userLocation={userLocation}
          markers={markersForMap}
          selectedMarkerId={selectedMarkerId}
          onMarkerClick={handleMarkerClick}
          onConfirmRestaurant={handleConfirmRestaurant}
          onViewOtherRestaurants={handleViewOtherRestaurants}
          isLoading={isLoading}
          mapLeafletRef={mapLeafletRef}
          syncCenterToUser={!isSettingLocation}
          hideUserMarker={isSettingLocation}
        />
      </div>

      <AnimatePresence>
        {isSettingLocation ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="pointer-events-none absolute left-1/2 top-1/2 z-[999] -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -inset-3 rounded-full bg-orange-500/30 blur-xl"
              />
              <div className="relative rounded-full border-4 border-white bg-gradient-to-br from-orange-500 to-red-600 p-3 shadow-2xl">
                <Crosshair className="h-7 w-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute left-1/2 top-full h-6 w-0.5 -translate-x-1/2 bg-gradient-to-b from-orange-500 to-transparent" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Floating Glassmorphism Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute right-4 top-4 bottom-4 w-full max-w-md z-[600]"
          >
            <div className="h-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/50 dark:border-neutral-700/50 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-200/50 dark:border-neutral-700/50">
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => setShowFilters(false)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-1.5 -ml-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
                    title="Đóng"
                  >
                    <ChevronRight className="w-6 h-6 text-neutral-500" />
                  </motion.button>
                  <SlidersHorizontal className="w-6 h-6 text-orange-600" />
                  <h2
                    className="text-2xl font-bold text-neutral-800 dark:text-white"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    {t("search")}
                  </h2>
                </div>
                {/* Settings & Mock Toggle */}
                <div className="flex items-center gap-2">
                  {/* Mock Data Toggle */}
                  <motion.button
                    onClick={handleMockToggle}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      useMockData
                        ? "bg-green-500 text-white"
                        : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                    }`}
                    title={useMockData ? t("mockModeOn") : t("mockModeOff")}
                  >
                    {useMockData ? "🟢 Mock" : "⚪ Mock"}
                  </motion.button>

                  {/* Settings Dropdown */}
                  <SettingsDropdown
                    theme={theme}
                    onThemeChange={onThemeChange}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Search input with autocomplete */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() =>
                      searchSuggestions.length > 0 && setShowSuggestions(true)
                    }
                    placeholder={t("searchPlaceholder")}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />

                  {/* Autocomplete suggestions */}
                  <AnimatePresence>
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50"
                      >
                        {searchSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors flex items-center gap-3"
                          >
                            <MapPin className="w-4 h-4 text-neutral-400" />
                            <div>
                              <p className="font-medium text-neutral-800 dark:text-neutral-200">
                                {suggestion.name}
                              </p>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {suggestion.address}
                              </p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </motion.div>
                )}

                {/* Mock switch notification */}
                {mockSwitchMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl text-blue-600 dark:text-blue-400 text-sm"
                  >
                    {mockSwitchMessage}
                  </motion.div>
                )}

                {/* Loading state */}
                {isLoadingFilters ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    <span className="ml-3 text-neutral-600">
                      {t("loadingFilters")}
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Concept filters - luôn hiển thị section dù rỗng */}
                    <FilterSection
                      title={t("concept")}
                      tags={conceptsList}
                      selected={selectedConcepts}
                      onToggle={toggleConcept}
                      color="blue"
                      isEmpty={conceptsList.length === 0}
                    />

                    {/* Purpose filters */}
                    <FilterSection
                      title={t("purpose")}
                      tags={purposesList}
                      selected={selectedPurposes}
                      onToggle={togglePurpose}
                      color="green"
                      isEmpty={purposesList.length === 0}
                    />

                    {/* Amenities filters */}
                    <FilterSection
                      title={t("amenities")}
                      tags={amenitiesList}
                      selected={selectedAmenities}
                      onToggle={toggleAmenity}
                      color="purple"
                      isEmpty={amenitiesList.length === 0}
                    />

                    {/* Budget Range filters */}
                    <FilterSection
                      title={t("budgetRange")}
                      tags={budgetRangesList}
                      selected={selectedBudgetRanges}
                      onToggle={toggleBudgetRange}
                      color="orange"
                      isEmpty={budgetRangesList.length === 0}
                    />

                    {/* Thông báo khi tất cả filters đều rỗng */}
                    {conceptsList.length === 0 &&
                      purposesList.length === 0 &&
                      amenitiesList.length === 0 &&
                      budgetRangesList.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl"
                        >
                          <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">
                            ⚠️ {t("filterError")}
                          </p>
                          <button
                            onClick={() => {
                              setUseMockData(true);
                              setApiMockData(true);
                              loadFilters();
                            }}
                            className="text-sm px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                          >
                            {t("useMockData")}
                          </button>
                        </motion.div>
                      )}
                  </>
                )}

                {/* Radius slider */}
                <div className="space-y-4">
                  <h3
                    className="font-semibold text-neutral-700 dark:text-neutral-300"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {t("radius")} - {radius} {t("km")}
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min={0}
                      max={radiusOptions.length - 1}
                      step={1}
                      value={radiusOptions.indexOf(radius)}
                      onChange={(e) =>
                        setRadius(radiusOptions[parseInt(e.target.value)])
                      }
                      className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-500">
                      {radiusOptions.map((r) => (
                        <span
                          key={r}
                          className={
                            radius === r ? "text-orange-600 font-semibold" : ""
                          }
                        >
                          {r}
                          {t("km")}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Number of places */}
                <div className="space-y-4">
                  <h3
                    className="font-semibold text-neutral-700 dark:text-neutral-300"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {t("numberOfPlaces")}
                  </h3>
                  <select
                    value={numberOfPlaces}
                    onChange={(e) =>
                      setNumberOfPlaces(parseInt(e.target.value))
                    }
                    className="w-full px-4 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {[
                      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
                      18, 19, 20,
                    ].map((num) => (
                      <option key={num} value={num}>
                        {num} {t("restaurants")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search button - Fixed at bottom */}
              <div className="p-6 border-t border-neutral-200/50 dark:border-neutral-700/50 bg-gradient-to-t from-white/60 to-transparent dark:from-neutral-900/60">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("searching")}
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      {t("search")}
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top-Right: Filters & Settings Control Group */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="absolute top-6 right-6 z-[500] flex gap-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-full shadow-lg border border-neutral-200/50 dark:border-neutral-800/50 p-1.5"
      >
        {/* Filters Toggle Button */}
        {!showFilters && (
          <motion.button
            onClick={() => setShowFilters(true)}
            className="p-2.5 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800/90 transition-all"
            title={t("openFilters")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <SlidersHorizontal className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </motion.button>
        )}

        {/* Divider */}
        {!showFilters && (
          <div className="w-px bg-neutral-200 dark:bg-neutral-700/50" />
        )}

        {/* Settings Dropdown */}
        <div className="flex items-center">
          <SettingsDropdown theme={theme} onThemeChange={onThemeChange} />
        </div>
      </motion.div>

      {/* Location status indicator */}
      {locationStatus === "denied" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-full text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          {t("locationDenied")}
        </motion.div>
      )}

      {/* Empty results message */}
      {!isLoading && searchResults.length === 0 && !showFilters && !error && showEmptyMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500] text-center"
        >
          <div className="relative bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 dark:border-neutral-700/50 min-w-[320px]">
            
            {/* Nút đóng (X) ở góc phải */}
            <button 
              onClick={() => setShowEmptyMessage(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-400"
            >
              <Plus className="w-5 h-5 rotate-45" /> {/* Sử dụng icon Plus xoay 45 độ thành X */}
            </button>

            <Search className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">
              {t("noResults")}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">
              {t("noResultsDesc")}
            </p>

            <div className="flex flex-col gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(true)}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold shadow-lg"
              >
                {t("openFilters")}
              </motion.button>
              
              {/* Nút "Để sau" */}
              <button
                onClick={() => setShowEmptyMessage(false)}
                className="px-6 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              >
                {t("Để sau")} {/* Hoặc text cứng nếu bạn chưa có i18n cho key này */}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bottom-Left: Set Location + Location Indicator + AI Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute bottom-6 left-6 z-[500] md:bottom-8 md:left-8 flex flex-col gap-3"
      >
        {/* Zoom Controls - on top */}
        <div className="flex gap-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-xl shadow-lg border border-neutral-200/50 dark:border-neutral-800/50 p-1 w-fit">
          <motion.button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/90 transition-all flex items-center justify-center w-7 h-7 flex-shrink-0"
            title="Zoom in"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          </motion.button>

          <div className="w-px bg-neutral-200 dark:bg-neutral-700/50" />

          <motion.button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/90 transition-all flex items-center justify-center w-7 h-7 flex-shrink-0"
            title="Zoom out"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Minus className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          </motion.button>
        </div>

        {/* Set Location Button - on top */}
        <AnimatePresence mode="wait">
          {isSettingLocation ? (
            <motion.div
              key="confirm-location"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="flex flex-col gap-2"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-neutral-200/50 bg-white/90 px-3 py-2 shadow-md backdrop-blur-xl dark:border-neutral-800/50 dark:bg-neutral-900/90"
              >
                <p
                  className="text-xs text-neutral-600 dark:text-neutral-300"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {t("dragToSetLocation")}
                </p>
              </motion.div>
              <div className="flex flex-col gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsSettingLocation(false)}
                  className="rounded-xl border border-neutral-200/50 bg-white/90 px-4 py-2.5 text-xs text-neutral-600 shadow-md backdrop-blur-xl dark:border-neutral-800/50 dark:bg-neutral-900/90 dark:text-neutral-300 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/90"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {t("cancel")}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmPickedLocation}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2.5 text-xs text-white shadow-[0_4px_16px_rgba(249,115,22,0.3)] transition-shadow hover:shadow-[0_6px_20px_rgba(249,115,22,0.4)]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Check className="h-3.5 w-3.5" />
                  {t("confirmLocation")}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="set-location"
              type="button"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                delay: 0.1,
              }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSettingLocation(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200/50 bg-white/90 px-5 py-3 shadow-lg backdrop-blur-xl transition-all hover:shadow-xl dark:border-neutral-800/50 dark:bg-neutral-900/90 hover:bg-neutral-50 dark:hover:bg-neutral-800/90 w-fit"
            >
              <MapPin className="h-4 w-4 text-orange-500" />
              <span
                className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {t("setYourLocation")}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Location Indicator - below Set Location */}
        <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-xl px-3.5 py-2.5 shadow-lg border border-white/50 dark:border-neutral-700/50 w-fit">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-800 dark:text-white">
                {t("currentLocation")}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </p>
            </div>
          </div>
        </div>

        {/* AI Recommendations Button */}
        <AnimatePresence>
          {!showAiRecommendations && aiRecommendations.length > 0 && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={() => setShowAiRecommendations(true)}
              className="px-4 py-2.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 dark:border-neutral-700/50 flex items-center gap-2.5 text-sm font-medium text-neutral-800 dark:text-white hover:shadow-xl transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/90 group w-fit"
            >
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-orange-500 group-hover:text-orange-600" />
              </motion.div>
              {t("aiRecommendationsTitle")}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="pointer-events-none absolute inset-0 z-[1000]">
        <div className="pointer-events-auto">
          <OdysseusAI
            onShowRestaurantsOnMap={handleOdysseusRestaurants}
            searchAnchor={userLocation}
            searchRadiusKm={radius}
          />
        </div>
      </div>
    </div>
  );
}

// Filter Section Component
interface FilterSectionProps {
  title: string;
  tags: Tag[];
  selected: number[];
  onToggle: (id: number) => void;
  color: "blue" | "green" | "purple" | "orange";
  isEmpty?: boolean;
}

const colorClasses = {
  blue: {
    selected: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md",
    unselected:
      "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700",
  },
  green: {
    selected:
      "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md",
    unselected:
      "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700",
  },
  purple: {
    selected:
      "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md",
    unselected:
      "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700",
  },
  orange: {
    selected:
      "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md",
    unselected:
      "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700",
  },
};

function FilterSection({
  title,
  tags,
  selected,
  onToggle,
  color,
  isEmpty = false,
}: FilterSectionProps) {
  const { t } = useLanguage();

  if (isEmpty) {
    return (
      <div className="space-y-2">
        <h3
          className="font-semibold text-neutral-400 dark:text-neutral-500"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {title}
        </h3>
        <p className="text-xs text-neutral-400 italic">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3
        className="font-semibold text-neutral-700 dark:text-neutral-300"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          // Dịch tag.name nếu có key trong translation, ngược lại hiện tên gốc
          const translatedName = t(tag.name);
          const displayName =
            translatedName !== tag.name ? translatedName : tag.name;

          return (
            <motion.button
              key={tag.id}
              onClick={() => onToggle(tag.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selected.includes(tag.id)
                  ? colorClasses[color].selected
                  : colorClasses[color].unselected
              }`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {displayName}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}