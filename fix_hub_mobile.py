import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

pattern = r"""                      <motion\.div\n                        key="expanded-analytical-panel"\n                        initial=\{\{ opacity: 0, x: 40, scaleX: 0\.9 \}\}\n                        animate=\{\{ opacity: 1, x: 0, scaleX: 1 \}\}\n                        exit=\{\{ opacity: 0, x: 40, scaleX: 0\.9 \}\}\n                        transition=\{\{ duration: 0\.25, ease: "easeOut" \}\}\n                        className=\{\`backdrop-blur-xl border p-3 sm:p-5 rounded-3xl shadow-2xl flex flex-col gap-4 relative overflow-hidden transition-all duration-300 ease-in-out origin-right \$\{"""

replacement = r"""                      <motion.div
                        key="expanded-analytical-panel"
                        initial={isMobile ? { opacity: 0, y: 40, scaleY: 0.9 } : { opacity: 0, x: 40, scaleX: 0.9 }}
                        animate={isMobile ? { opacity: 1, y: 0, scaleY: 1 } : { opacity: 1, x: 0, scaleX: 1 }}
                        exit={isMobile ? { opacity: 0, y: 40, scaleY: 0.9 } : { opacity: 0, x: 40, scaleX: 0.9 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={`backdrop-blur-xl border p-3 pt-6 sm:pt-5 sm:p-5 h-full md:h-auto rounded-none md:rounded-3xl shadow-2xl flex flex-col gap-4 relative overflow-hidden transition-all duration-300 ease-in-out origin-bottom md:origin-right ${"""

content = re.sub(pattern, replacement, content)

# Add the drag handle and close button for mobile inside this panel, right after the background blur 
pattern2 = r"""                        \}\}\n                        <InvestorDashboard"""
replacement2 = r"""                        }}
                        <div className="flex md:hidden absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full z-10" />
                        <button
                          type="button"
                          onClick={() => {
                             setIsDashboardExpanded(false);
                             setIsRightSidebarOpen(false);
                          }}
                          className="md:hidden absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-white z-10"
                        >
                          <X size={16} />
                        </button>
                        <InvestorDashboard"""

content = re.sub(pattern2, replacement2, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)

