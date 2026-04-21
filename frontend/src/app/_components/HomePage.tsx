"use client";

import { motion } from "motion/react";
import {
  Utensils,
  ChevronRight,
  Star,
  MapPin,
  Phone,
  Mail,
  Share2,
  Camera,
  MessageCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/components/providers/LanguageContext";
import { useAuth } from "@/components/auth/AuthContext";
import SettingsDropdown from "@/components/common/SettingsDropdown";
import LoginModal from "@/components/auth/LoginModal";
import RegisterModal from "@/components/auth/RegisterModal";
import UserMenu from "@/components/auth/UserMenu";

interface HomePageProps {
  onStartJourney: () => void;
  onGoToExplore: () => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}

export default function HomePage({
  onStartJourney,
  onGoToExplore,
  theme,
  onThemeChange,
}: HomePageProps) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll for reviews
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollAmount = 0;
    const scrollSpeed = 0.5;

    const scroll = () => {
      scrollAmount += scrollSpeed;
      if (container.scrollWidth > 0 && scrollAmount >= container.scrollWidth / 2) {
        scrollAmount = 0;
      }
      container.scrollLeft = scrollAmount;
    };

    const intervalId = setInterval(scroll, 20);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-y-auto overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative w-full min-h-screen flex items-center justify-center">
        {/* Dynamic Background Based on Theme */}
        <div className={`absolute inset-0 ${
          theme === 'dark'
            ? 'bg-[radial-gradient(circle_at_center,#2d1810_0%,#1a0f0a_30%,#0f0a08_60%,#050403_85%,#000000_100%)]'
            : 'bg-[radial-gradient(circle_at_center,#FFB347_0%,#FFC870_30%,#FFE5B8_60%,#FFF5E6_85%,#FFFDF8_100%)]'
        }`} />

      {/* Glowing orange light in dark mode */}
      {theme === 'dark' && (
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-[800px] h-[800px] bg-gradient-to-r from-orange-600 to-red-600 rounded-full blur-[120px]" />
        </motion.div>
      )}

      {/* Subtle overlay texture */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />

      {/* Header - Auth & Settings */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-10 right-10 z-50 flex items-center gap-4"
      >
        {isAuthenticated ? (
          <>
            <UserMenu />
            <SettingsDropdown theme={theme} onThemeChange={onThemeChange} />
          </>
        ) : (
          <>
            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLoginModal(true)}
              className="px-5 py-2.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:bg-white/20 dark:hover:bg-neutral-800/20 rounded-xl transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {t('login')}
            </motion.button>

            {/* Register Button */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 12px 24px rgba(255,143,67,0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowRegisterModal(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-[#FF4B2B] to-[#FF8122] text-white text-sm font-semibold rounded-xl shadow-[0_4px_16px_rgba(255,143,67,0.3)] transition-all"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {t('register')}
            </motion.button>

            {/* Settings Icon */}
            <SettingsDropdown theme={theme} onThemeChange={onThemeChange} />
          </>
        )}
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8">
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
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-3xl"
              />
              <div className="relative bg-white/40 dark:bg-neutral-800/40 backdrop-blur-xl p-10 rounded-full border border-orange-300/40 dark:border-orange-700/40 shadow-2xl">
                <Utensils className="w-24 h-24 text-orange-600 dark:text-orange-400 drop-shadow-lg" strokeWidth={1.5} />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <div className="space-y-6">
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-8xl font-bold text-neutral-800 dark:text-neutral-100 tracking-tight drop-shadow-sm"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {t('appTitle')}
            </motion.h1>
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-xl text-neutral-600 dark:text-neutral-400 font-light tracking-wide"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}
            >
              {t('appSubtitle')}
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
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            <span className="relative z-10 text-lg font-semibold tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
              {t('startJourney')}
            </span>
          </motion.button>

        </motion.div>
      </div>

      {/* Right Arrow Button to Explore */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2 }}
        onClick={onGoToExplore}
        whileHover={{ scale: 1.1, x: 5 }}
        whileTap={{ scale: 0.9 }}
        className="fixed right-8 top-1/2 -translate-y-1/2 z-40 p-4 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-xl rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.15)] border border-white dark:border-neutral-700 hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)] transition-all"
      >
        <ChevronRight className="w-6 h-6 text-orange-600 dark:text-orange-400" strokeWidth={2.5} />
      </motion.button>
      </div>

      {/* Top Restaurants Section */}
      <section className="relative bg-white dark:bg-neutral-900 py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-bold text-neutral-800 dark:text-neutral-100 mb-12 text-center"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {t('topRestaurants')}
          </motion.h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: item * 0.05 }}
                whileHover={{ y: -8 }}
                className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-orange-200/50 dark:border-orange-800/30"
              >
                <div className="h-40 bg-gradient-to-br from-orange-400 to-red-500" />
                <div className="p-4">
                  <h3 className="font-bold text-neutral-800 dark:text-neutral-100 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {t('restaurant')} {item}
                  </h3>
                  <div className="flex items-center gap-1 text-amber-500 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>Quận {item}, TP.HCM</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section - Auto-scrolling Carousel */}
      <section className="relative bg-neutral-50 dark:bg-neutral-950 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-bold text-neutral-800 dark:text-neutral-100 text-center"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {t('customerReviews')}
          </motion.h2>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-hidden px-8"
          style={{ scrollBehavior: 'auto' }}
        >
          {/* Duplicate reviews for infinite scroll effect */}
          {[...Array(2)].map((_, setIndex) => (
            <div key={setIndex} className="flex gap-6 flex-shrink-0">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <motion.div
                  key={`${setIndex}-${item}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: item * 0.05 }}
                  className="flex-shrink-0 w-96 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-2xl p-6 shadow-lg border border-orange-200/50 dark:border-orange-800/30"
                >
                  <div className="flex items-center gap-1 text-amber-500 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                    &quot;{t('reviewText')}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500" />
                    <div>
                      <p className="font-semibold text-neutral-800 dark:text-neutral-100" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {t('reviewer')} {item}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {t('foodLover')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-neutral-900 dark:bg-black text-white py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Utensils className="w-8 h-8 text-orange-500" />
                <h3 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>FoOdyssey</h3>
              </div>
              <p className="text-neutral-400 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                {t('footerDescription')}
              </p>
              <div className="flex gap-4">
                <a href="#" className="p-2 bg-neutral-800 dark:bg-neutral-900 rounded-full hover:bg-orange-600 transition-colors" aria-label="Social">
                  <Share2 className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 bg-neutral-800 dark:bg-neutral-900 rounded-full hover:bg-orange-600 transition-colors" aria-label="Photos">
                  <Camera className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 bg-neutral-800 dark:bg-neutral-900 rounded-full hover:bg-orange-600 transition-colors" aria-label="Contact chat">
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-bold mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>{t('contact')}</h4>
              <div className="space-y-3 text-neutral-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>+84 123 456 789</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>hello@foodyssey.vn</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>TP. Hồ Chí Minh, Việt Nam</span>
                </div>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>{t('legal')}</h4>
              <div className="space-y-3 text-neutral-400">
                <a href="#" className="block hover:text-orange-500 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {t('privacyPolicy')}
                </a>
                <a href="#" className="block hover:text-orange-500 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {t('termsOfService')}
                </a>
                <p className="text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {t('businessLicense')}: 0123456789
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-8 text-center text-neutral-500 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            © 2026 FoOdyssey. {t('allRightsReserved')}.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <RegisterModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} />
    </div>
  );
}