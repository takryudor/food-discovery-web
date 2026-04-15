import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Home, Utensils, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import RestaurantDetail from './RestaurantDetail';
import { RestaurantRecommendation } from '@/lib/types';

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

interface MapViewProps {
  onBackHome: () => void;
  aiRecommendations?: RestaurantRecommendation[];
}

export default function MapView({ onBackHome, aiRecommendations = [] }: MapViewProps) {
  const { t } = useLanguage();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [showAiRecommendations, setShowAiRecommendations] = useState(aiRecommendations.length > 0);
  const [showFilters, setShowFilters] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [concepts, setConcepts] = useState<string[]>([]);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState([0, 10000000]);
  const [radius, setRadius] = useState(5);
  const [numberOfPlaces, setNumberOfPlaces] = useState(5);

  const conceptOptions = ['healthyFood', 'specialty', 'fastFood', 'vegetarian'];
  const purposeOptions = ['datingNight', 'familyGathering', 'businessMeeting', 'casualHangout', 'soloDining'];
  const amenityOptions = ['carParking', 'petFriendly', 'airConditioned', 'digitalPayment', 'kidsCorner'];
  const radiusOptions = [3, 5, 8, 10];

  const mockRestaurants: Restaurant[] = [
    { id: 1, name: 'Phở Hà Nội', lat: 50.55, lng: 50.65, image: 'https://images.unsplash.com/photo-1555126634-323283e090fa', rating: 4.5, price: '50,000đ - 100,000đ', cuisine: 'Việt Nam', address: '123 Đường ABC, Quận 1' },
    { id: 2, name: 'Sushi Master', lat: 50.65, lng: 50.75, image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351', rating: 4.8, price: '200,000đ - 500,000đ', cuisine: 'Nhật Bản', address: '456 Đường XYZ, Quận 2' },
    { id: 3, name: 'Pasta Paradise', lat: 50.75, lng: 50.45, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9', rating: 4.3, price: '150,000đ - 300,000đ', cuisine: 'Ý', address: '789 Đường DEF, Quận 3' },
    { id: 4, name: 'BBQ Heaven', lat: 50.45, lng: 50.85, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1', rating: 4.6, price: '300,000đ - 600,000đ', cuisine: 'Hàn Quốc', address: '321 Đường GHI, Quận 4' },
    { id: 5, name: 'Vegan Delight', lat: 50.85, lng: 50.55, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd', rating: 4.4, price: '80,000đ - 150,000đ', cuisine: 'Chay', address: '654 Đường JKL, Quận 5' },
    { id: 6, name: 'Burger House', lat: 50.6, lng: 50.7, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd', rating: 4.2, price: '100,000đ - 200,000đ', cuisine: 'Mỹ', address: '987 Đường MNO, Quận 6' },
    { id: 7, name: 'Dim Sum Palace', lat: 50.5, lng: 50.6, image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d', rating: 4.7, price: '120,000đ - 250,000đ', cuisine: 'Trung Quốc', address: '147 Đường PQR, Quận 7' },
    { id: 8, name: 'Taco Fiesta', lat: 50.7, lng: 50.5, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47', rating: 4.5, price: '90,000đ - 180,000đ', cuisine: 'Mexico', address: '258 Đường STU, Quận 8' },
    { id: 9, name: 'French Bistro', lat: 50.8, lng: 50.4, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0', rating: 4.9, price: '400,000đ - 800,000đ', cuisine: 'Pháp', address: '369 Đường VWX, Quận 9' },
    { id: 10, name: 'Thai Spice', lat: 50.4, lng: 50.9, image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e', rating: 4.6, price: '110,000đ - 220,000đ', cuisine: 'Thái Lan', address: '741 Đường YZ, Quận 10' },
  ];

  const handleSearch = () => {
    const selected = mockRestaurants.slice(0, numberOfPlaces);
    setRestaurants(selected);
    setShowFilters(false);
  };

  const toggleFilter = (filter: string, setState: React.Dispatch<React.SetStateAction<string[]>>) => {
    setState((prev) => (prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]));
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Back home button */}
      {!showFilters && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          onClick={onBackHome}
          className="absolute top-8 left-8 z-50 p-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-full shadow-lg hover:shadow-xl transition-all border border-neutral-200/50 dark:border-neutral-800/50"
        >
          <Home className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
        </motion.button>
      )}

      {/* Map container - Premium styling */}
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 relative overflow-hidden">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 40px),
                                repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 40px)`
            }} />
          </div>

          {/* Current location marker */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute inset-0 bg-blue-500/40 dark:bg-blue-400/30 rounded-full blur-2xl"
              />
              <div className="relative bg-blue-500 dark:bg-blue-400 p-3.5 rounded-full shadow-xl">
                <MapPin className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Restaurant markers */}
          <AnimatePresence>
            {restaurants.map((restaurant, index) => (
              <motion.div
                key={restaurant.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 * index, type: 'spring', damping: 15 }}
                className="absolute cursor-pointer z-20"
                style={{
                  left: `${restaurant.lng}%`,
                  top: `${restaurant.lat}%`,
                }}
                onClick={() => setSelectedRestaurant(restaurant)}
              >
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                    className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full blur-xl"
                  />
                  <div className="relative bg-gradient-to-br from-orange-500 to-red-600 p-2.5 rounded-full shadow-2xl border-2 border-white">
                    <Utensils className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Glassmorphism Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-8 top-8 bottom-8 w-full max-w-md z-30"
          >
            <div className="h-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/50 dark:border-neutral-700/50 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-6 h-6 text-orange-600" />
                  <h2 className="text-3xl font-bold text-neutral-800 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {t('search')}
                  </h2>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent" />

                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>

                {/* Concept filters */}
                <FilterSection
                  title={t('concept')}
                  options={conceptOptions}
                  selected={concepts}
                  onToggle={(option) => toggleFilter(option, setConcepts)}
                  t={t}
                />

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent" />

                {/* Purpose filters */}
                <FilterSection
                  title={t('purpose')}
                  options={purposeOptions}
                  selected={purposes}
                  onToggle={(option) => toggleFilter(option, setPurposes)}
                  t={t}
                />

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent" />

                {/* Amenities filters */}
                <FilterSection
                  title={t('amenities')}
                  options={amenityOptions}
                  selected={amenities}
                  onToggle={(option) => toggleFilter(option, setAmenities)}
                  t={t}
                />

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent" />

                {/* Budget range - Dual handle slider */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-neutral-700 dark:text-neutral-300" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {t('budgetRange')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                      <span>{formatCurrency(budgetRange[0])}đ</span>
                      <span>{formatCurrency(budgetRange[1])}đ</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10000000}
                      step={100000}
                      value={budgetRange[1]}
                      onChange={(e) => setBudgetRange([budgetRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r
                        [&::-webkit-slider-thumb]:from-orange-500 [&::-webkit-slider-thumb]:to-red-600
                        [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-orange-500
                        [&::-moz-range-thumb]:to-red-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent" />

                {/* Radius - Single slider with marks */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-neutral-700 dark:text-neutral-300" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {t('radius')} - {radius} km
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={1}
                      value={radiusOptions.indexOf(radius)}
                      onChange={(e) => setRadius(radiusOptions[parseInt(e.target.value)])}
                      className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r
                        [&::-webkit-slider-thumb]:from-orange-500 [&::-webkit-slider-thumb]:to-red-600
                        [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-orange-500
                        [&::-moz-range-thumb]:to-red-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
                    />
                    <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-500 px-1">
                      {radiusOptions.map((r) => (
                        <span key={r} className={radius === r ? 'text-orange-600 font-semibold' : ''}>{r}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent" />

                {/* Number of places */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-neutral-700 dark:text-neutral-300" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {t('numberOfPlaces')}
                  </h3>
                  <select
                    value={numberOfPlaces}
                    onChange={(e) => setNumberOfPlaces(parseInt(e.target.value))}
                    className="w-full px-4 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i === 0 ? 'quán' : 'quán'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search button - Fixed at bottom */}
              <div className="p-8 pt-6 border-t border-neutral-200/50 dark:border-neutral-700/50 bg-gradient-to-t from-white/60 to-transparent dark:from-neutral-900/60">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearch}
                  className="w-full py-5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold shadow-[0_8px_24px_rgba(255,143,67,0.4)] hover:shadow-[0_12px_32px_rgba(255,143,67,0.6)] transition-all"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {t('search')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restaurant detail popup */}
      <AnimatePresence>
        {selectedRestaurant && (
          <RestaurantDetail
            restaurant={selectedRestaurant}
            onClose={() => setSelectedRestaurant(null)}
            onConfirm={() => setSelectedRestaurant(null)}
          />
        )}
      </AnimatePresence>

      {/* AI Recommendations Panel */}
      <AnimatePresence>
        {showAiRecommendations && aiRecommendations.length > 0 && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute left-8 bottom-8 w-full max-w-sm z-20"
          >
            <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-neutral-700/50 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-neutral-200/50 dark:border-neutral-700/50 bg-gradient-to-r from-orange-500/10 to-red-500/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold text-neutral-800 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {t('aiRecommendationsTitle')}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAiRecommendations(false)}
                  className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  ×
                </button>
              </div>

              {/* Recommendations List */}
              <div className="max-h-80 overflow-y-auto">
                {aiRecommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border-b border-neutral-200/50 dark:border-neutral-700/50 last:border-b-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="space-y-2">
                      <h4 className="font-semibold text-neutral-800 dark:text-white text-sm">
                        {rec.name}
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {rec.address}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 italic">
                        {rec.reason}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show AI Recommendations Button (when hidden but has data) */}
      <AnimatePresence>
        {!showAiRecommendations && aiRecommendations.length > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setShowAiRecommendations(true)}
            className="absolute left-8 bottom-8 z-20 px-4 py-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-full shadow-lg border border-white/50 dark:border-neutral-700/50 flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-white hover:shadow-xl transition-all"
          >
            <Sparkles className="w-4 h-4 text-orange-500" />
            {t('aiRecommendationsTitle')}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FilterSectionProps {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  t: (key: string) => string;
}

function FilterSection({ title, options, selected, onToggle, t }: FilterSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-neutral-700 dark:text-neutral-300" style={{ fontFamily: 'Inter, sans-serif' }}>
        {title}
      </h3>
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => (
          <motion.button
            key={option}
            onClick={() => onToggle(option)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              selected.includes(option)
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {t(option)}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
