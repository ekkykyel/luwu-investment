import React from "react";
import { motion } from "motion/react";

interface SonarRadarPulseProps {
  color?: string; // emerald, teal, blue, amber
  size?: number;
  className?: string;
  label?: string;
  showWaves?: boolean;
}

export const SonarRadarPulse: React.FC<SonarRadarPulseProps> = ({
  color = "emerald",
  size = 12,
  className = "",
  label,
  showWaves = true,
}) => {
  const colorMap: Record<string, { dot: string; ping: string; border: string }> = {
    emerald: {
      dot: "bg-emerald-500",
      ping: "bg-emerald-400/50",
      border: "border-emerald-500/30",
    },
    teal: {
      dot: "bg-teal-500",
      ping: "bg-teal-400/50",
      border: "border-teal-500/30",
    },
    blue: {
      dot: "bg-blue-500",
      ping: "bg-blue-400/50",
      border: "border-blue-500/30",
    },
    amber: {
      dot: "bg-amber-500",
      ping: "bg-amber-400/50",
      border: "border-amber-500/30",
    },
    purple: {
      dot: "bg-purple-500",
      ping: "bg-purple-400/50",
      border: "border-purple-500/30",
    },
    rose: {
      dot: "bg-rose-500",
      ping: "bg-rose-400/50",
      border: "border-rose-500/30",
    },
  };

  const selected = colorMap[color] || colorMap.emerald;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Animated Soundwave / Radar Ping 1 */}
        {showWaves && (
          <motion.span
            animate={{
              scale: [1, 2.4, 3.2],
              opacity: [0.8, 0.4, 0],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeOut",
            }}
            className={`absolute inset-0 rounded-full ${selected.ping} pointer-events-none`}
          />
        )}
        {/* Animated Ping 2 */}
        {showWaves && (
          <motion.span
            animate={{
              scale: [1, 1.8, 2.6],
              opacity: [0.9, 0.3, 0],
            }}
            transition={{
              duration: 2.2,
              delay: 0.7,
              repeat: Infinity,
              ease: "easeOut",
            }}
            className={`absolute inset-0 rounded-full ${selected.ping} pointer-events-none`}
          />
        )}
        {/* Center Solid Glowing Core */}
        <span
          className={`relative z-10 block rounded-full ${selected.dot} shadow-[0_0_12px_currentColor]`}
          style={{ width: size, height: size }}
        />
      </div>

      {label && (
        <span className="text-xs font-mono font-bold tracking-wider uppercase">
          {label}
        </span>
      )}
    </div>
  );
};

export default SonarRadarPulse;
