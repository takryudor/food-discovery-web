import { create } from "zustand";
import type { SearchResult } from "@/lib/types";

interface SearchState {
  searchResults: SearchResult[];
  setSearchResults: (value: SearchResult[]) => void;
  clearSearchResults: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchResults: [],
  setSearchResults: (value) => set({ searchResults: value }),
  clearSearchResults: () => set({ searchResults: [] }),
}));
