import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

pattern = r'            isAiPanelOpen=\{isAiPanelOpen\}\n          />\n        </div>'
replacement = r"""            isAiPanelOpen={isAiPanelOpen}
          />
          {/* Live Investment Metrics Widget */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className={`absolute top-24 right-4 md:top-6 md:left-[270px] lg:left-[340px] md:right-auto z-[40] pointer-events-auto backdrop-blur-2xl border p-3 md:p-4 rounded-2xl transition-all duration-300 ${
              isDarkMode ? "bg-slate-950/80 border-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-1 ring-white/5" : "bg-white/80 border-slate-200/60 text-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.1)] ring-1 ring-black/5"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-emerald-400" : "text-emerald-600"} mb-1 flex items-center gap-1.5`}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Live Metrics
                </span>
                <div className="flex items-end gap-3 md:gap-4 mt-0.5">
                  <div className="flex flex-col">
                    <span className="text-[9px] md:text-[10px] text-slate-400 font-mono">Valuasi Aktif</span>
                    <span className="text-sm md:text-base font-bold font-mono tracking-tight">
                      {formatRupiahSingkat(filteredInvestments.reduce((sum, inv) => sum + (inv.investmentValue || 0), 0))}
                    </span>
                  </div>
                  <div className={`w-px h-6 md:h-8 ${isDarkMode ? "bg-white/20" : "bg-slate-300"}`} />
                  <div className="flex flex-col">
                    <span className="text-[9px] md:text-[10px] text-slate-400 font-mono">Titik Lokasi</span>
                    <span className="text-sm md:text-base font-bold font-mono tracking-tight">
                      {filteredInvestments.length} <span className="text-[9px] md:text-[10px] text-slate-500 font-normal">titik</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>"""

content = content.replace(pattern, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Map Metrics Widget added.")
