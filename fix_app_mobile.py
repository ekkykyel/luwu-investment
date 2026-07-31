import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

# LEFT SIDEBAR animation
pattern1 = r"""                  initial=\{isMobile \? \{ x: "-100%", opacity: 0 \} : \{ x: -80, opacity: 0 \}\}\n                  animate=\{isMobile \? \{ x: 0, opacity: 1 \} : \{ x: 0, opacity: 1 \}\}\n                  exit=\{isMobile \? \{ x: "-100%", opacity: 0 \} : \{ x: -80, opacity: 0 \}\}"""
replacement1 = r"""                  initial={isMobile ? { y: "100%", opacity: 0 } : { x: -80, opacity: 0 }}
                  animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
                  exit={isMobile ? { y: "100%", opacity: 0 } : { x: -80, opacity: 0 }}"""
content = re.sub(pattern1, replacement1, content)

# LEFT SIDEBAR classes
pattern2 = r"""className=\{\`fixed inset-y-0 left-0 md:relative md:bottom-auto md:left-auto md:right-auto shrink-0 w-full md:max-w-sm md:w-64 lg:w-80 h-full max-h-full relative overflow-hidden pointer-events-auto flex flex-col gap-3 z-\[70\] md:z-\[50\] md:rounded-none shadow-\[12px_0_50px_rgba\(0,0,0,0\.5\)\] md:shadow-none \$\{isDarkMode \? "bg-slate-950 md:bg-transparent text-white" : "bg-white md:bg-transparent text-slate-900"\} border-r border-white/10 md:border-transparent\`\}"""
replacement2 = r"""className={`fixed inset-x-0 bottom-0 top-auto h-[85vh] rounded-t-3xl md:h-full md:relative md:inset-auto shrink-0 w-full md:max-w-sm md:w-64 lg:w-80 relative overflow-hidden pointer-events-auto flex flex-col gap-3 z-[70] md:z-[50] md:rounded-none shadow-[0_-12px_40px_rgba(0,0,0,0.5)] md:shadow-none ${isDarkMode ? "bg-slate-950 md:bg-transparent text-white" : "bg-white md:bg-transparent text-slate-900"} border-t md:border-t-0 md:border-r border-white/10 md:border-transparent`}"""
content = re.sub(pattern2, replacement2, content)


# LEFT SIDEBAR handle
# We need to replace the sticky header with a drag handle
pattern3 = r"""                  <div className="flex items-center justify-between md:hidden -mt-2 mb-3 px-1 sticky top-0 z-20 pt-2 pb-2 bg-gradient-to-b from-slate-900 via-slate-900/90 to-transparent">\n                    <span className="font-bold text-sm ml-2">Kontrol Peta</span>\n                    <button\n                      type="button"\n                      onClick=\{\(\) => setIsSidebarOpen\(false\)\}\n                      className="p-3 min-w-\[44px\] min-h-\[44px\] rounded-full bg-slate-800/80 hover:bg-slate-700 active:scale-90 text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center shadow-lg transition-all"\n                      aria-label="Tutup Sidebar"\n                      title="Tutup Menu Peta"\n                    >\n                      <X size=\{18\} />\n                    </button>\n                  </div>"""
replacement3 = r"""                  <div className="flex flex-col items-center justify-between md:hidden -mt-4 mb-3 px-1 sticky top-0 z-20 pt-2 pb-2 bg-slate-950/95 border-b border-slate-800 backdrop-blur-md">
                    <div className="w-12 h-1.5 bg-slate-700 rounded-full mb-3" />
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
content = re.sub(pattern3, replacement3, content)

# RIGHT SIDEBAR animation
pattern4 = r"""                  initial=\{isMobile \? \{ x: "100%", opacity: 0 \} : \{ x: 50, opacity: 0 \}\}\n                  animate=\{isMobile \? \{ x: 0, opacity: 1 \} : \{ x: 0, opacity: 1 \}\}\n                  exit=\{isMobile \? \{ x: "100%", opacity: 0 \} : \{ x: 50, opacity: 0 \}\}"""
replacement4 = r"""                  initial={isMobile ? { y: "100%", opacity: 0 } : { x: 50, opacity: 0 }}
                  animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
                  exit={isMobile ? { y: "100%", opacity: 0 } : { x: 50, opacity: 0 }}"""
content = re.sub(pattern4, replacement4, content)

# RIGHT SIDEBAR classes
pattern5 = r"""className=\{\`fixed inset-y-0 right-0 md:absolute md:inset-auto md:right-4 md:top-4 z-\[70\] md:z-\[50\] pointer-events-auto origin-top-right md:origin-right transition-all duration-300 \$\{\n                    isDashboardExpanded \n                      \? "w-full md:max-w-none md:w-\[440px\] lg:w-\[490px\] xl:w-\[540px\] h-full max-h-full md:h-auto md:max-h-\[85vh\] overflow-y-auto pb-20 md:pb-0" \n                      : "w-auto ml-auto md:top-4 top-20 right-2 md:right-4 absolute"\n                  \}\`\}"""
replacement5 = r"""className={`fixed inset-x-0 bottom-0 top-auto md:absolute md:inset-auto md:right-4 md:top-4 z-[70] md:z-[50] pointer-events-auto origin-bottom md:origin-right transition-all duration-300 ${
                    isDashboardExpanded 
                      ? "w-full h-[85vh] rounded-t-3xl md:rounded-none md:max-w-none md:w-[440px] lg:w-[490px] xl:w-[540px] md:h-auto md:max-h-[85vh] overflow-y-auto pb-20 md:pb-0 shadow-[0_-12px_40px_rgba(0,0,0,0.5)] md:shadow-none bg-slate-950 md:bg-transparent" 
                      : "w-auto ml-auto md:top-4 top-20 right-2 md:right-4 absolute"
                  }`}"""
content = re.sub(pattern5, replacement5, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Updated App.tsx layout")
