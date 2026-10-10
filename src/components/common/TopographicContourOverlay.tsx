import React from 'react';

interface TopographicContourOverlayProps {
  className?: string;
  opacity?: number;
}

/**
 * TopographicContourOverlay
 * Renders exquisite cartographic elevation contour lines (topo-lines)
 * echoing the geography of Kabupaten Luwu (Pegunungan Latimojong down to Teluk Bone).
 * Delivers an authentic spatial/GIS enterprise aesthetic without heavy WebGL overhead.
 */
export const TopographicContourOverlay: React.FC<TopographicContourOverlayProps> = ({
  className = '',
  opacity = 0.08,
}) => {
  const safeOpacity = typeof opacity === 'number' && !isNaN(opacity) ? opacity : 0.08;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-10 ${className}`}
      style={{ opacity: safeOpacity }}
    >
      <svg
        className="w-full h-full object-cover text-[#C9A24B] dark:text-[#E0BE6A]"
        viewBox="0 0 1440 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="topo-glow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C9A24B" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#E0BE6A" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#1F9D74" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Siluet Ikonik Puncak Pegunungan Latimojong */}
        <g className="opacity-60 text-[#C9A24B]">
          {/* Siluet Puncak Utama Latimojong & Ridge Arcs */}
          <path
            d="M 60 175 L 170 85 L 245 125 L 340 55 L 430 145 L 510 95 L 630 185"
            stroke="url(#topo-glow-grad)"
            strokeWidth="1.4"
            fill="none"
          />
          {/* Kontur Elevasi Puncak Bertingkat */}
          <path
            d="M 90 175 Q 170 100 240 135 T 340 75 T 435 155 T 600 185"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="4 6"
            fill="none"
          />
          <path
            d="M 120 175 Q 200 120 270 148 T 340 100 T 440 168 T 570 185"
            stroke="currentColor"
            strokeWidth="0.6"
            fill="none"
          />
          {/* Marker Geodesi Puncak */}
          <circle cx="340" cy="55" r="2.5" fill="#C9A24B" />
          <circle cx="340" cy="55" r="5" stroke="#E0BE6A" strokeWidth="0.7" strokeDasharray="2 2" fill="none" />
        </g>

        {/* Contour Elevation Line 1 - Latimojong High Ridge */}
        <path
          d="M-50 80 Q 200 40 450 110 T 950 90 T 1500 130"
          stroke="url(#topo-glow-grad)"
          strokeWidth="1.1"
          strokeDasharray="4 8"
          fill="none"
        />

        {/* Contour Elevation Line 2 */}
        <path
          d="M-50 140 Q 250 90 520 180 T 1020 150 T 1500 200"
          stroke="currentColor"
          strokeWidth="0.9"
          fill="none"
        />

        {/* Contour Elevation Line 3 - Valley & Fluvial Plains */}
        <path
          d="M-50 210 Q 180 180 480 260 T 960 220 T 1500 280"
          stroke="currentColor"
          strokeWidth="0.7"
          fill="none"
        />

        {/* Contour Elevation Line 4 - Mid-tier Agro Topography */}
        <path
          d="M-50 290 Q 280 240 580 340 T 1100 290 T 1500 360"
          stroke="url(#topo-glow-grad)"
          strokeWidth="1"
          fill="none"
        />

        {/* Contour Elevation Line 5 */}
        <path
          d="M-50 370 Q 220 330 540 420 T 1040 370 T 1500 440"
          stroke="currentColor"
          strokeWidth="0.7"
          fill="none"
        />

        {/* Contour Elevation Line 6 - Coastal Shelf (Teluk Bone) */}
        <path
          d="M-50 450 Q 320 410 660 490 T 1180 440 T 1500 520"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeDasharray="6 12"
          fill="none"
        />
      </svg>
    </div>
  );
};

export default TopographicContourOverlay;
