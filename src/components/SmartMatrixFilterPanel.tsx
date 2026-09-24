import React from "react";
import {
  Filter,
  Search,
  RotateCcw,
  Sparkles,
  Layers,
  Award,
  ShieldCheck,
  Building,
  TrendingUp,
} from "lucide-react";
import { SektorInvestasi } from "../types";
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

export default function SmartMatrixFilterPanel({
  filters,
  onChangeFilters,
  districtsList = [],
  totalResults = 0,
  isDark = true,
}: SmartMatrixFilterPanelProps) {
  const { t } = useTranslation();
  

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

  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl border relative overflow-hidden transition-all duration-300 ${
        isDark
          ? "bg-slate-900/90 border-slate-800 text-white shadow-[0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl"
          : "bg-white/95 border-slate-200/90 text-slate-900 shadow-xl shadow-slate-200/60 backdrop-blur-xl"
      }`}
    >
      {/* Top Accent Glowing Line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />

      {/* Top Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b ${
          isDark ? "border-slate-800" : "border-slate-200/80"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl border shrink-0 ${
              isDark
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            <Filter size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>{t('smartMatrixFilter.title', 'Filter Matriks Peluang Investasi')}</span>
                <Sparkles size={14} className="text-amber-500 fill-amber-500/20" />
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                isDark 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-emerald-100 text-emerald-800 border-emerald-200"
              }`}>
                Smart Matrix
              </span>
            </div>
            <p
              className={`text-[11px] font-medium mt-0.5 ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {t('smartMatrixFilter.showingResults', 'Menampilkan {{count}} Peluang IPRO Terverifikasi Pemkab Luwu', { count: totalResults })}
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all self-end sm:self-auto cursor-pointer active:scale-95 ${
            isDark
              ? "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <RotateCcw size={13} />
          <span>{t('smartMatrixFilter.resetFilter', 'Reset Filter')}</span>
        </button>
      </div>

      {/* Filter Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
        {/* Search Bar */}
        <div className="relative">
          <label
            className={`text-[10px] font-extrabold uppercase tracking-wider block mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            {t('smartMatrixFilter.searchLabel', 'Cari Kata Kunci')}
          </label>
          <div className="relative">
            <Search
              size={15}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            />
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) =>
                onChangeFilters({ ...filters, searchTerm: e.target.value })
              }
              placeholder={t('smartMatrixFilter.searchPlaceholder', 'Cari lokasi, sektor, atau kriteria...')}
              className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none transition-all ${
                isDark
                  ? "bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  : "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
              }`}
            />
          </div>
        </div>

        {/* Filter Sektor */}
        <div>
          <label
            className={`text-[10px] font-extrabold uppercase tracking-wider block mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            {t('smartMatrixFilter.sectorLabel', 'Sektor Strategis')}
          </label>
          <select
            value={filters.selectedSector}
            onChange={(e) =>
              onChangeFilters({ ...filters, selectedSector: e.target.value })
            }
            className={`w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
              isDark
                ? "bg-slate-950/80 border border-slate-800 text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                : "bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
            }`}
          >
            <option value="SEMUA">{t('smartMatrixFilter.allSectors', 'Semua Sektor')}</option>
            <option value="Pertanian">{t('smartMatrixFilter.agriculture', 'Pertanian & Agroindustri')}</option>
            <option value="Perkebunan">{t('smartMatrixFilter.plantation', 'Perkebunan (Kakao, Cengkeh, Kopi)')}</option>
            <option value="Perikanan">{t('smartMatrixFilter.fisheries', 'Perikanan & Rumput Laut')}</option>
            <option value="Pertambangan">{t('smartMatrixFilter.mining', 'Pertambangan & Smelter')}</option>
            <option value="Pariwisata">{t('smartMatrixFilter.tourism', 'Pariwisata & Ekowisata')}</option>
            <option value="Energi">{t('smartMatrixFilter.energy', 'Energi & Infrastruktur')}</option>
          </select>
        </div>

        {/* Filter Kecamatan */}
        <div>
          <label
            className={`text-[10px] font-extrabold uppercase tracking-wider block mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            {t('smartMatrixFilter.districtLabel', 'Kecamatan di Luwu')}
          </label>
          <select
            value={filters.selectedDistrict}
            onChange={(e) =>
              onChangeFilters({ ...filters, selectedDistrict: e.target.value })
            }
            className={`w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
              isDark
                ? "bg-slate-950/80 border border-slate-800 text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                : "bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
            }`}
          >
            <option value="SEMUA">{t('smartMatrixFilter.allDistricts', 'Semua Kecamatan (22 Wilayah)')}</option>
            {districtsList.map((dist, i) => (
              <option key={i} value={dist}>
                {t('smartMatrixFilter.districtPrefix', 'Kec.')} {dist}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Kesesuaian RTRW */}
        <div>
          <label
            className={`text-[10px] font-extrabold uppercase tracking-wider block mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            {t('smartMatrixFilter.rtrwLabel', 'Kesesuaian Tata Ruang (RTRW)')}
          </label>
          <select
            value={filters.rtrwStatus}
            onChange={(e) =>
              onChangeFilters({ ...filters, rtrwStatus: e.target.value })
            }
            className={`w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
              isDark
                ? "bg-slate-950/80 border border-slate-800 text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                : "bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
            }`}
          >
            <option value="SEMUA">{t('smartMatrixFilter.allRtrwZones', 'Semua Zona RTRW')}</option>
            <option value="SANGAT_SESUAI">{t('smartMatrixFilter.highlyCompliant', 'Sangat Sesuai (KIB / Prioritas)')}</option>
            <option value="SESUAI">{t('smartMatrixFilter.compliant', 'Sesuai (RTRW Compliant)')}</option>
          </select>
        </div>
      </div>

      {/* Interactive Toggle Pills Bar */}
      <div
        className={`flex flex-wrap items-center gap-2.5 mt-3.5 pt-3 border-t ${
          isDark ? "border-slate-800/80" : "border-slate-200/80"
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
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            filters.incentiveEligibleOnly
              ? isDark
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                : "bg-amber-100 text-amber-900 border-amber-300 shadow-sm"
              : isDark
                ? "bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300"
                : "bg-slate-100/80 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
          }`}
        >
          <Award
            size={14}
            className={filters.incentiveEligibleOnly ? "text-amber-500" : "text-slate-400"}
          />
          <span>{t('smartMatrixFilter.incentiveEligible', 'Eligible Insentif Perda Luwu')}</span>
        </button>

        <button
          type="button"
          onClick={() =>
            onChangeFilters({
              ...filters,
              cleanAndClearOnly: !filters.cleanAndClearOnly,
            })
          }
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            filters.cleanAndClearOnly
              ? isDark
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                : "bg-emerald-100 text-emerald-900 border-emerald-300 shadow-sm"
              : isDark
                ? "bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300"
                : "bg-slate-100/80 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
          }`}
        >
          <ShieldCheck
            size={14}
            className={filters.cleanAndClearOnly ? "text-emerald-500" : "text-slate-400"}
          />
          <span>{t('smartMatrixFilter.cleanAndClear', 'Lahan Clean & Clear (FS Ready)')}</span>
        </button>
      </div>
    </div>
  );
}
