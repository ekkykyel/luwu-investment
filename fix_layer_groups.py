import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Pattern to replace
pattern_start = r'<div className="flex flex-col gap-1\.5 mt-1">\s*\{Object\.values\(spatialLayers\)\.filter\(\(l\) => !\["layer_jalan", "layer_land_use_zoning", "layer_flood_risk", "layer_landslide_risk", "layer_historical_suitability"\]\.includes\(l\.id\)\)\.map\(\(l, idx\) => \('
pattern_end = r'</button>\s*\)\}\s*</div>\s*\)\)\}\s*</div>'

# Regex search
match = re.search(pattern_start + r'.*?' + pattern_end, content, flags=re.DOTALL)
if match:
    replacement = """<div className="flex flex-col gap-1 mt-1 relative">
                    {(() => {
                      const masterLayers = Object.values(spatialLayers).filter((l) => !["layer_jalan", "layer_land_use_zoning", "layer_flood_risk", "layer_landslide_risk", "layer_historical_suitability"].includes(l.id));
                      const adminLayers = masterLayers.filter(l => ['layer_kecamatan', 'layer_desa', 'layer_rbi'].includes(l.id));
                      const envLayers = masterLayers.filter(l => ['layer_mangrove', 'layer_tanah_kering_sekunder', 'layer_tanah_kering_primer', 'layer_sawah', 'layer_tambak'].includes(l.id));
                      const potLayers = masterLayers.filter(l => ['layer_potensi'].includes(l.id));
                      const otherLayers = masterLayers.filter(l => !['layer_kecamatan', 'layer_desa', 'layer_rbi', 'layer_mangrove', 'layer_tanah_kering_sekunder', 'layer_tanah_kering_primer', 'layer_sawah', 'layer_tambak', 'layer_potensi'].includes(l.id));
                      
                      const layerGroups = [
                        { name: 'Administrasi', layers: adminLayers },
                        { name: 'Lingkungan', layers: envLayers },
                        { name: 'Potensi & Komoditas', layers: potLayers },
                        { name: 'Lainnya', layers: otherLayers }
                      ].filter(g => g.layers.length > 0);
                      
                      return layerGroups.map(group => (
                        <div key={group.name} className="flex flex-col mb-3">
                          <div className={`sticky top-0 z-20 ${isDarkMode ? "bg-slate-950/95 border-slate-800 text-slate-400" : "bg-white/95 border-slate-200 text-slate-500"} backdrop-blur-sm py-1.5 px-2 mb-1.5 text-[9px] font-bold uppercase tracking-wider border-b`}>
                            {group.name}
                          </div>
                          <div className="flex flex-col gap-1 pl-1">
                            {group.layers.map((l, idx) => (
                              <div key={`${l.id}-${idx}`} className={`flex items-center justify-between group transition-all duration-200 ease-in-out py-1.5 pr-2 pl-2.5 rounded-r-md ${
                                l.isActive 
                                  ? `border-l-4 border-emerald-500 ${isDarkMode ? "bg-slate-800/30 text-white" : "bg-emerald-50 text-slate-900"}` 
                                  : `border-l-4 border-transparent grayscale opacity-70 hover:opacity-100 hover:grayscale-0 ${isDarkMode ? "text-slate-400 hover:bg-slate-800/10" : "text-slate-500 hover:bg-slate-50"}`
                              }`}>
                                <label className="flex items-center gap-2 cursor-pointer text-[10px] sm:text-xs font-mono font-semibold select-none flex-1">
                                  <input
                                    type="checkbox"
                                    checked={l.isActive}
                                    onChange={() => handleToggleLayerVis(l.id)}
                                    className={`rounded h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                                      isDarkMode ? "accent-emerald-400" : "accent-emerald-500"
                                    }`}
                                  />
                                  <span className="truncate">
                                    {l.id === 'layer_potensi' ? t('map.investmentPotential') : 
                                     l.id === 'layer_rbi' ? t('mapControls.mapEarth') : 
                                     l.id === 'layer_kecamatan' ? t('mapControls.layerSubdistrict') : 
                                     l.id === 'layer_jalan' ? t('mapControls.mainRoads') : 
                                     l.id === 'layer_desa' ? t('mapControls.villageBorders') : 
                                     l.id === 'layer_sawah' ? t('mapControls.layerRicefield') : 
                                     l.id === 'layer_tambak' ? t('mapControls.layerPond') : 
                                     l.id === 'layer_mangrove' ? t('mapControls.layerMangrove') : 
                                     l.id === 'layer_tanah_kering_sekunder' ? t('mapControls.layerDrySec') : 
                                     l.id === 'layer_tanah_kering_primer' ? t('mapControls.layerDryPrim') : 
                                     l.name}
                                  </span>
                                </label>
                                {currentRole === Role.SUPER_ADMIN && (
                                  <button
                                    onClick={() => handleDeleteLayer(l.id)}
                                    className="p-1 px-1.5 text-xs text-red-500 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                    title="Hapus Layer Spasial"
                                  >
                                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>"""
    content = content[:match.start()] + replacement + content[match.end():]
    
    # Also add the polish comment to end of file
    if "// ui polish: layer active borders and sticky grouping" not in content:
        content += "\n// ui polish: layer active borders and sticky grouping\n"

    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Layer grouping applied.")
else:
    print("Could not find the target code block.")
