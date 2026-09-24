import React from "react";
import {
  Filter,
  Search,
  RotateCcw,
  Sparkles,
  Layers,
  Award,
  ShieldCheck,
  Building2,
  MapPin,
  Compass,
  X,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export interface SmartFilterState {
  searchTerm: string;
  selectedSector: string;
  selectedDistrict: string;
  minRoi: number;
  rtrwStatus: string;
  incentiveEligibleOnly: boolean;
  cleanAndClearOnly: boolean;
}

interface SmartMatrixFilterPanelProps {
  filters: SmartFilterState;
  onChangeFilters: (newFilters: SmartFilterState) => void;
  districtsList?: string[];
  totalResults?: number;
  isDark?: boolean;
}

const POPULAR_PRESETS = [
  { label: "🌿 Kakao Organik", term: "Kakao", sector: "Perkebunan" },
  { label: "⚡ Industri Smelter", term: "", sector: "Pertambangan" },
  { label: "🐟 Rumput Laut", term: "", sector: "Perikanan" },
  { label: "☕ Kopi Latimojong", term: "Kopi", sector: "Perkebunan" },
  { label: "🌾 Padi & Agro", term: "", sector: "Pertanian" },
];

export default function SmartMatrixFilterPanel({
  filters,
  onChangeFilters,
  districtsList = [],
  totalResults = 0,
  isDark = true,
}: SmartMatrixFilterPanelProps) {
  const { t } = useTranslation();

  const activeFiltersCount =
    (filters.searchTerm ? 1 : 0) +
    (filters.selectedSector !== "SEMUA" ? 1 : 0) +
    (filters.selectedDistrict !== "SEMUA" ? 1 : 0) +
    (filters.rtrwStatus !== "SEMUA" ? 1 : 0) +
    (filters.incentiveEligibleOnly ? 1 : 0) +
    (filters.cleanAndClearOnly ? 1 : 0);

  const handleReset = () => {
    onChangeFilters({
      searchTerm: "",
      selectedSector: "SEMUA",
      selectedDistrict: "SEMUA",
      minRoi: 0,
      rtrwStatus: "SEMUA",
      incentiveEligibleOnly: false,
      cleanAndClearOnly: false,
    });
  };

  const handlePresetClick = (preset: typeof POPULAR_PRESETS[0]) => {
    const isAlreadySelected =
      (preset.term && filters.searchTerm.toLowerCase().includes(preset.term.toLowerCase())) ||
      (!preset.term && filters.selectedSector === preset.sector);

    if (isAlreadySelected) {
      onChangeFilters({
        ...filters,
        searchTerm: preset.term ? "" : filters.searchTerm,
        selectedSector: !preset.term ? "SEMUA" : filters.selectedSector,
      });
    } else {
      onChangeFilters({
        ...filters,
        searchTerm: preset.term || filters.searchTerm,
        selectedSector: preset.sector || filters.selectedSector,
      });
    }
  };

  return (
    <div
      className={`p-4 sm:p-6 rounded-3xl border relative overflow-hidden transition-all duration-300 backdrop-blur-2xl ${
        isDark
          ? "bg-slate-900/90 border-slate-800/90 text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          : "bg-white/95 border-slate-200/90 text-slate-900 shadow-2xl shadow-slate-200/80"
      }`}
    >
      {/* Volumetric Top Glowing Accents */}
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />
      <div className="absolute -top-16 left-1/4 w-72 h-24 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-16 right-1/4 w-72 h-24 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
          isDark ? "border-slate-800/80" : "border-slate-200/90"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border transition-all ${
              isDark
                ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200"
            }`}
          >
            <Filter size={19} className="animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{t("smartMatrixFilter.title", "Filter Matriks Peluang Investasi")}</span>
                <Sparkles size={14} className="text-amber-400 fill-amber-400/20 animate-spin" style={{ animationDuration: "6s" }} />
              </h4>

              <span
                className={`text-[9.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shadow-xs ${
                  isDark
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/30"
                    : "bg-emerald-50 text-emerald-800 border-emerald-300"
                }`}
              >
                Smart Matrix
              </span>
            </div>

            <p
              className={`text-[11px] font-medium mt-0.5 flex items-center gap-1.5 ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span>
                {t(
                  "smartMatrixFilter.showingResults",
                  "Menampilkan {{count}} Peluang IPRO Terverifikasi Pemkab Luwu",
                  { count: totalResults }
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Right Header Action: Active Filter Counter & Reset Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {activeFiltersCount > 0 && (
            <span
              className={`text-[10.5px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                isDark
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              <Zap size={11} className="text-amber-400" />
              <span>{activeFiltersCount} Aktif</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 border ${
              activeFiltersCount > 0
                ? isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm"
                : isDark
                ? "bg-slate-900/60 text-slate-500 border-slate-800/80 cursor-default opacity-60"
                : "bg-slate-50 text-slate-400 border-slate-200 cursor-default opacity-60"
            }`}
          >
            <RotateCcw size={12} className="transition-transform group-hover:-rotate-90" />
            <span>{t("smartMatrixFilter.resetFilter", "Reset Filter")}</span>
          </button>
        </div>
      </div>

      {/* Quick 1-Tap Preset Chips */}
      <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span
          className={`text-[10px] font-extrabold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1 ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          <Sparkles size={11} className="text-amber-400" />
          <span>Preset:</span>
        </span>
        {POPULAR_PRESETS.map((preset, idx) => {
          const isSelected =
            (preset.term && filters.searchTerm.toLowerCase().includes(preset.term.toLowerCase())) ||
            (!preset.term && filters.selectedSector === preset.sector);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all border cursor-pointer active:scale-95 ${
                isSelected
                  ? isDark
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-md shadow-emerald-950/40"
                    : "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                  : isDark
                  ? "bg-slate-950/60 hover:bg-slate-800/80 text-slate-300 border-slate-800 hover:border-slate-700"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Filter Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-3.5">
        {/* 1. Search Bar */}
        <div className="relative">
          <label
            className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            <span className="flex items-center gap-1">
              <Search size={12} className="text-emerald-500" />
              <span>{t("smartMatrixFilter.searchLabel", "Cari Kata Kunci")}</span>
            </span>
            {filters.searchTerm && (
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, searchTerm: "" })}
                className="text-[9.5px] text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <X size={10} /> Hapus
              </button>
            )}
          </label>
          <div className="relative">
            <Search
              size={15}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                filters.searchTerm
                  ? "text-emerald-500"
                  : isDark
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            />
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) =>
                onChangeFilters({ ...filters, searchTerm: e.target.value })
              }
              placeholder={t("smartMatrixFilter.searchPlaceholder", "Contoh: Kakao, Smelter, Bua...")}
              className={`w-full rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all shadow-xs ${
                filters.searchTerm
                  ? isDark
                    ? "bg-emerald-950/30 border-emerald-500/60 text-white ring-1 ring-emerald-500/30"
                    : "bg-emerald-50/50 border-emerald-500/60 text-slate-900 ring-1 ring-emerald-500/20"
                  : isDark
                  ? "bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  : "bg-slate-50/90 border border-slate-200/90 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              }`}
            />
          </div>
        </div>

        {/* 2. Filter Sektor */}
        <div>
          <label
            className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            <Building2 size={12} className="text-teal-500" />
            <span>{t("smartMatrixFilter.sectorLabel", "Sektor Strategis")}</span>
          </label>
          <div className="relative">
            <select
              value={filters.selectedSector}
              onChange={(e) =>
                onChangeFilters({ ...filters, selectedSector: e.target.value })
              }
              className={`w-full rounded-2xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all cursor-pointer appearance-none shadow-xs ${
                filters.selectedSector !== "SEMUA"
                  ? isDark
                    ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/30 font-bold"
                    : "bg-emerald-50 border-emerald-500/60 text-emerald-900 ring-1 ring-emerald-500/20 font-bold"
                  : isDark
                  ? "bg-slate-950/70 border border-slate-800 text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  : "bg-slate-50/90 border border-slate-200/90 text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              }`}
            >
              <option value="SEMUA">{t("smartMatrixFilter.allSectors", "Semua Sektor")}</option>
              <option value="Pertanian">{t("smartMatrixFilter.agriculture", "Pertanian & Agroindustri")}</option>
              <option value="Perkebunan">{t("smartMatrixFilter.plantation", "Perkebunan (Kakao, Kopi, Cengkeh)")}</option>
              <option value="Perikanan">{t("smartMatrixFilter.fisheries", "Perikanan & Rumput Laut")}</option>
              <option value="Pertambangan">{t("smartMatrixFilter.mining", "Pertambangan & Smelter")}</option>
              <option value="Pariwisata">{t("smartMatrixFilter.tourism", "Pariwisata & Ekowisata")}</option>
              <option value="Energi">{t("smartMatrixFilter.energy", "Energi & Infrastruktur")}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* 3. Filter Kecamatan */}
        <div>
          <label
            className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            <MapPin size={12} className="text-amber-500" />
            <span>{t("smartMatrixFilter.districtLabel", "Kecamatan di Luwu")}</span>
          </label>
          <div className="relative">
            <select
              value={filters.selectedDistrict}
              onChange={(e) =>
                onChangeFilters({ ...filters, selectedDistrict: e.target.value })
              }
              className={`w-full rounded-2xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all cursor-pointer appearance-none shadow-xs ${
                filters.selectedDistrict !== "SEMUA"
                  ? isDark
                    ? "bg-amber-950/40 border-amber-500/60 text-amber-300 ring-1 ring-amber-500/30 font-bold"
                    : "bg-amber-50 border-amber-500/60 text-amber-900 ring-1 ring-amber-500/20 font-bold"
                  : isDark
                  ? "bg-slate-950/70 border border-slate-800 text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  : "bg-slate-50/90 border border-slate-200/90 text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              }`}
            >
              <option value="SEMUA">{t("smartMatrixFilter.allDistricts", "Semua Kecamatan (22 Wilayah)")}</option>
              {districtsList.map((dist, i) => (
                <option key={i} value={dist}>
                  {t("smartMatrixFilter.districtPrefix", "Kec.")} {dist}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* 4. Filter Kesesuaian RTRW */}
        <div>
          <label
            className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            <Compass size={12} className="text-indigo-500" />
            <span>{t("smartMatrixFilter.rtrwLabel", "Kesesuaian Tata Ruang (RTRW)")}</span>
          </label>
          <div className="relative">
            <select
              value={filters.rtrwStatus}
              onChange={(e) =>
                onChangeFilters({ ...filters, rtrwStatus: e.target.value })
              }
              className={`w-full rounded-2xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all cursor-pointer appearance-none shadow-xs ${
                filters.rtrwStatus !== "SEMUA"
                  ? isDark
                    ? "bg-indigo-950/40 border-indigo-500/60 text-indigo-300 ring-1 ring-indigo-500/30 font-bold"
                    : "bg-indigo-50 border-indigo-500/60 text-indigo-900 ring-1 ring-indigo-500/20 font-bold"
                  : isDark
                  ? "bg-slate-950/70 border border-slate-800 text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  : "bg-slate-50/90 border border-slate-200/90 text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              }`}
            >
              <option value="SEMUA">{t("smartMatrixFilter.allRtrwZones", "Semua Zona RTRW")}</option>
              <option value="SANGAT_SESUAI">{t("smartMatrixFilter.highlyCompliant", "Sangat Sesuai (KIB / Prioritas)")}</option>
              <option value="SESUAI">{t("smartMatrixFilter.compliant", "Sesuai (RTRW Compliant)")}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Toggle Pills Bar with High-End Glass Badges */}
      <div
        className={`flex flex-wrap items-center gap-2.5 mt-4 pt-3.5 border-t ${
          isDark ? "border-slate-800/80" : "border-slate-200/90"
        }`}
      >
        <button
          type="button"
          onClick={() =>
            onChangeFilters({
              ...filters,
              incentiveEligibleOnly: !filters.incentiveEligibleOnly,
            })
          }
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border active:scale-95 shadow-xs ${
            filters.incentiveEligibleOnly
              ? isDark
                ? "bg-gradient-to-r from-amber-500/25 to-amber-600/15 text-amber-300 border-amber-500/50 shadow-amber-950/40"
                : "bg-amber-100/90 text-amber-950 border-amber-400 shadow-amber-200/50"
              : isDark
              ? "bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
              : "bg-slate-100/80 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-lg flex items-center justify-center ${
              filters.incentiveEligibleOnly
                ? "bg-amber-500 text-slate-950 font-black"
                : isDark
                ? "bg-slate-800 text-slate-400"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            <Award size={12} />
          </div>
          <span>{t("smartMatrixFilter.incentiveEligible", "Eligible Insentif Perda Luwu")}</span>
        </button>

        <button
          type="button"
          onClick={() =>
            onChangeFilters({
              ...filters,
              cleanAndClearOnly: !filters.cleanAndClearOnly,
            })
          }
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border active:scale-95 shadow-xs ${
            filters.cleanAndClearOnly
              ? isDark
                ? "bg-gradient-to-r from-emerald-500/25 to-teal-600/15 text-emerald-300 border-emerald-500/50 shadow-emerald-950/40"
                : "bg-emerald-100/90 text-emerald-950 border-emerald-400 shadow-emerald-200/50"
              : isDark
              ? "bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
              : "bg-slate-100/80 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-lg flex items-center justify-center ${
              filters.cleanAndClearOnly
                ? "bg-emerald-500 text-slate-950 font-black"
                : isDark
                ? "bg-slate-800 text-slate-400"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            <ShieldCheck size={12} />
          </div>
          <span>{t("smartMatrixFilter.cleanAndClear", "Lahan Clean & Clear (FS Ready)")}</span>
        </button>
      </div>
    </div>
  );
}
