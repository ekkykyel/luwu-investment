import React, { useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
  maxTilt?: number;
  scaleOnHover?: number;
  glareOpacity?: number;
  perspective?: number;
  disabled?: boolean;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = "",
  wrapperClassName = "",
  maxTilt = 12,
  scaleOnHover = 1.025,
  glareOpacity = 0.2,
  perspective = 1000,
  disabled = false,
  onClick,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse coordinate motion values (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring physics for buttery-smooth response
  const springConfig = { damping: 20, stiffness: 300, mass: 0.2 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Derive 3D rotation angles
  const rotateX = useTransform(springY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // Derive glare spotlight position in percentage
  const glareX = useTransform(springX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(springY, [-0.5, 0.5], [0, 100]);

  // Derive glare spotlight background at top-level (always called, never conditional)
  const glareBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]) =>
      `radial-gradient(circle 300px at ${gx}% ${gy}%, rgba(255,255,255,0.35), transparent 70%)`
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width === 0 || height === 0) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const normX = mouseX / width - 0.5;
      const normY = mouseY / height - 0.5;

      x.set(normX);
      y.set(normY);
    },
    [disabled, x, y]
  );

  const handleMouseEnter = () => {
    if (!disabled) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div
      style={{ perspective: `${perspective}px` }}
      className={`relative ${wrapperClassName ? wrapperClassName : "w-full"}`}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{
          rotateX: disabled ? 0 : rotateX,
          rotateY: disabled ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={disabled ? undefined : { scale: scaleOnHover }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className={`relative overflow-hidden cursor-pointer select-none transition-shadow duration-300 ${className}`}
        {...(props as any)}
      >
        {/* Children content */}
        <div style={{ transform: "translateZ(20px)" }} className="w-full h-full relative z-10">
          {children}
        </div>

        {/* Dynamic Glare / Specular Sheen */}
        {!disabled && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-20 rounded-[inherit] transition-opacity duration-300"
            style={{
              opacity: isHovered ? glareOpacity : 0,
              background: glareBackground,
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default TiltCard;
