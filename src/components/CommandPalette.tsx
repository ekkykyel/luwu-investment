import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Building, TrendingUp, X, Command } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Investment, District } from "../types.js";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  investments: Investment[];
  districts: District[];
  onSelectInvestment: (inv: Investment) => void;
  isDarkMode: boolean;
}

export default function CommandPalette({
  isOpen,
  onClose,
  investments,
  districts,
  onSelectInvestment,
  isDarkMode,
}: CommandPaletteProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearchQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const getDistrictName = (districtId: string) => {
    return districts.find((d) => d.id === districtId)?.name || "";
  };

  const filteredInvestments = investments.filter(
    (inv) =>
      inv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.sector?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getDistrictName(inv.districtId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl border ${
              isDarkMode
                ? "bg-slate-900 border-slate-700/80 shadow-black/50"
                : "bg-white border-slate-200 shadow-slate-200/50"
            }`}
          >
            {/* Search Input */}
            <div className={`flex items-center px-4 border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
              <Search className={`w-5 h-5 shrink-0 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
              <input
                ref={inputRef}
                type="text"
                placeholder={t('commandPalette.placeholder', 'Cari proyek investasi, sektor, atau kecamatan...')}
                className={`w-full bg-transparent border-0 py-4 pl-3 pr-4 text-sm sm:text-base outline-none focus:ring-0 ${
                  isDarkMode ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"
                }`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border ${
                isDarkMode ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-500 border-slate-200"
              }`}>
                <span className="text-xs">esc</span>
              </div>
            </div>

            {/* Results */}
            <div className={`max-h-[60vh] overflow-y-auto p-2 ${isDarkMode ? "bg-slate-900" : "bg-slate-50"}`}>
              {searchQuery && filteredInvestments.length === 0 ? (
                <div className="py-14 text-center px-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    isDarkMode ? "bg-slate-800 text-slate-500" : "bg-slate-200 text-slate-400"
                  }`}>
                    <Search className="w-6 h-6" />
                  </div>
                  <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {t('commandPalette.noResults', 'Tidak ada hasil yang ditemukan untuk ')} "{searchQuery}"
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {searchQuery && <div className={`px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                    {t('commandPalette.investments', 'Proyek Investasi')}
                  </div>}
                  {filteredInvestments.slice(0, 8).map((inv) => (
                    <button
                      key={inv.id}
                      onClick={() => {
                        onSelectInvestment(inv);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        isDarkMode
                          ? "hover:bg-slate-800 text-left"
                          : "hover:bg-white hover:shadow-sm text-left"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${
                          isDarkMode ? "bg-slate-800 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                        }`}>
                          <Building className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <h4 className={`text-sm font-bold truncate ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                            {inv.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                            }`}>
                              {inv.sector}
                            </span>
                            <span className={`text-[10px] flex items-center gap-0.5 ${
                              isDarkMode ? "text-slate-500" : "text-slate-400"
                            }`}>
                              <MapPin className="w-3 h-3" /> {getDistrictName(inv.districtId)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`shrink-0 text-xs font-mono font-bold ${
                        isDarkMode ? "text-emerald-400" : "text-emerald-600"
                      }`}>
                        Rp {(inv.investmentValue / 1000).toFixed(1)}T
                      </div>
                    </button>
                  ))}
                  
                  {!searchQuery && (
                    <div className="py-8 text-center px-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                        isDarkMode ? "bg-slate-800 text-slate-500" : "bg-slate-200 text-slate-400"
                      }`}>
                        <Command className="w-6 h-6" />
                      </div>
                      <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        {t('commandPalette.startTyping', 'Ketik untuk mencari data investasi Luwu...')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className={`px-4 py-3 border-t flex items-center justify-between text-[10px] ${
              isDarkMode ? "bg-slate-900/50 border-slate-800 text-slate-500" : "bg-slate-50 border-slate-100 text-slate-400"
            }`}>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className={`px-1 rounded border ${isDarkMode ? "border-slate-700 bg-slate-800 text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}>↑↓</span> {t('commandPalette.navigate', 'Navigasi')}
                </span>
                <span className="flex items-center gap-1">
                  <span className={`px-1 rounded border ${isDarkMode ? "border-slate-700 bg-slate-800 text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}>↵</span> {t('commandPalette.select', 'Pilih')}
                </span>
              </div>
              <div className="font-bold tracking-wider uppercase">ARC-WEB GIS</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
