"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { getAuthErrorMessage } from "@/lib/auth/authErrors";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const { register } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage(t("passwordMismatch"));
      return;
    }

    setIsSubmitting(true);

    try {
      const { needsEmailConfirmation } = await register(email.trim(), password);
      if (needsEmailConfirmation) {
        setSuccessMessage(t("registerCheckEmail"));
        return;
      }
      onClose();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-[32px] z-[80]"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-6"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="register-modal-title"
              className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl rounded-[32px] shadow-2xl max-w-md w-full p-10 border border-white/50 dark:border-neutral-700/50"
            >
              <motion.div className="flex justify-end mb-4">
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                  aria-label={t("close")}
                >
                  <X className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                </motion.button>
              </motion.div>

              <div className="text-center mb-8">
                <h2
                  id="register-modal-title"
                  className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2 font-serif"
                >
                  {t("createAccount")}
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300">{t("joinUs")}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMessage && (
                  <p
                    role="alert"
                    className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl px-4 py-3"
                  >
                    {errorMessage}
                  </p>
                )}

                {successMessage && (
                  <p
                    role="status"
                    className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 rounded-2xl px-4 py-3"
                  >
                    {successMessage}
                  </p>
                )}

                <motion.div className="space-y-2">
                  <label
                    htmlFor="register-email"
                    className="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    <input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      autoComplete="email"
                      disabled={isSubmitting}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all disabled:opacity-60"
                    />
                  </div>
                </motion.div>

                <motion.div className="space-y-2">
                  <label
                    htmlFor="register-password"
                    className="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                  >
                    {t("password")}
                  </label>
                  <motion.div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="w-full pl-12 pr-12 py-4 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                      aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </motion.div>
                </motion.div>

                <motion.div className="space-y-2">
                  <label
                    htmlFor="register-confirm-password"
                    className="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                  >
                    {t("confirmPassword")}
                  </label>
                  <motion.div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    <input
                      id="register-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="w-full pl-12 pr-12 py-4 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                      aria-label={
                        showConfirmPassword ? t("hidePassword") : t("showPassword")
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </motion.div>
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={isSubmitting ? undefined : { scale: 1.02, y: -2 }}
                  whileTap={isSubmitting ? undefined : { scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold shadow-[0_8px_24px_rgba(255,143,67,0.4)] hover:shadow-[0_12px_32px_rgba(255,143,67,0.6)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t("loading") : t("register")}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
