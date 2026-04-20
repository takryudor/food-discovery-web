"use client";

import { useRouter } from "next/navigation";
import ExplorePage from "@/app/explore/_components/ExplorePage";
import { useUIStore } from "@/store/uiStore";

export default function ExploreRoutePage() {
  const router = useRouter();
  const theme = useUIStore((state) => state.theme);

  return <ExplorePage onBackHome={() => router.push("/")} theme={theme} />;
}
