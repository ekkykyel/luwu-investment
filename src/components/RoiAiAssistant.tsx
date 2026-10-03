import React, { useState } from 'react';
import { Bot, Sparkles, TrendingUp, ShieldCheck, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { useRoiCalculation, generateHeuristicRoiAnalysis, formatHeuristicRoiMarkdown, RoiPayload } from '../hooks/useRoiCalculation';

export interface RoiAiAssistantProps {
  payload: RoiPayload;
  onAnalysisComplete?: (result: string) => void;
  className?: string;
  isDarkMode?: boolean;
}

export const RoiAiAssistant: React.FC<RoiAiAssistantProps> = ({
  payload,
  onAnalysisComplete,
  className = '',
  isDarkMode = true
}) => {
  const { loading, analysisText, calculateRoi } = useRoiCalculation();
  const [hasRun, setHasRun] = useState(false);

  const handleRunAnalysis = async () => {
    setHasRun(true);
    const result = await calculateRoi(payload);
    if (onAnalysisComplete) {
      onAnalysisComplete(result.text);
    }
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isDarkMode ? 'bg-slate-900/80 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    } ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Bot size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-1.5">
              <span>AI Konsultan ROI Luwu</span>
              <Sparkles size={14} className="text-amber-400" />
            </h4>
            <p className="text-[11px] text-slate-400">Analisis kelayakan investasi real-time berbasis parameter daerah</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRunAnalysis}
          disabled={loading}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-900/20"
        >
          {loading ? (
            <>
              <RefreshCw size={13} className="animate-spin" />
              <span>Menganalisis...</span>
            </>
          ) : (
            <>
              <TrendingUp size={13} />
              <span>{hasRun ? 'Analisis Ulang' : 'Mulai Analisis AI'}</span>
            </>
          )}
        </button>
      </div>

      {analysisText && (
        <div className={`mt-3 p-4 rounded-xl border text-xs leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap ${
          isDarkMode ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          {analysisText}
        </div>
      )}
    </div>
  );
};

export default RoiAiAssistant;
