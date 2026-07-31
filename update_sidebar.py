import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Update Thematic Overlays (opacity and colors)
old_thematic_label = """                        <label className={`flex items-center gap-2 cursor-pointer text-[10px] sm:text-xs font-mono font-semibold select-none py-2 ${
                          isDarkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
                        }`}>"""

new_thematic_label = """                        <label className={`flex items-center gap-2 cursor-pointer text-[10px] sm:text-xs font-mono font-semibold select-none py-2 transition-colors duration-200 ${
                          l.isActive ? (isDarkMode ? "text-white" : "text-slate-900") : (isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700")
                        }`}>"""

content = content.replace(old_thematic_label, new_thematic_label)

# 2. Update Visual Legend for Active Risks
old_visual_legend = """                    {/* Visual Legend for Active Risks */}
                    {(spatialLayers["layer_flood_risk"]?.isActive || spatialLayers["layer_landslide_risk"]?.isActive) && (
                      <div className={`mt-2 p-2.5 rounded-xl border flex flex-col gap-2 transition-all ${
                        isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-slate-100/60 border-slate-200/60"
                      }`}>
                        <div className={`text-[9px] font-bold uppercase tracking-widest border-b pb-1 mb-0.5 ${
                          isDarkMode ? "text-slate-300 border-slate-700/50" : "text-slate-600 border-slate-300/50"
                        }`}>
                          {t('mapControls.disasterRiskLegend')}
                        </div>
                        {spatialLayers["layer_flood_risk"]?.isActive && (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-md border shadow-sm" style={{ backgroundColor: spatialLayers["layer_flood_risk"].color || "#3b82f6", borderColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }} />
                            <span className={`text-[10px] font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                              {t('mapControls.floodZone')}
                            </span>
                          </div>
                        )}
                        {spatialLayers["layer_landslide_risk"]?.isActive && (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-md border shadow-sm" style={{ backgroundColor: spatialLayers["layer_landslide_risk"].color || "#ef4444", borderColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }} />
                            <span className={`text-[10px] font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                              {t('mapControls.landslideZone')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}"""

new_visual_legend = """                    {/* Visual Legend for Active Risks */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${(spatialLayers["layer_flood_risk"]?.isActive || spatialLayers["layer_landslide_risk"]?.isActive) ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
                      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${
                        isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-slate-100/60 border-slate-200/60"
                      }`}>
                        <div className={`text-[9px] font-bold uppercase tracking-widest border-b pb-1 mb-0.5 ${
                          isDarkMode ? "text-slate-300 border-slate-700/50" : "text-slate-600 border-slate-300/50"
                        }`}>
                          {t('mapControls.disasterRiskLegend')}
                        </div>
                        
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${spatialLayers["layer_flood_risk"]?.isActive ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-md border shadow-sm" style={{ backgroundColor: spatialLayers["layer_flood_risk"]?.color || "#3b82f6", borderColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }} />
                            <span className={`text-[10px] font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                              {t('mapControls.floodZone')}
                            </span>
                          </div>
                        </div>

                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${spatialLayers["layer_landslide_risk"]?.isActive ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-md border shadow-sm" style={{ backgroundColor: spatialLayers["layer_landslide_risk"]?.color || "#ef4444", borderColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }} />
                            <span className={`text-[10px] font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                              {t('mapControls.landslideZone')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>"""

content = content.replace(old_visual_legend, new_visual_legend)

# 3. Master Layer Spasial items
old_master_layer_div = """                      <div key={`${l.id}-${idx}`} className="flex items-center justify-between group">
                        <label className={`flex items-center gap-2 cursor-pointer text-[10px] sm:text-xs font-mono font-semibold select-none ${
                          isDarkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
                        }`}>"""

new_master_layer_div = """                      <div key={`${l.id}-${idx}`} className="flex items-center justify-between group transition-all duration-300 ease-in-out">
                        <label className={`flex items-center gap-2 cursor-pointer text-[10px] sm:text-xs font-mono font-semibold select-none transition-colors duration-200 ${
                          l.isActive ? (isDarkMode ? "text-white" : "text-slate-900") : (isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700")
                        }`}>"""

content = content.replace(old_master_layer_div, new_master_layer_div)

content += '\n// ui polish: smooth pure css transitions for layer toggles\n'

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Updates applied.")
