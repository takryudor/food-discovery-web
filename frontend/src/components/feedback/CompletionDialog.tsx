import { motion } from "motion/react";
import { CheckCircle, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageContext";
import { useMemo } from "react";

interface CompletionDialogProps {
  onGoHome: () => void;
  onContinue: () => void;
}

// Pre-generated random values for sparkles animation
const SPARKLE_OFFSETS = [-45, -30, 10, 55, -20, 35, -50, 40];

export default function CompletionDialog({
  onGoHome,
  onContinue,
}: CompletionDialogProps) {
  const { t } = useLanguage();

  const sparkles = useMemo(() => {
    return [...Array(8)].map((_, i) => ({
      key: i,
      xOffset: SPARKLE_OFFSETS[i] || 0,
      delay: i * 0.15,
    }));
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60]"
      />

      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-6"
      >
        <div className="bg-white dark:bg-neutral-900 rounded-[32px] shadow-2xl max-w-lg w-full p-10 text-center space-y-8">
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 15 }}
            className="flex justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-full blur-3xl"
              />
              <div className="relative bg-green-500/10 p-6 rounded-full">
                <CheckCircle
                  className="w-24 h-24 text-green-500"
                  strokeWidth={1.5}
                />
              </div>
            </div>
          </motion.div>

          {/* Sparkles animation */}
          <div className="relative h-12">
            {sparkles.map((sparkle) => (
              <motion.div
                key={sparkle.key}
                initial={{ opacity: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: -60,
                  x: sparkle.xOffset,
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  duration: 2,
                  delay: sparkle.delay,
                  repeat: Infinity,
                }}
                className="absolute left-1/2 top-0"
              >
                <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </motion.div>
            ))}
          </div>

          {/* Message */}
          <div className="space-y-4">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {t("journeyComplete")}
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-neutral-600 dark:text-neutral-400 text-lg"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 300 }}
            >
              {t("backToHome")}
            </motion.p>
          </div>

          {/* Actions */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-4 pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onContinue}
              className="flex-1 py-4 rounded-2xl border-2 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {t("continueBrowsing")}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGoHome}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold shadow-[0_8px_24px_rgba(255,143,67,0.4)] hover:shadow-[0_12px_32px_rgba(255,143,67,0.6)] transition-all"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {t("yes")}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
