import { motion } from "motion/react";
import { Utensils, Send, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "./LanguageContext";
import SettingsDropdown from "./SettingsDropdown";
import { sendChatboxMessage } from "@/lib/api";
import { RestaurantRecommendation } from "@/lib/types";

interface HomePageProps {
  onStartJourney: () => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
  onAiRecommendations?: (recommendations: RestaurantRecommendation[]) => void;
}

export default function HomePage({
  onStartJourney,
  theme,
  onThemeChange,
  onAiRecommendations,
}: HomePageProps) {
  const { t } = useLanguage();
  const [aiMessage, setAiMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!aiMessage.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await sendChatboxMessage({ message: aiMessage.trim() });
      if (onAiRecommendations) {
        onAiRecommendations(response.recommendations);
      }
      onStartJourney();
    } catch (err) {
      const errorMessage = (err as Error).message || t("aiChatError");
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Soft Professional Radial Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#FFB347_0%,#FFC870_30%,#FFE5B8_60%,#FFF5E6_85%,#FFFDF8_100%)]" />

      {/* Subtle overlay texture */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />

      {/* Settings button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-8 right-8 z-50"
      >
        <SettingsDropdown theme={theme} onThemeChange={onThemeChange} />
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8">
        <motion.div className="text-center space-y-12 max-w-4xl">
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.15, 0.25, 0.15],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-3xl"
              />
              <div className="relative bg-white/40 backdrop-blur-xl p-10 rounded-full border border-orange-300/40 shadow-2xl">
                <Utensils
                  className="w-24 h-24 text-orange-600 drop-shadow-lg"
                  strokeWidth={1.5}
                />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <div className="space-y-6">
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-8xl font-bold text-neutral-800 tracking-tight drop-shadow-sm"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {t("appTitle")}
            </motion.h1>
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-xl text-neutral-600 font-light tracking-wide"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 300 }}
            >
              {t("appSubtitle")}
            </motion.p>
          </div>

          {/* CTA Button - Vibrant Red-Orange Gradient */}
          <motion.button
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartJourney}
            className="relative px-16 py-5 bg-gradient-to-r from-red-500 via-orange-500 to-red-600 text-white rounded-full overflow-hidden group shadow-[0_8px_32px_rgba(255,99,71,0.5)] hover:shadow-[0_12px_48px_rgba(255,99,71,0.7)] transition-all duration-300"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <span
              className="relative z-10 text-lg font-semibold tracking-wide"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {t("startJourney")}
            </span>
          </motion.button>

          {/* AI Chatbox Section */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mt-8 w-full max-w-xl"
          >
            <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-3xl p-2 shadow-lg border border-white/50 dark:border-neutral-700/50">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                  <input
                    type="text"
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("aiChatPlaceholder")}
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={isLoading || !aiMessage.trim()}
                  className="p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-center text-neutral-600 dark:text-neutral-400 text-sm"
              >
                {t("aiChatLoading")}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
