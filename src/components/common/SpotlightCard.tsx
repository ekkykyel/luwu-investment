import React, { useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "motion/react";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  isDark?: boolean;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = "",
  spotlightColor,
  isDark = true,
  onClick,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [opacity, setOpacity] = useState(0);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { damping: 30, stiffness: 300 });
  const springY = useSpring(mouseY, { damping: 30, stiffness: 300 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const { left, top } = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }, [mouseX, mouseY]);

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  const defaultColor = isDark
    ? "rgba(16, 185, 129, 0.15)"
    : "rgba(13, 148, 136, 0.12)";
  const color = spotlightColor || defaultColor;
  const background = useMotionTemplate`radial-gradient(400px circle at ${springX}px ${springY}px, ${color}, transparent 80%)`;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative overflow-hidden group rounded-[24px] ${className}`}
      {...props}
    >
      {/* Animated Radial Spotlight Backdrop */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300 z-0"
        style={{
          opacity,
          background,
        }}
      />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default SpotlightCard;
