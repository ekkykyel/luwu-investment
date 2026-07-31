import React from 'react';

export default function MapLiveCoordinates({ viewState, isDarkMode }: { viewState: { longitude: number; latitude: number; zoom: number }, isDarkMode: boolean }) {
  if (!viewState) return null;
  return (
    <div className={`absolute bottom-6 left-6 z-[1000] px-3 py-1.5 rounded-lg text-[10px] font-mono shadow-sm border flex gap-3 backdrop-blur-md ${isDarkMode ? 'bg-slate-900/80 text-slate-300 border-slate-700' : 'bg-white/80 text-slate-600 border-slate-200'}`}>
      <span>Lat: {viewState.latitude.toFixed(5)}</span>
      <span>Lng: {viewState.longitude.toFixed(5)}</span>
      <span>Z: {viewState.zoom.toFixed(1)}</span>
    </div>
  );
}
