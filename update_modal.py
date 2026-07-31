import re

with open('src/components/InvestmentDetailModal.tsx', 'r') as f:
    content = f.read()

# Replace <motion.div with <div for the outer overlay and inner modal
# Outer overlay
pattern1 = r"""    <motion\.div\n      initial=\{\{ opacity: 0 \}\}\n      animate=\{\{ opacity: 1 \}\}\n      exit=\{\{ opacity: 0 \}\}\n      className=\{\`fixed inset-0 z-\[9999\] flex overflow-hidden transition-all duration-300 \$\{isMinimized \? "items-end justify-end pointer-events-none p-4 sm:p-8" : "bg-black/40 backdrop-blur-sm items-center justify-center p-0 sm:p-4 lg:p-6"\}\`\}\n      onClick=\{isMinimized \? undefined : \(\) => onClose\(\)\}\n    >"""
replacement1 = r"""    <div
      className={`fixed inset-0 z-[9999] flex overflow-hidden transition-all duration-300 animate-fade-in ${isMinimized ? "items-end justify-end pointer-events-none p-4 sm:p-8" : "bg-black/40 backdrop-blur-sm items-center justify-center p-0 sm:p-4 lg:p-6"}`}
      onClick={isMinimized ? undefined : () => onClose()}
    >"""
content = re.sub(pattern1, replacement1, content)

# Inner modal
pattern2 = r"""      <motion\.div\n        initial=\{\{ opacity: 0, scale: 0\.95 \}\}\n        animate=\{\{ opacity: 1, scale: 1 \}\}\n        exit=\{\{ opacity: 0, scale: 0\.95 \}\}\n        transition=\{\{ duration: 0\.15, ease: "easeOut" \}\}\n        className=\{\`relative w-full sm:h-auto sm:max-h-\[90vh\] lg:max-h-\[95vh\] max-w-5xl lg:max-w-\[1000px\] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col \$\{modalBg\} \$\{isMinimized \? "pointer-events-auto h-auto max-w-\[400px\]" : "h-full mx-auto"\}\`\}\n        onClick=\{\(e\) => e\.stopPropagation\(\)\}\n      >"""
replacement2 = r"""      <div
        className={`relative w-full sm:h-auto sm:max-h-[90vh] lg:max-h-[95vh] max-w-5xl lg:max-w-[1000px] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-[fadeInUp_0.3s_ease-out_forwards] ${modalBg} ${isMinimized ? "pointer-events-auto h-auto max-w-[400px]" : "h-full mx-auto"}`}
        onClick={(e) => e.stopPropagation()}
      >"""
content = re.sub(pattern2, replacement2, content)

# also need to close with </div> instead of </motion.div>
content = content.replace("</motion.div>", "</div>")

with open('src/components/InvestmentDetailModal.tsx', 'w') as f:
    f.write(content)

print("InvestmentDetailModal.tsx updated")
