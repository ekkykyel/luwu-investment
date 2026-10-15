import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Store,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Building2,
  Search,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Handshake,
  Award,
  Layers,
  FileCheck2,
  TrendingUp,
  Workflow,
  X,
  BadgeCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";

interface UmkmPartner {
  id: string;
  name: string;
  owner_name: string;
  category: string;
  whatsapp: string;
  is_active: boolean;
}

interface LocalPartnershipSectionProps {
  isDark?: boolean;
  onOpenConsultation?: () => void;
}

export default function LocalPartnershipSection({
  isDark = true,
  onOpenConsultation,
}: LocalPartnershipSectionProps) {
  const { t } = useTranslation();
  const [umkmList, setUmkmList] = useState<UmkmPartner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function loadUmkm() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("mpp_umkm")
          .select("id, name, owner_name, category, whatsapp, is_active")
          .limit(40);

        if (!error && data && isMounted) {
          setUmkmList(data as UmkmPartner[]);
        } else if (isMounted) {
          setUmkmList([]);
        }
      } catch {
        if (isMounted) setUmkmList([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadUmkm();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const rawCategories = Array.from(new Set(umkmList.map((u) => u.category || "Umum"))).filter(Boolean);
    return ["ALL", ...rawCategories];
  }, [umkmList]);

  const filteredUmkm = useMemo(() => {
    return umkmList.filter((item) => {
      const matchCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      const matchQuery =
        !searchQuery ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.owner_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [umkmList, selectedCategory, searchQuery]);

  const workflowSteps = [
    {
      step: "01",
      title: t("localPartnership.s1Title", "Pemetaan Kebutuhan Korporasi"),
      desc: t("localPartnership.s1Desc", "Investor menyampaikan spesifikasi komoditas, volume bahan baku, atau jasa pendukung yang dibutuhkan."),
      icon: Layers,
      tag: t("localPartnership.s1Tag", "Tahap Analisis"),
    },
    {
      step: "02",
      title: t("localPartnership.s2Title", "Kurasi & Uji Kelayakan MPP"),
      desc: t("localPartnership.s2Desc", "DPMPTSP bersama Dinas Koperasi & UMKM memverifikasi NIB, kapasitas produksi, dan standardisasi kualitas."),
      icon: FileCheck2,
      tag: t("localPartnership.s2Tag", "Validasi Legalitas"),
    },
    {
      step: "03",
      title: t("localPartnership.s3Title", "Fasilitasi MoU & Kontrak"),
      desc: t("localPartnership.s3Desc", "Pendampingan klausul kontrak kemitraan jangka panjang berkeadilan dengan supervisi kelembagaan daerah."),
      icon: Handshake,
      tag: t("localPartnership.s3Tag", "Fasilitasi Resmi"),
    },
    {
      step: "04",
      title: t("localPartnership.s4Title", "Insentif & Monitoring Mutu"),
      desc: t("localPartnership.s4Desc", "Pemberian prioritas kemudahan asistensi investasi dan monitoring berkala ketercapaian rantai pasok."),
      icon: TrendingUp,
      tag: t("localPartnership.s4Tag", "Insentif Daerah"),
    },
  ];

  return (
    <section
      id="kemitraan-umkm-section"
      className={`scroll-mt-20 sm:scroll-mt-24 py-12 sm:py-16 md:py-20 border-t relative overflow-hidden transition-colors duration-500 ${
        isDark ? "bg-[#06181F] border-[rgba(201,162,75,0.22)]" : "bg-[#FAF7F0] border-[rgba(160,122,40,0.20)]"
      }`}
    >
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-emerald-500/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="container max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="invest-eyebrow mb-3.5">
            <Handshake size={14} className="text-[#A07A28] dark:text-[#C9A24B]" />
            <span>{t("localPartnership.eyebrow", "Pilar 6 • Local Economy & MSME Integration")}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-extrabold tracking-tight text-slate-900 dark:text-white mb-2.5 text-balance">
            {t("localPartnership.title", "Kemitraan UMKM & Direktori Pemasok Daerah Luwu")}
          </h2>
          <div className="gold-divider-diamond">
            <span className="gold-diamond-icon" />
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            {t("localPartnership.subtitle", "Mewujudkan ekosistem investasi inklusif dengan menghubungkan pelaku usaha skala besar dengan rantai pasok pengusaha dan komoditas lokal Kabupaten Luwu secara aman, terverifikasi, dan berkelanjutan.")}
          </p>
        </div>

        {/* 3 Executive Value Proposition Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 mb-10">
          <div
            className={`p-3.5 sm:p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
              isDark
                ? "bg-[#0B2A20]/80 border-[rgba(201,162,75,0.25)] shadow-md shadow-black/40 hover:border-[rgba(201,162,75,0.45)]"
                : "bg-white/95 border-[rgba(160,122,40,0.22)] shadow-sm hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Award size={22} />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25">
                {t("localPartnership.prop1Badge", "B2B Matching")}
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1.5">
              {t("localPartnership.prop1Title", "Fasilitasi Business Matching Terkurasi")}
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t("localPartnership.prop1Desc", "DPMPTSP Luwu secara aktif mengorkestrasi temu bisnis berkala antara korporasi investor dengan klaster UMKM lokal untuk menjamin kontinuitas pasokan bahan baku dan jasa operasional.")}
            </p>
          </div>

          <div
            className={`p-3.5 sm:p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
              isDark
                ? "bg-[#0B2A20]/80 border-[rgba(201,162,75,0.25)] shadow-md shadow-black/40 hover:border-[rgba(201,162,75,0.45)]"
                : "bg-white/95 border-[rgba(160,122,40,0.22)] shadow-sm hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/25">
                {t("localPartnership.prop2Badge", "Standard MPP Simpurusiang")}
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1.5">
              {t("localPartnership.prop2Title", "Legalitas & Sertifikasi Terjamin")}
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t("localPartnership.prop2Desc", "Seluruh mitra UMKM terdaftar di Mal Pelayanan Publik (MPP) Simpurusiang dengan kepemilikan NIB resmi, sertifikasi halal, uji higienitas/mutu, serta rekam jejak kepatuhan usaha.")}
            </p>
          </div>

          <div
            className={`p-3.5 sm:p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
              isDark
                ? "bg-[#0B2A20]/80 border-[rgba(201,162,75,0.25)] shadow-md shadow-black/40 hover:border-[rgba(201,162,75,0.45)]"
                : "bg-white/95 border-[rgba(160,122,40,0.22)] shadow-sm hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Sparkles size={22} />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25">
                {t("localPartnership.prop3Badge", "Regulasi BKPM & Perda")}
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1.5">
              {t("localPartnership.prop3Title", "Insentif Khusus Bagi Korporasi Mitra")}
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t("localPartnership.prop3Desc", "Investor yang bermitra dengan UMKM lokal berhak memperoleh poin prioritas perizinan, asistensi fiskal daerah, apresiasi CSR terpadu, dan pengawalan kelancaran operasional di lapangan.")}
            </p>
          </div>
        </div>

        {/* 4-Stage Partnership Workflow / Pipeline */}
        <div
          className={`mb-10 p-2.5 sm:p-7 rounded-2xl sm:rounded-3xl border transition-colors ${
            isDark
              ? "bg-[#08201A]/90 border-[rgba(201,162,75,0.25)] shadow-xl shadow-black/50"
              : "bg-white/95 border-[rgba(160,122,40,0.22)] shadow-md"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Workflow size={16} className="text-[#A07A28] dark:text-[#C9A24B]" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {t("localPartnership.flowTitle", "Alur Kemitraan Strategis Korporasi & UMKM")}
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {t("localPartnership.flowSubtitle", "Mekanisme resmi fasilitasi rantai pasok daerah di bawah koordinasi DPMPTSP Kabupaten Luwu")}
              </p>
            </div>
            <span className="self-start sm:self-auto text-[11px] font-mono px-3 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25">
              {t("localPartnership.flowBadge", "4 Tahap Terstruktur")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {workflowSteps.map((wf, idx) => {
              const IconComp = wf.icon;
              const isActive = activeWorkflowStep === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveWorkflowStep(idx)}
                  className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all duration-200 text-left relative overflow-hidden ${
                    isActive
                      ? isDark
                        ? "bg-[#0F382B] border-[#C9A24B] shadow-md ring-1 ring-[#C9A24B]/50"
                        : "bg-[#F3EEDF] border-[#A07A28] shadow-sm ring-1 ring-[#A07A28]/40"
                      : isDark
                      ? "bg-[#0B2A20]/60 border-white/5 hover:border-[rgba(201,162,75,0.25)]"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-extrabold text-[#A07A28] dark:text-[#C9A24B]">
                      {wf.step}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                      {wf.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      <IconComp size={16} />
                    </div>
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                      {wf.title}
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {wf.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Directory Showcase Container */}
        <div
          className={`p-2.5 sm:p-7 rounded-2xl sm:rounded-3xl border transition-colors ${
            isDark
              ? "bg-[#0B2A20]/90 border-[rgba(201,162,75,0.25)] shadow-xl shadow-black/50"
              : "bg-white/95 border-[rgba(160,122,40,0.22)] shadow-lg shadow-slate-200/50"
          }`}
        >
          {/* Header Directory Filter & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-200 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Store size={18} className="text-[#A07A28] dark:text-[#C9A24B]" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {t("localPartnership.dirTitle", "Katalog Terbina MPP Simpurusiang")}
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {t("localPartnership.dirSubtitle", "Pemasok lokal siap kontrak, tersinkronisasi langsung dari database MPP DPMPTSP Kabupaten Luwu")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("localPartnership.searchPlaceholder", "Cari nama UMKM / penanggung jawab...")}
                  className={`w-full pl-9 pr-8 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#A07A28]/40 transition-colors ${
                    isDark
                      ? "bg-[#08201A] border-white/10 text-white placeholder-slate-400"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-500"
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 shrink-0 self-start sm:self-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t("localPartnership.dirBadge", "{{count}} Mitra Siap Pasok", { count: filteredUmkm.length })}</span>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0 mr-1">
              {t("localPartnership.clusterLabel", "Klaster:")}
            </span>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                    isSelected
                      ? "bg-[#0F6B4F] text-white border-[#C9A24B] shadow-sm"
                      : isDark
                      ? "bg-[#08201A] text-slate-300 border-white/10 hover:bg-[#0D3025] hover:border-[rgba(201,162,75,0.25)]"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:border-slate-300"
                  }`}
                >
                  {cat === "ALL" ? t("localPartnership.allClusters", "Semua Klaster Usaha") : cat}
                </button>
              );
            })}
          </div>

          {/* UMKM Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className={`p-5 rounded-2xl border animate-pulse ${
                    isDark ? "bg-[#08201A]/60 border-white/5" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <div className="h-4 w-28 bg-slate-300 dark:bg-slate-700 rounded mb-3" />
                  <div className="h-5 w-44 bg-slate-300 dark:bg-slate-700 rounded mb-2" />
                  <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
                  <div className="h-8 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredUmkm.length === 0 ? (
            <div
              className={`p-10 rounded-2xl border text-center ${
                isDark ? "bg-[#08201A]/60 border-white/10" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-slate-500/10 text-slate-400">
                <Store size={28} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                {t("localPartnership.emptyFilterTitle", "Belum ada data mitra UMKM pada filter ini")}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                {t("localPartnership.emptyFilterDesc", "Data mitra binaan disinkronkan secara langsung dari sistem database MPP Kabupaten Luwu sesuai prinsip Zero Dummy.")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUmkm.map((umkm) => {
                const waMessage = encodeURIComponent(
                  `Halo ${umkm.owner_name || ""}, kami dari perusahaan calon investor Kabupaten Luwu berminat menjajaki kerja sama kemitraan rantai pasok dengan unit usaha ${umkm.name} melalui fasilitasi DPMPTSP Kabupaten Luwu.`
                );
                const waUrl = umkm.whatsapp
                  ? `https://wa.me/62${umkm.whatsapp.replace(/^0/, "").replace(/\D/g, "")}?text=${waMessage}`
                  : null;

                return (
                  <div
                    key={umkm.id}
                    className={`p-3.5 sm:p-5 rounded-2xl border flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                      isDark
                        ? "bg-[#08201A]/85 border-[rgba(201,162,75,0.20)] hover:border-[rgba(201,162,75,0.45)]"
                        : "bg-slate-50/90 border-slate-200 hover:border-emerald-600/40 shadow-xs"
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#0F6B4F]/15 dark:bg-[#0F6B4F]/25 text-[#0F6B4F] dark:text-[#C9A24B] border border-[rgba(201,162,75,0.30)] truncate max-w-[65%]">
                          {umkm.category || "Klaster Binaan"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                          <CheckCircle2 size={11} /> {t("localPartnership.mppVerified", "MPP Verified")}
                        </span>
                      </div>

                      {/* Title & Owner */}
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1 line-clamp-1">
                        {umkm.name}
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5 font-medium">
                        <Users size={12} className="text-slate-500 dark:text-slate-400 shrink-0" />
                        <span>{t("localPartnership.personInCharge", "Penanggung Jawab:")}</span>
                        <strong className="text-slate-900 dark:text-slate-100 font-bold truncate">
                          {umkm.owner_name || "Pengelola Usaha"}
                        </strong>
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
                      {waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                        >
                          <Phone size={13} />
                          <span>{t("localPartnership.contactPartner", "Hubungi Mitra")}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium italic">{t("localPartnership.contactViaMpp", "Kontak via MPP")}</span>
                      )}
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-semibold">
                        {t("localPartnership.regencyName", "Kabupaten Luwu")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Callout Banner for Fast-Track Business Matching */}
          <div
            className={`mt-8 p-3.5 sm:p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${
              isDark
                ? "bg-gradient-to-r from-[#0F382B] to-[#08201A] border-[rgba(201,162,75,0.35)] text-white shadow-lg"
                : "bg-gradient-to-r from-emerald-50 to-[#F3EEDF] border-[rgba(160,122,40,0.30)] text-slate-900 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0F6B4F]/20 text-[#0F6B4F] dark:text-[#C9A24B] border border-[rgba(201,162,75,0.30)] flex items-center justify-center shrink-0">
                <Store size={22} />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {t("localPartnership.customNeedTitle", "Butuh Suplier Daerah dengan Spesifikasi Khusus?")}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  {t("localPartnership.customNeedDesc", "Tim Fasilitasi Kemitraan DPMPTSP Luwu siap mencarikan, mengkurasi, dan memvalidasi mitra UMKM sesuai baku mutu teknis rantai pasok industri Anda.")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenConsultation}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0F6B4F] to-[#1F9D74] hover:from-[#137d5c] hover:to-[#25b586] border border-[#C9A24B]/40 shadow-md shrink-0 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <span>{t("localPartnership.btnApplyPartnership", "Ajukan Fasilitasi Kemitraan")}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
