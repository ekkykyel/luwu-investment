import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Calculator } from 'lucide-react';

interface ROICalculatorProps {
  isDarkMode: boolean;
}

export const ROICalculator: React.FC<ROICalculatorProps> = ({ isDarkMode }) => {
  const [landCost, setLandCost] = useState<number>(5000); // in millions
  const [opBudget, setOpBudget] = useState<number>(1000); // in millions
  const [revenue, setRevenue] = useState<number>(3000); // in millions

  const chartData = useMemo(() => {
    const data = [];
    let cumulativeProfit = -landCost;
    for (let year = 0; year <= 10; year++) {
      if (year === 0) {
        data.push({ year: `Thn ${year}`, profit: cumulativeProfit });
      } else {
        cumulativeProfit += (revenue - opBudget);
        data.push({ year: `Thn ${year}`, profit: cumulativeProfit });
      }
    }
    return data;
  }, [landCost, opBudget, revenue]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val * 1000000);
  };

  const breakEvenYear = chartData.findIndex(d => d.profit >= 0);

  return (
    <div className={`mt-6 p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-indigo-500/20' : 'bg-slate-50 border-indigo-100'}`}>
      <h3 className={`flex items-center gap-2 font-bold mb-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
        <Calculator className="w-5 h-5" />
        Kalkulator ROI (Proyeksi 10 Tahun)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-600 dark:text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>Biaya Lahan & Awal (Juta Rp)</label>
          <input 
            type="number" 
            value={landCost} 
            onChange={e => setLandCost(Number(e.target.value))}
            className={`w-full px-3 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`} 
          />
        </div>
        <div>
          <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-600 dark:text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>Biaya Operasional Tahunan (Juta Rp)</label>
          <input 
            type="number" 
            value={opBudget} 
            onChange={e => setOpBudget(Number(e.target.value))}
            className={`w-full px-3 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`} 
          />
        </div>
        <div>
          <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-600 dark:text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>Proyeksi Pendapatan Tahunan (Juta Rp)</label>
          <input 
            type="number" 
            value={revenue} 
            onChange={e => setRevenue(Number(e.target.value))}
            className={`w-full px-3 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`} 
          />
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
            <XAxis dataKey="year" stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
            <YAxis 
              tickFormatter={(val) => `${val / 1000} M`} 
              stroke={isDarkMode ? '#94a3b8' : '#64748b'} 
              fontSize={12}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value / 1000000), 'Profit Kumulatif']} 
              contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: '8px' }}
              labelStyle={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="#6366f1" 
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
          Profit Thn 10: <strong className={(chartData[10]?.profit || 0) > 0 ? 'text-emerald-500' : 'text-rose-500'}>{formatCurrency((chartData[10]?.profit || 0) / 1000000)}</strong>
        </div>
      </div>
    </div>
  );
};
