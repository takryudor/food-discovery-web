"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowLeft, Star, Eye, MessageCircle, Clock } from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface ExplorePageProps {
  onBackHome: () => void;
  theme: 'light' | 'dark';
}

export default function ExplorePage({ onBackHome, theme }: ExplorePageProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll({ container: containerRef });
  const heroY = useTransform(scrollY, [0, 400], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  const articles = [
    { id: 1, title: t('exploreArticle1Title'), description: t('exploreArticle1Desc'), image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836', category: t('categoryStreetFood'), readTime: '5 min' },
    { id: 2, title: t('exploreArticle2Title'), description: t('exploreArticle2Desc'), image: 'https://images.unsplash.com/photo-1559847844-5315695dadae', category: t('categoryFineDining'), readTime: '8 min' },
    { id: 3, title: t('exploreArticle3Title'), description: t('exploreArticle3Desc'), image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352', category: t('categoryHealthy'), readTime: '6 min' },
    { id: 4, title: t('exploreArticle4Title'), description: t('exploreArticle4Desc'), image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d', category: t('categoryNightlife'), readTime: '7 min' },
    { id: 5, title: t('exploreArticle5Title'), description: t('exploreArticle5Desc'), image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe', category: t('categoryTraditional'), readTime: '10 min' },
    { id: 6, title: t('exploreArticle6Title'), description: t('exploreArticle6Desc'), image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38', category: t('categoryFusion'), readTime: '6 min' },
  ];

  const latestNews = [
    { id: 1, title: t('categoryStreetFood') + ': Top 10 2026', image: 'https://images.unsplash.com/photo-1677837698681-a0055f7e82da?w=400', date: '15/04/2026' },
    { id: 2, title: 'Bánh mì Sài Gòn — World\'s Best', image: 'https://images.unsplash.com/photo-1600454309261-3dc9b7597637?w=400', date: '12/04/2026' },
    { id: 3, title: 'Phở & Bún bò Festival', image: 'https://images.unsplash.com/photo-1701480253822-1842236c9a97?w=400', date: '10/04/2026' },
    { id: 4, title: 'Cà phê Sài Gòn — Hidden Gems', image: 'https://images.unsplash.com/photo-1762390157744-128c1460ae2d?w=400', date: '08/04/2026' },
    { id: 5, title: 'Rooftop Dining Guide', image: 'https://images.unsplash.com/photo-1748591633514-5a7524bc38c3?w=400', date: '05/04/2026' },
    { id: 6, title: 'Dim Sum & Dumplings', image: 'https://images.unsplash.com/photo-1496116155751-2833e0c42786?w=400', date: '02/04/2026' },
    { id: 7, title: 'Seafood Night Market', image: 'https://images.unsplash.com/photo-1761314037182-8ea3363cf3a3?w=400', date: '28/03/2026' },
  ];

  const popularArticles = [
    { id: 1, title: t('exploreArticle1Title'), description: t('exploreArticle1Desc'), image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836', category: t('categoryStreetFood'), views: 12400, comments: 234 },
    { id: 2, title: t('exploreArticle4Title'), description: t('exploreArticle4Desc'), image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d', category: t('categoryNightlife'), views: 9800, comments: 187 },
    { id: 3, title: t('exploreArticle2Title'), description: t('exploreArticle2Desc'), image: 'https://images.unsplash.com/photo-1559847844-5315695dadae', category: t('categoryFineDining'), views: 8500, comments: 156 },
  ];

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
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-neutral-200 dark:border-neutral-800"
            >
              <div className="relative h-56 overflow-hidden">
                <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
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
      </section>

      {/* Latest Food News — Horizontal Scroll */}
      <section className="max-w-7xl mx-auto px-8 pb-20">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl text-neutral-800 dark:text-neutral-100 mb-8"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {t('latestFoodNews')}
        </motion.h2>

        <div className="overflow-x-auto pb-4 -mx-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-5 px-2 w-max">
            {latestNews.map((news, index) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="w-64 flex-shrink-0 bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer border border-neutral-200 dark:border-neutral-800"
              >
                <div className="h-36 overflow-hidden">
                  <img src={news.image} alt={news.title} className="w-full h-full object-cover" />
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
      <section className="max-w-7xl mx-auto px-8 pb-24">
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
              className="flex flex-col md:flex-row bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-neutral-200 dark:border-neutral-800"
            >
              {/* Large image */}
              <div className="md:w-2/5 h-64 md:h-auto overflow-hidden relative">
                <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
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
    </div>
  );
}
