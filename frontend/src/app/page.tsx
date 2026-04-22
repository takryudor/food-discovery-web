"use client";

import { useRouter } from "next/navigation";
import HomePage from "@/app/_components/HomePage";
import { useMapStore } from "@/store/mapStore";
import { useSearchStore } from "@/store/searchStore";
import { useFilterStore } from "@/store/filterStore";
import { useUIStore } from "@/store/uiStore";

export default function HomeRoutePage() {
  const router = useRouter();
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const clearFilters = useFilterStore((state) => state.clearFilters);
  const clearSearchResults = useSearchStore((state) => state.clearSearchResults);
  const clearMapState = useMapStore((state) => state.clearMapState);

  const handleStartJourney = () => {
    clearFilters();
    clearSearchResults();
    clearMapState();
    router.push("/map");
  };

  return (
    <div className="size-full relative overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <HomePage
        onStartJourney={handleStartJourney}
        onGoToExplore={() => router.push("/explore")}
        theme={theme}
        onThemeChange={setTheme}
      />
    </div>
  );
}
