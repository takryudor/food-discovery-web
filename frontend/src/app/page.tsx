"use client"; // Bắt buộc phải có dòng này ở trên cùng

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LanguageProvider } from "@/components/LanguageContext";
import HomePage from "@/components/HomePage";
import MapView from "@/components/MapView";
import { RestaurantRecommendation } from "@/lib/types";

type Screen = "home" | "map";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [aiRecommendations, setAiRecommendations] = useState<RestaurantRecommendation[]>([]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleStartJourney = () => {
    setTimeout(() => setCurrentScreen("map"), 100);
  };

  const handleBackHome = () => {
    setCurrentScreen("home");
  };

  return (
    <LanguageProvider>
      <div className="size-full relative overflow-hidden bg-neutral-50 dark:bg-neutral-950">
        <AnimatePresence mode="wait">
          {currentScreen === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full h-full"
            >
              <HomePage
                onStartJourney={handleStartJourney}
                theme={theme}
                onThemeChange={setTheme}
                onAiRecommendations={setAiRecommendations}
              />
            </motion.div>
          )}
          {currentScreen === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full h-full"
            >
              <MapView
                onBackHome={handleBackHome}
                aiRecommendations={aiRecommendations}
                theme={theme}
                onThemeChange={setTheme}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LanguageProvider>
  );
}
