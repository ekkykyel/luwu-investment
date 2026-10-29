import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building,
  Edit3,
  Eye,
  CheckCircle2,
  X,
  Sparkles,
  RefreshCw,
  AlertCircle,
  MapPin,
  Plane,
  Anchor,
  ShieldCheck,
  Compass,
  FileText,
  Navigation,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  Info
} from 'lucide-react';
import {
  InfrastructureItem,
  InfrastructureSpec,
  getInfrastructureIcon,
  fetchInfrastructureItems,
  saveInfrastructureItem,
  resetToDefaultInfrastructures,
  DEFAULT_STRATEGIC_INFRASTRUCTURES
} from '../../data/infrastructureData';
import { ImageUploadField } from '../common/ImageUploadField';
import { InfrastructureDetailModal } from '../InfrastructureDetailModal';

interface Props {
  isDarkMode?: boolean;
}

// 4 Pilar Master Order
const PILLAR_ORDER: { type: InfrastructureItem['type']; title: string; subtitle: string; icon: any; color: string; gradient: string }[] = [
  {
    type: 'airport',
    title: 'Pilar 1: Simpul Udara',
    subtitle: 'Bandara Udara Bua',
    icon: Plane,
    color: 'amber',
    gradient: 'from-amber-600 via-amber-700 to-amber-900'
  },
  {
    type: 'port',
    title: 'Pilar 2: Simpul Maritim',
    subtitle: 'Pelabuhan Ulo-Ulo Belopa',
    icon: Anchor,
    color: 'teal',
    gradient: 'from-teal-600 via-teal-700 to-teal-900'
  },
  {
    type: 'industrial',
    title: 'Pilar 3: Sentra Industri',
    subtitle: 'Kawasan Industri Bua',
    icon: Building,
    color: 'emerald',
    gradient: 'from-emerald-700 via-emerald-800 to-slate-900'
  },
  {
    type: 'mpp',
    title: 'Pilar 4: Pusat Pelayanan',
    subtitle: 'MPP Simpurusiang',
    icon: ShieldCheck,
    color: 'indigo',
    gradient: 'from-indigo-600 via-indigo-700 to-indigo-900'
  }
];

const LUWU_PRESETS = [
  { label: 'Bandara Bua', lat: -3.085955, lng: 120.242292, loc: 'Kecamatan Bua, Kabupaten Luwu' },
  { label: 'Pelabuhan Belopa', lat: -3.408730, lng: 120.404182, loc: 'Kecamatan Belopa, Kabupaten Luwu' },
  { label: 'Kawasan Industri Bua (KIB)', lat: -3.131175, lng: 120.236680, loc: 'Kecamatan Bua, Kabupaten Luwu' },
  { label: 'MPP Simpurusiang Belopa', lat: -3.394277, lng: 120.368575, loc: 'Kompleks Perkantoran Pemkab Luwu, Belopa' }
];

export const MppInfrastructureAdminManager: React.FC<Props> = ({ isDarkMode = true }) => {
  const [items, setItems] = useState<InfrastructureItem[]>(DEFAULT_STRATEGIC_INFRASTRUCTURES);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InfrastructureItem | null>(null);
  const [previewFacility, setPreviewFacility] = useState<InfrastructureItem | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'identity' | 'description' | 'specs' | 'advantages' | 'location'>('identity');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<InfrastructureItem['type']>('airport');
  const [formTag, setFormTag] = useState('');
  const [formStatus, setFormStatus] = useState<InfrastructureItem['status']>('Beroperasi Aktif');
  const [formLocation, setFormLocation] = useState('');
  const [formLat, setFormLat] = useState<string>('-3.085955');
  const [formLng, setFormLng] = useState<string>('120.242292');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDetailedInfo, setFormDetailedInfo] = useState('');
  const [formConnectivity, setFormConnectivity] = useState('');
  const [formSpecs, setFormSpecs] = useState<InfrastructureSpec[]>([]);
  const [formAdvantages, setFormAdvantages] = useState<string[]>([]);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    loadData();
    const handleUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setItems(e.detail);
      }
    };
    window.addEventListener('infrastruktur_updated', handleUpdated);
    return () => window.removeEventListener('infrastruktur_updated', handleUpdated);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchInfrastructureItems();
      if (data && data.length > 0) {
        setItems(data);
      }
    } catch (err: any) {
      console.error('Error loading infrastructure:', err);
      showFeedback('error', 'Gagal memuat basis data infrastruktur.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEdit = (item: InfrastructureItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormType(item.type);
    setFormTag(item.tag);
    setFormStatus(item.status);
    setFormLocation(item.location);
    setFormLat(String(item.latitude));
    setFormLng(String(item.longitude));
    setFormImageUrl(item.imageUrl || '');
    setFormDesc(item.desc || '');
    setFormDetailedInfo(item.detailedInfo || item.desc || '');
    setFormConnectivity(item.connectivity || '');
    setFormSpecs(item.specs && item.specs.length > 0 ? [...item.specs] : [
      { label: 'Kategori Spasial', value: item.tag || 'Infrastruktur' }
    ]);
    setFormAdvantages(item.advantages && item.advantages.length > 0 ? [...item.advantages] : [
      'Mendukung efisiensi logistik terpadu di Kabupaten Luwu'
    ]);
    setActiveFormTab('identity');
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formName.trim()) {
      showFeedback('error', 'Nama infrastruktur wajib diisi.');
      return;
    }

    const latNum = parseFloat(formLat);
    const lngNum = parseFloat(formLng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      showFeedback('error', 'Koordinat Latitude dan Longitude harus berupa angka yang valid.');
      return;
    }

    const targetId = editingItem ? editingItem.id : formType;
    const payload: Partial<InfrastructureItem> = {
      id: targetId,
      name: formName.trim(),
      type: formType,
      tag: formTag.trim() || 'Infrastruktur Strategis',
      status: formStatus,
      location: formLocation.trim() || 'Kabupaten Luwu',
      latitude: latNum,
      longitude: lngNum,
      imageUrl: formImageUrl.trim() || (editingItem?.imageUrl || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80'),
      desc: formDesc.trim(),
      detailedInfo: formDetailedInfo.trim() || formDesc.trim(),
      connectivity: formConnectivity.trim(),
      specs: formSpecs.filter(s => s.label.trim() && s.value.trim()),
      advantages: formAdvantages.filter(a => a.trim())
    };

    try {
      setIsLoading(true);
      await saveInfrastructureItem(payload);
      showFeedback('success', `Konten "${formName}" berhasil disimpan dan diperbarui di Beranda & WebGIS!`);
      setIsFormOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Error saving infrastructure:', err);
      showFeedback('error', `Gagal menyimpan: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefault = (item: InfrastructureItem) => {
    const defaultData = DEFAULT_STRATEGIC_INFRASTRUCTURES.find(d => d.type === item.type);
    if (!defaultData) return;
    if (!window.confirm(`Kembalikan konten "${item.name}" ke konfigurasi standar resmi Kabupaten Luwu?`)) return;

    handleOpenEdit(defaultData);
  };

  const handleResetAll = () => {
    if (!window.confirm("Kembalikan SELURUH 4 Pilar Infrastruktur ke data standar resmi Kabupaten Luwu?")) return;
    const defaults = resetToDefaultInfrastructures();
    setItems(defaults);
    showFeedback('success', 'Seluruh 4 Pilar Infrastruktur berhasil di-reset ke standar resmi.');
  };

  // Dynamic Specs handler
  const handleAddSpec = () => {
    setFormSpecs([...formSpecs, { label: '', value: '' }]);
  };

  const handleUpdateSpec = (idx: number, field: 'label' | 'value', val: string) => {
    const updated = [...formSpecs];
    updated[idx][field] = val;
    setFormSpecs(updated);
  };

  const handleRemoveSpec = (idx: number) => {
    setFormSpecs(formSpecs.filter((_, i) => i !== idx));
  };

  // Dynamic Advantages handler
  const handleAddAdvantage = () => {
    setFormAdvantages([...formAdvantages, '']);
  };

  const handleUpdateAdvantage = (idx: number, val: string) => {
    const updated = [...formAdvantages];
    updated[idx] = val;
    setFormAdvantages(updated);
  };

  const handleRemoveAdvantage = (idx: number) => {
    setFormAdvantages(formAdvantages.filter((_, i) => i !== idx));
  };

  // Ensure 4 items strictly in order: airport, port, industrial, mpp
  const orderedItems: { pillar: typeof PILLAR_ORDER[0]; item: InfrastructureItem }[] = PILLAR_ORDER.map((pillar, idx) => {
    const found = items.find(i => i.type === pillar.type) || DEFAULT_STRATEGIC_INFRASTRUCTURES[idx];
    return {
      pillar,
      item: found
    };
  });

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'} font-sans`}>
      {/* HEADER BANNER */}
      <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/30' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>4 Simpul Utama Kabupaten Luwu</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Manajemen 4 Pilar Infrastruktur Wilayah
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Kelola konten publik untuk 4 simpul konektivitas utama: <strong>Bandara Udara Bua</strong>, <strong>Pelabuhan Ulo-Ulo Belopa</strong>, <strong>Kawasan Industri Bua</strong>, dan <strong>MPP Simpurusiang</strong>. Konten otomatis tersinkronisasi pada kartu Beranda dan modal investor.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className={`p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${
              isDarkMode 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
            title="Muat Ulang Basis Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            type="button"
            onClick={handleResetAll}
            className={`p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${
              isDarkMode 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-400' 
                : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'
            }`}
            title="Kembalikan semua ke default"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset Standar</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK NOTIFICATION */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 border shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </motion.div>
      )}

      {/* 4 PILARS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {orderedItems.map(({ pillar, item }, index) => {
          const IconComponent = pillar.icon;
          return (
            <motion.div
              key={item.type || index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`rounded-2xl sm:rounded-3xl border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl ${
                isDarkMode 
                  ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/40' 
                  : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'
              }`}
            >
              {/* IMAGE HEADER WITH PILLAR BADGE */}
              <div className="relative h-44 sm:h-52 w-full overflow-hidden group">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                {/* Top Pillar Pill & Operational Status */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-black/75 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5 shadow-md">
                    <IconComponent size={13} className="text-amber-400" />
                    <span>{pillar.title}</span>
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border backdrop-blur-md ${
                    item.status === 'Beroperasi Aktif' || item.status === 'Published'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {item.status}
                  </span>
                </div>

                {/* Bottom Overlay Title & Location */}
                <div className="absolute bottom-3 inset-x-3 text-white">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-600/80 backdrop-blur-xs mb-1">
                    {item.tag}
                  </span>
                  <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug drop-shadow-md">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-slate-300 mt-0.5">
                    <MapPin size={12} className="text-emerald-400 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>
              </div>

              {/* CARD BODY CONTENT */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Deskripsi & Fungsi Strategis */}
                  <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    isDarkMode ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1">
                      <FileText size={12} />
                      <span>Deskripsi &amp; Fungsi Strategis</span>
                    </div>
                    <p className="line-clamp-2">
                      {item.detailedInfo || item.desc}
                    </p>
                  </div>

                  {/* Badges for Specs & Benefits */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className={`p-2 rounded-xl border flex flex-col items-center justify-center ${
                      isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Compass size={11} className="text-indigo-400" /> Spesifikasi
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-indigo-400 mt-0.5">
                        {item.specs?.length || 0} Parameter Teknis
                      </span>
                    </div>

                    <div className={`p-2 rounded-xl border flex flex-col items-center justify-center ${
                      isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Sparkles size={11} className="text-amber-400" /> Nilai Tambah
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-amber-400 mt-0.5">
                        {item.advantages?.length || 0} Manfaat Investor
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-3 border-t border-inherit flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewFacility(item)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] ${
                      isDarkMode 
                        ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    }`}
                    title="Lihat Pratinjau Tampilan Modal Investor"
                  >
                    <Eye size={15} className="text-indigo-400" />
                    <span>Pratinjau Modal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/30 border border-indigo-400/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[42px] active:scale-95"
                    title="Kelola & Edit Konten Lengkap"
                  >
                    <Edit3 size={15} />
                    <span>Kelola Konten</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResetToDefault(item)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer min-h-[42px] min-w-[42px] flex items-center justify-center ${
                      isDarkMode 
                        ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-400 border-slate-700' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-amber-600 border-slate-300'
                    }`}
                    title="Reset ke Standar Resmi"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* FORM MODAL (MANAGE KONTEN INFRASTRUKTUR) */}
      <AnimatePresence>
        {isFormOpen && (
          <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
            onClick={() => setIsFormOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-[calc(100vw-20px)] sm:w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border ${
                isDarkMode 
                  ? 'bg-slate-900 text-white border-slate-700 shadow-black/80' 
                  : 'bg-white text-slate-900 border-slate-200'
              }`}
            >
              {/* MODAL HEADER */}
              <div className={`p-4 sm:p-5 flex items-center justify-between border-b shrink-0 ${
                isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <Building size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg">
                      Kelola Konten: {formName || 'Infrastruktur Strategis'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Edit foto, deskripsi fungsi strategis, spesifikasi teknis, dan keunggulan bagi investor
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center ${
                    isDarkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300'
                  }`}
                  title="Tutup Form"
                >
                  <X size={18} />
                </button>
              </div>

              {/* NAVIGATION TABS INSIDE MODAL */}
              <div className={`px-4 sm:px-6 pt-3 pb-2 border-b flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0 ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100/70 border-slate-200'
              }`}>
                {[
                  { id: 'identity', label: '1. Foto & Identitas', icon: ImageIcon },
                  { id: 'description', label: '2. Deskripsi & Fungsi', icon: FileText },
                  { id: 'specs', label: `3. Spesifikasi (${formSpecs.length})`, icon: Compass },
                  { id: 'advantages', label: `4. Manfaat Investor (${formAdvantages.length})`, icon: Sparkles },
                  { id: 'location', label: '5. Lokasi & GPS', icon: MapPin }
                ].map(tab => {
                  const TabIcon = tab.icon;
                  const isActive = activeFormTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFormTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isDarkMode
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <TabIcon size={13} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* MODAL FORM BODY */}
              <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
                {/* TAB 1: FOTO & IDENTITAS */}
                {activeFormTab === 'identity' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                          Nama Resmi Infrastruktur <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Contoh: Bandara Udara Bua"
                          required
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] ${
                            isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                          Tagline / Subkategori Singkat
                        </label>
                        <input
                          type="text"
                          value={formTag}
                          onChange={(e) => setFormTag(e.target.value)}
                          placeholder="Contoh: Gerbang Udara & Kargo"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] ${
                            isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                          Status Operasional
                        </label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as any)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] ${
                            isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="Beroperasi Aktif">Beroperasi Aktif</option>
                          <option value="Dalam Pengembangan">Dalam Pengembangan</option>
                          <option value="Perencanaan">Perencanaan</option>
                          <option value="Published">Published</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                          Kecamatan / Lokasi Wilayah
                        </label>
                        <input
                          type="text"
                          value={formLocation}
                          onChange={(e) => setFormLocation(e.target.value)}
                          placeholder="Contoh: Kecamatan Bua, Kabupaten Luwu"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] ${
                            isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    {/* UPLOAD FOTO INFRASTRUKTUR */}
                    <div className="p-3.5 sm:p-4 rounded-2xl border border-indigo-500/20 bg-indigo-950/15 space-y-3">
                      <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon size={14} />
                        <span>Upload Foto Infrastruktur Beresolusi Tinggi</span>
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Foto ini akan menjadi banner utama pada modal investor dan kartu pengantar di Beranda.
                      </p>

                      {/* Component Upload ke Supabase Storage */}
                      <ImageUploadField
                        id="infra-photo-field"
                        label="Unggah File Foto (Supabase Storage)"
                        value={formImageUrl}
                        onChange={(val) => setFormImageUrl(val)}
                        folder="infrastruktur"
                        placeholder="Klik untuk pilih atau seret foto infrastruktur ke area ini"
                        maxSizeMB={8}
                      />

                      {/* URL input fallback */}
                      <div className="space-y-1 pt-1">
                        <label className="text-[11px] text-slate-400 block">
                          Atau Tautan URL Foto Eksternal:
                        </label>
                        <input
                          type="url"
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          placeholder="https://..."
                          className={`w-full px-3 py-2 rounded-xl border text-xs transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px] ${
                            isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      {/* Photo Preview */}
                      {formImageUrl && (
                        <div className="relative w-full h-44 rounded-xl overflow-hidden border border-white/10 mt-2">
                          <img
                            src={formImageUrl}
                            alt="Pratinjau Foto"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80';
                            }}
                          />
                          <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md text-[10px] font-bold bg-black/75 text-white backdrop-blur-xs border border-white/20">
                            Pratinjau Foto Aktif
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: DESKRIPSI & FUNGSI STRATEGIS */}
                {activeFormTab === 'description' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Keterangan Singkat (Ditampilkan pada Kartu Beranda)
                      </label>
                      <input
                        type="text"
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        placeholder="Ringkasan 1-2 kalimat fungsi strategis..."
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] ${
                          isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Maksimal 1-2 kalimat ringkas untuk kenyamanan membaca di perangkat seluler.
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center justify-between">
                        <span>Deskripsi Lengkap &amp; Fungsi Strategis (Modal Detail Investor)</span>
                        <span className="text-[10px] text-emerald-400 lowercase font-mono">komprehensif</span>
                      </label>
                      <textarea
                        rows={6}
                        value={formDetailedInfo}
                        onChange={(e) => setFormDetailedInfo(e.target.value)}
                        placeholder="Uraikan sejarah, fungsi strategis logistik, konektivitas ekonomi, serta kontribusi infrastruktur ini bagi kelayakan investasi di Kabupaten Luwu..."
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm leading-relaxed transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 custom-scrollbar ${
                          isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Konektivitas Jaringan Jalan &amp; Arteri
                      </label>
                      <input
                        type="text"
                        value={formConnectivity}
                        onChange={(e) => setFormConnectivity(e.target.value)}
                        placeholder="Contoh: Terhubung langsung dengan Jalan Nasional Trans-Sulawesi dan hanya 35 km dari Ibukota Belopa."
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] ${
                          isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: SPESIFIKASI & KAPASITAS TEKNIS */}
                {activeFormTab === 'specs' && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-950/15 text-xs text-slate-300 flex items-start gap-2">
                      <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                      <span>
                        Parameter spesifikasi teknis disajikan dalam bentuk grid key-value untuk mempermudah audit kelayakan teknis bagi tim engineering investor.
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Compass size={14} />
                        <span>Daftar Parameter Spesifikasi &amp; Kapasitas Teknis</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAddSpec}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Plus size={13} /> Tambah Parameter
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {formSpecs.map((spec, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-xl border border-slate-700/60 bg-slate-950/40">
                          <input
                            type="text"
                            value={spec.label}
                            onChange={(e) => handleUpdateSpec(idx, 'label', e.target.value)}
                            placeholder="Label (contoh: Dimensi Runway / Kedalaman Kolam)"
                            className={`w-1/3 px-3 py-2 rounded-lg border text-xs font-medium transition-all min-h-[38px] ${
                              isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          <input
                            type="text"
                            value={spec.value}
                            onChange={(e) => handleUpdateSpec(idx, 'value', e.target.value)}
                            placeholder="Nilai (contoh: 1.600 m x 30 m / 6-8 meter LWS)"
                            className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-all min-h-[38px] ${
                              isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSpec(idx)}
                            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                            title="Hapus Parameter"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}

                      {formSpecs.length === 0 && (
                        <p className="text-xs text-slate-500 text-center py-4 italic">
                          Belum ada spesifikasi teknis yang ditambahkan. Klik tombol di atas untuk menambah.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: KEUNGGULAN & MANFAAT BAGI INVESTOR */}
                {activeFormTab === 'advantages' && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-950/15 text-xs text-slate-300 flex items-start gap-2">
                      <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        Poin keunggulan strategis yang disajikan langsung menjawab pertimbangan utama investor (ROI, waktu tempuh, kemudahan perizinan, dan insentif daerah).
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} />
                        <span>Poin Keunggulan &amp; Manfaat bagi Investor</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAddAdvantage}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Plus size={13} /> Tambah Keunggulan
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {formAdvantages.map((adv, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 rounded-xl border border-slate-700/60 bg-slate-950/40">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                            {idx + 1}
                          </span>
                          <textarea
                            rows={2}
                            value={adv}
                            onChange={(e) => handleUpdateAdvantage(idx, e.target.value)}
                            placeholder="Uraikan manfaat konkret bagi investor (misal: Akses tercepat dari Bandara Sultan Hasanuddin Makassar hanya 45 menit)..."
                            className={`flex-1 px-3 py-2 rounded-lg border text-xs leading-relaxed transition-all min-h-[40px] ${
                              isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveAdvantage(idx)}
                            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer mt-1"
                            title="Hapus Keunggulan"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}

                      {formAdvantages.length === 0 && (
                        <p className="text-xs text-slate-500 text-center py-4 italic">
                          Belum ada poin keunggulan yang ditambahkan. Klik tombol di atas untuk menambah.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 5: LOKASI & TITIK GPS */}
                {activeFormTab === 'location' && (
                  <div className="space-y-4">
                    <div className="space-y-2 p-3.5 sm:p-4 rounded-2xl border border-indigo-500/20 bg-indigo-950/15">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin size={14} />
                          <span>Koordinat Geospasial (WGS84)</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">Presisi GIS Luwu</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-400 block">Latitude (Garis Lintang):</label>
                          <input
                            type="text"
                            value={formLat}
                            onChange={(e) => setFormLat(e.target.value)}
                            placeholder="-3.085955"
                            className={`w-full px-3 py-2 rounded-xl border font-mono text-xs transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] ${
                              isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-400 block">Longitude (Garis Bujur):</label>
                          <input
                            type="text"
                            value={formLng}
                            onChange={(e) => setFormLng(e.target.value)}
                            placeholder="120.242292"
                            className={`w-full px-3 py-2 rounded-xl border font-mono text-xs transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] ${
                              isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Preset Buttons */}
                      <div className="pt-2">
                        <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Preset Koordinat Resmi Luwu:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {LUWU_PRESETS.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setFormLat(String(preset.lat));
                                setFormLng(String(preset.lng));
                                setFormLocation(preset.loc);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                                isDarkMode 
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>

              {/* MODAL FOOTER */}
              <div className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 shrink-0 ${
                isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[42px] ${
                    isDarkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' 
                      : 'bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-700'
                  }`}
                >
                  Batal
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const tabs = ['identity', 'description', 'specs', 'advantages', 'location'];
                      const currentIdx = tabs.indexOf(activeFormTab);
                      if (currentIdx < tabs.length - 1) {
                        setActiveFormTab(tabs[currentIdx + 1] as any);
                      }
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer min-h-[42px] ${
                      isDarkMode 
                        ? 'bg-slate-800 hover:bg-slate-700 text-indigo-400 border-slate-700' 
                        : 'bg-slate-100 hover:bg-slate-200 text-indigo-600 border-slate-300'
                    }`}
                  >
                    Lanjut Tab Berikutnya &rarr;
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveForm()}
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 min-h-[42px]"
                  >
                    <Check size={16} />
                    <span>{isLoading ? 'Menyimpan...' : 'Simpan Pembaruan Konten'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREVIEW DETAIL MODAL */}
      <InfrastructureDetailModal
        isOpen={!!previewFacility}
        facility={previewFacility}
        onClose={() => setPreviewFacility(null)}
        isDark={isDarkMode}
        canEdit={true}
        onEdit={(fac) => {
          setPreviewFacility(null);
          handleOpenEdit(fac);
        }}
      />
    </div>
  );
};

export default MppInfrastructureAdminManager;
