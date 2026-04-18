import { Settings, Sun, Moon, Globe } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './LanguageContext';

interface SettingsDropdownProps {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

export default function SettingsDropdown({ theme, onThemeChange }: SettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="relative z-50">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-4 rounded-full bg-white/60 backdrop-blur-xl text-neutral-700 border border-orange-300/40 hover:bg-white/80 transition-all shadow-lg"
      >
        <Settings className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 dark:border-neutral-700/50 overflow-hidden"
          >
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <Globe className="w-4 h-4" />
                  {t('language')}
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => setLanguage('vi')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 px-4 py-3 rounded-xl transition-all font-medium ${
                      language === 'vi'
                        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {t('vietnamese')}
                  </motion.button>
                  <motion.button
                    onClick={() => setLanguage('en')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 px-4 py-3 rounded-xl transition-all font-medium ${
                      language === 'en'
                        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {t('english')}
                  </motion.button>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent" />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  {t('theme')}
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => onThemeChange('light')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-medium ${
                      theme === 'light'
                        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <Sun className="w-4 h-4" />
                    {t('light')}
                  </motion.button>
                  <motion.button
                    onClick={() => onThemeChange('dark')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-medium ${
                      theme === 'dark'
                        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <Moon className="w-4 h-4" />
                    {t('dark')}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
