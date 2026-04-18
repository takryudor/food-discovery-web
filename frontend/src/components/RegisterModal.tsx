"use client";

import { useState } from "react";
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert(t('passwordMismatch'));
      return;
    }
    login(email, password);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Glassmorphism Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-[32px] z-[80]"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-6"
          >
            <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl rounded-[32px] shadow-2xl max-w-md w-full p-10 border border-white/50 dark:border-neutral-700/50">
              {/* Close button */}
              <div className="flex justify-end mb-4">
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                </motion.button>
              </div>

              {/* Title */}
              <div className="text-center mb-8">
                <h2
                  className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {t('createAccount')}
                </h2>
                <p
                  className="text-neutral-700 dark:text-neutral-300"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {t('joinUs')}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email input */}
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                  </div>
                </div>

                {/* Password input */}
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {t('password')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-12 py-4 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password input */}
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {t('confirmPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-12 py-4 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold shadow-[0_8px_24px_rgba(255,143,67,0.4)] hover:shadow-[0_12px_32px_rgba(255,143,67,0.6)] transition-all"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {t('register')}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
