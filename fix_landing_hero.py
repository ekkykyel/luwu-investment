import re

with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

# 1. Hero Text Mod
pattern_hero_text = r'<motion\.h1[^>]*>.*?<\/motion\.h1>'
replacement_hero_text = """<motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                className="text-5xl md:text-6xl lg:text-7xl font-['Playfair_Display'] font-extrabold tracking-tight mb-6 leading-tight"
              >
                <span className={`block text-lg md:text-xl font-['Plus_Jakarta_Sans'] font-medium tracking-[0.2em] uppercase mb-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {t('hero.heroTitleBrand')}
                </span>
                <span className={`transition-all duration-500 ease-in-out ${isDark ? 'text-white drop-shadow-md' : 'text-slate-900 drop-shadow-sm'}`}>
                  {t('hero.heroTitleSlogan')}
                </span>
              </motion.h1>"""

content = re.sub(pattern_hero_text, replacement_hero_text, content, flags=re.DOTALL)

# 2. Hero Background Image Mod (less noise, more vignette)
pattern_bg = r'className=\{`absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out \$\{idx === currentSlide \? "opacity-30 mix-blend-overlay" : "opacity-0"\}[\`]'
replacement_bg = 'className={`absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? "opacity-40 mix-blend-luminosity" : "opacity-0"}`}'

content = content.replace('opacity-30 mix-blend-overlay', 'opacity-40 mix-blend-luminosity')

# add a vignette overlay over the image carousel
pattern_carousel = r'(<div className="absolute inset-0 z-0 transition-all duration-1000">.*?</div>)'
replacement_carousel = r'\1\n          <div className={`absolute inset-0 z-10 ${isDark ? "bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.8)_70%,#020617_100%)]" : "bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.8)_70%,#ffffff_100%)]"} pointer-events-none`} />'

content = re.sub(pattern_carousel, replacement_carousel, content, flags=re.DOTALL)

# 3. Bento Stats Grid Glassmorphism
pattern_bento = r'className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 glass-panel rounded-3xl p-4 md:p-8"'
replacement_bento = 'className={`grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 rounded-3xl p-4 md:p-8 border shadow-2xl backdrop-blur-2xl ${isDark ? "bg-slate-950/40 border-white/5" : "bg-white/60 border-slate-200/50"}`}'
content = content.replace(pattern_bento, replacement_bento)

# 4. Stat Items Border
content = content.replace("border-t-emerald-400/60", "border-t-emerald-500/80 shadow-[0_-2px_15px_rgba(16,185,129,0.1)]")
content = content.replace("border-t-indigo-400/60", "border-t-indigo-500/80 shadow-[0_-2px_15px_rgba(99,102,241,0.1)]")
content = content.replace("border-t-amber-400/60", "border-t-amber-500/80 shadow-[0_-2px_15px_rgba(245,158,11,0.1)]")
content = content.replace("border-t-rose-400/60", "border-t-rose-500/80 shadow-[0_-2px_15px_rgba(244,63,94,0.1)]")


with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)
print("LandingPage hero polished.")
