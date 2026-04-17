import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  vi: {
    startJourney: 'Bắt đầu hành trình',
    settings: 'Cài đặt',
    language: 'Ngôn ngữ',
    theme: 'Chế độ',
    light: 'Sáng',
    dark: 'Tối',
    vietnamese: 'Tiếng Việt',
    english: 'English',
    searchPlaceholder: 'Hãy nhập địa điểm bạn muốn tìm ở đây (nếu bạn muốn)',
    concept: 'Concept',
    purpose: 'Mục đích',
    amenities: 'Tiện ích',
    budgetRange: 'Khoảng ngân sách',
    numberOfPlaces: 'Số lượng quán',
    search: 'FoOdyssey',
    healthyFood: 'Healthy food',
    specialty: 'Specialty',
    fastFood: 'Fast food',
    vegetarian: 'Vegetarian',
    datingNight: 'Dating night',
    familyGathering: 'Family gathering',
    businessMeeting: 'Business meeting',
    casualHangout: 'Casual hangout',
    soloDining: 'Solo dining',
    carParking: 'Car Parking',
    petFriendly: 'Pet-friendly',
    airConditioned: 'Air-conditioned',
    digitalPayment: 'Digital Payment',
    kidsCorner: "Kid's Corner",
    iWillEatHere: 'I will eat here!',
    holdOn: 'Hold on',
    journeyComplete: 'Hành trình hoàn tất!',
    backToHome: 'Bạn có muốn quay về màn hình chính không?',
    continueBrowsing: 'Tôi muốn xem tiếp',
    yes: 'Có',
    backHome: 'Trở về nhà',
    appTitle: 'FoOdyssey',
    appSubtitle: 'Khám phá hành trình ẩm thực của bạn',
    aiChatPlaceholder: 'Hỏi AI về nhà hàng bạn muốn tìm...',
    aiChatSend: 'Gửi',
    aiChatLoading: 'AI đang suy nghĩ...',
    aiChatError: 'Có lỗi xảy ra. Vui lòng thử lại.',
    aiRecommendationsTitle: 'Gợi ý từ AI',
    aiNoRecommendations: 'Không có gợi ý nào. Hãy thử hỏi khác nhé!',
    radius: 'Bán kính tìm kiếm',
    km: 'km',
    restaurants: 'quán',
    loadingFilters: 'Đang tải bộ lọc...',
    filterError: 'Không tải được bộ lọc từ server',
    useMockData: 'Dùng dữ liệu mẫu',
    searching: 'Đang tìm...',
    noResults: 'Chưa có kết quả',
    noResultsDesc: 'Hãy điều chỉnh bộ lọc và tìm kiếm để xem nhà hàng trên bản đồ',
    openFilters: 'Mở bộ lọc',
    locationDenied: 'Đang sử dụng vị trí mặc định (TP.HCM)',
    mockModeOn: 'Đang dùng dữ liệu mẫu',
    mockModeOff: 'Đang dùng dữ liệu thật',
    refreshMap: 'Làm mới bản đồ',
    switchMockPrompt: 'Đã chuyển chế độ. Vui lòng tìm kiếm lại để cập nhật dữ liệu.',
    price: 'Giá',
    address: 'Địa chỉ',
    phone: 'Điện thoại',
    openingHours: 'Giờ mở cửa',
    description: 'Mô tả',
    loading: 'Đang tải...',
  },
  en: {
    startJourney: 'Start Your Journey',
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    vietnamese: 'Tiếng Việt',
    english: 'English',
    searchPlaceholder: 'Enter the location you want to find (optional)',
    concept: 'Concept',
    purpose: 'Purpose',
    amenities: 'Amenities',
    search: 'FoOdyssey',
    healthyFood: 'Healthy food',
    specialty: 'Specialty',
    fastFood: 'Fast food',
    vegetarian: 'Vegetarian',
    datingNight: 'Dating night',
    familyGathering: 'Family gathering',
    businessMeeting: 'Business meeting',
    casualHangout: 'Casual hangout',
    soloDining: 'Solo dining',
    carParking: 'Car Parking',
    petFriendly: 'Pet-friendly',
    airConditioned: 'Air-conditioned',
    digitalPayment: 'Digital Payment',
    kidsCorner: "Kid's Corner",
    iWillEatHere: 'I will eat here!',
    holdOn: 'Hold on',
    journeyComplete: 'Journey Complete!',
    backToHome: 'Would you like to return to the home screen?',
    continueBrowsing: 'Continue browsing',
    yes: 'Yes',
    backHome: 'Back Home',
    appTitle: 'FoOdyssey',
    appSubtitle: 'Discover your culinary journey',
    aiChatPlaceholder: 'Ask AI about restaurants you want to find...',
    aiChatSend: 'Send',
    aiChatLoading: 'AI is thinking...',
    aiChatError: 'An error occurred. Please try again.',
    aiRecommendationsTitle: 'AI Recommendations',
    aiNoRecommendations: 'No recommendations found. Try asking something different!',
    budgetRange: 'Budget Range',
    radius: 'Search Radius',
    numberOfPlaces: 'Number of Results',
    km: 'km',
    restaurants: 'places',
    loadingFilters: 'Loading filters...',
    filterError: 'Could not load filters from server',
    useMockData: 'Use sample data',
    searching: 'Searching...',
    noResults: 'No results yet',
    noResultsDesc: 'Adjust filters and search to see restaurants on the map',
    openFilters: 'Open Filters',
    locationDenied: 'Using default location (Ho Chi Minh City)',
    mockModeOn: 'Using sample data',
    mockModeOff: 'Using real data',
    refreshMap: 'Refresh Map',
    switchMockPrompt: 'Mode switched. Please search again to update data.',
    price: 'Price',
    address: 'Address',
    phone: 'Phone',
    openingHours: 'Opening Hours',
    description: 'Description',
    loading: 'Loading...',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('vi');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.vi] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
