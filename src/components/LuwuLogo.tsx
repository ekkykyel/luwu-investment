import React from "react";

interface LuwuLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function LuwuLogo({ className = "", size = "md" }: LuwuLogoProps) {
  let dimensions = "w-10 h-10";
  if (size === "sm") dimensions = "w-8 h-8";
  if (size === "md") dimensions = "w-10 h-11";
  if (size === "lg") dimensions = "w-14 h-16";
  if (size === "xl") dimensions = "w-20 h-24";

  return (
    <img
      src={"https://i.ibb.co.com/KxKKb5d8/transparant.png"}
      alt="Logo Kabupaten Luwu"
      className={`${dimensions} ${className} select-none inline-block object-contain`}
      style={{ imageRendering: "-webkit-optimize-contrast" }}
    />
  );
}
