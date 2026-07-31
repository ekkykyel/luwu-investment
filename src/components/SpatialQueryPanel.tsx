import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { SektorInvestasi } from "../types.js";
import { Search, Compass, ShieldAlert, CheckCircle, Navigation, MapPin, Eye, Route, X, Sparkles } from "lucide-react";

export const getSectorI18nKey = (sector: string) => {
  switch(sector) {
    case 'Kelautan dan Perikanan': return 'sector.marine';
    case 'Pertanian': return 'sector.agriculture';
    case 'Pertambangan': return 'sector.mining';
    case 'Perindustrian': return 'sector.industry';
    case 'Pariwisata': return 'sector.tourism';
    default: return sector;
  }
};

interface SpatialQueryProps {
  onExecuteQuery: (params: any) => void;
  queryResults: any[];
  onFocusInvestment: (id: string) => void;
  isDarkMode: boolean;
  infrastructure?: any[];
  onProximityFilterChange?: (infraId: string | null, radiusKm: number) => void;
  onSelectShortestPathRoute?: (infraId: string, investmentId: string) => void;
  activeRouteInfo?: {
    distanceKm: number;
    distanceMeters: number;
    method: string;
    infraName: string;
    investmentName: string;
  } | null;
  onClearShortestPathRoute?: () => void;
}

export default function SpatialQueryPanel({ 
  onExecuteQuery, 
  queryResults, 
  onFocusInvestment, 
  isDarkMode,
  infrastructure = [],
  onProximityFilterChange,
  onSelectShortestPathRoute,
  activeRouteInfo,
  onClearShortestPathRoute
}: SpatialQueryProps) {
  const { t } = useTranslation();
  // Query Filters
  const [minArea, setMinArea] = useState<number>(0);
  const [maxPortDist, setMaxPortDist] = useState<number>(99);
  const [maxRoadDist, setMaxRoadDist] = useState<number>(99);
  const [minValue, setMinValue] = useState<number>(0);
  const [selectedSectors, setSelectedSectors] = useState<SektorInvestasi[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);

  // Proximity Radius Filters
  const [selectedInfraId, setSelectedInfraId] = useState<string>("");
  const [proximityRadius, setProximityRadius] = useState<number>(5);

  // Debounce/trigger callback when proximity filter inputs change
  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (selectedInfraId && proximityRadius > 0) {
        onProximityFilterChange?.(selectedInfraId, proximityRadius);
      } else {
        onProximityFilterChange?.(null, proximityRadius);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedInfraId, proximityRadius, onProximityFilterChange]);

  const handleSectorToggle = (sec: SektorInvestasi) => {
    if (selectedSectors.includes(sec)) {
      setSelectedSectors(selectedSectors.filter(s => s !== sec));
    } else {
      setSelectedSectors([...selectedSectors, sec]);
    }
  };

  // Run customized query trigger
  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsQuerying(true);
    try {
      await onExecuteQuery({
        minArea,
        maxPortDist: maxPortDist === 99 ? 999 : maxPortDist,
        maxRoadDist: maxRoadDist === 99 ? 999 : maxRoadDist,
        minValue: minValue * 1e9, // Billion to native
        sectors: selectedSectors.join(",")
      });
    } finally {
      setIsQuerying(false);
    }
  };

  // Preset templates shortcuts
  const applyPresetQuery = async (preset: string) => {
    setIsQuerying(true);
    try {
      if (preset === "large_land") {
        setMinArea(100);
        setMaxPortDist(99);
        setMaxRoadDist(99);
        setMinValue(0);
        setSelectedSectors([]);
        await onExecuteQuery({
          minArea: 100,
          maxPortDist: 999,
          maxRoadDist: 999,
          minValue: 0,
          sectors: ""
        });
      } else if (preset === "near_port") {
        setMinArea(0);
        setMaxPortDist(10);
        setMaxRoadDist(99);
        setMinValue(0);
        setSelectedSectors([]);
        await onExecuteQuery({
          minArea: 0,
          maxPortDist: 10,
          maxRoadDist: 999,
          minValue: 0,
          sectors: ""
        });
      } else if (preset === "agri_strategic") {
        setMinArea(50);
        setMaxPortDist(99);
        setMaxRoadDist(5);
        setMinValue(0);
        setSelectedSectors([SektorInvestasi.PERTANIAN]);
        await onExecuteQuery({
          minArea: 50,
          maxPortDist: 999,
          maxRoadDist: 5,
          minValue: 0,
          sectors: SektorInvestasi.PERTANIAN
        });
      } else if (preset === "mega_invest") {
        setMinArea(0);
        setMaxPortDist(99);
        setMaxRoadDist(99);
        setMinValue(100); // 100 Billion
        setSelectedSectors([]);
        await onExecuteQuery({
          minArea: 0,
          maxPortDist: 999,
          maxRoadDist: 999,
          minValue: 100 * 1e9,
          sectors: ""
        });
      }
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className={`shrink-0 border p-4 sm:p-5 rounded-2xl flex flex-col gap-4 font-sans relative overflow-hidden transition-all duration-300 md:w-64 ${isDarkMode ? "bg-slate-900/60 border-slate-700/50 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] text-slate-100" : "bg-white/80 border-slate-200/60 shadow-lg text-slate-800"}`}>
      
      {isDarkMode && <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 blur-3xl pointer-events-none mix-blend-screen"></div>}

      <div className={`flex items-center gap-3 relative z-10 border-b pb-3 ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
        <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-emerald-500/10" : "bg-emerald-50 border border-emerald-100"}`}>
          <Compass className={`h-4.5 w-4.5 rotate-45 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
        </div>
        <h4 className={`text-[12px] sm:text-[13px] font-display font-bold uppercase tracking-wide ${isDarkMode ? "text-white" : "text-slate-800"}`}>Spatial Intelligence Query</h4>
      </div>

      {/* Shortcuts Presets */}
      <div className="flex flex-col gap-2 pt-1 relative z-10">
        <span className={`text-[8.5px] font-extrabold uppercase tracking-widest font-mono ${isDarkMode ? "text-emerald-400/85" : "text-emerald-700"}`}>{t('spatial.instantSpatialSearch')}</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => applyPresetQuery("large_land")}
            className={`p-2 border rounded-xl text-left text-[10px] transition-all font-semibold flex flex-col gap-0.5 shadow-sm hover:scale-[1.01] active:scale-[0.99] ${
              isDarkMode 
                ? "border-slate-800 bg-slate-900/50 hover:border-emerald-500 hover:bg-emerald-950/35 text-slate-400" 
                : "border-slate-300 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50 text-slate-500"
            }`}
          >
            <span className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{t('spatial.largeScale')}</span>
            <span className="font-mono text-[9px] opacity-80">{t('spatial.greaterThan100Ha')}</span>
          </button>
          <button
            type="button"
            onClick={() => applyPresetQuery("near_port")}
            className={`p-2 border rounded-xl text-left text-[10px] transition-all font-semibold flex flex-col gap-0.5 shadow-sm hover:scale-[1.01] active:scale-[0.99] ${
              isDarkMode 
                ? "border-slate-800 bg-slate-900/50 hover:border-blue-500 hover:bg-blue-950/35 text-slate-400" 
                : "border-slate-300 bg-slate-50 hover:border-blue-500 hover:bg-blue-50 text-slate-500"
            }`}
          >
            <span className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{t('spatial.buaPort')}</span>
            <span className="font-mono text-[9px] opacity-80">{t('spatial.logisticsLessThan10km')}</span>
          </button>
          <button
            type="button"
            onClick={() => applyPresetQuery("agri_strategic")}
            className={`p-2 border rounded-xl text-left text-[10px] transition-all font-semibold flex flex-col gap-0.5 shadow-sm hover:scale-[1.01] active:scale-[0.99] ${
              isDarkMode 
                ? "border-slate-800 bg-slate-900/50 hover:border-green-500 hover:bg-green-950/35 text-slate-400" 
                : "border-slate-300 bg-slate-50 hover:border-green-500 hover:bg-green-50 text-slate-500"
            }`}
          >
            <span className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{t('spatial.farmingArea')}</span>
            <span className="font-mono text-[9px] opacity-80">{t('spatial.farmingAndArtery')}</span>
          </button>
          <button
            type="button"
            onClick={() => applyPresetQuery("mega_invest")}
            className={`p-2 border rounded-xl text-left text-[10px] transition-all font-semibold flex flex-col gap-0.5 shadow-sm hover:scale-[1.01] active:scale-[0.99] ${
              isDarkMode 
                ? "border-slate-800 bg-slate-900/50 hover:border-rose-500 hover:bg-rose-950/35 text-slate-400" 
                : "border-slate-300 bg-slate-50 hover:border-rose-500 hover:bg-rose-50 text-slate-500"
            }`}
          >
            <span className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{t('spatial.megaInvestment')}</span>
            <span className="font-mono text-[9px] opacity-80">{t('spatial.greaterThan100Billion')}</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Form */}
      <form onSubmit={handleQuerySubmit} className={`flex flex-col gap-4 border-t pt-4 text-xs font-sans relative z-10 ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
        <span className={`text-[8.5px] font-extrabold uppercase tracking-widest font-mono ${isDarkMode ? "text-emerald-400/85" : "text-emerald-700"}`}>{t('spatial.customFilter')}</span>
        
        {/* Sliders distance and values */}
        <div className="flex flex-col gap-3.5 mt-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-[8px] sm:text-[9px] block font-extrabold mb-1 uppercase font-mono tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>{t('spatial.minLand')}</label>
              <input
                type="number"
                min="0"
                value={minArea}
                onChange={(e) => setMinArea(Number(e.target.value))}
                className={`w-full border rounded-lg px-2.5 py-2 text-xs font-mono shadow-inner focus:outline-none focus:ring-1 transition-all ${
                  isDarkMode 
                    ? "bg-slate-900/80 border-slate-700 text-slate-200 focus:border-emerald-500 focus:ring-emerald-500/40" 
                    : "bg-white border-slate-300 text-slate-800 focus:border-emerald-600 focus:ring-emerald-500/30"
                }`}
              />
            </div>
            <div>
              <label className={`text-[8px] sm:text-[9px] block font-extrabold mb-1 uppercase font-mono tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>{t('spatial.minVal')}</label>
              <input
                type="number"
                min="0"
                value={minValue}
                onChange={(e) => setMinValue(Number(e.target.value))}
                className={`w-full border rounded-lg px-2.5 py-2 text-xs font-mono shadow-inner focus:outline-none focus:ring-1 transition-all ${
                  isDarkMode 
                    ? "bg-slate-900/80 border-slate-700 text-slate-200 focus:border-emerald-500 focus:ring-emerald-500/40" 
                    : "bg-white border-slate-300 text-slate-800 focus:border-emerald-600 focus:ring-emerald-500/30"
                }`}
              />
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-100/50 border-slate-200"}`}>
            <div className="flex justify-between items-center text-[9px] mb-2">
              <span className={`font-extrabold uppercase font-mono tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-700"}`}>{t('spatial.maxDistBua')}</span>
              <span className={`font-mono font-bold px-1.5 py-0.5 rounded shadow-inner text-[9.5px] ${
                isDarkMode ? "bg-slate-800 border border-slate-700 text-slate-300" : "bg-white border border-slate-300 text-slate-800"
              }`}>{maxPortDist === 99 ? "Bebas" : `${maxPortDist} km`}</span>
            </div>
            <input
              type="range"
              min="2"
              max="99"
              step="2"
              value={maxPortDist}
              onChange={(e) => setMaxPortDist(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full appearance-none"
            />
          </div>

          <div className={`p-2.5 rounded-xl border ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-100/50 border-slate-200"}`}>
            <div className="flex justify-between items-center text-[9px] mb-2">
              <span className={`font-extrabold uppercase font-mono tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-700"}`}>{t('spatial.maxDistRoad')}</span>
              <span className={`font-mono font-bold px-1.5 py-0.5 rounded shadow-inner text-[9.5px] ${
                isDarkMode ? "bg-slate-800 border border-slate-700 text-slate-300" : "bg-white border border-slate-300 text-slate-800"
              }`}>{maxRoadDist === 99 ? "Bebas" : `${maxRoadDist} km`}</span>
            </div>
            <input
              type="range"
              min="1"
              max="99"
              step="2"
              value={maxRoadDist}
              onChange={(e) => setMaxRoadDist(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full appearance-none"
            />
          </div>

          {/* Interactive Proximity Radius Filter */}
          <div className={`p-3 rounded-2xl border flex flex-col gap-3 relative overflow-hidden transition-all duration-300 ${
            isDarkMode 
              ? "bg-slate-900/60 border-emerald-500/10 hover:border-emerald-500/20" 
              : "bg-slate-50 border-slate-200 hover:border-emerald-500/20 shadow-sm"
          }`}>
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded-lg ${isDarkMode ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
                <MapPin className={`h-3.5 w-3.5 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
              </div>
              <span className={`text-[10px] font-extrabold uppercase tracking-widest font-mono ${isDarkMode ? "text-emerald-400/90" : "text-emerald-700"}`}>Proximity Radius Filter</span>
            </div>

            {/* Target Infrastructure Dropdown & Quick Facility Type Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className={`text-[8.5px] font-extrabold uppercase font-mono tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Target Infrastructure</label>
                <span className="text-[8px] font-mono text-emerald-500 uppercase tracking-widest font-semibold">ISO 19115 GIS Buffer</span>
              </div>
              <select
                value={selectedInfraId}
                onChange={(e) => setSelectedInfraId(e.target.value)}
                className={`w-full border rounded-lg px-2.5 py-2 text-xs font-sans shadow-inner focus:outline-none focus:ring-1 transition-all ${
                  isDarkMode 
                    ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500 focus:ring-emerald-500/40" 
                    : "bg-white border-slate-300 text-slate-800 focus:border-emerald-600 focus:ring-emerald-500/30"
                }`}
              >
                <option value="">-- Pilih Infrastruktur Target --</option>
                {infrastructure.map((inf) => (
                  <option key={inf.id} value={inf.id}>
                    {inf.name} ({inf.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick OGC Standard Distance Buffer Presets */}
            {selectedInfraId && (
              <div className="flex flex-col gap-2 mt-1 transition-all duration-350">
                <div className="flex justify-between items-center text-[8.5px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  <span>Preset Buffer Standar OGC:</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { radius: 1, label: "1 KM", desc: "Mikro" },
                    { radius: 5, label: "5 KM", desc: "Perkotaan" },
                    { radius: 10, label: "10 KM", desc: "Koridor" },
                    { radius: 25, label: "25 KM", desc: "Regional" },
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.radius}
                      onClick={() => setProximityRadius(preset.radius)}
                      className={`py-1.5 px-1 border rounded-lg text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                        proximityRadius === preset.radius
                          ? "bg-emerald-500 text-white border-emerald-400 shadow-md font-bold"
                          : isDarkMode
                          ? "bg-slate-950 border-slate-800 text-slate-400 hover:border-emerald-500/50 hover:text-slate-200"
                          : "bg-white border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
                      }`}
                    >
                      <span className="text-[9.5px] font-mono font-extrabold">{preset.label}</span>
                      <span className="text-[7.5px] opacity-80">{preset.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Real-time Dynamic Text above the slider */}
                <div className={`text-[10px] font-medium leading-relaxed mt-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  Investasi dalam radius <span className="font-bold text-emerald-500 font-mono text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded shadow-inner border border-emerald-500/20">{proximityRadius}</span> KM dari <span className="font-bold text-slate-200 dark:text-white bg-slate-850 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-white/5">{infrastructure.find(i => i.id === selectedInfraId)?.name || "Target"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-bold text-slate-400">1 KM</span>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={proximityRadius}
                    onChange={(e) => setProximityRadius(Number(e.target.value))}
                    className="flex-grow accent-emerald-500 cursor-pointer h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full appearance-none transition-all hover:bg-emerald-500/10"
                  />
                  <span className="text-[9px] font-mono font-bold text-slate-400">30 KM</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Categories sectors checkboxes selector */}
        <div className="mt-1">
          <label className={`text-[8px] sm:text-[9px] block font-extrabold mb-2 uppercase font-mono tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-505"}`}>{t('spatial.targetIndustrySector')}</label>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(SektorInvestasi).map(sec => {
              const active = selectedSectors.includes(sec);
              return (
                <button
                  type="button"
                  key={sec}
                  onClick={() => handleSectorToggle(sec)}
                  className={`px-2.5 py-1.5 rounded-lg text-[8.5px] font-sans font-bold transition-all border uppercase tracking-wider ${
                    active
                      ? (isDarkMode ? "bg-slate-800 border-emerald-500 text-white shadow-sm" : "bg-emerald-600 border-emerald-600 text-white shadow")
                      : (isDarkMode ? "bg-slate-950/50 hover:bg-slate-900 text-slate-500 border-slate-800/85" : "bg-white hover:bg-slate-50 text-slate-500 border-slate-300")
                  }`}
                >
                  {t(getSectorI18nKey(sec))}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={isQuerying}
          className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-display tracking-widest rounded-xl transition-all text-[10px] sm:text-[11px] shadow-lg hover:scale-[1.01] active:scale-[0.99] border border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {isQuerying ? (
            <>
              <span className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              {t('loading')}
            </>
          ) : (
            t('spatial.executeQuery')
          )}
        </button>
      </form>

      {/* Query Results Display Grid */}
      <div className={`border-t pt-4 flex flex-col gap-3 relative z-10 ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
        
        {/* Active Shortest Path Route Card (pgRouting Topology) */}
        {activeRouteInfo && (
          <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-emerald-500/50 shadow-[0_10px_25px_rgba(16,185,129,0.15)] text-white flex flex-col gap-2 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2">
              <div className="flex items-center gap-1.5">
                <Route className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-emerald-300">Rute Aksesibilitas Tercepat (pgRouting)</span>
              </div>
              {onClearShortestPathRoute && (
                <button
                  type="button"
                  onClick={onClearShortestPathRoute}
                  className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Tutup Rute"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1 text-[10.5px]">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400 font-mono text-[9.5px]">Awal:</span>
                <span className="font-bold text-emerald-300 truncate max-w-[180px]">{activeRouteInfo.infraName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400 font-mono text-[9.5px]">Tujuan:</span>
                <span className="font-bold text-amber-300 truncate max-w-[180px]">{activeRouteInfo.investmentName}</span>
              </div>
            </div>

            <div className="mt-1 pt-2 border-t border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[8.5px] font-mono text-slate-400 block uppercase">Metode Topologi</span>
                <span className="text-[9.5px] font-bold text-emerald-400 font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  {activeRouteInfo.method}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[8.5px] font-mono text-slate-400 block uppercase">Jarak Presisi</span>
                <span className="text-xs font-black font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  {activeRouteInfo.distanceKm} KM ({activeRouteInfo.distanceMeters.toLocaleString("id-ID")} m)
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center text-[10px]">
          <span className={`font-extrabold uppercase tracking-widest font-mono ${isDarkMode ? "text-emerald-400/85" : "text-emerald-700"}`}>{t('spatial.areaMatch')} ({queryResults.length})</span>
          {queryResults.length > 0 && <span className="text-slate-400 font-bold font-mono">{t('spatial.sortedByScore')}</span>}
        </div>

        {queryResults.length === 0 ? (
          <div className={`p-4 rounded-xl border border-dashed text-center text-[10px] font-mono italic ${
            isDarkMode ? "border-slate-750 bg-slate-900/30 text-slate-500" : "border-slate-300 bg-slate-50 text-slate-400"
          }`}>
            {t('spatial.noMatch')}
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
            {queryResults.map(item => (
              <div
                key={item.id}
                onClick={() => onFocusInvestment(item.id)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col gap-2 w-full group shadow-md hover:scale-[1.01] ${
                  isDarkMode 
                    ? "border-slate-800 bg-slate-900 hover:bg-slate-800/80 hover:border-emerald-500/40" 
                    : "border-slate-300 bg-slate-50 hover:bg-white hover:border-emerald-500 text-slate-800 shadow-sm"
                }`}
              >
                <div className={`flex justify-between items-center p-2 rounded-lg border shadow-inner gap-2 ${
                  isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <span className={`font-semibold truncate block w-full text-left transition-colors uppercase tracking-wide text-[10.5px] ${
                    isDarkMode ? "text-slate-200 group-hover:text-emerald-400" : "text-slate-800 group-hover:text-emerald-700"
                  }`}>{item.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold text-white shadow ${
                    item.suitabilityScore >= 90 ? "bg-emerald-600" : item.suitabilityScore >= 70 ? "bg-amber-600" : "bg-rose-600"
                  }`}>{item.suitabilityScore}%</span>
                </div>
                
                <div className={`grid grid-cols-2 gap-y-1.5 gap-x-2 font-mono text-[9px] mt-0.5 px-1 ${
                  isDarkMode ? "text-slate-500" : "text-slate-600"
                }`}>
                  <div className="uppercase">{t('spatial.sectorLabel')}: <span className={isDarkMode ? "text-slate-300 font-sans font-medium capitalize" : "text-slate-800 font-sans font-medium capitalize"}>{t(getSectorI18nKey(item.sector))}</span></div>
                  <div className="uppercase">{t('spatial.areaLabel')}: <span className={isDarkMode ? "text-slate-300 font-bold" : "text-slate-800 font-bold"}>{item.areaHa} Ha</span></div>
                  <div className="uppercase">{t('spatial.toPort')}: <span className="text-sky-500 font-bold">{item.distToPortKm} KM</span></div>
                  <div className="uppercase">{t('spatial.toRoad')}: <span className="text-amber-500 font-bold">{item.distToRoadKm} KM</span></div>
                </div>

                {/* Shortest Path Route Trigger Button */}
                {selectedInfraId && onSelectShortestPathRoute && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectShortestPathRoute(selectedInfraId, item.id);
                    }}
                    className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 font-mono text-[9.5px] font-bold transition-all flex items-center justify-center gap-1.5 hover:border-emerald-400"
                  >
                    <Route className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    Visualisasikan Jalur Terpendek (pgRouting)
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
