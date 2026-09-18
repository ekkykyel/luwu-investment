import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, Filter, Newspaper, Calendar, User, Eye, 
  Share2, ArrowRight, Tag, Bookmark, ChevronLeft, Sparkles,
  CheckCircle2, ExternalLink, ThumbsUp, MessageSquare, Clock
} from 'lucide-react';
import { MppNewsItem, getStoredMppNews, syncMppNewsWithServer } from '../../data/mppNewsData';

interface MppNewsCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang?: string;
  isDark?: boolean;
  selectedNewsId?: string | null;
}

export const MppNewsCatalogModal: React.FC<MppNewsCatalogModalProps> = ({
  isOpen,
  onClose,
  currentLang = 'id',
  isDark = false,
  selectedNewsId = null
}) => {
  const [newsList, setNewsList] = useState<MppNewsItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [activeNews, setActiveNews] = useState<MppNewsItem | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [likedNews, setLikedNews] = useState<Record<string, boolean>>({});

  // Sync news list from storage and handle updates
  useEffect(() => {
    const data = getStoredMppNews();
    setNewsList(data);

    if (isOpen) {
      syncMppNewsWithServer().then(res => {
        if (res && res.length > 0) setNewsList(res);
      });
    }

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setNewsList(e.detail);
      } else {
        setNewsList(getStoredMppNews());
      }
    };

    window.addEventListener('mpp_news_updated', handleUpdate);
    return () => window.removeEventListener('mpp_news_updated', handleUpdate);
  }, [isOpen]);

  // Handle auto-selecting specific news if passed
  useEffect(() => {
    if (selectedNewsId && newsList.length > 0) {
      const found = newsList.find(n => n.id === selectedNewsId);
      if (found) {
        setActiveNews(found);
      }
    }
  }, [selectedNewsId, newsList]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeNews) {
          setActiveNews(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeNews, onClose]);

  const categories = useMemo(() => [
    'Semua',
    'Giat Kegiatan MPP',
    'Berita Daerah',
    'Berita Nasional',
    'Berita Internasional',
    'Tips & Edukasi'
  ], []);

  // Filtering
  const filteredNews = useMemo(() => {
    return newsList.filter(item => {
      if (item.status === 'draft') return false;

      const matchesCat = selectedCategory === 'Semua' || item.kategori === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCat;

      const title = (item.judul || '').toLowerCase();
      const summary = (item.ringkasan || '').toLowerCase();
      const content = (item.isiLengkap || '').toLowerCase();
      const author = (item.penulis || '').toLowerCase();

      const matchesSearch = title.includes(q) || summary.includes(q) || content.includes(q) || author.includes(q);
      return matchesCat && matchesSearch;
    });
  }, [newsList, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const isEn = currentLang?.startsWith('en');
  const isZh = currentLang?.startsWith('zh');

  const getLocalizedTitle = (item: MppNewsItem) => {
    if (isEn && item.judul_en) return item.judul_en;
    if (isZh && item.judul_zh) return item.judul_zh;
    return item.judul;
  };

  const getLocalizedSummary = (item: MppNewsItem) => {
    if (isEn && item.ringkasan_en) return item.ringkasan_en;
    if (isZh && item.ringkasan_zh) return item.ringkasan_zh;
    return item.ringkasan;
  };

  const getLocalizedContent = (item: MppNewsItem) => {
    if (isEn && item.isiLengkap_en) return item.isiLengkap_en;
    if (isZh && item.isiLengkap_zh) return item.isiLengkap_zh;
    return item.isiLengkap;
  };

  const handleShare = (item: MppNewsItem) => {
    const title = getLocalizedTitle(item);
    const text = `${title} - Portal MPP Simpurusiang Kab. Luwu`;
    if (navigator.share) {
      navigator.share({
        title: title,
        text: text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} (${window.location.href})`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const toggleLike = (id: string) => {
    setLikedNews(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (activeNews) {
              setActiveNews(null);
            } else {
              onClose();
            }
          }}
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 font-sans"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              {activeNews && (
                <button
                  onClick={() => setActiveNews(null)}
                  className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500 hover:text-white transition-all mr-1 flex items-center justify-center shadow-sm"
                  title="Kembali ke Katalog"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-inner">
                <Newspaper size={22} className="stroke-[2]" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{activeNews ? isEn ? 'Detail Berita & Informasi' : isZh ? '新闻详情' : 'Detail Berita & Pengumuman' : isEn ? 'Official News & Announcements' : isZh ? '官方新闻与公告' : 'Katalog Berita & Pengumuman'}</span>
                  {!activeNews && (
                    <span className="text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                      {filteredNews.length} Publikasi
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  {isEn ? 'Official news, regional updates, and public service notices for MPP Simpurusiang Luwu' : isZh ? '鲁乌县辛普鲁西亚公共服务大厅官方新闻与公告' : 'Publikasi kegiatan resmi, info daerah, nasional, serta tips pelayanan MPP Simpurusiang Kabupaten Luwu'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white transition-all shadow-sm"
              aria-label="Tutup Modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
            {activeNews ? (
              /* --- VIEW: DETAIL READER BERITA --- */
              <motion.article 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto space-y-6"
              >
                {/* Badge Kategori & Pinned */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                    {activeNews.kategori}
                  </span>
                  {activeNews.isPinned && (
                    <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5 shadow-sm">
                      <Sparkles size={12} />
                      Featured Article
                    </span>
                  )}
                </div>

                {/* Judul Berita */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight font-sans">
                  {getLocalizedTitle(activeNews)}
                </h1>

                {/* Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <User size={15} className="text-emerald-500" />
                      {activeNews.penulis}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={15} className="text-emerald-500" />
                      {activeNews.tanggal}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Eye size={15} className="text-emerald-500" />
                      {activeNews.viewsCount || 350} Pembaca
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleLike(activeNews.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        likedNews[activeNews.id] 
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400' 
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <ThumbsUp size={14} className={likedNews[activeNews.id] ? 'fill-current' : ''} />
                      <span>{likedNews[activeNews.id] ? 'Menyukai' : 'Suka'}</span>
                    </button>

                    <button
                      onClick={() => handleShare(activeNews)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-xs font-semibold"
                    >
                      {copiedShare ? <CheckCircle2 size={14} /> : <Share2 size={14} />}
                      <span>{copiedShare ? 'Link Disalin!' : 'Bagikan'}</span>
                    </button>
                  </div>
                </div>

                {/* Hero Image Header */}
                <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                  <img 
                    src={activeNews.image} 
                    alt={activeNews.judul}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Ringkasan Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-500/20 text-slate-800 dark:text-emerald-200 font-medium text-sm sm:text-base leading-relaxed italic">
                  "{getLocalizedSummary(activeNews)}"
                </div>

                {/* Isi Artikel Lengkap */}
                <div className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed space-y-4 font-sans whitespace-pre-line">
                  {getLocalizedContent(activeNews)}
                </div>

                {/* Footer Artikel & Berita Terkait */}
                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-500" />
                    <span>Berita & Informasi Lainnya</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {newsList
                      .filter(n => n.id !== activeNews.id && n.status === 'published')
                      .slice(0, 2)
                      .map(rel => (
                        <div
                          key={rel.id}
                          onClick={() => setActiveNews(rel)}
                          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-emerald-500/50 transition-all cursor-pointer flex gap-3 group"
                        >
                          <img 
                            src={rel.image} 
                            alt={rel.judul} 
                            className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                              {rel.kategori}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-500 transition-colors">
                              {getLocalizedTitle(rel)}
                            </h5>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="text-center pt-4">
                    <button
                      onClick={() => setActiveNews(null)}
                      className="px-6 py-2.5 rounded-2xl bg-emerald-500 text-white font-semibold text-xs sm:text-sm hover:bg-emerald-600 transition-all shadow-md inline-flex items-center gap-2"
                    >
                      <ChevronLeft size={16} />
                      <span>Kembali ke Katalog Berita</span>
                    </button>
                  </div>
                </div>
              </motion.article>
            ) : (
              /* --- VIEW: KATALOG & FILTER BERITA --- */
              <>
                {/* Controls Bar: Search & Category Chips */}
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative w-full max-w-xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isEn ? "Search news, topics, or authors..." : isZh ? "搜索新闻、主题或作者..." : "Cari judul berita, topik, atau penulis..."}
                      className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Category Chips Horizontal Scroll */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar pt-1 justify-start sm:justify-center">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm flex items-center gap-1.5 ${
                          selectedCategory === cat
                            ? 'bg-emerald-500 text-white font-bold ring-2 ring-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                      >
                        {cat === 'Semua' && <Filter size={13} />}
                        <span>{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* News Grid */}
                {filteredNews.length === 0 ? (
                  <div className="py-16 text-center space-y-3 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                      <Newspaper size={28} />
                    </div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      Tidak Ada Berita Ditemukan
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Coba sesuaikan kata kunci pencarian atau ganti kategori untuk menampilkan berita & publikasi resmi lainnya.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('Semua');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium text-xs hover:bg-emerald-600 transition-all shadow-sm"
                    >
                      Reset Filter
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredNews.map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ y: -6 }}
                        onClick={() => setActiveNews(item)}
                        className="group bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer flex flex-col h-full relative"
                      >
                        {/* Image Header */}
                        <div className="relative h-44 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0">
                          <img
                            src={item.image}
                            alt={item.judul}
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            <span className="px-3 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                              {item.kategori}
                            </span>
                            {item.isPinned && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center gap-1">
                                <Sparkles size={10} />
                                Pin
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content Body */}
                        <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} className="text-emerald-500" />
                                {item.tanggal}
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={12} className="text-emerald-500" />
                                {item.penulis}
                              </span>
                            </div>

                            <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors line-clamp-2 leading-snug">
                              {getLocalizedTitle(item)}
                            </h4>

                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {getLocalizedSummary(item)}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="inline-flex items-center gap-1">
                              <span>Baca Selengkapnya</span>
                              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal flex items-center gap-1">
                              <Eye size={11} />
                              {item.viewsCount || 300}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
