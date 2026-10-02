import React, { useEffect, useState } from 'react';

export default function MapLiveCoordinates({
  viewState,
  isDarkMode,
  isPartitioningActive = true
}: {
  viewState: { longitude: number; latitude: number; zoom: number };
  isDarkMode: boolean;
  isPartitioningActive?: boolean;
}) {
  if (!viewState) return null;

  // Real-time 60 FPS measurement
  const [fps, setFps] = useState<number>(60);
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const measure = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        const measured = Math.min(Math.round((frameCount * 1000) / (now - lastTime)), 60);
        setFps(measured > 0 ? measured : 60);
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(measure);
    };

    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className={`hidden sm:flex absolute bottom-3 left-3 z-[30] px-2.5 py-1 rounded-lg text-[9px] font-mono shadow-xs border items-center gap-2 backdrop-blur-md transition-colors pointer-events-none select-none ${isDarkMode ? 'bg-slate-900/80 text-slate-300 border-slate-700/50' : 'bg-white/85 text-slate-600 border-slate-200/70'}`}>
      <span>Lat: {viewState.latitude.toFixed(4)}</span>
      <span>Lng: {viewState.longitude.toFixed(4)}</span>
      <span>Z: {viewState.zoom.toFixed(1)}</span>
      <span className="h-2 w-[1px] bg-slate-300 dark:bg-slate-700" />
      <span className="flex items-center gap-1" title="Kinerja Rendering Peta Real-time">
        <span className={`w-1.5 h-1.5 rounded-full ${fps >= 55 ? 'bg-emerald-500' : fps >= 30 ? 'bg-amber-500' : 'bg-rose-500'} animate-pulse`} />
        <span className="font-semibold">{fps} FPS</span>
      </span>
    </div>
  );
}
