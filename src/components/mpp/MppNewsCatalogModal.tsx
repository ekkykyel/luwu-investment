import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, Filter, Newspaper, Calendar, User, Eye, 
  Share2, ArrowRight, Tag, Bookmark, ChevronLeft, Sparkles,
  CheckCircle2, ExternalLink, ThumbsUp, MessageSquare, Clock,
  RefreshCw, AlertTriangle, WifiOff, Database
} from 'lucide-react';
import { 
  MppNewsItem, 
  getStoredMppNews, 
  fetchMppNewsWithFallback, 
  syncMppNewsWithServer 
} from '../../data/mppNewsData';
import { supabase } from '../../lib/supabaseClient';

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
  const [newsList, setNewsList] = useState<MppNewsItem[]>(() => getStoredMppNews());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'supabase' | 'server_api' | 'local_cache'>('local_cache');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [activeNews, setActiveNews] = useState<MppNewsItem | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [likedNews, setLikedNews] = useState<Record<string, boolean>>({});

  // Fetch news from Supabase with robust error handling
  const loadNewsData = useCallback(async (isInitial = false) => {
    if (isInitial && newsList.length === 0) {
      setIsLoading(true);
    }
    setErrorMessage(null);
    try {
      const res = await fetchMppNewsWithFallback({ includeDrafts: false });
      if (res.data && res.data.length > 0) {
        setNewsList(res.data);
      }
      setDataSource(res.fromSource);
      if (res.error && (!res.data || res.data.length === 0)) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      console.warn('[MppNewsCatalogModal] Load error:', err);
      setErrorMessage('Terjadi kendala saat menghubungkan ke database berita. Menggunakan arsip lokal.');
    } finally {
      setIsLoading(false);
    }
  }, [newsList.length]);

  // Sync news list from storage and handle realtime updates
  useEffect(() => {
    if (!isOpen) return;

    loadNewsData(true);

    // Event listener for cross-tab or local updates
    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setNewsList(e.detail);
      } else {
        setNewsList(getStoredMppNews());
      }
    };

    window.addEventListener('mpp_news_updated', handleUpdate);

    // Real-time Supabase postgres subscription on 'news' table
    let channel: any = null;
    try {
      channel = supabase
        .channel('public_news_catalog_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'news' },
          () => {
            loadNewsData(false);
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('[MppNewsCatalogModal] Realtime subscription notice:', e);
    }

    return () => {
      window.removeEventListener('mpp_news_updated', handleUpdate);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {}
      }
    };
  }, [isOpen, loadNewsData]);

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
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative w-full max-w-5xl h-[92vh] max-h-[860px] bg-white dark:bg-[#0B1120] border border-slate-300 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 font-sans"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              {activeNews && (
                <button
                  onClick={() => setActiveNews(null)}
                  className="p-2 rounded-xl bg-slate-200 hover:bg-emerald-500 hover:text-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all mr-1 flex items-center justify-center shadow-sm font-bold"
                  title="Kembali ke Katalog"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-inner">
                <Newspaper size={22} className="stroke-[2]" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{activeNews ? isEn ? 'Detail Berita & Informasi' : isZh ? '新闻详情' : 'Detail Berita & Pengumuman' : isEn ? 'Official News & Announcements' : isZh ? '官方新闻与公告' : 'Katalog Berita & Pengumuman'}</span>
                  {!activeNews && (
                    <span className="text-xs bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
                      {filteredNews.length} Publikasi
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
                  {isEn ? 'Official news, regional updates, and public service notices for MPP Simpurusiang Luwu' : isZh ? '鲁乌县辛普鲁西亚公共服务大厅官方新闻与公告' : 'Publikasi kegiatan resmi, info daerah, nasional, serta tips pelayanan MPP Simpurusiang Kabupaten Luwu'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadNewsData(false)}
                disabled={isLoading}
                title="Segarkan Data dari Supabase"
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
              >
                <RefreshCw size={15} className={isLoading ? 'animate-spin text-emerald-600' : ''} />
                <span className="hidden md:inline">{isLoading ? 'Memuat...' : 'Segarkan'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white transition-all shadow-sm"
                aria-label="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Error / Offline Status Notice if any */}
          {errorMessage && (
            <div className="px-5 sm:px-8 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => loadNewsData(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 dark:text-amber-200 font-bold text-[11px] underline"
              >
                Coba Lagi
              </button>
            </div>
          )}

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
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30 shadow-sm">
                    {activeNews.kategori}
                  </span>
                  {activeNews.isPinned && (
                    <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
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
                <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                      <User size={15} className="text-emerald-600 dark:text-emerald-400" />
                      {activeNews.penulis}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={15} className="text-emerald-600 dark:text-emerald-400" />
                      {activeNews.tanggal}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Eye size={15} className="text-emerald-600 dark:text-emerald-400" />
                      {activeNews.viewsCount || 350} Pembaca
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleLike(activeNews.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        likedNews[activeNews.id] 
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-400' 
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <ThumbsUp size={14} className={likedNews[activeNews.id] ? 'fill-current text-rose-600' : ''} />
                      <span>{likedNews[activeNews.id] ? 'Menyukai' : 'Suka'}</span>
                    </button>

                    <button
                      onClick={() => handleShare(activeNews)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold"
                    >
                      {copiedShare ? <CheckCircle2 size={14} /> : <Share2 size={14} />}
                      <span>{copiedShare ? 'Link Disalin!' : 'Bagikan'}</span>
                    </button>
                  </div>
                </div>

                {/* Hero Image Header */}
                <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-3xl overflow-hidden shadow-lg border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
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
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-500/30 text-slate-900 dark:text-emerald-200 font-semibold text-sm sm:text-base leading-relaxed italic shadow-sm">
                  "{getLocalizedSummary(activeNews)}"
                </div>

                {/* Isi Artikel Lengkap */}
                <div className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed space-y-4 font-sans whitespace-pre-line">
                  {getLocalizedContent(activeNews)}
                </div>

                {/* Footer Artikel & Berita Terkait */}
                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400" />
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
                          className="p-3.5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 hover:border-emerald-500/50 transition-all cursor-pointer flex gap-3 group"
                        >
                          <img 
                            src={rel.image} 
                            alt={rel.judul} 
                            className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform border border-slate-200 dark:border-slate-800"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                              {rel.kategori}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {getLocalizedTitle(rel)}
                            </h5>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="text-center pt-4">
                    <button
                      onClick={() => setActiveNews(null)}
                      className="px-6 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 transition-all shadow-md inline-flex items-center gap-2"
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
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isEn ? "Search news, topics, or authors..." : isZh ? "搜索新闻、主题或作者..." : "Cari judul berita, topik, atau penulis..."}
                      className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm font-medium"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
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
                        className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-1.5 ${
                          selectedCategory === cat
                            ? 'bg-emerald-600 text-white font-extrabold ring-2 ring-emerald-500/40'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 hover:border-emerald-500/60 hover:text-emerald-700 dark:hover:text-emerald-400'
                        }`}
                      >
                        {cat === 'Semua' && <Filter size={13} />}
                        <span>{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loading Skeleton */}
                {isLoading && newsList.length === 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map((sk) => (
                      <div key={sk} className="bg-slate-100 dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-pulse flex flex-col h-72">
                        <div className="h-44 bg-slate-200 dark:bg-slate-800 w-full" />
                        <div className="p-5 space-y-3 flex-1">
                          <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/3" />
                          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-4/5" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredNews.length === 0 ? (
                  <div className="py-16 text-center space-y-3 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
                    <div className="w-14 h-14 rounded-full bg-amber-500/15 text-amber-600 mx-auto flex items-center justify-center">
                      <Newspaper size={28} />
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      Tidak Ada Berita Ditemukan
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                      Coba sesuaikan kata kunci pencarian atau ganti kategori untuk menampilkan berita & publikasi resmi lainnya.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('Semua');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-sm"
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
                        className="group bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer flex flex-col h-full relative"
                      >
                        {/* Image Header */}
                        <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
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
                            <span className="px-3 py-0.5 rounded-full bg-slate-950/85 backdrop-blur-md text-[10px] font-extrabold text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                              {item.kategori}
                            </span>
                            {item.isPinned && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold flex items-center gap-1">
                                <Sparkles size={10} />
                                Pin
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content Body */}
                        <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} className="text-emerald-600 dark:text-emerald-400" />
                                {item.tanggal}
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={12} className="text-emerald-600 dark:text-emerald-400" />
                                {item.penulis}
                              </span>
                            </div>

                            <h4 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                              {getLocalizedTitle(item)}
                            </h4>

                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed font-normal">
                              {getLocalizedSummary(item)}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <span className="inline-flex items-center gap-1">
                              <span>Baca Selengkapnya</span>
                              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
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

