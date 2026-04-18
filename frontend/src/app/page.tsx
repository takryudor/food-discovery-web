"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LanguageProvider } from "@/components/LanguageContext";
import { AuthProvider } from "@/components/AuthContext";
import HomePage from "@/components/HomePage";
import MapView from "@/components/MapView";
import ExplorePage from "@/components/ExplorePage";

type Screen = "home" | "map" | "explore";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [theme, setTheme] = useState<"light" | "dark">("light");

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

  const handleGoToExplore = () => {
    setCurrentScreen("explore");
  };

  return (
    <LanguageProvider>
      <AuthProvider>
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
                  onGoToExplore={handleGoToExplore}
                  theme={theme}
                  onThemeChange={setTheme}
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
                <MapView onBackHome={handleBackHome} theme={theme} onThemeChange={setTheme} />
              </motion.div>
            )}
            {currentScreen === "explore" && (
              <motion.div
                key="explore"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full h-full"
              >
                <ExplorePage onBackHome={handleBackHome} theme={theme} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AuthProvider>
    </LanguageProvider>
  );
}
