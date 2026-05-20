import { create } from "zustand";

interface FavoritesState {
  favoriteIds: number[];
  setFavoriteIds: (ids: number[]) => void;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set) => ({
  favoriteIds: [],
  setFavoriteIds: (ids) => set({ favoriteIds: ids }),
  clearFavorites: () => set({ favoriteIds: [] }),
}));
