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
    radius: 'Bán kính',
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
    budgetRange: 'Budget Range',
    radius: 'Radius',
    numberOfPlaces: 'Number of Places',
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
