"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { isMockDataEnabled } from "@/lib/api/client";
import { toggleFavorite } from "@/lib/api/users";
import { useFavoritesStore } from "@/store/favoritesStore";

const STORAGE_PREFIX = "foodyssey_favorites_";
const MOCK_FAVORITES_KEY = "foodyssey_mock_favorites";

function favoritesStorageKey(userId: string): string {
  return isMockDataEnabled() ? MOCK_FAVORITES_KEY : STORAGE_PREFIX + userId;
}

function loadCachedFavorites(userId: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(favoritesStorageKey(userId));
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function cacheFavorites(userId: string, ids: number[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(favoritesStorageKey(userId), JSON.stringify(ids));
  }
}

export function useFavorites() {
  const { user, isAuthenticated } = useAuth();
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds);
  const setFavoriteIds = useFavoritesStore((state) => state.setFavoriteIds);
  const clearFavorites = useFavoritesStore((state) => state.clearFavorites);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      clearFavorites();
      return;
    }
    setFavoriteIds(loadCachedFavorites(user.id));
  }, [user?.id, setFavoriteIds, clearFavorites]);

  const isFavorite = useCallback(
    (restaurantId: number) => favoriteIds.includes(restaurantId),
    [favoriteIds],
  );

  const toggle = useCallback(
    async (restaurantId: number) => {
      if (!isAuthenticated || !user?.id) {
        return { needsAuth: true as const };
      }

      setIsToggling(true);
      try {
        const result = await toggleFavorite(restaurantId);
        setFavoriteIds(result.favorites);
        cacheFavorites(user.id, result.favorites);
        return { needsAuth: false as const, action: result.action };
      } finally {
        setIsToggling(false);
      }
    },
    [isAuthenticated, user?.id, setFavoriteIds],
  );

  return {
    favoriteIds,
    isFavorite,
    toggle,
    isToggling,
  };
}
