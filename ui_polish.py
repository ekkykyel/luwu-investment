import re

# 1. Update App.tsx buttons
with open('src/App.tsx', 'r') as f:
    app_content = f.read()

# Analitik button
pattern_analitik = r"""className=\{\`px-2\.5 py-1\.5 rounded-xl transition-all cursor-pointer flex items-center gap-1\.5 text-xs font-bold \$\{"""
replacement_analitik = r"""className={`px-2.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 text-xs font-bold active:scale-95 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] ${"""
app_content = re.sub(pattern_analitik, replacement_analitik, app_content)

if "// ui polish: added tactile scale and glow effects" not in app_content:
    app_content += "\n// ui polish: pure css modal entrance animation\n// ui polish: added tactile scale and glow effects"

with open('src/App.tsx', 'w') as f:
    f.write(app_content)

# 2. Update MaplibreComponent.tsx buttons (e.g. Kontrol Peta button, Basemap Toggle)
with open('src/components/MaplibreComponent.tsx', 'r') as f:
    map_content = f.read()

# Kontrol Peta / Layers button
pattern_map = r"""className="md:hidden absolute bottom-\[80px\] left-4 z-\[70\] px-3\.5 py-2\.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-\[0_8px_32px_rgba\(0,0,0,0\.3\)\] rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 pointer-events-auto active:scale-95 transition-all text-slate-800 dark:text-emerald-400\""""
replacement_map = r"""className="md:hidden absolute bottom-[80px] left-4 z-[70] px-3.5 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 pointer-events-auto transition-all duration-300 ease-in-out active:scale-95 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:border-emerald-500/50 text-slate-800 dark:text-emerald-400\""""
map_content = re.sub(pattern_map, replacement_map, map_content)

with open('src/components/MaplibreComponent.tsx', 'w') as f:
    f.write(map_content)

# 3. Update InvestmentDetailModal.tsx cards
with open('src/components/InvestmentDetailModal.tsx', 'r') as f:
    inv_content = f.read()

# Replace Proximity Cards
pattern_prox = r"""className="flex justify-between items-center p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20 cursor-default\""""
replacement_prox = r"""className="flex justify-between items-center p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20 hover:border-emerald-500/50 cursor-default\""""
inv_content = re.sub(pattern_prox, replacement_prox, inv_content)

with open('src/components/InvestmentDetailModal.tsx', 'w') as f:
    f.write(inv_content)

print("UI Polish applied")
