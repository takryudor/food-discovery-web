"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { X, Heart, MapPin, Loader2, Star } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageContext";
import { useFavorites } from "@/hooks/useFavorites";
import { getRestaurantDetail } from "@/lib/api/restaurant";
import type { RestaurantDetail } from "@/lib/types";
import FavoriteButton from "./FavoriteButton";

interface SavedPlacesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function favoriteIdsKey(ids: number[]): string {
  return [...ids].sort((a, b) => a - b).join(",");
}

export default function SavedPlacesModal({
  isOpen,
  onClose,
}: SavedPlacesModalProps) {
  const { t } = useLanguage();
  const { favoriteIds } = useFavorites();
  const idsKey = useMemo(() => favoriteIdsKey(favoriteIds), [favoriteIds]);

  const [places, setPlaces] = useState<RestaurantDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastLoadedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      lastLoadedKeyRef.current = null;
      return;
    }

    if (idsKey === lastLoadedKeyRef.current) {
      return;
    }

    let cancelled = false;

    async function loadPlaces() {
      if (favoriteIds.length === 0) {
        if (!cancelled) {
          setPlaces([]);
          setIsLoading(false);
          lastLoadedKeyRef.current = idsKey;
        }
        return;
      }

      if (lastLoadedKeyRef.current === null) {
        setIsLoading(true);
      }

      try {
        const details = await Promise.all(
          favoriteIds.map((id) => getRestaurantDetail(id)),
        );
        if (!cancelled) {
          setPlaces(details);
          lastLoadedKeyRef.current = idsKey;
        }
      } catch (error) {
        console.error("[saved-places] load failed:", error);
        if (!cancelled) {
          setPlaces([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPlaces();

    return () => {
      cancelled = true;
    };
  }, [isOpen, idsKey, favoriteIds]);

  const contentMinH = "min-h-[280px]";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="saved-places-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="pointer-events-none fixed inset-0 z-[91] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              key="saved-places-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="saved-places-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto relative flex max-h-[min(80vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 z-10 rounded-full bg-neutral-100 p-2 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                aria-label={t("close")}
              >
                <X className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
              </button>

              <motion.div className="border-b border-neutral-200 p-6 pr-14 dark:border-neutral-800">
                <motion.div className="flex items-center gap-3">
                  <motion.div className="rounded-xl bg-orange-100 p-2.5 dark:bg-orange-950/40">
                    <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                  </motion.div>
                  <h2
                    id="saved-places-title"
                    className="text-xl font-bold text-neutral-900 dark:text-white"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    {t("savedPlaces")}
                  </h2>
                </motion.div>
              </motion.div>

              <motion.div className={`min-h-0 flex-1 overflow-y-auto p-4 ${contentMinH}`}>
                {isLoading ? (
                  <motion.div
                    className={`flex flex-col items-center justify-center gap-3 py-16 ${contentMinH}`}
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {t("loading")}
                    </p>
                  </motion.div>
                ) : places.length === 0 ? (
                  <motion.div
                    className={`flex flex-col items-center justify-center gap-3 py-16 text-center ${contentMinH}`}
                  >
                    <Heart className="h-10 w-10 text-neutral-300 dark:text-neutral-600" />
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {t("noSavedPlaces")}
                    </p>
                  </motion.div>
                ) : (
                  <ul className="space-y-3">
                    {places.map((place) => (
                      <li
                        key={place.id}
                        className="flex gap-3 rounded-2xl border border-neutral-200/80 p-3 dark:border-neutral-800"
                      >
                        <motion.div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                          <Image
                            src={
                              place.cover_image ||
                              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400"
                            }
                            alt={place.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </motion.div>
                        <motion.div className="min-w-0 flex-1">
                          <motion.div className="flex items-start justify-between gap-2">
                            <h3 className="truncate font-semibold text-neutral-900 dark:text-white">
                              {place.name}
                            </h3>
                            <FavoriteButton
                              restaurantId={place.id}
                              variant="inline"
                            />
                          </motion.div>
                          {place.rating != null && (
                            <motion.div className="mt-1 flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              <span>{place.rating}</span>
                            </motion.div>
                          )}
                          <p className="mt-1 flex items-start gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span className="line-clamp-2">{place.address}</span>
                          </p>
                        </motion.div>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
