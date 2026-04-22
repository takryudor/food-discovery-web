"use client";

import { useRouter } from "next/navigation";
import MapView from "@/components/map/MapView";
import { useFilterStore } from "@/store/filterStore";
import { useMapStore } from "@/store/mapStore";
import { useSearchStore } from "@/store/searchStore";
import { useUIStore } from "@/store/uiStore";

export default function MapRoutePage() {
  const router = useRouter();
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const clearFilters = useFilterStore((state) => state.clearFilters);
  const clearSearchResults = useSearchStore((state) => state.clearSearchResults);
  const clearMapState = useMapStore((state) => state.clearMapState);

  const handleBackHome = () => {
    clearFilters();
    clearSearchResults();
    clearMapState();
    router.push("/");
  };

  return (
    <MapView
      onBackHome={handleBackHome}
      theme={theme}
      onThemeChange={setTheme}
    />
  );
}
