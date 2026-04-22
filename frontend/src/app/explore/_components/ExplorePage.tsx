"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { ArrowLeft, Star, Eye, MessageCircle, Clock, X } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageContext';

interface Article {
  id: number | string;
  title: string;
  description?: string;
  image: string;
  category?: string;
  readTime?: string;
  views?: number;
  comments?: number;
  date?: string;
}

interface ExplorePageProps {
  onBackHome: () => void;
  theme: 'light' | 'dark';
}

export default function ExplorePage({ onBackHome, theme }: ExplorePageProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const latestNewsScrollRef = useRef<HTMLDivElement>(null);
  const latestNewsDragStateRef = useRef({ isDragging: false, startX: 0, scrollLeft: 0, moved: false });
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [visibleArticles, setVisibleArticles] = useState(6);

  const startMouseDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    const container = latestNewsScrollRef.current;
    if (!container) return;

    latestNewsDragStateRef.current.isDragging = true;
    latestNewsDragStateRef.current.startX = event.pageX - container.offsetLeft;
    latestNewsDragStateRef.current.scrollLeft = container.scrollLeft;
    latestNewsDragStateRef.current.moved = false;
  };

  const moveMouseDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    const container = latestNewsScrollRef.current;
    if (!container || !latestNewsDragStateRef.current.isDragging) return;

    event.preventDefault();
    const x = event.pageX - container.offsetLeft;
    const walk = (x - latestNewsDragStateRef.current.startX) * 1.15;
    if (Math.abs(walk) > 4) {
      latestNewsDragStateRef.current.moved = true;
    }
    container.scrollLeft = latestNewsDragStateRef.current.scrollLeft - walk;
  };

  const endMouseDrag = () => {
    latestNewsDragStateRef.current.isDragging = false;
  };

  const suppressClickAfterDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    if (latestNewsDragStateRef.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      latestNewsDragStateRef.current.moved = false;
    }
  };

  const { scrollY } = useScroll({ container: containerRef });
  const heroY = useTransform(scrollY, [0, 400], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  const articles = useMemo(
    () => [
      { id: 1, title: t('exploreArticle1Title'), description: t('exploreArticle1Desc'), image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836', category: t('categoryStreetFood'), readTime: '5 min' },
      { id: 2, title: t('exploreArticle2Title'), description: t('exploreArticle2Desc'), image: 'https://images.unsplash.com/photo-1559847844-5315695dadae', category: t('categoryFineDining'), readTime: '8 min' },
      { id: 3, title: t('exploreArticle3Title'), description: t('exploreArticle3Desc'), image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352', category: t('categoryHealthy'), readTime: '6 min' },
      { id: 4, title: t('exploreArticle4Title'), description: t('exploreArticle4Desc'), image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d', category: t('categoryNightlife'), readTime: '7 min' },
      { id: 5, title: t('exploreArticle5Title'), description: t('exploreArticle5Desc'), image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe', category: t('categoryTraditional'), readTime: '10 min' },
      { id: 6, title: t('exploreArticle6Title'), description: t('exploreArticle6Desc'), image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38', category: t('categoryFusion'), readTime: '6 min' },
    ],
    [t],
  );

  const latestNews = useMemo(
    () => [
      { id: 1, title: t('categoryStreetFood') + ': Top 10 2026', image: 'https://images.unsplash.com/photo-1677837698681-a0055f7e82da?w=400', date: '15/04/2026' },
      { id: 2, title: 'Bánh mì Sài Gòn — World\'s Best', image: 'https://images.unsplash.com/photo-1600454309261-3dc9b7597637?w=400', date: '12/04/2026' },
      { id: 3, title: 'Phở & Bún bò Festival', image: 'https://images.unsplash.com/photo-1701480253822-1842236c9a97?w=400', date: '10/04/2026' },
      { id: 4, title: 'Cà phê Sài Gòn — Hidden Gems', image: 'https://images.unsplash.com/photo-1762390157744-128c1460ae2d?w=400', date: '08/04/2026' },
      { id: 5, title: 'Rooftop Dining Guide', image: 'https://images.unsplash.com/photo-1748591633514-5a7524bc38c3?w=400', date: '05/04/2026' },
      { id: 6, title: 'Dim Sum & Dumplings', image: 'https://images.unsplash.com/photo-1496116155751-2833e0c42786?w=400', date: '02/04/2026' },
      { id: 7, title: 'Seafood Night Market', image: 'https://images.unsplash.com/photo-1761314037182-8ea3363cf3a3?w=400', date: '28/03/2026' },
    ],
    [t],
  );

  const popularArticles = useMemo(
    () => [
      { id: 1, title: t('exploreArticle1Title'), description: t('exploreArticle1Desc'), image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836', category: t('categoryStreetFood'), views: 12400, comments: 234 },
      { id: 2, title: t('exploreArticle4Title'), description: t('exploreArticle4Desc'), image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d', category: t('categoryNightlife'), views: 9800, comments: 187 },
      { id: 3, title: t('exploreArticle2Title'), description: t('exploreArticle2Desc'), image: 'https://images.unsplash.com/photo-1559847844-5315695dadae', category: t('categoryFineDining'), views: 8500, comments: 156 },
    ],
    [t],
  );

  const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

  return (
    <div
      ref={containerRef}
      className={`w-full h-screen overflow-y-auto ${theme === 'dark' ? 'bg-neutral-950' : 'bg-neutral-50'}`}
    >
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center gap-4">
          <motion.button
            onClick={onBackHome}
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-full bg-white dark:bg-neutral-800 shadow-lg hover:shadow-xl transition-all border border-neutral-200 dark:border-neutral-700"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
          </motion.button>
          <h1 className="text-3xl text-neutral-800 dark:text-neutral-100" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('explore')}
          </h1>
        </div>
      </header>

      {/* Hero Section with Parallax */}
      <section ref={heroRef} className="relative h-96 overflow-hidden">
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 -top-20 bottom-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 h-[130%]" />
        </motion.div>
        <div className="absolute inset-0 bg-black/30" />
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative h-full flex items-center justify-center text-center px-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-6xl text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              {t('exploreHeroTitle')}
            </h2>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              {t('exploreHeroDesc')}
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Articles Grid */}
      <section
        className="max-w-7xl mx-auto px-8 py-20"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 1200px' }}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.slice(0, visibleArticles).map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              onClick={() => setSelectedArticle(article)}
              className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-neutral-200 dark:border-neutral-800"
            >
              <div className="relative h-56 overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-4 py-1.5 bg-orange-500 text-white text-xs rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {article.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
                  <span>{article.readTime}</span>
                </div>
                <h3 className="text-xl text-neutral-800 dark:text-neutral-100 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {article.title}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {article.description}
                </p>
                <span className="text-orange-600 dark:text-orange-400 text-sm hover:underline" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {t('readMore')} →
                </span>
              </div>
            </motion.article>
          ))}
        </div>
        {visibleArticles < articles.length && (
          <div className="flex justify-center mt-12">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setVisibleArticles(articles.length)}
              className="px-8 py-3 bg-gradient-to-r from-[#FF4B2B] to-[#FF8122] text-white rounded-full shadow-lg hover:shadow-xl transition-all"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {t('seeMore')}
            </motion.button>
          </div>
        )}
      </section>

      {/* Latest Food News — Horizontal Scroll */}
      <section
        className="max-w-7xl mx-auto px-8 pb-20"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 1000px' }}
      >
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl text-neutral-800 dark:text-neutral-100 mb-8"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {t('latestFoodNews')}
        </motion.h2>

        <div
          ref={latestNewsScrollRef}
          className="overflow-x-auto overscroll-x-contain scroll-smooth pb-4 -mx-2 px-2 scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-proximity touch-pan-x cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          onMouseDown={startMouseDrag}
          onMouseMove={moveMouseDrag}
          onMouseUp={endMouseDrag}
          onMouseLeave={endMouseDrag}
          onClickCapture={suppressClickAfterDrag}
        >
          <div className="flex gap-5 w-max">
            {latestNews.map((news, index) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => setSelectedArticle({ ...news, description: t('exploreArticleDesc'), category: t('latestFoodNews'), readTime: '4 min' })}
                className="w-[82vw] max-w-64 flex-shrink-0 snap-start bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer border border-neutral-200 dark:border-neutral-800"
              >
                <div className="relative h-36 overflow-hidden">
                  <Image
                    src={news.image}
                    alt={news.title}
                    fill
                    sizes="256px"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <h4 className="text-sm text-neutral-800 dark:text-neutral-100 mb-2 line-clamp-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {news.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>{news.date}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles — Large Cards */}
      <section
        className="max-w-7xl mx-auto px-8 pb-24"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 1200px' }}
      >
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl text-neutral-800 dark:text-neutral-100 mb-8"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {t('popularArticles')}
        </motion.h2>

        <div className="flex flex-col gap-8">
          {popularArticles.map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedArticle(article)}
              className="flex flex-col md:flex-row bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-neutral-200 dark:border-neutral-800"
            >
              {/* Large image */}
              <div className="md:w-2/5 h-64 md:h-auto overflow-hidden relative">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-4 py-1.5 bg-orange-500 text-white text-xs rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {article.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-8 flex flex-col justify-center">
                <h3 className="text-2xl md:text-3xl text-neutral-800 dark:text-neutral-100 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {article.title}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-base" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {article.description}
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-6 mb-5">
                  <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                    <Eye className="w-4.5 h-4.5 text-orange-500" />
                    <span className="text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {formatNumber(article.views)} {t('views')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                    <MessageCircle className="w-4.5 h-4.5 text-orange-500" />
                    <span className="text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {article.comments} {t('comments')}
                    </span>
                  </div>
                </div>

                <span className="text-orange-600 dark:text-orange-400 text-sm hover:underline w-fit" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {t('readMore')} →
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Article Detail Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedArticle(null)}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800"
            >
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-5 right-5 z-10 p-2.5 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur shadow-lg hover:scale-110 transition-transform"
                aria-label={t('close')}
              >
                <X className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
              </button>
              <div className="relative h-72 overflow-hidden">
                <Image
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover"
                  loading="lazy"
                />
                {selectedArticle.category && (
                  <div className="absolute top-5 left-5">
                    <span className="px-4 py-1.5 bg-orange-500 text-white text-xs rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {selectedArticle.category}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-8">
                <h2 className="text-3xl md:text-4xl text-neutral-800 dark:text-neutral-100 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {selectedArticle.title}
                </h2>
                <div className="flex flex-wrap items-center gap-5 text-sm text-neutral-500 dark:text-neutral-400 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {selectedArticle.readTime && (
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{selectedArticle.readTime}</span>
                  )}
                  {selectedArticle.views !== undefined && (
                    <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{formatNumber(selectedArticle.views)} {t('views')}</span>
                  )}
                  {selectedArticle.comments !== undefined && (
                    <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" />{selectedArticle.comments} {t('comments')}</span>
                  )}
                  {selectedArticle.date && (
                    <span>{selectedArticle.date}</span>
                  )}
                </div>
                <p className="text-neutral-700 dark:text-neutral-300 mb-4 text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {selectedArticle.description}
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Sài Gòn từ lâu đã là điểm đến ẩm thực hàng đầu Đông Nam Á với sự giao thoa giữa truyền thống và hiện đại. Từ những gánh hàng rong ven đường đến nhà hàng fine-dining đạt sao Michelin, thành phố này mang đến vô vàn trải nghiệm vị giác độc đáo cho bất kỳ ai đặt chân đến.
                </p>
                <div className="mt-8 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedArticle(null)}
                    className="px-6 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {t('close')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
