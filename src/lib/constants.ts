import { SektorInvestasi } from "../types.js";

export const SECTOR_COLORS: Record<SektorInvestasi, string> = {
  [SektorInvestasi.KELAUTAN]: "#06b6d4", // cyan
  [SektorInvestasi.PERTANIAN]: "#10b981", // emerald
  [SektorInvestasi.PERTAMBANGAN]: "#f59e0b", // amber
  [SektorInvestasi.PERDAGANGAN]: "#6366f1", // indigo
  [SektorInvestasi.PARIWISATA]: "#f43f5e" // rose
};

export const SECTOR_MULTIPLIERS: Record<SektorInvestasi, { yield: number; risk: string; factor: number }> = {
  [SektorInvestasi.KELAUTAN]: { yield: 14.8, risk: "Medium-Low", factor: 1.12 },
  [SektorInvestasi.PERTANIAN]: { yield: 11.2, risk: "Low", factor: 1.05 },
  [SektorInvestasi.PERTAMBANGAN]: { yield: 22.4, risk: "High", factor: 1.25 },
  [SektorInvestasi.PERDAGANGAN]: { yield: 13.5, risk: "Medium", factor: 1.08 },
  [SektorInvestasi.PARIWISATA]: { yield: 16.2, risk: "Medium-High", factor: 1.15 }
};
