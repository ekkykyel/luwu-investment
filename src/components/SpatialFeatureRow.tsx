import React, { memo } from "react";

export const SpatialFeatureRow = memo(({ index, style, data }: any) => {
  const { activeFeatures, selectedFeatureIndex, isDarkMode, handleSelectFeature } = data;
  const f = activeFeatures[index];
  const isSelected = selectedFeatureIndex === index;

  return (
    <div style={{ ...style, paddingBottom: '6px' }}>
      <button
        key={`${f.properties?.id || 'feat'}-${index}`}
        onClick={() => handleSelectFeature(index)}
        className={`w-full h-full p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 cursor-pointer ${
          isSelected
            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
            : isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
        }`}
      >
        <div className="font-bold flex justify-between items-center w-full">
          <span className="truncate flex-1">{f.properties?.name || `Objek #${index + 1}`}</span>
          <span className={`text-[8.5px] px-1.5 py-0.5 rounded uppercase font-bold font-mono ml-2 shrink-0 ${
            f.properties?.status === "Published"
              ? "bg-emerald-500/20 text-emerald-400"
              : f.properties?.status === "Review"
              ? "bg-amber-500/20 text-amber-400"
              : "bg-slate-500/20 text-slate-400"
          }`}>
            {f.properties?.status || "Draft"}
          </span>
        </div>
        <div className="flex justify-between items-center text-[9.5px] text-slate-400 font-mono w-full">
          <span>Luas: {f.properties?.areaHa ? f.properties.areaHa.toFixed(2) : "0"} Ha</span>
          <span>{f.geometry?.type}</span>
        </div>
      </button>
    </div>
  );
});
