"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, Send, ImagePlus, ChevronDown, MapPin, X, Sparkles, Camera, Utensils, Loader2 } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { sendChatboxMessage, searchRestaurants } from "@/lib/api";
import type { RestaurantRecommendation } from "@/lib/types";

type AIMode = "restaurant" | "image" | "assistant";

export interface SuggestedRestaurant {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  price: string;
  address: string;
  lat: number;
  lng: number;
}

interface ChatMessage {
  id: number;
  role: "user" | "ai";
  text: string;
  imageUrl?: string;
  /** Đã có tọa độ (ví dụ sau khi ghép search) */
  restaurants?: SuggestedRestaurant[];
  /** Trả về từ BE /ai/chatbox — chưa có tọa độ, cần search để ghim bản đồ */
  beRecommendations?: RestaurantRecommendation[];
  menuTranslation?: { original: string; translated: string }[];
  type?: "text" | "restaurants" | "menu" | "food" | "place";
}

interface OdysseusAIProps {
  onShowRestaurantsOnMap: (restaurants: SuggestedRestaurant[]) => void;
  searchAnchor: { lat: number; lng: number };
  searchRadiusKm?: number;
}

export default function OdysseusAI({
  onShowRestaurantsOnMap,
  searchAnchor,
  searchRadiusKm = 15,
}: OdysseusAIProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AIMode>('restaurant');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setMessages([]);
    setUploadedImage(null);
  }, [mode]);

  const getWelcomeMessage = (): string => {
    switch (mode) {
      case 'restaurant': return t('aiWelcomeRestaurant');
      case 'image': return t('aiWelcomeImage');
      case 'assistant': return t('aiWelcomeAssistant');
    }
  };

  const getModeLabel = (m: AIMode): string => {
    switch (m) {
      case 'restaurant': return t('restaurantSuggestion');
      case 'image': return t('menuFoodCNN');
      case 'assistant': return t('aiAssistant');
    }
  };

  const getModeIcon = (m: AIMode) => {
    switch (m) {
      case 'restaurant': return <Utensils className="w-4 h-4" />;
      case 'image': return <Camera className="w-4 h-4" />;
      case 'assistant': return <Bot className="w-4 h-4" />;
    }
  };

  const handleSendRestaurant = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: Date.now(), role: "user", text, type: "text" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    try {
      const response = await sendChatboxMessage({ message: text });
      const list = response.recommendations ?? [];
      const notificationMessage = response.message;
      
      // Xác định text chính cho AI message
      let aiText = "";
      if (notificationMessage) {
        aiText = notificationMessage;
      } else if (list.length > 0) {
        aiText = `${t("aiSuggestingRestaurants").replace("...", "")} ${list.length} ${t("places")}:`;
      } else {
        aiText = t("aiNoResult");
      }
      
      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "ai",
        text: aiText,
        beRecommendations: list,
        type: list.length > 0 ? "restaurants" : "text",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const fallback = (err as Error).message || t("aiChatError");
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "ai", text: fallback, type: "text" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendImage = async () => {
    if (!uploadedImage) return;
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      text: "",
      imageUrl: uploadedImage,
      type: "text",
    };
    setMessages((prev) => [...prev, userMsg]);
    setUploadedImage(null);
    setIsLoading(true);
    try {
      const response = await sendChatboxMessage({
        message:
          "Người dùng vừa gửi ảnh (hệ thống chưa phân tích nội dung ảnh). Hãy gợi ý danh sách nhà hàng/quán ăn phù hợp tại TP. Hồ Chí Minh.",
      });
      const list = response.recommendations ?? [];
      const notificationMessage = response.message;
      
      // Xác định text chính cho AI message
      let aiText = "";
      if (notificationMessage) {
        aiText = notificationMessage;
      } else if (list.length > 0) {
        aiText = t("aiImageFood");
      } else {
        aiText = t("aiNoResult");
      }
      
      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "ai",
        text: aiText,
        beRecommendations: list,
        type: list.length > 0 ? "restaurants" : "text",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const fallback = (err as Error).message || t("aiChatError");
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "ai", text: fallback, type: "text" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = () => {
    if (mode === "restaurant") void handleSendRestaurant();
    else if (mode === "image") void handleSendImage();
  };

  const resolveBeToMapPins = async (recs: RestaurantRecommendation[]) => {
    setIsLoading(true);
    try {
      const resolved: SuggestedRestaurant[] = [];
      for (const rec of recs) {
        const resp = await searchRestaurants({
          query: rec.name,
          location: { lat: searchAnchor.lat, lng: searchAnchor.lng },
          radius_km: searchRadiusKm,
          limit: 10,
        });
        const items = resp.items ?? [];
        const q = rec.name.toLowerCase().trim();
        const match =
          items.find(
            (it) =>
              it.name.toLowerCase().includes(q.slice(0, Math.min(24, q.length))) ||
              (q.length >= 4 && q.includes(it.name.toLowerCase().slice(0, 12)))
          ) ?? items[0];

        if (match) {
          resolved.push({
            id: match.id,
            name: match.name,
            address: match.address,
            lat: match.latitude,
            lng: match.longitude,
            rating: match.rating,
            cuisine: rec.reason?.slice(0, 90) || "—",
            price: match.description?.slice(0, 72) || "—",
          });
        }
      }

      if (resolved.length === 0) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), role: "ai", text: t("aiNoResult"), type: "text" },
        ]);
        return;
      }

      onShowRestaurantsOnMap(resolved);
      setIsOpen(false);
    } catch (err) {
      const fallback = (err as Error).message || t("aiChatError");
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "ai", text: fallback, type: "text" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewMessageOnMap = async (msg: ChatMessage) => {
    if (msg.beRecommendations?.length) {
      await resolveBeToMapPins(msg.beRecommendations);
      return;
    }
    if (msg.restaurants?.length) {
      onShowRestaurantsOnMap(msg.restaurants);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* AI Toggle Button - positioned below Home button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`absolute top-24 left-8 z-50 p-4 rounded-full shadow-lg hover:shadow-xl transition-all border ${
          isOpen
            ? 'bg-gradient-to-r from-orange-500 to-red-600 border-orange-400/50 text-white'
            : 'bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border-neutral-200/50 dark:border-neutral-800/50'
        }`}
      >
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          {isOpen ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5 text-orange-500 dark:text-orange-400" />}
        </motion.div>
      </motion.button>

      {/* AI Panel - positioned to the RIGHT of the AI button */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -20, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ left: '5.5rem' }}
            className="absolute top-8 bottom-8 w-full max-w-sm z-40"
          >
            <div className="h-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/50 dark:border-neutral-700/50 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 pb-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl text-neutral-800 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {t('aiOdysseus')}
                  </h2>
                </div>

                {/* Mode Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowModeDropdown(!showModeDropdown)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 transition-all hover:border-orange-300 dark:hover:border-orange-600"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <div className="flex items-center gap-2">
                      {getModeIcon(mode)}
                      <span className="text-sm">{getModeLabel(mode)}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showModeDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50"
                      >
                        {(['restaurant', 'image', 'assistant'] as AIMode[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => { setMode(m); setShowModeDropdown(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                              mode === m
                                ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                            }`}
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            {getModeIcon(m)}
                            <span>{getModeLabel(m)}</span>
                            {m === 'assistant' && (
                              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400">
                                {t('aiComingSoon')}
                              </span>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent" />
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto px-6 space-y-4">
                {messages.length === 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {getWelcomeMessage()}
                      </p>
                    </div>
                  </motion.div>
                )}

                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {msg.role === 'ai' && (
                      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="" className="w-48 h-36 object-cover rounded-2xl" />
                      )}
                      {msg.text && (
                        <div className={`rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-tr-sm'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-tl-sm'
                        }`}>
                          <p className="text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{msg.text}</p>
                        </div>
                      )}

                      {msg.menuTranslation && (
                        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-4 space-y-2">
                          {msg.menuTranslation.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm border-b border-neutral-200 dark:border-neutral-700 last:border-0 pb-2 last:pb-0">
                              <span className="text-neutral-800 dark:text-neutral-200" style={{ fontFamily: 'Inter, sans-serif' }}>{item.original}</span>
                              <span className="text-orange-600 dark:text-orange-400 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>→ {item.translated}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.beRecommendations && msg.beRecommendations.length > 0 ? (
                        <div className="space-y-2">
                          {msg.beRecommendations.map((r, idx) => (
                            <div
                              key={`${r.name}-${idx}`}
                              className="rounded-2xl border border-neutral-200/50 bg-white p-3 shadow-sm dark:border-neutral-700/50 dark:bg-neutral-800/80"
                            >
                              <p
                                className="text-sm text-neutral-900 dark:text-white"
                                style={{ fontFamily: "Inter, sans-serif" }}
                              >
                                {r.name}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{r.address}</p>
                              <p className="mt-1 text-xs italic text-neutral-600 dark:text-neutral-300">
                                {r.reason}
                              </p>
                            </div>
                          ))}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => void handleViewMessageOnMap(msg)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-2.5 text-sm text-white shadow-md"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            <MapPin className="h-4 w-4" />
                            {t("aiViewOnMap")}
                          </motion.button>
                        </div>
                      ) : null}

                      {msg.restaurants && msg.restaurants.length > 0 ? (
                        <div className="space-y-2">
                          {msg.restaurants.map((r) => (
                            <div
                              key={r.id}
                              className="rounded-2xl border border-neutral-200/50 bg-white p-3 shadow-sm dark:border-neutral-700/50 dark:bg-neutral-800/80"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p
                                    className="text-sm text-neutral-900 dark:text-white"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                  >
                                    {r.name}
                                  </p>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {r.cuisine} · ⭐ {r.rating}
                                  </p>
                                  <p className="text-xs text-neutral-400 dark:text-neutral-500">{r.address}</p>
                                  <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">{r.price}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => void handleViewMessageOnMap(msg)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-2.5 text-sm text-white shadow-md"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            <MapPin className="h-4 w-4" />
                            {t("aiViewOnMap")}
                          </motion.button>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                        <span className="text-sm text-neutral-500 dark:text-neutral-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {mode === 'image' ? t('aiAnalyzing') : t('aiSuggestingRestaurants')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 pt-4 border-t border-neutral-200/50 dark:border-neutral-700/50 bg-gradient-to-t from-white/60 to-transparent dark:from-neutral-900/60">
                {mode === 'image' && uploadedImage && (
                  <div className="mb-3 relative inline-block">
                    <img src={uploadedImage} alt="" className="w-24 h-20 object-cover rounded-xl" />
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {mode === 'assistant' ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {t('aiComingSoon')} 🚀
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {mode === 'image' && (
                      <>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => fileInputRef.current?.click()}
                          className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-500 transition-all"
                        >
                          <ImagePlus className="w-5 h-5" />
                        </motion.button>
                      </>
                    )}

                    {mode === 'restaurant' && (
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleSend();
                          }
                        }}
                        placeholder={t('aiTypePlaceholder')}
                        className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm transition-all"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      />
                    )}

                    {mode === 'image' && !uploadedImage && (
                      <p className="flex-1 text-sm text-neutral-400 dark:text-neutral-500 px-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {t('aiUploadImage')}
                      </p>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSend}
                      disabled={mode === 'restaurant' ? !input.trim() : !uploadedImage}
                      className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
