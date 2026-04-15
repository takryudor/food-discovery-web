import { motion } from 'motion/react';
import { X, Star, MapPin, Phone, Clock } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from './LanguageContext';
import CompletionDialog from './CompletionDialog';

interface Restaurant {
  id: number;
  name: string;
  lat: number;
  lng: number;
  image: string;
  rating: number;
  price: string;
  cuisine: string;
  address: string;
}

interface RestaurantDetailProps {
  restaurant: Restaurant;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RestaurantDetail({ restaurant, onClose, onConfirm }: RestaurantDetailProps) {
  const { t } = useLanguage();
  const [showCompletion, setShowCompletion] = useState(false);

  const handleConfirm = () => {
    setShowCompletion(true);
  };

  const handleGoHome = () => {
    setShowCompletion(false);
    setTimeout(() => {
      onConfirm();
    }, 100);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
      >
        <div className="bg-white dark:bg-neutral-900 rounded-[32px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Header image */}
          <div className="relative h-80 overflow-hidden">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-6 right-6 p-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-full hover:bg-white dark:hover:bg-neutral-900 transition-colors shadow-lg"
            >
              <X className="w-5 h-5 text-neutral-900 dark:text-white" />
            </motion.button>

            <div className="absolute bottom-6 left-6 right-6 text-white">
              <h2 className="text-4xl font-bold mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                {restaurant.name}
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{restaurant.rating}</span>
                </div>
                <span className="text-sm bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full font-medium">
                  {restaurant.cuisine}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8 overflow-y-auto max-h-96">
            {/* Price */}
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-2xl">
              <span className="text-neutral-600 dark:text-neutral-400 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                Giá:
              </span>
              <span className="font-bold text-2xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {restaurant.price}
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent" />

            {/* Address */}
            <div className="flex gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-950/30 rounded-xl">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2 text-neutral-800 dark:text-neutral-200" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Địa chỉ
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{restaurant.address}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-950/30 rounded-xl">
                <Phone className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2 text-neutral-800 dark:text-neutral-200" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Điện thoại
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">+84 123 456 789</p>
              </div>
            </div>

            {/* Hours */}
            <div className="flex gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-950/30 rounded-xl">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2 text-neutral-800 dark:text-neutral-200" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Giờ mở cửa
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">9:00 - 22:00 (Hàng ngày)</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent" />

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-3 text-neutral-800 dark:text-neutral-200" style={{ fontFamily: 'Inter, sans-serif' }}>
                Mô tả
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Nhà hàng {restaurant.name} mang đến cho bạn trải nghiệm ẩm thực độc đáo với các món ăn {restaurant.cuisine.toLowerCase()}
                chính gốc. Không gian sang trọng, phục vụ tận tình, và hương vị khó quên.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl border-2 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {t('holdOn')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold shadow-[0_8px_24px_rgba(255,143,67,0.4)] hover:shadow-[0_12px_32px_rgba(255,143,67,0.6)] transition-all"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {t('iWillEatHere')}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Completion dialog */}
      {showCompletion && (
        <CompletionDialog
          onGoHome={handleGoHome}
          onContinue={() => setShowCompletion(false)}
        />
      )}
    </>
  );
}
