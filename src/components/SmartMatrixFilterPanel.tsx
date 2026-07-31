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
import { SektorInvestasi } from "../types.js";
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
      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isDark
          ? "bg-slate-900/90 border-emerald-500/30 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          : "bg-emerald-50/60 border-emerald-300/80 text-slate-900 shadow-xl"
      }`}
    >
      {/* Top Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
          isDark ? "border-slate-800" : "border-emerald-200/80"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl border ${
              isDark
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-emerald-100 text-emerald-700 border-emerald-300"
            }`}
          >
            <Filter size={18} />
          </div>
          <div>
            <h4
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? "text-emerald-400" : "text-emerald-800"
              }`}
            >
              <span>{t('smartMatrixFilter.title', 'Filter Matriks Peluang Investasi (Smart Matrix Search)')}</span>
              <Sparkles size={13} className="text-amber-500" />
            </h4>
            <span
              className={`text-[11px] ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {t('smartMatrixFilter.showingResults', 'Menampilkan {{count}} Peluang IPRO Terverifikasi Pemkab Luwu', { count: totalResults })}
            </span>
          </div>
        </div>

        <button
          onClick={handleReset}
          className={`flex items-center gap-1.5 text-xs transition-colors self-end sm:self-auto cursor-pointer font-semibold ${
            isDark
              ? "text-slate-400 hover:text-emerald-400"
              : "text-slate-600 hover:text-emerald-700"
          }`}
        >
          <RotateCcw size={14} />
          <span>{t('smartMatrixFilter.resetFilter', 'Reset Filter')}</span>
        </button>
      </div>

      {/* Filter Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {/* Search Bar */}
        <div className="relative">
          <label
            className={`text-[10px] font-bold uppercase block mb-1 ${
              isDark ? "text-slate-400" : "text-slate-700"
            }`}
          >
            {t('smartMatrixFilter.searchLabel', 'Cari Kata Kunci')}
          </label>
          <div className="relative">
            <Search
              size={15}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            />
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) =>
                onChangeFilters({ ...filters, searchTerm: e.target.value })
              }
              placeholder={t('smartMatrixFilter.searchPlaceholder', 'Contoh: Kakao, Smelter, Bua...')}
              className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none transition-colors ${
                isDark
                  ? "bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500"
                  : "bg-white border border-slate-300 text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
              }`}
            />
          </div>
        </div>

        {/* Filter Sektor */}
        <div>
          <label
            className={`text-[10px] font-bold uppercase block mb-1 ${
              isDark ? "text-slate-400" : "text-slate-700"
            }`}
          >
            {t('smartMatrixFilter.sectorLabel', 'Sektor Strategis')}
          </label>
          <select
            value={filters.selectedSector}
            onChange={(e) =>
              onChangeFilters({ ...filters, selectedSector: e.target.value })
            }
            className={`w-full rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors cursor-pointer ${
              isDark
                ? "bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500"
                : "bg-white border border-slate-300 text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
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
            className={`text-[10px] font-bold uppercase block mb-1 ${
              isDark ? "text-slate-400" : "text-slate-700"
            }`}
          >
            {t('smartMatrixFilter.districtLabel', 'Kecamatan di Luwu')}
          </label>
          <select
            value={filters.selectedDistrict}
            onChange={(e) =>
              onChangeFilters({ ...filters, selectedDistrict: e.target.value })
            }
            className={`w-full rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors cursor-pointer ${
              isDark
                ? "bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500"
                : "bg-white border border-slate-300 text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
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
            className={`text-[10px] font-bold uppercase block mb-1 ${
              isDark ? "text-slate-400" : "text-slate-700"
            }`}
          >
            {t('smartMatrixFilter.rtrwLabel', 'Kesesuaian Tata Ruang (RTRW)')}
          </label>
          <select
            value={filters.rtrwStatus}
            onChange={(e) =>
              onChangeFilters({ ...filters, rtrwStatus: e.target.value })
            }
            className={`w-full rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors cursor-pointer ${
              isDark
                ? "bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500"
                : "bg-white border border-slate-300 text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
            }`}
          >
            <option value="SEMUA">{t('smartMatrixFilter.allRtrwZones', 'Semua Zona RTRW')}</option>
            <option value="SANGAT_SESUAI">{t('smartMatrixFilter.highlyCompliant', 'Sangat Sesuai (KIB / Prioritas)')}</option>
            <option value="SESUAI">{t('smartMatrixFilter.compliant', 'Sesuai (RTRW Compliant)')}</option>
          </select>
        </div>
      </div>

      {/* Toggles Bar */}
      <div
        className={`flex flex-wrap items-center gap-4 mt-3 pt-3 border-t ${
          isDark ? "border-slate-800/80" : "border-emerald-200/80"
        }`}
      >
        <label
          className={`flex items-center gap-2 cursor-pointer text-xs font-semibold ${
            isDark ? "text-slate-300" : "text-slate-800"
          }`}
        >
          <input
            type="checkbox"
            checked={filters.incentiveEligibleOnly}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                incentiveEligibleOnly: e.target.checked,
              })
            }
            className={`rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer ${
              isDark
                ? "border-slate-700 bg-slate-950"
                : "border-slate-300 bg-white"
            }`}
          />
          <span className="flex items-center gap-1.5">
            <Award
              size={14}
              className={isDark ? "text-amber-400" : "text-amber-600"}
            />
            {t('smartMatrixFilter.incentiveEligible', 'Eligible Insentif Perda Luwu')}
          </span>
        </label>

        <label
          className={`flex items-center gap-2 cursor-pointer text-xs font-semibold ${
            isDark ? "text-slate-300" : "text-slate-800"
          }`}
        >
          <input
            type="checkbox"
            checked={filters.cleanAndClearOnly}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                cleanAndClearOnly: e.target.checked,
              })
            }
            className={`rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer ${
              isDark
                ? "border-slate-700 bg-slate-950"
                : "border-slate-300 bg-white"
            }`}
          />
          <span className="flex items-center gap-1.5">
            <ShieldCheck
              size={14}
              className={isDark ? "text-emerald-400" : "text-emerald-700"}
            />
            {t('smartMatrixFilter.cleanAndClear', 'Lahan Clean & Clear (FS Ready)')}
          </span>
        </label>
      </div>
    </div>
  );
}
