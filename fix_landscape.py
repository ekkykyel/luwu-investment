import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. & 2. Fix Header and Search Bar position
# We will make the header flex-wrap
pattern1 = r"""      \{\/\* FLOATING TOP HEADER \*\/\}\n      <header \n        className="absolute left-4 right-4 md:left-6 md:right-6 md:top-6 z-\[60\] shrink-0 pointer-events-none flex items-center justify-between gap-4" """
replacement1 = r"""      {/* FLOATING TOP HEADER */}
      <header 
        className="absolute left-4 right-14 md:left-6 md:right-16 md:top-6 z-[60] shrink-0 pointer-events-none flex flex-wrap items-center justify-between gap-3" """
content = re.sub(pattern1, replacement1, content)

# And fix the reset button position
pattern2 = r"""      \{\/\* FLOATING QUICK RESET KECAMATAN \(GLOBAL\) \*\/\}\n      \{selectedDistrictId && \(\n        <div className="absolute top-20 md:top-6 left-1/2 -translate-x-1/2 z-\[65\] pointer-events-auto animate-\[bounce_1s_ease-in-out\]">"""
replacement2 = r"""      {/* FLOATING QUICK RESET KECAMATAN (GLOBAL) */}
      {selectedDistrictId && (
        <div className="absolute top-[120px] md:top-6 left-1/2 -translate-x-1/2 z-[65] pointer-events-auto animate-[bounce_1s_ease-in-out]">"""
content = re.sub(pattern2, replacement2, content)

# 3. Z-Index collision on mobile bottom bar
pattern3 = r"""            \{\/\* MOBILE BOTTOM ACTION BAR \*\/\}\n            <div className=\{\`md:hidden fixed bottom-0 left-0 right-0 z-\[100\] pointer-events-auto pb-safe flex justify-around items-center border-t backdrop-blur-xl \$\{"""
replacement3 = r"""            {/* MOBILE BOTTOM ACTION BAR */}
            <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[9999] pointer-events-auto pb-safe flex justify-around items-center border-t backdrop-blur-xl ${"""
content = re.sub(pattern3, replacement3, content)

# Append hotfix string
content += "\n// hotfix: resolve mobile landscape layout and dead bottom buttons"

with open('src/App.tsx', 'w') as f:
    f.write(content)
