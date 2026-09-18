import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Search,
  Building2,
  MapPin,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Layers,
  FileText,
  PhoneCall,
  Zap,
  Filter
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AgencyItem {
  nama: string;
  fullName?: string;
  layanan: string;
  logo: string;
  kategori?: string;
  loket?: string;
  jamLayanan?: string;
  deskripsi?: string;
  layananList?: string[];
  syaratUmum?: string[];
  telepon?: string;
  popularServices?: string[];
  status?: string;
  [key: string]: any;
}

interface MppAgenciesCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencies: any[];
  onSelectAgency: (agency: any) => void;
  isDark?: boolean;
}

export const MppAgenciesCatalogModal: React.FC<MppAgenciesCatalogModalProps> = ({
  isOpen,
  onClose,
  agencies = [],
  onSelectAgency,
  isDark = false,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Categorize agencies automatically if not explicitly provided
  const categorizedAgencies = useMemo(() => {
    return (agencies || []).map((ag) => {
      let category = ag.kategori;
      if (!category) {
        const nameLower = (ag.nama || '').toLowerCase();
        if (nameLower.includes('dinas') || nameLower.includes('dpamtpsp') || nameLower.includes('disdukcapil') || nameLower.includes('bapenda') || nameLower.includes('dinas kesehatan')) {
          category = isEn ? 'Luwu Regional Agencies (OPD)' : isZh ? '鲁乌县政府职能部门 (OPD)' : 'OPD Pemkab Luwu';
        } else if (nameLower.includes('kpp') || nameLower.includes('bpn') || nameLower.includes('kemenag') || nameLower.includes('imigrasi') || nameLower.includes('pengadilan')) {
          category = isEn ? 'Ministries & State Agencies' : isZh ? '部委与国家直属机构' : 'Kementerian & Lembaga';
        } else if (nameLower.includes('bank') || nameLower.includes('bpjs') || nameLower.includes('pdam') || nameLower.includes('pos')) {
          category = isEn ? 'SOE / BUMD & Banking' : isZh ? '国有企业 / 地方国企与银行' : 'BUMN / BUMD & Perbankan';
        } else if (nameLower.includes('polres') || nameLower.includes('samsat') || nameLower.includes('kejaksaan')) {
          category = isEn ? 'Police & Legal Services' : isZh ? '警察与司法政法机构' : 'Kepolisian & Law';
        } else {
          category = isEn ? 'Integrated Services' : isZh ? '综合便民服务' : 'Layanan Terintegrasi';
        }
      }
      return { ...ag, calculatedCategory: category };
    });
  }, [agencies, isEn, isZh]);

  const categoriesList = useMemo(() => [
    { id: 'all', label: isEn ? 'All Agencies' : isZh ? '全部入驻部门' : 'Semua Instansi', count: categorizedAgencies.length },
    { id: 'opd', label: isEn ? 'Luwu Regional Agencies' : isZh ? '县政府职能局 (OPD)' : 'OPD Pemkab Luwu', keyword: 'OPD' },
    { id: 'vertikal', label: isEn ? 'Ministries & State Agencies' : isZh ? '部委与垂直机构' : 'Kementerian / Lembaga', keyword: 'Kementerian' },
    { id: 'bumn', label: isEn ? 'SOE / BUMD & Banks' : isZh ? '国企/银行 (BUMN)' : 'BUMN / BUMD / Bank', keyword: 'BUMN' },
    { id: 'hukum', label: isEn ? 'Police & Law' : isZh ? '公安交警与司法' : 'Kepolisian & Hukum', keyword: 'Kepolisian' },
  ], [categorizedAgencies.length, isEn, isZh]);

  const filteredAgencies = useMemo(() => {
    return categorizedAgencies.filter((ag) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const catObj = categoriesList.find((c) => c.id === selectedCategory);
        if (catObj && catObj.keyword && !String(ag.calculatedCategory || '').toLowerCase().includes(catObj.keyword.toLowerCase())) {
          return false;
        }
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = (ag.nama || '').toLowerCase().includes(q);
      const matchFullName = (ag.fullName || '').toLowerCase().includes(q);
      const matchServices = (ag.layanan || '').toLowerCase().includes(q);
      const matchLoket = (ag.loket || '').toLowerCase().includes(q);
      return matchName || matchFullName || matchServices || matchLoket;
    });
  }, [categorizedAgencies, selectedCategory, searchQuery, categoriesList]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white shadow-emerald-950/40'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Mobile Handle & Title Bar */}
          <div className="relative pt-3 pb-4 px-5 sm:px-7 border-b border-slate-200/80 dark:border-slate-800 shrink-0 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-md">
            {/* Handle Drag Android */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3 sm:hidden" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      {isEn ? 'Official Directory' : isZh ? '官方机构名录' : 'Direktori Resmi'}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> {isEn ? 'MPP Simpurusiang Integrated' : isZh ? '辛普鲁西亚政务中心一体化' : 'Terintegrasi MPP Simpurusiang'}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight">
                    {isEn ? 'Integrated Agencies & Public Service Booths' : isZh ? '已入驻部门机构与公共服务窗口' : 'Instansi & Layanan Publik Tergabung'}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick KPI Stat Pills Bar */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800">
              <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block leading-none">{isEn ? 'Total Agencies' : isZh ? '入驻部门总数' : 'Total Instansi'}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{categorizedAgencies.length} {isEn ? 'Booths' : isZh ? '个窗口' : 'Gerai'}</span>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block leading-none">{isEn ? 'Total Services' : isZh ? '服务事项总数' : 'Total Layanan'}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">148+ {isEn ? 'Services' : isZh ? '项服务' : 'Layanan'}</span>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block leading-none">{isEn ? 'Service Hours Status' : isZh ? '窗口运行状态' : 'Status Jam Buka'}</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {isEn ? 'Active & Open' : isZh ? '正常办理中' : 'Aktif Buka'}
                  </span>
                </div>
              </div>
            </div>

            {/* Instant Search Bar */}
            <div className="relative mt-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? "Search agency or service name (e.g. ID card, Business License, Tax, Police)..." : isZh ? "搜索部门或服务事项 (如: 身份证, 营业执照, 税务, 驾照, 土地局)..." : "Cari instansi atau nama layanan (cth: KTP, NIB, SIM, PBB, BPN)..."}
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Quick Filter Tabs */}
          <div className="px-5 sm:px-7 py-2.5 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              {categoriesList.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Main Content Area (Symmetric Grid) */}
          <div className="p-5 sm:p-7 overflow-y-auto space-y-4">
            {filteredAgencies.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {isEn ? `No agencies or services found for "${searchQuery}"` : isZh ? `未找到与 "${searchQuery}" 相关的部门或服务` : `Tidak ditemukan instansi atau layanan dengan kata kunci "${searchQuery}"`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isEn ? 'Try keywords like "Disdukcapil", "ID Card", "License", or "BPJS".' : isZh ? '请尝试搜索 "Disdukcapil", "身份证", "许可证", 或 "BPJS"。' : 'Coba kata kunci lain seperti "Disdukcapil", "KTP", "Perizinan", atau "BPJS".'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-md cursor-pointer"
                >
                  {isEn ? 'Reset Search' : isZh ? '重置搜索' : 'Reset Pencarian'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredAgencies.map((agency, idx) => (
                  <motion.div
                    key={agency.nama || idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500/50 hover:shadow-lg transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Top: Logo, Kategori & Loket Badge */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                          <img
                            src={agency.logo || '/logo-luwu-clean.svg'}
                            alt={agency.nama}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/logo-luwu-clean.svg';
                            }}
                          />
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            {agency.calculatedCategory}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            {agency.loket || (isEn ? 'MPP Booth' : isZh ? '政务大厅窗口' : 'Gerai MPP')}
                          </span>
                        </div>
                      </div>

                      {/* Agency Name */}
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {agency.fullName || agency.nama}
                      </h3>

                      {/* Services Summary */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-3">
                        {agency.layanan}
                      </p>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 08.00 - 15.30 WITA
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectAgency(agency);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <span>{isEn ? 'View Details' : isZh ? '查看详情' : 'Lihat Detail'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer Bar */}
          <div className="p-4 px-5 sm:px-7 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200/80 dark:border-slate-800 shrink-0 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> {isEn ? 'Luwu Regency Integrated One-Stop Public Service' : isZh ? '鲁乌县一门式公共政务综合服务大厅' : 'Layanan Terintegrasi Satu Pintu Pemkab Luwu'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-extrabold transition-all cursor-pointer shadow-md"
            >
              {isEn ? 'Close' : isZh ? '关闭' : 'Selesai'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

