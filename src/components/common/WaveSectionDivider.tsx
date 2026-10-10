import React from 'react';

interface WaveSectionDividerProps {
  isDark?: boolean;
  className?: string;
  fill?: string;
  flip?: boolean;
}

export const WaveSectionDivider: React.FC<WaveSectionDividerProps> = ({
  isDark = true,
  className = '',
  fill,
  flip = false
}) => {
  const fillColor = fill || (isDark ? '#0f172a' : '#f8fafc');

  return (
    <div className={`w-full overflow-hidden leading-none pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className={`relative block w-full h-8 sm:h-12 md:h-16 ${flip ? 'rotate-180' : ''}`}
      >
        <path
          d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,40 L1200,120 L0,120 Z"
          fill={fillColor}
        />
      </svg>
    </div>
  );
};

export default WaveSectionDivider;
