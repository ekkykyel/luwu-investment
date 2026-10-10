import React from 'react';

interface SulapaEppaOverlayProps {
  className?: string;
  opacity?: number;
}

/**
 * SulapaEppaOverlay
 * Renders exquisite Bugis-Luwu Sulapa Eppa' (four-cornered diamond / rhombus)
 * sacred geometric weaving motif reflecting local heritage and dignity.
 */
export const SulapaEppaOverlay: React.FC<SulapaEppaOverlayProps> = ({
  className = '',
  opacity = 0.05,
}) => {
  const safeOpacity = typeof opacity === 'number' && !isNaN(opacity) ? opacity : 0.05;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-10 ${className}`}
      style={{ opacity: safeOpacity }}
    >
      <svg
        className="w-full h-full text-[#A07A28] dark:text-[#C9A24B]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="sulapa-eppa-pattern"
            width="56"
            height="56"
            patternUnits="userSpaceOnUse"
          >
            {/* Outer Diamond Rhombus */}
            <path
              d="M28 2 L54 28 L28 54 L2 28 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.7"
            />
            {/* Inner Sacred Center Rhombus */}
            <path
              d="M28 14 L42 28 L28 42 L14 28 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            {/* Center Sacred Point */}
            <circle cx="28" cy="28" r="1.5" fill="currentColor" />
            {/* Four Cardinal Rays */}
            <path
              d="M28 2 L28 14 M54 28 L42 28 M28 54 L28 42 M2 28 L14 28"
              stroke="currentColor"
              strokeWidth="0.4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sulapa-eppa-pattern)" />
      </svg>
    </div>
  );
};

export default SulapaEppaOverlay;
