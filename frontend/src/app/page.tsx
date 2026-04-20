"use client";

import { useRouter } from "next/navigation";
import HomePage from "@/app/_components/HomePage";
import { useUIStore } from "@/store/uiStore";

export default function HomeRoutePage() {
  const router = useRouter();
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  return (
    <div className="size-full relative overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <HomePage
        onStartJourney={() => router.push("/map")}
        onGoToExplore={() => router.push("/explore")}
        theme={theme}
        onThemeChange={setTheme}
      />
    </div>
  );
}
