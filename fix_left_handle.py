import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

pattern = r"""                  <div className="flex items-center justify-between md:hidden -mt-2 mb-3 px-1 sticky top-0 z-20 pt-2 pb-2 bg-gradient-to-b from-slate-900 via-slate-900/90 to-transparent">\n                    <span className="font-bold text-sm ml-2">Kontrol Peta</span>\n                    <button\n                      type="button"\n                      onClick=\{\(\) => setIsSidebarOpen\(false\)\}\n                      className="p-3 min-w-\[44px\] min-h-\[44px\] rounded-full bg-slate-800/80 hover:bg-slate-700 active:scale-90 text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center shadow-lg transition-all"\n                      aria-label="Tutup Sidebar"\n                      title="Tutup Menu Peta"\n                    >\n                      <X size=\{18\}.*?>\n                    </button>\n                  </div>"""

replacement = r"""                  <div className="flex flex-col items-center justify-between md:hidden -mt-4 mb-3 px-1 sticky top-0 z-20 pt-2 pb-2 bg-slate-950/95 border-b border-slate-800 backdrop-blur-md">
                    <div className="w-12 h-1.5 bg-slate-700 rounded-full mb-3 pointer-events-none" />
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-sm ml-2">Kontrol Peta</span>
                      <button
                        type="button"
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-3 min-w-[44px] min-h-[44px] rounded-full bg-slate-800/80 hover:bg-slate-700 active:scale-90 text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center shadow-lg transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>"""

content = re.sub(pattern, replacement, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
