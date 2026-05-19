"use client";

import { motion } from "motion/react";
import { Heart, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageContext";
import { useFavorites } from "@/hooks/useFavorites";

interface FavoriteButtonProps {
  restaurantId: number;
  onRequireAuth?: () => void;
  className?: string;
  variant?: "overlay" | "inline";
}

export default function FavoriteButton({
  restaurantId,
  onRequireAuth,
  className = "",
  variant = "overlay",
}: FavoriteButtonProps) {
  const { t } = useLanguage();
  const { isFavorite, toggle, isToggling } = useFavorites();
  const favorited = isFavorite(restaurantId);

  const handleClick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    const result = await toggle(restaurantId);
    if (result.needsAuth) {
      onRequireAuth?.();
    }
  };

  const label = favorited ? t("removeFromFavorites") : t("addToFavorites");

  const baseClass =
    variant === "overlay"
      ? "absolute top-4 left-4 p-2.5 rounded-full backdrop-blur-md transition-colors shadow-lg"
      : "p-2 rounded-full transition-colors";

  const stateClass =
    variant === "overlay"
      ? favorited
        ? "bg-red-500/90 text-white hover:bg-red-600"
        : "bg-white/20 text-white hover:bg-white/30"
      : favorited
        ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400"
        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300";

  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      disabled={isToggling}
      onClick={(event) => void handleClick(event)}
      className={`${baseClass} ${stateClass} disabled:opacity-70 ${className}`}
    >
      {isToggling ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Heart
          className={`w-5 h-5 ${favorited ? "fill-current" : ""}`}
        />
      )}
    </motion.button>
  );
}
