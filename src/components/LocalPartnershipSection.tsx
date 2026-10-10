import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
} from "lucide-react";
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

  useEffect(() => {
    let isMounted = true;
    async function loadUmkm() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("mpp_umkm")
          .select("id, name, owner_name, category, whatsapp, is_active")
          .limit(30);

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

  const categories = ["ALL", ...Array.from(new Set(umkmList.map((u) => u.category || "Umum")))];

  const filteredUmkm = umkmList.filter((item) => {
    const matchCat = selectedCategory === "ALL" || (item.category || "Umum") === selectedCategory;
    const matchSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.owner_name && item.owner_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <section
      id="kemitraan-umkm-section"
      className={`scroll-mt-20 sm:scroll-mt-24 py-12 sm:py-16 md:py-20 border-t relative overflow-hidden transition-colors duration-500 ${
        isDark ? "bg-[#06181f] border-white/10" : "bg-slate-50 border-slate-200"
      }`}
    >
      <div className="container max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3.5 border backdrop-blur-md shadow-xs bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30">
            <Handshake size={14} className="text-sky-600 dark:text-sky-400" />
            <span>Pilar 6 • Local Economy Ready</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3 text-balance">
            {t("landingInvest.partnership.title", "Kemitraan UMKM & Direktori Pemasok Daerah Luwu")}
          </h2>
          <div className="h-1.5 w-24 bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-500 rounded-full mb-4 mx-auto" />
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
            {t("landingInvest.partnership.subtitle", "Mewujudkan ekosistem investasi inklusif dengan menghubungkan pelaku usaha skala besar dengan rantai pasok pengusaha dan komoditas lokal Kabupaten Luwu.")}
          </p>
        </div>

        {/* 3 Core Value Cards of Local Partnerships */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div
            className={`p-5 rounded-2xl border ${
              isDark ? "bg-surface/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Award size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              {t("landingInvest.partnership.matchingTitle", "Fasilitasi Business Matching")}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t("landingInvest.partnership.matchingDesc", "DPMPTSP Luwu mendampingi pertemuan berkala antara korporasi investor dengan klaster UMKM lokal untuk kontrak pasok bahan baku dan jasa penunjang.")}
            </p>
          </div>

          <div
            className={`p-5 rounded-2xl border ${
              isDark ? "bg-surface/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
              <ShieldCheck size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              {t("landingInvest.partnership.legalityTitle", "Legalitas & Sertifikasi Terjamin")}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t("landingInvest.partnership.legalityDesc", "Seluruh mitra UMKM terdaftar di Mal Pelayanan Publik (MPP) Simpurusiang dan dibina memiliki NIB resmi, sertifikasi halal, dan standardisasi mutu.")}
            </p>
          </div>

          <div
            className={`p-5 rounded-2xl border ${
              isDark ? "bg-surface/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <Sparkles size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              {t("landingInvest.partnership.incentivesTitle", "Insentif Khusus Bagi Investor")}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t("landingInvest.partnership.incentivesDesc", "Investor yang bermitra dengan UMKM lokal berhak memperoleh prioritas kemudahan perizinan, asistensi fiskal daerah, dan dukungan promosi terpadu.")}
            </p>
          </div>
        </div>

        {/* Directory Showcase Container */}
        <div
          className={`p-5 sm:p-7 rounded-3xl border ${
            isDark
              ? "bg-surface/90 border-slate-800 shadow-xl shadow-black/40"
              : "bg-white border-slate-200 shadow-lg shadow-slate-100"
          }`}
        >
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
                Kategori:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-sky-500 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat === "ALL"
                    ? t("landingInvest.partnership.allClusters", "Semua Klaster")
                    : cat.toLowerCase().includes("kuliner")
                    ? t("landingInvest.partnership.culinary", cat)
                    : cat.toLowerCase().includes("tani") || cat.toLowerCase().includes("pertanian")
                    ? t("landingInvest.partnership.agriculture", cat)
                    : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("landingInvest.partnership.searchPlaceholder", "Cari nama UMKM / pemilik...")}
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500/30 ${
                  isDark
                    ? "bg-base/70 border-slate-800 text-white placeholder-slate-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                }`}
              />
            </div>
          </div>

          {/* UMKM Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`p-4 rounded-2xl border animate-pulse ${
                    isDark ? "bg-base/40 border-slate-800" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded mb-3" />
                  <div className="h-5 w-40 bg-slate-300 dark:bg-slate-700 rounded mb-2" />
                  <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
                  <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : filteredUmkm.length === 0 ? (
            <div
              className={`p-8 rounded-2xl border text-center ${
                isDark ? "bg-base/40 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <Store size={32} className="mx-auto text-slate-400 mb-2 opacity-60" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                Belum ada data mitra UMKM pada filter ini
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data mitra binaan disinkronkan secara langsung dari sistem database MPP Kabupaten Luwu.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUmkm.map((umkm) => (
                <div
                  key={umkm.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between transition-all hover:scale-[1.01] ${
                    isDark
                      ? "bg-base/70 border-slate-800/80 hover:border-sky-500/50"
                      : "bg-slate-50 border-slate-200/90 hover:border-sky-400 shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                        {umkm.category || "Klaster Binaan"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={12} /> {t("landingInvest.partnership.verifiedMpp", "Terverifikasi MPP")}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-0.5">
                      {umkm.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      {t("landingInvest.partnership.personInCharge", "Penanggung Jawab:")} <span className="font-semibold text-slate-700 dark:text-slate-300">{umkm.owner_name}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <a
                      href={`https://wa.me/62${(umkm.whatsapp || "").replace(/^0/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      <Phone size={13} />
                      <span>{t("landingInvest.partnership.contactPartnership", "Hubungi Kemitraan")}</span>
                    </a>
                    <span className="text-[10px] font-mono text-slate-400">
                      Kabupaten Luwu
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Callout Banner for Fast-Track Business Matching */}
          <div className={`mt-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isDark
              ? "bg-sky-950/20 border-sky-500/30 text-white"
              : "bg-sky-50/80 border-sky-200 text-slate-900"
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Store size={20} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold">
                  {t("landingInvest.partnership.needSupplierTitle", "Butuh Suplier Daerah dengan Spesifikasi Khusus?")}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  {t("landingInvest.partnership.needSupplierDesc", "Tim Fasilitasi Kemitraan DPMPTSP Luwu siap mencarikan dan memvalidasi mitra UMKM sesuai kebutuhan rantai pasok industri Anda.")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenConsultation}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-md shrink-0 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <span>{t("landingInvest.partnership.btnApplyMatching", "Ajukan Business Matching")}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
