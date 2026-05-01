"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import Image from "next/image";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon, LatLngTuple } from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Loader2,
  AlertCircle,
  Star,
  Phone,
  Clock,
  X,
  Car,
  Footprints,
  Bike,
  Bus,
  Navigation,
  ExternalLink,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import { UserLocation, GeoJSONFeature, RestaurantDetail, RouteResponse } from "@/lib/types";
import { getRestaurantDetail } from "@/lib/api/restaurant";
import { getRoute } from "@/lib/api/geo";
import { useLanguage } from "@/components/providers/LanguageContext";

// Fix Leaflet icon issue in Next.js
import L from "leaflet";

const VIETNAM_BOUNDS: [LatLngTuple, LatLngTuple] = [
  [8.0, 102.0],
  [23.7, 109.9],
];

// Create custom icons
const userLocationIcon = new Icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10' fill='%233b82f6' fill-opacity='0.2'/%3E%3Ccircle cx='12' cy='12' r='4' fill='%233b82f6'/%3E%3C/svg%3E",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const restaurantIcon = new Icon({
  iconUrl: "/food-marker.svg",
  iconSize: [42, 42],
  iconAnchor: [21, 38],
  popupAnchor: [0, -34],
});

const selectedRestaurantIcon = new Icon({
  iconUrl: "/food-marker-selected.svg",
  iconSize: [50, 50],
  iconAnchor: [25, 46],
  popupAnchor: [0, -40],
});

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function haversineDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const earthRadiusKm = 6371;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const originLat = (fromLat * Math.PI) / 180;
  const destinationLat = (toLat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(originLat) * Math.cos(destinationLat) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

interface MapComponentProps {
  userLocation: UserLocation;
  markers: GeoJSONFeature[];
  selectedMarkerId: number | null;
  onMarkerClick: (feature: GeoJSONFeature) => void;
  onConfirmRestaurant: (restaurant: RestaurantDetail) => void;
  onViewOtherRestaurants: () => void;
  isLoading: boolean;
  /** When false, map view is not forced to follow `userLocation` (e.g. user is panning to pick a point). */
  syncCenterToUser?: boolean;
  hideUserMarker?: boolean;
  mapLeafletRef?: MutableRefObject<L.Map | null>;
}

function MapInstanceExposer({
  mapRef,
}: {
  mapRef: MutableRefObject<L.Map | null>;
}) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);
  return null;
}

// Component to update map center when user location changes
function MapCenterUpdater({
  center,
  enabled,
}: {
  center: LatLngTuple;
  enabled: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return;
    map.setView(center, map.getZoom());
  }, [center, map, enabled]);

  return null;
}

export default function MapComponent({
  userLocation,
  markers,
  selectedMarkerId,
  onMarkerClick,
  onConfirmRestaurant,
  onViewOtherRestaurants,
  isLoading,
  syncCenterToUser = true,
  hideUserMarker = false,
  mapLeafletRef,
}: MapComponentProps) {
  const { t } = useLanguage();
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<RestaurantDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const markerRefs = useRef<Record<number, L.Marker | null>>({});

  const center: LatLngTuple = useMemo(
    () => [userLocation.lat, userLocation.lng],
    [userLocation.lat, userLocation.lng],
  );

  const handleMarkerClick = async (feature: GeoJSONFeature) => {
    onMarkerClick(feature);
    setDetailError(null);

    if (feature.properties.is_ai_suggestion) {
      setLoadingDetail(false);
      const lat = feature.geometry.coordinates[1];
      const lng = feature.geometry.coordinates[0];
      setSelectedRestaurant({
        id: feature.properties.id,
        name: feature.properties.name,
        description: feature.properties.cuisine ?? "",
        address: feature.properties.address,
        latitude: lat,
        longitude: lng,
        rating: feature.properties.rating,
        phone: undefined,
        open_hours: undefined,
        price_range: feature.properties.price_hint,
        cover_image:
          "https://images.unsplash.com/photo-1555126634-323283e090fa?w=800",
        concepts: [],
        purposes: [],
        amenities: [],
      });
      return;
    }

    setLoadingDetail(true);
    try {
      const detail = await getRestaurantDetail(feature.properties.id);
      setSelectedRestaurant(detail);
    } catch (error) {
      console.error("Failed to load restaurant detail:", error);
      const errorMessage =
        (error as { message?: string }).message ||
        t("loadRestaurantError");
      setDetailError(errorMessage);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedMarkerId == null) return;
    const marker = markerRefs.current[selectedMarkerId];
    marker?.openPopup();
    marker?.fire("click");
  }, [selectedMarkerId, markers]);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={14}
        minZoom={5}
        maxZoom={18}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full"
        style={{ zIndex: 1 }}
        maxBounds={VIETNAM_BOUNDS}
        maxBoundsViscosity={1}
        preferCanvas={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          bounds={VIETNAM_BOUNDS}
          noWrap={true}
          updateWhenIdle={true}
        />
        {mapLeafletRef ? <MapInstanceExposer mapRef={mapLeafletRef} /> : null}
        <MapCenterUpdater center={center} enabled={syncCenterToUser} />

        {/* User location marker */}
        {!hideUserMarker ? (
          <Marker position={center} icon={userLocationIcon}>
            <Popup autoPan={false}>
              <div className="text-sm font-medium">{t("yourLocation")}</div>
            </Popup>
          </Marker>
        ) : null}

        {/* Restaurant markers */}
        {markers.map((feature) => {
          const coords: LatLngTuple = [
            feature.geometry.coordinates[1], // latitude
            feature.geometry.coordinates[0], // longitude
          ];

          return (
            <Marker
              key={feature.properties.id}
              position={coords}
              icon={
                selectedMarkerId === feature.properties.id
                  ? selectedRestaurantIcon
                  : restaurantIcon
              }
              ref={(marker) => {
                markerRefs.current[feature.properties.id] = marker;
              }}
              eventHandlers={{
                mouseover: (event) => {
                  event.target.openPopup();
                },
                mouseout: (event) => {
                  event.target.closePopup();
                },
                click: () => handleMarkerClick(feature),
              }}
            >
              <Popup autoPan={false} closeButton={false}>
                <div className="p-2 min-w-[200px]">
                  {(() => {
                    const rawDistance =
                      toNumber(feature.properties.distance_km) ??
                      toNumber(feature.properties.distance) ??
                      haversineDistanceKm(
                        userLocation.lat,
                        userLocation.lng,
                        feature.geometry.coordinates[1],
                        feature.geometry.coordinates[0],
                      );

                    const eta = feature.properties.eta;
                    return (
                      <div className="mb-2 grid grid-cols-[auto_1fr] gap-x-2 text-sm text-gray-700">
                        <span className="font-medium">{t("distance")}:</span>
                        <span>{rawDistance.toFixed(2)} km</span>
                        {eta != null && (
                          <>
                            <span className="font-medium">{t("eta")}:</span>
                            <span>{eta} {t("minutes")}</span>
                          </>
                        )}
                      </div>
                    );
                  })()}
                  <h3 className="font-semibold text-base mb-1">
                    {feature.properties.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {feature.properties.address}
                  </p>
                  {loadingDetail &&
                    selectedMarkerId === feature.properties.id && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("loading")}
                      </div>
                    )}
                  {detailError &&
                    selectedMarkerId === feature.properties.id && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="w-4 h-4" />
                        {detailError}
                      </div>
                    )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[400] flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-12 h-12 text-orange-500" />
                </motion.div>
                <MapPin className="w-5 h-5 text-orange-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-neutral-600 font-medium">{t("loadingMap")}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {selectedRestaurant && (
          <RestaurantDetailPanel
            restaurant={selectedRestaurant}
            userLocation={userLocation}
            onClose={() => {
              setSelectedRestaurant(null);
              onViewOtherRestaurants();
            }}
            onConfirm={() => {
              onConfirmRestaurant(selectedRestaurant);
              setSelectedRestaurant(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Restaurant Detail Panel Component
type TransportMode = "driving" | "walking" | "bicycling" | "transit";

interface RestaurantDetailPanelProps {
  restaurant: RestaurantDetail;
  userLocation?: UserLocation;
  onClose: () => void;
  onConfirm: () => void;
}

function RestaurantDetailPanel({
  restaurant,
  userLocation,
  onClose,
  onConfirm,
}: RestaurantDetailPanelProps) {
  const { t } = useLanguage();
  const [selectedMode, setSelectedMode] = useState<TransportMode>("driving");
  const [routeInfo, setRouteInfo] = useState<RouteResponse | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  useEffect(() => {
    if (!userLocation || !restaurant.id) return;
    setIsLoadingRoute(true);
    setRouteInfo(null);
    getRoute(restaurant.id, userLocation.lat, userLocation.lng, selectedMode)
      .then(setRouteInfo)
      .catch(() => {})
      .finally(() => setIsLoadingRoute(false));
  }, [restaurant.id, userLocation, selectedMode]);

  const transportModes: { mode: TransportMode; icon: React.ReactNode }[] = [
    { mode: "driving", icon: <Car className="w-4 h-4" /> },
    { mode: "walking", icon: <Footprints className="w-4 h-4" /> },
    { mode: "bicycling", icon: <Bike className="w-4 h-4" /> },
    { mode: "transit", icon: <Bus className="w-4 h-4" /> },
  ];
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-[500]"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:max-h-[90vh] z-[501] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Image Header with Gradient Overlay */}
          <div className="relative h-56 md:h-64">
            <Image
              src={
                restaurant.cover_image ||
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"
              }
              alt={restaurant.name}
              fill
              sizes="(max-width: 768px) 100vw, 512px"
              className="object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Restaurant name and rating */}
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                {restaurant.name}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                {restaurant.rating && (
                  <div className="flex items-center gap-1 bg-yellow-500/90 px-2 py-1 rounded-full">
                    <Star className="w-3 h-3 text-white fill-white" />
                    <span className="text-white text-sm font-medium">
                      {restaurant.rating}
                    </span>
                  </div>
                )}
                {restaurant.concepts?.slice(0, 2).map((concept) => (
                  <span
                    key={concept.id}
                    className="px-2 py-1 bg-white/20 backdrop-blur-md text-white text-sm rounded-full"
                  >
                    {concept.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5">
            {/* Price */}
            {restaurant.price_range && (
              <div className="bg-orange-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">{t("price")}:</span>
                  <span className="text-orange-600 font-bold text-lg">
                    {restaurant.price_range}
                  </span>
                </div>
              </div>
            )}

            {/* Address */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-xl shrink-0">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-sm mb-1">
                  {t("address")}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {restaurant.address}
                </p>
              </div>
            </div>

            {/* ETA & Routing */}
            {userLocation && (
              <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                {/* Transport mode selector */}
                <div className="grid grid-cols-4 gap-2">
                  {transportModes.map(({ mode, icon }) => (
                    <button
                      key={mode}
                      onClick={() => setSelectedMode(mode)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                        selectedMode === mode
                          ? "bg-blue-500 text-white shadow-sm"
                          : "bg-white text-gray-600 hover:bg-blue-100"
                      }`}
                    >
                      {icon}
                      <span>{t(mode)}</span>
                    </button>
                  ))}
                </div>

                {/* ETA display */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-600 shrink-0" />
                    {isLoadingRoute ? (
                      <span className="text-sm text-gray-500">{t("etaLoading")}</span>
                    ) : routeInfo ? (
                      <span className="text-sm font-semibold text-blue-700">
                        {routeInfo.distance_km.toFixed(1)} km · {routeInfo.eta_minutes} {t("minutes")}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">{t("eta")}</span>
                    )}
                  </div>
                  {routeInfo?.maps_link && (
                    <a
                      href={routeInfo.maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {t("openInGoogleMaps")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Phone */}
            {restaurant.phone && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-xl shrink-0">
                  <Phone className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">
                    {t("phone")}
                  </h3>
                  <p className="text-gray-600 text-sm">{restaurant.phone}</p>
                </div>
              </div>
            )}

            {/* Opening Hours */}
            {restaurant.open_hours && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-xl shrink-0">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">
                    {t("openingHours")}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {restaurant.open_hours}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            {restaurant.description && (
              <div className="pt-2">
                <h3 className="font-semibold text-gray-800 text-sm mb-2">
                  {t("description")}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {restaurant.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {restaurant.purposes?.length || restaurant.amenities?.length ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {restaurant.purposes?.map((purpose) => (
                  <span
                    key={purpose.id}
                    className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                  >
                    {purpose.name}
                  </span>
                ))}
                {restaurant.amenities?.map((amenity) => (
                  <span
                    key={amenity.id}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                  >
                    {amenity.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-sm hover:border-gray-300 transition-colors"
          >
            {t("viewOtherRestaurants")}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-orange-500/25"
          >
            {t("iWillEatHere")}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
