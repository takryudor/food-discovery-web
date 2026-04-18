"use client";

import { useState } from "react";
import { motion, AnimatePresence } from 'motion/react';
import { User, Heart, Settings, LogOut } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      {/* Avatar button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center shadow-lg border-2 border-white dark:border-neutral-800"
      >
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
        ) : (
          <User className="w-5 h-5 text-white" />
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close on click outside */}
            <div
              className="fixed inset-0 z-[70]"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 mt-3 w-64 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/50 dark:border-neutral-700/50 overflow-hidden z-[80]"
            >
              {/* User info */}
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                <p
                  className="font-semibold text-neutral-800 dark:text-white truncate"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {user.name}
                </p>
                <p
                  className="text-sm text-neutral-600 dark:text-neutral-400 truncate"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {user.email}
                </p>
              </div>

              {/* Menu items */}
              <div className="p-2">
                <motion.button
                  onClick={() => setIsOpen(false)}
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors"
                >
                  <Heart className="w-5 h-5 text-orange-600" />
                  <span
                    className="text-neutral-700 dark:text-neutral-300 font-medium"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {t('savedPlaces')}
                  </span>
                </motion.button>

                <motion.button
                  onClick={() => setIsOpen(false)}
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors"
                >
                  <Settings className="w-5 h-5 text-orange-600" />
                  <span
                    className="text-neutral-700 dark:text-neutral-300 font-medium"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {t('accountSettings')}
                  </span>
                </motion.button>

                <div className="my-2 h-px bg-neutral-200 dark:bg-neutral-800" />

                <motion.button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  whileHover={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors"
                >
                  <LogOut className="w-5 h-5 text-red-600" />
                  <span
                    className="text-red-600 font-medium"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {t('logout')}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
