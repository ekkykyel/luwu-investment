import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Share2,
  Instagram,
  Youtube,
  Facebook,
  Music2,
  Globe,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Eye,
  ExternalLink,
  MessageCircle,
  Heart,
  Play,
  ArrowRight,
  Send,
  Upload,
  Link2,
  Info
} from 'lucide-react';
import {
  MppSocialMediaSettings,
  DEFAULT_MPP_SOCIAL_MEDIA,
  getStoredMppSocialMedia,
  syncMppSocialMediaWithServer
} from '../../data/mppSocialMediaData';

const PRESET_SOCIAL_IMAGES = [
  { name: 'Pelayanan Loket MPP', url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&q=80&w=800' },
  { name: 'Gedung & Fasilitas', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800' },
  { name: 'Sosialisasi & Rapat', url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=800' },
  { name: 'Konsultasi Warga', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800' },
  { name: 'Kiosk & Digitalisasi', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800' }
];

export const MppSocialMediaAdminManager: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => {
  const [settings, setSettings] = useState<MppSocialMediaSettings>(DEFAULT_MPP_SOCIAL_MEDIA);
  const [activePlatform, setActivePlatform] = useState<'instagram' | 'youtube' | 'facebook' | 'tiktok'>('instagram');
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loaded = getStoredMppSocialMedia();
    setSettings(loaded);
  }, []);

  const triggerToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await syncMppSocialMediaWithServer(settings);
      triggerToast('success', 'Konten & link media sosial resmi MPP berhasil disinkronkan ke Portal Publik!');
    } catch (err) {
      console.error(err);
      triggerToast('error', 'Gagal menyimpan media sosial.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Kembalikan seluruh data media sosial ke pengaturan standar resmi?')) {
      setSettings(DEFAULT_MPP_SOCIAL_MEDIA);
      syncMppSocialMediaWithServer(DEFAULT_MPP_SOCIAL_MEDIA);
      triggerToast('success', 'Pengaturan media sosial dikembalikan ke default.');
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 text-left">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/40'
                : 'bg-rose-950/90 text-rose-400 border border-rose-500/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Integrasi Media Sosial
            </span>
            <span className="text-xs text-slate-500">• Seksi Portal MPP</span>
          </div>
          <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Kelola Sosial Media Resmi MPP Kabupaten Luwu</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Atur postingan unggulan, tautan profil, gambar feed, video profil, dan statistik interaksi untuk Instagram, YouTube, Facebook, dan TikTok yang tampil pada seksi Sosial Media di Portal MPP Simpurusiang.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              previewMode
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{previewMode ? 'Sembunyikan Preview' : 'Lihat Live Preview'}</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            title="Reset ke Default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Platform Tabs Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setActivePlatform('instagram')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer border ${
            activePlatform === 'instagram'
              ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white border-transparent shadow-md'
              : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
          }`}
        >
          <Instagram className="w-4 h-4" />
          <span>Instagram Feed</span>
        </button>
        <button
          type="button"
          onClick={() => setActivePlatform('youtube')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer border ${
            activePlatform === 'youtube'
              ? 'bg-red-600 text-white border-transparent shadow-md'
              : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
          }`}
        >
          <Youtube className="w-4 h-4" />
          <span>YouTube Official</span>
        </button>
        <button
          type="button"
          onClick={() => setActivePlatform('facebook')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer border ${
            activePlatform === 'facebook'
              ? 'bg-[#1877F2] text-white border-transparent shadow-md'
              : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
          }`}
        >
          <Facebook className="w-4 h-4" />
          <span>Facebook Page</span>
        </button>
        <button
          type="button"
          onClick={() => setActivePlatform('tiktok')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer border ${
            activePlatform === 'tiktok'
              ? 'bg-slate-800 text-white border-slate-600 shadow-md'
              : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
          }`}
        >
          <Music2 className="w-4 h-4" />
          <span>TikTok Official</span>
        </button>
      </div>

      {/* Main Configuration Form */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* PLATFORM 1: INSTAGRAM */}
        {activePlatform === 'instagram' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Username / Handle Instagram
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">@</span>
                  <input
                    type="text"
                    required
                    value={settings.instagram.handle.replace(/^@/, '')}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        instagram: { ...settings.instagram, handle: e.target.value.replace(/^@/, '') }
                      })
                    }
                    placeholder="dpmptspkabluwu"
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Tautan Profil Instagram (URL Follow)
                </label>
                <input
                  type="url"
                  required
                  value={settings.instagram.profileUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      instagram: { ...settings.instagram, profileUrl: e.target.value }
                    })
                  }
                  placeholder="https://instagram.com/dpmptspluwu"
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Tag / Label Badge Postingan
                </label>
                <input
                  type="text"
                  value={settings.instagram.tag}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      instagram: { ...settings.instagram, tag: e.target.value }
                    })
                  }
                  placeholder="Pelayanan Prima"
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Statistik Interaksi (Likes & Komentar)
                </label>
                <input
                  type="text"
                  value={settings.instagram.stats}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      instagram: { ...settings.instagram, stats: e.target.value }
                    })
                  }
                  placeholder="1.2K Likes • 84 Komentar"
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  URL Banner / Foto Postingan Instagram
                </label>
                <input
                  type="url"
                  value={settings.instagram.postImage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      instagram: { ...settings.instagram, postImage: e.target.value }
                    })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">Pilihan Gambar:</span>
                  {PRESET_SOCIAL_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          instagram: { ...settings.instagram, postImage: preset.url }
                        })
                      }
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 whitespace-nowrap transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Narasi / Caption Postingan Instagram
                </label>
                <textarea
                  rows={2}
                  value={settings.instagram.caption}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      instagram: { ...settings.instagram, caption: e.target.value }
                    })
                  }
                  placeholder="Tuliskan ringkasan informasi atau ajakan di postingan Instagram..."
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* PLATFORM 2: YOUTUBE */}
        {activePlatform === 'youtube' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Nama Channel YouTube
                </label>
                <input
                  type="text"
                  required
                  value={settings.youtube.channelName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      youtube: { ...settings.youtube, channelName: e.target.value }
                    })
                  }
                  placeholder="MPP Simpurusiang Official"
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Tautan Channel YouTube (URL Subscribe)
                </label>
                <input
                  type="url"
                  required
                  value={settings.youtube.channelUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      youtube: { ...settings.youtube, channelUrl: e.target.value }
                    })
                  }
                  placeholder="https://youtube.com/@mppluwuofficial"
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Judul Video Profil / Edukasi Unggulan
                </label>
                <input
                  type="text"
                  required
                  value={settings.youtube.videoTitle}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      youtube: { ...settings.youtube, videoTitle: e.target.value }
                    })
                  }
                  placeholder="Video Profil & Alur Pelayanan Terpadu Satu Pintu MPP Simpurusiang"
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Durasi Video (Menit:Detik)
                </label>
                <input
                  type="text"
                  value={settings.youtube.duration}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      youtube: { ...settings.youtube, duration: e.target.value }
                    })
                  }
                  placeholder="04:15"
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Statistik Penayangan / Label
                </label>
                <input
                  type="text"
                  value={settings.youtube.stats}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      youtube: { ...settings.youtube, stats: e.target.value }
                    })
                  }
                  placeholder="12.5K Ditonton • Profil Resmi"
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  URL Thumbnail Cover Video YouTube
                </label>
                <input
                  type="url"
                  value={settings.youtube.videoThumbnail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      youtube: { ...settings.youtube, videoThumbnail: e.target.value }
                    })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* PLATFORM 3: FACEBOOK */}
        {activePlatform === 'facebook' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Nama Halaman Facebook (Page Name)
                </label>
                <input
                  type="text"
                  required
                  value={settings.facebook.pageName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      facebook: { ...settings.facebook, pageName: e.target.value }
                    })
                  }
                  placeholder="DPMPTSP & MPP Kabupaten Luwu"
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Tautan Halaman Facebook (URL Profil/Follow)
                </label>
                <input
                  type="url"
                  required
                  value={settings.facebook.pageUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      facebook: { ...settings.facebook, pageUrl: e.target.value }
                    })
                  }
                  placeholder="https://facebook.com/dpmptspluwu"
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Tag Kategori Postingan Facebook
                </label>
                <input
                  type="text"
                  value={settings.facebook.tag}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      facebook: { ...settings.facebook, tag: e.target.value }
                    })
                  }
                  placeholder="Sosialisasi & Edukasi"
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Statistik Interaksi Facebook
                </label>
                <input
                  type="text"
                  value={settings.facebook.stats}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      facebook: { ...settings.facebook, stats: e.target.value }
                    })
                  }
                  placeholder="2.4K Suka • 156 Dibagikan"
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  URL Foto Postingan Facebook
                </label>
                <input
                  type="url"
                  value={settings.facebook.postImage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      facebook: { ...settings.facebook, postImage: e.target.value }
                    })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Narasi / Status Postingan Facebook
                </label>
                <textarea
                  rows={2}
                  value={settings.facebook.caption}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      facebook: { ...settings.facebook, caption: e.target.value }
                    })
                  }
                  placeholder="Tuliskan isi status Facebook tentang layanan terpadu..."
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* PLATFORM 4: TIKTOK */}
        {activePlatform === 'tiktok' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Handle TikTok (@username)
                </label>
                <input
                  type="text"
                  required
                  value={settings.tiktok.handle}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      tiktok: { ...settings.tiktok, handle: e.target.value }
                    })
                  }
                  placeholder="@mpp.luwu"
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Tautan Profil TikTok
                </label>
                <input
                  type="url"
                  required
                  value={settings.tiktok.profileUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      tiktok: { ...settings.tiktok, profileUrl: e.target.value }
                    })
                  }
                  placeholder="https://tiktok.com/@mpp.luwu"
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Tag Edukasi / Label TikTok
                </label>
                <input
                  type="text"
                  value={settings.tiktok.tag}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      tiktok: { ...settings.tiktok, tag: e.target.value }
                    })
                  }
                  placeholder="Edukasi Kilat"
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Statistik Views & Likes
                </label>
                <input
                  type="text"
                  value={settings.tiktok.stats}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      tiktok: { ...settings.tiktok, stats: e.target.value }
                    })
                  }
                  placeholder="45.2K Views • 3.8K Likes"
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  URL Cover / Thumbnail Video TikTok
                </label>
                <input
                  type="url"
                  value={settings.tiktok.videoThumbnail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      tiktok: { ...settings.tiktok, videoThumbnail: e.target.value }
                    })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Topik Video / Caption TikTok
                </label>
                <textarea
                  rows={2}
                  value={settings.tiktok.caption}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      tiktok: { ...settings.tiktok, caption: e.target.value }
                    })
                  }
                  placeholder="Tutorial Buat NIB OSS Cuma 10 Menit di Loket MPP Simpurusiang! 🚀"
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Saluran Tambahan: X / Twitter & Saluran WhatsApp */}
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Tautan Saluran Resmi WhatsApp (Opsional)
            </label>
            <input
              type="url"
              value={settings.whatsappChannel || ''}
              onChange={(e) => setSettings({ ...settings, whatsappChannel: e.target.value })}
              placeholder="https://whatsapp.com/channel/..."
              className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Tautan Akun X / Twitter Resmi (Opsional)
            </label>
            <input
              type="url"
              value={settings.twitter || ''}
              onChange={(e) => setSettings({ ...settings, twitter: e.target.value })}
              placeholder="https://x.com/dpmptspluwu"
              className="w-full p-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span>Perubahan tersinkron otomatis ke halaman publik portal MPP.</span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Media Sosial'}</span>
          </button>
        </div>
      </form>

      {/* Live Preview Card */}
      {previewMode && (
        <div className="pt-4 border-t border-slate-800 space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Simulasi Tampilan di Portal Publik:</span>
            </h4>
            <span className="text-[10px] text-slate-500">Live Preview Mode</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            {/* Instagram Preview Card */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 text-xs">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 p-[1.5px]">
                    <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                      <Instagram className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                  </div>
                  <span className="font-bold text-white text-xs truncate">@{settings.instagram.handle}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Follow
                </span>
              </div>
              <div className="h-28 w-full bg-slate-800 overflow-hidden relative">
                <img
                  src={settings.instagram.postImage}
                  alt="Post"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_MPP_SOCIAL_MEDIA.instagram.postImage;
                  }}
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-[9px] font-semibold">
                  {settings.instagram.tag}
                </span>
              </div>
              <div className="p-3 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">{settings.instagram.stats}</span>
                <p className="text-[11px] text-slate-300 line-clamp-2">{settings.instagram.caption}</p>
              </div>
            </div>

            {/* YouTube Preview Card */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 text-xs">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center">
                    <Youtube className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-white text-xs truncate">{settings.youtube.channelName}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">
                  Subscribe
                </span>
              </div>
              <div className="h-28 w-full bg-slate-800 overflow-hidden relative flex items-center justify-center">
                <img
                  src={settings.youtube.videoThumbnail}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_MPP_SOCIAL_MEDIA.youtube.videoThumbnail;
                  }}
                />
                <div className="absolute w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                  <Play className="w-4 h-4 ml-0.5 fill-current" />
                </div>
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono">
                  {settings.youtube.duration}
                </span>
              </div>
              <div className="p-3 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">{settings.youtube.stats}</span>
                <h5 className="text-[11px] font-bold text-white line-clamp-1">{settings.youtube.videoTitle}</h5>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
