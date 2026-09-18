import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Newspaper, Plus, Search, Edit3, Trash2, Eye, Pin, CheckCircle2, 
  X, Image as ImageIcon, Sparkles, RefreshCw, AlertCircle, FileText,
  Calendar, User, Tag, Layers, Share2, Filter, Globe
} from 'lucide-react';
import { MppNewsItem, getStoredMppNews, saveMppNews, INITIAL_MPP_NEWS } from '../../data/mppNewsData';

const PRESET_IMAGES = [
  { name: 'Giat MPP & Gedung', url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' },
  { name: 'Rapat & Layanan', url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' },
  { name: 'Nasional & Pembangunan', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' },
  { name: 'Tips & Edukasi', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' },
  { name: 'Smart City & Digital', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' },
];

export const MppNewsAdminManager: React.FC = () => {
  const [newsList, setNewsList] = useState<MppNewsItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'published' | 'draft'>('semua');

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<MppNewsItem | null>(null);
  const [previewNews, setPreviewNews] = useState<MppNewsItem | null>(null);

  // Form Fields
  const [formJudul, setFormJudul] = useState('');
  const [formJudulEn, setFormJudulEn] = useState('');
  const [formKategori, setFormKategori] = useState<MppNewsItem['kategori']>('Giat Kegiatan MPP');
  const [formPenulis, setFormPenulis] = useState('Humas Pemkab Luwu');
  const [formTanggal, setFormTanggal] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formRingkasan, setFormRingkasan] = useState('');
  const [formIsiLengkap, setFormIsiLengkap] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = () => {
    const data = getStoredMppNews();
    setNewsList(data);
  };

  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const openCreateModal = () => {
    setEditingNews(null);
    setFormJudul('');
    setFormJudulEn('');
    setFormKategori('Giat Kegiatan MPP');
    setFormPenulis('Humas Pemkab Luwu');
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    setFormTanggal(todayStr);
    setFormImage(PRESET_IMAGES[0].url);
    setFormRingkasan('');
    setFormIsiLengkap('');
    setFormIsPinned(false);
    setFormStatus('published');
    setIsFormOpen(true);
  };

  const openEditModal = (item: MppNewsItem) => {
    setEditingNews(item);
    setFormJudul(item.judul);
    setFormJudulEn(item.judul_en || '');
    setFormKategori(item.kategori);
    setFormPenulis(item.penulis);
    setFormTanggal(item.tanggal);
    setFormImage(item.image);
    setFormRingkasan(item.ringkasan);
    setFormIsiLengkap(item.isiLengkap);
    setFormIsPinned(!!item.isPinned);
    setFormStatus(item.status);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formJudul.trim() || !formRingkasan.trim() || !formIsiLengkap.trim()) {
      showNotif('error', 'Harap lengkapi Judul, Ringkasan, dan Isi Artikel Berita.');
      return;
    }

    let updatedList = [...newsList];

    if (editingNews) {
      // Edit existing
      updatedList = updatedList.map(n => {
        if (n.id === editingNews.id) {
          return {
            ...n,
            judul: formJudul,
            judul_en: formJudulEn || undefined,
            kategori: formKategori,
            penulis: formPenulis,
            tanggal: formTanggal,
            image: formImage || PRESET_IMAGES[0].url,
            ringkasan: formRingkasan,
            isiLengkap: formIsiLengkap,
            isPinned: formIsPinned,
            status: formStatus
          };
        }
        return n;
      });
      showNotif('success', 'Berita berhasil diperbarui dan dipublikasikan.');
    } else {
      // Create new
      const newNews: MppNewsItem = {
        id: `news-${Date.now()}`,
        judul: formJudul,
        judul_en: formJudulEn || undefined,
        kategori: formKategori,
        penulis: formPenulis || 'Admin MPP Simpurusiang',
        tanggal: formTanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        image: formImage || PRESET_IMAGES[0].url,
        ringkasan: formRingkasan,
        isiLengkap: formIsiLengkap,
        isPinned: formIsPinned,
        status: formStatus,
        viewsCount: 1
      };
      updatedList = [newNews, ...updatedList];
      showNotif('success', 'Berita baru berhasil dibuat dan diterbitkan ke Portal MPP!');
    }

    saveMppNews(updatedList);
    setNewsList(updatedList);
    setIsFormOpen(false);
  };

  const handleDelete = (id: string, judul: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus berita: "${judul}"?`)) {
      const updated = newsList.filter(n => n.id !== id);
      saveMppNews(updated);
      setNewsList(updated);
      showNotif('success', 'Berita berhasil dihapus.');
    }
  };

  const togglePin = (id: string) => {
    const updated = newsList.map(n => {
      if (n.id === id) {
        return { ...n, isPinned: !n.isPinned };
      }
      return n;
    });
    saveMppNews(updated);
    setNewsList(updated);
    showNotif('success', 'Status Pinned/Featured berita berhasil diperbarui.');
  };

  const toggleStatus = (id: string) => {
    const updated = newsList.map(n => {
      if (n.id === id) {
        const nextStatus: 'published' | 'draft' = n.status === 'published' ? 'draft' : 'published';
        return { ...n, status: nextStatus };
      }
      return n;
    });
    saveMppNews(updated);
    setNewsList(updated);
    showNotif('success', 'Status publikasi berita berhasil diperbarui.');
  };

  const handleResetDefaults = () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan daftar berita ke data standar Pemkab Luwu?')) {
      saveMppNews(INITIAL_MPP_NEWS);
      setNewsList(INITIAL_MPP_NEWS);
      showNotif('success', 'Data berita berhasil direset ke standar awal.');
    }
  };

  // Filtered List
  const filteredList = newsList.filter(item => {
    const matchesCat = selectedCategory === 'Semua' || item.kategori === selectedCategory;
    const matchesStatus = statusFilter === 'semua' || item.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || item.judul.toLowerCase().includes(q) || item.ringkasan.toLowerCase().includes(q) || item.penulis.toLowerCase().includes(q);
    return matchesCat && matchesStatus && matchesSearch;
  });

  const publishedCount = newsList.filter(n => n.status === 'published').length;
  const draftCount = newsList.filter(n => n.status === 'draft').length;
  const pinnedCount = newsList.filter(n => n.isPinned).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl border shadow-xl flex items-center justify-between text-xs sm:text-sm font-semibold ${
              notification.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="p-1 rounded-lg hover:bg-black/10">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner & Stat Cards */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900/90 via-slate-900 to-teal-950 text-white border border-emerald-500/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Sparkles size={14} />
              Kelola Publikasi & Informasi Portal
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Modul Berita MPP Simpurusiang
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Buat, sunting, dan terbitkan berita giat kegiatan MPP, info perizinan daerah, nasional, serta tips pelayanan publik langsung ke Portal Utama MPP Simpurusiang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openCreateModal}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95"
            >
              <Plus size={18} className="stroke-[2.5]" />
              <span>Tulis Berita Baru</span>
            </button>

            <button
              onClick={handleResetDefaults}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs border border-white/10"
              title="Reset ke Berita Standar Pemkab Luwu"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-300 block">Total Berita Terbit</span>
            <span className="text-xl font-extrabold text-emerald-400">{publishedCount} Artikel</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-300 block">Draf / Disimpan</span>
            <span className="text-xl font-extrabold text-amber-400">{draftCount} Draf</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-300 block">Berita Pinned / Utama</span>
            <span className="text-xl font-extrabold text-teal-300">{pinnedCount} Pinned</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul berita atau penulis..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Giat Kegiatan MPP">Giat Kegiatan MPP</option>
            <option value="Berita Daerah">Berita Daerah</option>
            <option value="Berita Nasional">Berita Nasional</option>
            <option value="Berita Internasional">Berita Internasional</option>
            <option value="Tips & Edukasi">Tips & Edukasi</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="semua">Semua Status</option>
            <option value="published">Terbit (Published)</option>
            <option value="draft">Draf (Draft)</option>
          </select>
        </div>
      </div>

      {/* News List / Cards */}
      {filteredList.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <Newspaper className="w-12 h-12 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Belum ada berita yang sesuai dengan filter.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-3 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Tulis Berita Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Header Image */}
              <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.judul}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    {item.kategori}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    item.status === 'published' 
                      ? 'bg-emerald-500/90 text-white border-emerald-400' 
                      : 'bg-amber-500/90 text-slate-950 border-amber-400'
                  }`}>
                    {item.status === 'published' ? 'Terbit' : 'Draf'}
                  </span>
                </div>

                <button
                  onClick={() => togglePin(item.id)}
                  className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all ${
                    item.isPinned
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-950/60 text-slate-300 border-white/20 hover:text-amber-400'
                  }`}
                  title={item.isPinned ? "Lepas Pinned" : "Pin Berita Utama"}
                >
                  <Pin size={13} className={item.isPinned ? "fill-current" : ""} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-emerald-500" />
                      {item.tanggal}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <User size={12} className="text-emerald-500" />
                      {item.penulis}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {item.judul}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.ringkasan}
                  </p>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewNews(item)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-600 transition-all text-xs font-semibold flex items-center gap-1"
                    title="Pratinjau Artikel"
                  >
                    <Eye size={14} />
                    <span>Pratinjau</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleStatus(item.id)}
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${
                        item.status === 'published'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {item.status === 'published' ? 'Jadikan Draf' : 'Terbitkan'}
                    </button>

                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                      title="Edit Berita"
                    >
                      <Edit3 size={14} />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id, item.judul)}
                      className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                      title="Hapus Berita"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM: TAMBAH / EDIT BERITA */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-900 dark:text-slate-100 font-sans"
            >
              {/* Form Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Newspaper size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {editingNews ? 'Edit Berita Portal MPP' : 'Tulis Berita Baru MPP Simpurusiang'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Lengkapi informasi di bawah untuk menerbitkan publikasi resmi ke portal.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
                {/* Judul Berita */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>Judul Berita (Bahasa Indonesia) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formJudul}
                    onChange={(e) => setFormJudul(e.target.value)}
                    placeholder="Contoh: Peresmian Integrasi 26 Gerai Pelayanan di MPP Simpurusiang"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Judul Bahasa Inggris (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Globe size={13} className="text-emerald-500" />
                    <span>Judul Berita Bahasa Inggris (English Translation - Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formJudulEn}
                    onChange={(e) => setFormJudulEn(e.target.value)}
                    placeholder="Example: Inauguration of 26 Integrated Service Counters at MPP Simpurusiang"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Row: Kategori & Penulis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kategori Berita *</label>
                    <select
                      value={formKategori}
                      onChange={(e) => setFormKategori(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Giat Kegiatan MPP">Giat Kegiatan MPP</option>
                      <option value="Berita Daerah">Berita Daerah</option>
                      <option value="Berita Nasional">Berita Nasional</option>
                      <option value="Berita Internasional">Berita Internasional</option>
                      <option value="Tips & Edukasi">Tips & Edukasi</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Penulis / Sumber *</label>
                    <input
                      type="text"
                      required
                      value={formPenulis}
                      onChange={(e) => setFormPenulis(e.target.value)}
                      placeholder="Contoh: Humas Pemkab Luwu / Admin MPP"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Tanggal & Image Presets */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal Publikasi</label>
                      <input
                        type="text"
                        value={formTanggal}
                        onChange={(e) => setFormTanggal(e.target.value)}
                        placeholder="Contoh: 17 September 2026"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">URL Gambar Header *</label>
                      <input
                        type="url"
                        required
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Image Preset Chips */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <ImageIcon size={12} />
                      Pilih Gambar Preset Cepat (Opsional):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_IMAGES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormImage(preset.url)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                            formImage === preset.url
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ringkasan Berita */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ringkasan Singkat (Excerpt) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formRingkasan}
                    onChange={(e) => setFormRingkasan(e.target.value)}
                    placeholder="Tuliskan 1-2 kalimat ringkasan artikel berita yang menarik untuk ditampilkan di kartu depan portal..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Isi Artikel Lengkap */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Isi Berita Lengkap *
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={formIsiLengkap}
                    onChange={(e) => setFormIsiLengkap(e.target.value)}
                    placeholder="Tuliskan seluruh isi berita, poin-poin kegiatan, kutipan narasi pejabat/pengelola MPP, dan himbauan untuk masyarakat..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                  />
                </div>

                {/* Checkbox Pinned & Radio Status */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPinned}
                      onChange={(e) => setFormIsPinned(e.target.checked)}
                      className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Pin size={14} className="text-amber-500" />
                      Pin di Halaman Utama (Featured Article)
                    </span>
                  </label>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Status:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <input
                        type="radio"
                        name="status"
                        value="published"
                        checked={formStatus === 'published'}
                        onChange={() => setFormStatus('published')}
                        className="text-emerald-500"
                      />
                      <span>Terbit (Published)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <input
                        type="radio"
                        name="status"
                        value="draft"
                        checked={formStatus === 'draft'}
                        onChange={() => setFormStatus('draft')}
                        className="text-amber-500"
                      />
                      <span>Simpan Draf</span>
                    </label>
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>{editingNews ? 'Simpan Perubahan' : 'Terbitkan Berita Sekarang'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL PREVIEW ARTICLE */}
      <AnimatePresence>
        {previewNews && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                  Pratinjau Artikel Berita
                </span>
                <button onClick={() => setPreviewNews(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-block">
                  {previewNews.kategori}
                </span>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {previewNews.judul}
                </h2>

                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span>Oleh: {previewNews.penulis}</span>
                  <span>•</span>
                  <span>{previewNews.tanggal}</span>
                </div>

                <img 
                  src={previewNews.image} 
                  alt={previewNews.judul} 
                  className="w-full h-56 rounded-2xl object-cover border border-slate-200 dark:border-slate-800"
                />

                <p className="text-xs text-slate-700 dark:text-slate-300 italic p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  "{previewNews.ringkasan}"
                </p>

                <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {previewNews.isiLengkap}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
