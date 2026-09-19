import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Plus, Edit3, Trash2, ArrowUp, ArrowDown, Settings, 
  CheckCircle2, X, Sparkles, Image as ImageIcon, RefreshCw, Eye, 
  Play, Pause, Sliders, Layers, Check, AlertCircle
} from 'lucide-react';
import { 
  MagattiPhotoItem, 
  MagattiSlideshowSettings, 
  getStoredMagattiPhotos, 
  saveMagattiPhotos, 
  getStoredMagattiSettings, 
  saveMagattiSettings, 
  DEFAULT_MAGATTI_PHOTOS 
} from '../../data/mppMagattiGalleryData';
import { MppMagattiGallerySlideshow } from './MppMagattiGallerySlideshow';

const PRESET_PHOTO_TEMPLATES = [
  {
    title: 'Gedung Tampak Depan MPP Simpurusiang Belopa',
    category: 'Tampak Depan' as const,
    caption: 'Fasad utama Gedung Mal Pelayanan Publik Simpurusiang Kabupaten Luwu di Jalan Pahlawan Belopa.',
    url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80'
  },
  {
    title: 'Ruang Loket Pelayanan Terpadu Satu Atap',
    category: 'Ruang Loket' as const,
    caption: 'Area loket pelayanan 26 gerai instansi terintegrasi dengan sistem pemanggil antrean otomatis.',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80'
  },
  {
    title: 'Lobby Utama & Konsierge Asisten Digital',
    category: 'Lobby & Konsierge' as const,
    caption: 'Lobby penerimaan warga dilengkapi petugas ramah, Kios Digital Mandiri, dan layar statistik live.',
    url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80'
  },
  {
    title: 'Anjungan Mandiri & Kiosk Cetak Dokumen',
    category: 'Fasilitas Digital' as const,
    caption: 'Fasilitas mandiri warga untuk mencetak KTP-el, NIB UMKM, serta verifikasi berkas secara mandiri.',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80'
  },
  {
    title: 'Lounge Pelayanan VIP Fast-Track Investor',
    category: 'Lounge VIP' as const,
    caption: 'Ruang konsultasi khusus investor dan pelaku usaha dengan fasilitas konsultasi privat.',
    url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80'
  }
];

export const MppMagattiAdminManager: React.FC = () => {
  const [photos, setPhotos] = useState<MagattiPhotoItem[]>([]);
  const [settings, setSettings] = useState<MagattiSlideshowSettings>(getStoredMagattiSettings());

  // Form modal state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<MagattiPhotoItem | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Form inputs
  const [formTitle, setFormTitle] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategory, setFormCategory] = useState<MagattiPhotoItem['category']>('Tampak Depan');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPhotos(getStoredMagattiPhotos());
    setSettings(getStoredMagattiSettings());
  };

  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const openAddModal = () => {
    setEditingPhoto(null);
    setFormTitle('');
    setFormCaption('');
    setFormUrl(PRESET_PHOTO_TEMPLATES[0].url);
    setFormCategory('Tampak Depan');
    setIsPhotoModalOpen(true);
  };

  const openEditModal = (photo: MagattiPhotoItem) => {
    setEditingPhoto(photo);
    setFormTitle(photo.title);
    setFormCaption(photo.caption);
    setFormUrl(photo.url);
    setFormCategory(photo.category);
    setIsPhotoModalOpen(true);
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) {
      showNotif('error', 'Judul foto dan URL Gambar wajib diisi.');
      return;
    }

    let updatedList = [...photos];

    if (editingPhoto) {
      updatedList = updatedList.map(p => {
        if (p.id === editingPhoto.id) {
          return {
            ...p,
            title: formTitle,
            caption: formCaption,
            url: formUrl,
            category: formCategory
          };
        }
        return p;
      });
      showNotif('success', 'Foto galeri berhasil diperbarui.');
    } else {
      const newPhoto: MagattiPhotoItem = {
        id: `magatti-${Date.now()}`,
        title: formTitle,
        caption: formCaption,
        url: formUrl,
        category: formCategory,
        isActive: true,
        order: updatedList.length + 1
      };
      updatedList.push(newPhoto);
      showNotif('success', 'Foto baru berhasil ditambahkan ke Galeri Pelayanan Magatti!');
    }

    saveMagattiPhotos(updatedList);
    setPhotos(updatedList);
    setIsPhotoModalOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus foto "${title}"?`)) {
      const updated = photos.filter(p => p.id !== id);
      saveMagattiPhotos(updated);
      setPhotos(updated);
      showNotif('success', 'Foto berhasil dihapus.');
    }
  };

  const toggleActive = (id: string) => {
    const updated = photos.map(p => {
      if (p.id === id) {
        return { ...p, isActive: !p.isActive };
      }
      return p;
    });
    saveMagattiPhotos(updated);
    setPhotos(updated);
    showNotif('success', 'Status keaktifan foto diperbarui.');
  };

  const moveOrder = (id: string, dir: 'up' | 'down') => {
    const index = photos.findIndex(p => p.id === id);
    if (index === -1) return;
    if (dir === 'up' && index === 0) return;
    if (dir === 'down' && index === photos.length - 1) return;

    const updated = [...photos];
    const targetIndex = dir === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Recalculate order numbers
    const reordered = updated.map((p, idx) => ({ ...p, order: idx + 1 }));
    saveMagattiPhotos(reordered);
    setPhotos(reordered);
    showNotif('success', 'Urutan penayangan foto diperbarui.');
  };

  const handleSaveSettings = (newSettings: Partial<MagattiSlideshowSettings>) => {
    const updated = { ...settings, ...newSettings };
    saveMagattiSettings(updated);
    setSettings(updated);
    showNotif('success', 'Pengaturan animasi slideshow berhasil disimpan.');
  };

  const handleResetDefaults = () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan Galeri Foto Magatti ke foto standar Pemkab Luwu?')) {
      saveMagattiPhotos(DEFAULT_MAGATTI_PHOTOS);
      setPhotos(DEFAULT_MAGATTI_PHOTOS);
      showNotif('success', 'Galeri foto berhasil direset ke standar awal.');
    }
  };

  const activeCount = photos.filter(p => p.isActive).length;

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

      {/* Top Banner Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 text-white border border-teal-500/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Sparkles size={14} />
              Kelola Slideshow Pelayanan Magatti
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Galeri Foto Gedung & Ruang Pelayanan MPP
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Atur koleksi foto tampak depan Gedung MPP Simpurusiang Kab. Luwu, ruang loket, lobby, serta fasilitas digital yang ditayangkan secara bergantian dengan animasi di card utama Portal MPP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openAddModal}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95"
            >
              <Plus size={18} className="stroke-[2.5]" />
              <span>Tambah Foto Baru</span>
            </button>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs border border-white/10 flex items-center gap-2"
            >
              <Sliders size={16} />
              <span>Atur Animasi</span>
            </button>

            <button
              onClick={handleResetDefaults}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs border border-white/10"
              title="Reset ke Foto Standar Pemkab Luwu"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Stats Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-300 block">Total Foto Aktif</span>
            <span className="text-xl font-extrabold text-emerald-400">{activeCount} Foto</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-300 block">Efek Animasi</span>
            <span className="text-xl font-extrabold text-teal-300 uppercase">{settings.animationType}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-300 block">Durasi Transisi</span>
            <span className="text-xl font-extrabold text-amber-300">{(settings.intervalMs / 1000).toFixed(1)}s / Slide</span>
          </div>
        </div>
      </div>

      {/* Live Preview Canvas Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="text-emerald-500" size={18} />
            <span>Pratinjau Langsung Card 'Pelayanan Magatti' Portal MPP</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Tampilan Otomatis Sesuai Pengaturan
          </span>
        </div>

        <div className="w-full aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-slate-950">
          <MppMagattiGallerySlideshow />
        </div>
      </div>

      {/* Photo List Management Table/Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="text-emerald-500" size={18} />
            <span>Daftar Foto Galeri MPP Simpurusiang ({photos.length})</span>
          </h3>

          <span className="text-xs text-slate-500 font-medium">
            Gunakan panah atas/bawah untuk mengubah urutan slide
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((item, index) => (
            <div
              key={item.id}
              className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 ${
                item.isActive
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-900 opacity-60'
              }`}
            >
              <div className="space-y-3">
                {/* Photo Thumbnail */}
                <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    <span className="w-6 h-6 rounded-full bg-slate-950/80 backdrop-blur-md text-white font-mono text-[11px] font-bold flex items-center justify-center border border-white/10">
                      #{item.order}
                    </span>
                  </div>
                </div>

                {/* Title & Caption */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.caption || 'Belum ada deskripsi foto.'}
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                {/* Order Up / Down */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveOrder(item.id, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-100 transition-all text-xs"
                    title="Naikkan Urutan"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveOrder(item.id, 'down')}
                    disabled={index === photos.length - 1}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-100 transition-all text-xs"
                    title="Turunkan Urutan"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                {/* Status Toggle & Edit/Delete */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleActive(item.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                      item.isActive
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {item.isActive ? 'Aktif' : 'Nonaktif'}
                  </button>

                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                    title="Edit Foto"
                  >
                    <Edit3 size={14} />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                    title="Hapus Foto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL FORM: TAMBAH / EDIT FOTO */}
      <AnimatePresence>
        {isPhotoModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-900 dark:text-slate-100 font-sans"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {editingPhoto ? 'Edit Foto Magatti' : 'Tambah Foto Galeri Magatti'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Foto ini akan ditampilkan secara bergantian dengan efek animasi di card Portal MPP.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="p-2 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSavePhoto} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Judul / Nama Foto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Contoh: Gedung Tampak Depan MPP Simpurusiang Belopa"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kategori Area Foto *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Tampak Depan">Tampak Depan Gedung</option>
                    <option value="Ruang Loket">Ruang Loket Pelayanan</option>
                    <option value="Lobby & Konsierge">Lobby & Konsierge</option>
                    <option value="Fasilitas Digital">Fasilitas & Anjungan Mandiri</option>
                    <option value="Lounge VIP">Lounge VIP Investor</option>
                  </select>
                </div>

                {/* URL Header */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    URL Gambar Foto *
                  </label>
                  <input
                    type="url"
                    required
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Preset Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <ImageIcon size={12} />
                    Pilihan Preset Gambar Cepat:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PRESET_PHOTO_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFormTitle(tmpl.title);
                          setFormCategory(tmpl.category);
                          setFormCaption(tmpl.caption);
                          setFormUrl(tmpl.url);
                        }}
                        className={`p-2.5 rounded-xl text-left text-xs border transition-all ${
                          formUrl === tmpl.url
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                        }`}
                      >
                        <span className="block font-bold text-[11px]">{tmpl.category}: {tmpl.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Caption */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Keterangan Singkat / Caption Foto
                  </label>
                  <textarea
                    rows={2}
                    value={formCaption}
                    onChange={(e) => setFormCaption(e.target.value)}
                    placeholder="Tuliskan keterangan suasana foto, lokasi, atau fasilitas yang ada..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>{editingPhoto ? 'Simpan Perubahan' : 'Tambahkan Foto'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL SETTINGS: ANIMASI & TIMER */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 text-slate-900 dark:text-slate-100 font-sans"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Sliders className="text-emerald-500" size={20} />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Pengaturan Animasi Slideshow
                  </h3>
                </div>
                <button onClick={() => setIsSettingsModalOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={16} />
                </button>
              </div>

              {/* Interval Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Durasi Pergantian Tiap Foto:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3000, 5000, 7000, 10000].map((ms) => (
                    <button
                      key={ms}
                      type="button"
                      onClick={() => handleSaveSettings({ intervalMs: ms })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        settings.intervalMs === ms
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {ms / 1000}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation Type Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Gaya Efek Transisi Animasi:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'kenburns', label: 'Ken Burns (Zoom Smooth)' },
                    { id: 'slide3d', label: 'Slide 3D Perspective' },
                    { id: 'blurFade', label: 'Glass Blur Transition' },
                    { id: 'fadeZoom', label: 'Fade & Scale' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleSaveSettings({ animationType: type.id as any })}
                      className={`p-3 rounded-2xl text-left text-xs font-bold border transition-all ${
                        settings.animationType === type.id
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AutoPlay Toggle */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Pemutaran Otomatis (Auto-Play)
                </span>
                <input
                  type="checkbox"
                  checked={settings.autoPlay}
                  onChange={(e) => handleSaveSettings({ autoPlay: e.target.checked })}
                  className="w-4 h-4 text-emerald-500 rounded"
                />
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs"
                >
                  Selesai & Terapkan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
