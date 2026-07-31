with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """                        )}
                        <InvestorDashboard"""

replacement = """                        )}
                        <div className="flex md:hidden absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full z-10 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => {
                             setIsDashboardExpanded(false);
                             setIsRightSidebarOpen(false);
                          }}
                          className="md:hidden absolute top-3 right-3 p-2 rounded-full bg-slate-800/80 text-white z-[80] shadow-lg active:scale-90 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <X size={16} />
                        </button>
                        <InvestorDashboard"""

content = content.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)
