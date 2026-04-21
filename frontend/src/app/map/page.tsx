"use client";

import { useRouter } from "next/navigation";
import MapView from "@/components/map/MapView";
import { useUIStore } from "@/store/uiStore";

export default function MapRoutePage() {
  const router = useRouter();
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  return (
    <MapView
      onBackHome={() => router.push("/")}
      theme={theme}
      onThemeChange={setTheme}
    />
  );
}
