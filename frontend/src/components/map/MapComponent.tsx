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
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import { UserLocation, GeoJSONFeature, RestaurantDetail } from "@/lib/types";
import { getRestaurantDetail } from "@/lib/api/restaurant";
import { useLanguage } from "@/components/providers/LanguageContext";

// Fix Leaflet icon issue in Next.js
import L from "leaflet";

// Create custom icons
const userLocationIcon = new Icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10' fill='%233b82f6' fill-opacity='0.2'/%3E%3Ccircle cx='12' cy='12' r='4' fill='%233b82f6'/%3E%3C/svg%3E",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const restaurantIcon = new Icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10' fill='%23f97316'/%3E%3Cpath d='M7 12h10M12 7v10'/%3E%3C/svg%3E",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

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
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full"
        style={{ zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
              icon={restaurantIcon}
              ref={(marker) => {
                markerRefs.current[feature.properties.id] = marker;
              }}
              eventHandlers={{
                click: () => handleMarkerClick(feature),
              }}
            >
              <Popup autoPan={false}>
                <div className="p-2 min-w-[200px]">
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
interface RestaurantDetailPanelProps {
  restaurant: RestaurantDetail;
  onClose: () => void;
  onConfirm: () => void;
}

function RestaurantDetailPanel({
  restaurant,
  onClose,
  onConfirm,
}: RestaurantDetailPanelProps) {
  const { t } = useLanguage();
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
