import React, { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Bot, Percent, ShieldCheck, FileText, Sparkles } from 'lucide-react';
import { useRoiCalculation, generateHeuristicRoiAnalysis, formatHeuristicRoiMarkdown } from '../hooks/useRoiCalculation';

export interface RoiSimulatorDashboardProps {
  isDarkMode?: boolean;
  defaultSector?: string;
  defaultInvestment?: number;
}

export const RoiSimulatorDashboard: React.FC<RoiSimulatorDashboardProps> = ({
  isDarkMode = true,
  defaultSector = 'Pertanian & Perkebunan',
  defaultInvestment = 5000000000
}) => {
  const [sektor, setSektor] = useState(defaultSector);
  const [nilaiInvestasi, setNilaiInvestasi] = useState<number>(defaultInvestment);
  const [luasLahan, setLuasLahan] = useState<number>(10);
  const [opexTahunan, setOpexTahunan] = useState<number>(defaultInvestment * 0.15);
  const [revenueTahunan, setRevenueTahunan] = useState<number>(defaultInvestment * 0.4);

  const { loading, analysisText, calculateRoi } = useRoiCalculation();

  // Metrics
  const netProfit = (revenueTahunan || 0) - (opexTahunan || 0);
  const roiPercentage = nilaiInvestasi > 0 ? (netProfit / nilaiInvestasi) * 100 : 0;
  const paybackPeriod = netProfit > 0 ? nilaiInvestasi / netProfit : 0;

  const handleCalculateAi = async () => {
    await calculateRoi({
      nilaiInvestasi,
      sektor,
      luasLahan,
      capex: nilaiInvestasi,
      opex: opexTahunan,
      revenue: revenueTahunan
    });
  };

  return (
    <div className={`p-6 rounded-3xl border ${
      isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
    } shadow-xl space-y-6`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Calculator size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Simulator ROI & Kelayakan Investasi</h2>
            <p className="text-xs text-slate-400">Analisis proyeksi kelayakan finansial & kebijakan strategis Kab. Luwu</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCalculateAi}
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-black/25 flex items-center gap-2 cursor-pointer"
        >
          <Bot size={16} />
          <span>{loading ? 'Menganalisis Kelayakan...' : 'Hitung Analisis AI'}</span>
          <Sparkles size={14} className="text-amber-300" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold mb-1.5 text-slate-400">Sektor Investasi</label>
          <select
            value={sektor}
            onChange={(e) => setSektor(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl text-sm border font-medium ${
              isDarkMode ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            <option value="Pertanian & Perkebunan">Pertanian & Perkebunan (Kakao, Kopi, Padi)</option>
            <option value="Perikanan & Kelautan">Perikanan & Kelautan (Rumput Laut, Udang)</option>
            <option value="Industri Pengolahan">Industri Pengolahan & Manufaktur</option>
            <option value="Pariwisata & Jasa">Pariwisata & Ekowisata</option>
            <option value="Energi Terbarukan">Energi Terbarukan (PLTMH, Solar)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5 text-slate-400">Nilai Investasi (CAPEX)</label>
          <input
            type="number"
            value={nilaiInvestasi}
            onChange={(e) => setNilaiInvestasi(Number(e.target.value))}
            className={`w-full px-3.5 py-2.5 rounded-xl text-sm border font-mono font-bold ${
              isDarkMode ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5 text-slate-400">Estimasi Luas Lahan (Ha)</label>
          <input
            type="number"
            value={luasLahan}
            onChange={(e) => setLuasLahan(Number(e.target.value))}
            className={`w-full px-3.5 py-2.5 rounded-xl text-sm border font-mono font-bold ${
              isDarkMode ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Estimasi ROI</span>
            <Percent size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">{roiPercentage.toFixed(2)}%</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Estimasi Laba Bersih</span>
            <TrendingUp size={14} className="text-indigo-400" />
          </div>
          <div className="text-xl font-black font-mono text-indigo-400">Rp {netProfit.toLocaleString('id-ID')}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Payback Period (BEP)</span>
            <DollarSign size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">{paybackPeriod > 0 ? `${paybackPeriod.toFixed(1)} Thn` : 'N/A'}</div>
        </div>
      </div>

      {analysisText && (
        <div className="p-5 rounded-2xl bg-base/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            <ShieldCheck size={16} />
            <span>Hasil Analisis AI Strategis</span>
          </div>
          <div className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap font-sans">
            {analysisText}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoiSimulatorDashboard;
