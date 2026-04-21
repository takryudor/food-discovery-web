import { create } from "zustand";
import type { GeoJSONFeature } from "@/lib/types";

interface MapState {
  mapMarkers: GeoJSONFeature[];
  selectedMarkerId: number | null;
  setMapMarkers: (value: GeoJSONFeature[]) => void;
  setSelectedMarkerId: (value: number | null) => void;
  clearMapState: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  mapMarkers: [],
  selectedMarkerId: null,
  setMapMarkers: (value) => set({ mapMarkers: value }),
  setSelectedMarkerId: (value) => set({ selectedMarkerId: value }),
  clearMapState: () =>
    set({
      mapMarkers: [],
      selectedMarkerId: null,
    }),
}));
