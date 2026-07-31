import React, { useState, useEffect } from 'react';
import AutoTranslatedText from './AutoTranslatedText.js';
import { useTranslation } from 'react-i18next';

// Helper Format Currency
const formatRupiahSingkat = (value: number) => {
  if (!value) return "Rp 0";
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
};

export default function HoverTooltip({ hoverInfo, investments = [], villages = [] }: { hoverInfo: any, investments?: any[], villages?: any[] }) {
  const { t } = useTranslation();

  if (!hoverInfo) return null;

  const { x, y, properties, type } = hoverInfo;
  
  // Base Tooltip Positioning Style (avoid overflowing screen bounds intuitively)
  const isRightSide = x > window.innerWidth / 2;
  const isBottomSide = y > window.innerHeight / 2;
  
  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    pointerEvents: 'none', // So it doesn't interrupt map interaction
    top: isBottomSide ? undefined : y + 20,
    bottom: isBottomSide ? (window.innerHeight - y) + 20 : undefined,
    left: isRightSide ? undefined : x + 20,
    right: isRightSide ? (window.innerWidth - x) + 20 : undefined,
  };

  if (type === 'kecamatan') {
    const rawKecName = properties._name || properties.KECAMATAN || properties.kecamatan || 'Tanpa Nama';
    // Calculate area if provided by map geojson properties
    let luas: number | string = properties.LUAS || properties.luas || properties.Shape_Area || properties.SHAPE_Area || 0;
    if (properties.description) {
        if (properties.description.includes('Luas =')) {
            const match = properties.description.match(/Luas = ([0-9.]+)/);
            if (match && match[1]) luas = parseFloat(match[1]);
        }
    }
    
    // Process Live Data Syncyrnously
    const districtKey = `dist_${rawKecName.toLowerCase().replace(/\s+/g, '_')}`;
    const liveData = investments.filter(inv => inv.district_id === districtKey || inv.districtId === districtKey);

    let data = {
        totalInvestment: 0,
        activeProjects: 0,
        dominantSector: t('tooltip.noData', 'Belum Ada Data'),
        dominantStatus: t('tooltip.noData', 'Belum Ada Data'),
        laborCount: 0
    };

    if (liveData && liveData.length > 0) {
      let totalInvestment = 0;
      let activeProjects = 0;
      let laborCount = 0;
      let sectorCount: Record<string, number> = {};
      let kesesuaianCount: Record<string, number> = {};

      liveData.forEach((inv) => {
        if (inv.is_active || inv.isActive) activeProjects += 1;
        totalInvestment += (inv.investment_value || inv.investmentValue || 0);

        // Tenaga Kerja might be in smart_data JSON
        let smartData = null;
        if (typeof inv.smart_data === 'string') {
            try { smartData = JSON.parse(inv.smart_data); } catch(e) {}
        } else {
            smartData = inv.smart_data || inv.smartData;
        }

        if (smartData && smartData.laborCount) {
            laborCount += Number(smartData.laborCount);
        }

        const sec = inv.sector || 'Lainnya';
        sectorCount[sec] = (sectorCount[sec] || 0) + 1;

        const status = inv.spatial_status || inv.spatialStatus || inv.land_status || 'Kesesuaian RDTR (Estimasi)';
        kesesuaianCount[status] = (kesesuaianCount[status] || 0) + 1;
      });

      // Dominant Sector
      const dominantSector = Object.keys(sectorCount).length > 0 
        ? Object.keys(sectorCount).reduce((a, b) => sectorCount[a] > sectorCount[b] ? a : b)
        : t('tooltip.none', 'Belum Ada');

      const dominantStatus = Object.keys(kesesuaianCount).length > 0
        ? Object.keys(kesesuaianCount).reduce((a, b) => kesesuaianCount[a] > kesesuaianCount[b] ? a : b)
        : 'N/A';

      data = {
        totalInvestment,
        activeProjects,
        dominantSector,
        dominantStatus,
        laborCount
      };
    }
    
    return (
      <div style={style} className="px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl rounded-xl font-sans min-w-[280px] border border-slate-200 dark:border-slate-800 transition duration-300 animate-in fade-in zoom-in-95">
        <div className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            📍 {t('mapAnalytics.subdistrict', 'Kecamatan')} {rawKecName}
        </div>
        
        {/* Executive Grid Layer */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{t('tooltip.totalArea', 'Total Luas')}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                {typeof luas === 'number' ? luas.toFixed(1) : luas} <span className="text-[9px] text-slate-400">Ha</span>
              </span>
            </div>
          </div>
          <div className="flex flex-col bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
            <span className="text-[9px] uppercase font-bold text-emerald-600/70 dark:text-emerald-400/70 tracking-wider">{t('tooltip.investment', 'Investasi')}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {data.totalInvestment > 0 ? formatRupiahSingkat(data.totalInvestment) : t('tooltip.none', 'Belum Ada')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] sm:text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 rounded">
                <span className="font-semibold opacity-70">{t('tooltip.dominantSector', 'Sektor Dominan')}</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                    <AutoTranslatedText text={data.dominantSector} inline />
                </span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 rounded">
                <span className="font-semibold opacity-70">{t('tooltip.dominantStatus', 'Status Ruang')}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    <AutoTranslatedText text={data.dominantStatus} inline />
                </span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 rounded">
                <span className="font-semibold opacity-70">{t('tooltip.activeProjects', 'Proyek Aktif')}</span>
                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                    {t('tooltip.projectCount', { count: data.activeProjects, defaultValue: `${data.activeProjects} Proyek` })}
                </span>
            </div>
            {data.laborCount > 0 && (
                <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-1.5 rounded border border-amber-100/50 dark:border-amber-900/50">
                    <span className="font-semibold">{t('tooltip.laborForce', 'Est. Tenaga Kerja')}</span>
                    <span className="font-bold font-mono">
                        {t('tooltip.peopleUnit', { count: data.laborCount, defaultValue: `${data.laborCount} Jiwa` })}
                    </span>
                </div>
            )}
        </div>
      </div>
    );
  }

  if (type === 'desa') {
    const rawDesaName = properties.name || properties.Nama_Desa || properties.desa || properties.NAMOBJ || 'Tanpa Nama';
    const rawKecName = properties.kecamatan || properties.KECAMATAN || properties.WADMKC || 'Tanpa Kecamatan';
    
    // Attempt to match with villages from Supabase db to avoid dummy data
    const matchedVillage = villages?.find(v => v.id === properties.id || (v.name && v.name.toLowerCase() === rawDesaName.toLowerCase()));

    const luas = matchedVillage?.areaHa || properties.areaHa || properties.luas || properties.Luas_GIS || properties.LUAS || 0;
    const pop = matchedVillage?.population || properties.population || properties.Jum_Pdd || properties.jum_pdd || 0;
    const density = matchedVillage?.density || properties.density || properties.Kepadatan || properties.kepadatan || 0;
    
    // Count active projects in this specific village
    const liveData = investments.filter(inv => inv.villageId === properties.id || inv.village_id === properties.id || (matchedVillage && inv.villageId === matchedVillage.id));
    const activeProjects = liveData.filter(inv => inv.is_active || inv.isActive).length;
    
    return (
      <div style={style} className="px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl rounded-xl font-sans min-w-[280px] border border-emerald-500/50 dark:border-emerald-800/80 transition duration-300 animate-in fade-in zoom-in-95">
        <div className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            🏡 {t('mapAnalytics.village', 'Desa')} {rawDesaName}
        </div>
        
        {/* Detail Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-[10px] sm:text-xs">
          <div className="flex flex-col bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{t('mapAnalytics.subdistrict', 'Kecamatan')}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate">{rawKecName}</span>
          </div>
          <div className="flex flex-col bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{t('tooltip.totalArea', 'Luas Area')}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{Number(luas).toFixed(1)} Ha</span>
          </div>
        </div>

        <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] sm:text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 rounded">
                <span className="font-semibold opacity-70">{t('tooltip.population', 'Penduduk')}</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                    {pop > 0 ? `${pop.toLocaleString("id-ID")} Jiwa` : '-'}
                </span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 rounded">
                <span className="font-semibold opacity-70">{t('tooltip.density', 'Kepadatan')}</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                    {density > 0 ? `${Number(density).toFixed(1)} J/km²` : '-'}
                </span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 rounded">
                <span className="font-semibold opacity-70">{t('tooltip.activeProjects', 'Proyek Aktif')}</span>
                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                    {activeProjects} Proyek
                </span>
            </div>
        </div>
      </div>
    );
  }

  if (type === 'zonasi') {
    const keterangan = properties.keterangan || properties.zona || 'Zonasi Rencana';
    const rpluwu = properties.rpluwu2009 || properties.Kawasan || '-';
    
    return (
      <div style={style} className="px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl rounded-xl font-sans min-w-[280px] border border-slate-200 dark:border-slate-800 transition duration-300 animate-in fade-in zoom-in-95 animate-duration-150">
        <div className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
          🗺️ {t('mapAnalytics.zoning', 'Zonasi Tata Ruang')}
        </div>
        
        <div className="space-y-3 text-[10px] sm:text-xs text-slate-600 dark:text-slate-300">
          <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Keterangan / Fungsi</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              <AutoTranslatedText text={keterangan} inline />
            </span>
          </div>
          
          <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Rencana Tata Ruang (RPLUWU 2009)</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              <AutoTranslatedText text={rpluwu} inline />
            </span>
          </div>

          {properties.stroke && (
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 rounded">
              <span className="font-semibold opacity-70">Warna Kode</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: properties.stroke }} />
                <span className="font-mono text-[10px]">{properties.stroke}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback for Investments/Lines (Super minimalist)
  const name = properties.name || properties.NAME || properties.nama || properties.NAMA || type;
  const isInvestment = type === 'investment';
  const isLine = type === 'line';
  const icon = isInvestment ? '💡' : (isLine ? '🛣️' : '🗺️');
  const borderColor = isInvestment ? 'border-amber-500' : (isLine ? 'border-orange-500' : 'border-emerald-500');

  return (
    <div style={style} className={`px-3 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-l-4 ${borderColor} shadow-xl rounded-r font-sans transition-opacity duration-300 ease-in-out animate-in fade-in zoom-in-95`}>
        <div className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm flex flex-col min-w-[140px] max-w-[200px]">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="text-emerald-500 text-sm">{icon}</span>
            <span className="truncate">
              <AutoTranslatedText text={name} inline />
            </span>
          </div>
        </div>
        {properties.sector && (
          <div className="mt-1.5"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-sm bg-slate-600">{properties.sector}</span></div>
        )}
    </div>
  );
}
// data integration: use real villages db for tooltip stats
