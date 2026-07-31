import re

with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

# Add useScroll, useTransform to motion/react import
import_pattern = r'import \{ motion, AnimatePresence \} from "motion/react";'
import_replacement = r'import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";'
content = re.sub(import_pattern, import_replacement, content)

# Add hooks inside LandingPage component
hooks_pattern = r'(const \[scrollY, setScrollY\] = useState\(0\);)'
hooks_replacement = r'\1\n  const { scrollY: framerScrollY } = useScroll();\n  const yBg = useTransform(framerScrollY, [0, 1000], [0, 400]);\n  const yText = useTransform(framerScrollY, [0, 1000], [0, 200]);\n  const opacityText = useTransform(framerScrollY, [0, 800], [1, 0]);'
content = re.sub(hooks_pattern, hooks_replacement, content)

# Apply yBg to background image carousel
# Before: <div className="absolute inset-0 z-0 transition-all duration-1000">
# After: <motion.div className="absolute inset-0 z-0 transition-all duration-1000" style={{ y: yBg }}>
carousel_pattern = r'<div className="absolute inset-0 z-0 transition-all duration-1000">'
carousel_replacement = r'<motion.div className="absolute inset-0 z-0 transition-all duration-1000" style={{ y: yBg }}>'
content = content.replace(carousel_pattern, carousel_replacement)

# change closing div for carousel
carousel_close_pattern = r'(\s*style=\{\{ backgroundImage: `url\(\'\$\{imgUrl\}\'\)` \}\}\s*/>\s*)\}\)\}\s*</div>'
carousel_close_replacement = r'\1})}</motion.div>'
content = re.sub(carousel_close_pattern, carousel_close_replacement, content)

# Apply yText and opacityText to the text container
text_container_pattern = r'<div className="flex flex-col items-center text-center max-w-4xl mx-auto">'
text_container_replacement = r'<motion.div className="flex flex-col items-center text-center max-w-4xl mx-auto" style={{ y: yText, opacity: opacityText }}>'
content = content.replace(text_container_pattern, text_container_replacement)

text_container_close_pattern = r'</button>\s*</motion\.div>\s*</div>'
text_container_close_replacement = r'</button>\n              </motion.div>\n            </motion.div>'
content = re.sub(text_container_close_pattern, text_container_close_replacement, content)

with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)
print("LandingPage parallax added.")
