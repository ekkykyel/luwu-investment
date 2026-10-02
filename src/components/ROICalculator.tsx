import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Calculator, TrendingUp, DollarSign, Percent } from 'lucide-react';

interface ROICalculatorProps {
  isDarkMode: boolean;
  initialInvestment?: number;
  initialOpex?: number;
  initialRevenue?: number;
}

export const ROICalculator: React.FC<ROICalculatorProps> = ({ 
  isDarkMode,
  initialInvestment = 5000,
  initialOpex = 2500,
  initialRevenue = 4080
}) => {
  const [totalInvestment, setTotalInvestment] = useState<number>(initialInvestment); // in millions
  const [opex, setOpex] = useState<number>(initialOpex); // in millions
  const [revenue, setRevenue] = useState<number>(initialRevenue); // in millions

  // Calculate Net Profit (Laba Bersih)
  const netProfit = (revenue || 0) - (opex || 0);

  // Calculate ROI Percentage (prevent division by zero)
  const roiPercentage = totalInvestment > 0 
    ? ((netProfit / totalInvestment) * 100) 
    : 0;

  const chartData = useMemo(() => {
    const data = [];
    let cumulativeProfit = -totalInvestment;
    for (let year = 0; year <= 10; year++) {
      if (year === 0) {
        data.push({ year: `Thn ${year}`, profit: cumulativeProfit });
      } else {
        cumulativeProfit += netProfit;
        data.push({ year: `Thn ${year}`, profit: cumulativeProfit });
      }
    }
    return data;
  }, [totalInvestment, netProfit]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val * 1000000);
  };

  const breakEvenYear = chartData.findIndex(d => d.profit >= 0);

  return (
    <div className={`mt-6 p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-indigo-500/20' : 'bg-slate-50 border-indigo-100'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className={`flex items-center gap-2 font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
          <Calculator className="w-5 h-5" />
          Kalkulator ROI & Kelayakan Finansial
        </h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roiPercentage >= 10 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : roiPercentage > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
            ROI: <strong className="font-mono">{roiPercentage.toFixed(2)}%</strong>
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Investasi / CAPEX (Juta Rp)</label>
          <input 
            type="number" 
            value={totalInvestment} 
            onChange={e => setTotalInvestment(Number(e.target.value))}
            className={`w-full px-3 py-2 rounded-lg text-sm border font-mono font-bold focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`} 
          />
        </div>
        <div>
          <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Biaya Operasional / OPEX Tahunan (Juta Rp)</label>
          <input 
            type="number" 
            value={opex} 
            onChange={e => setOpex(Number(e.target.value))}
            className={`w-full px-3 py-2 rounded-lg text-sm border font-mono font-bold focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`} 
          />
        </div>
        <div>
          <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Estimasi Pendapatan / Revenue (Juta Rp)</label>
          <input 
            type="number" 
            value={revenue} 
            onChange={e => setRevenue(Number(e.target.value))}
            className={`w-full px-3 py-2 rounded-lg text-sm border font-mono font-bold focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`} 
          />
        </div>
      </div>

      {/* KPI Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Estimasi ROI Tahunan</span>
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className={`text-xl font-black font-mono tracking-tight ${roiPercentage >= 10 ? 'text-emerald-500' : roiPercentage > 0 ? 'text-amber-500' : 'text-rose-500'}`}>
            {roiPercentage.toFixed(2)}%
          </div>
        </div>
        <div className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Laba Bersih (Net Profit)</span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className={`text-xl font-black font-mono tracking-tight ${netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
            {formatCurrency(netProfit)}
          </div>
        </div>
        <div className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Titik Impas (BEP)</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
            {breakEvenYear > 0 ? `${breakEvenYear} Tahun` : 'Belum BEP'}
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
            <XAxis dataKey="year" stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
            <YAxis 
              tickFormatter={(val) => `${(val / 1000).toFixed(1)} M`} 
              stroke={isDarkMode ? '#94a3b8' : '#64748b'} 
              fontSize={12}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(Number(value)), 'Profit Kumulatif']} 
              contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: '8px' }}
              labelStyle={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="#10b981" 
              strokeWidth={3}
              activeDot={{ r: 8 }} 
              name="Profit Kumulatif"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          Titik Impas (BEP): <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{breakEvenYear > 0 ? `Tahun ke-${breakEvenYear}` : 'Belum BEP'}</strong>
        </div>
        <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          Profit Thn 10: <strong className={(chartData[10]?.profit || 0) > 0 ? 'text-emerald-500' : 'text-rose-500'}>{formatCurrency(chartData[10]?.profit || 0)}</strong>
        </div>
      </div>
    </div>
  );
};
