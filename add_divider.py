import re

with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

divider_html = """            </motion.div>

            {/* Elegant Gradient Divider */}
            <motion.div 
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              className="w-full max-w-3xl mx-auto my-12 relative flex items-center justify-center"
            >
              <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent blur-[2px]" />
              <div className={`w-3 h-3 rotate-45 border ${isDark ? 'border-emerald-500/50 bg-[#0b0f19]' : 'border-emerald-400 bg-slate-50'} z-10`} />
            </motion.div>

            {/* Premium Bento Stats Grid */}"""

content = content.replace("            </motion.div>\n\n            {/* Premium Bento Stats Grid */}", divider_html)

with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)
print("Divider added.")
