import re

def add_while_tap(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find <button ...> and replace with <motion.button whileTap={{ scale: 0.95 }} ...>
    # Be careful not to replace closing </button> incorrectly.
    content = re.sub(r'<button\b', r'<motion.button whileTap={{ scale: 0.95 }}', content)
    content = re.sub(r'</button>', r'</motion.button>', content)

    # For existing <motion.button, make sure we add whileTap={{ scale: 0.95 }} if missing
    def insert_while_tap(match):
        tag = match.group(0)
        if 'whileTap=' not in tag:
            return tag.replace('<motion.button', '<motion.button whileTap={{ scale: 0.95 }}')
        return tag

    content = re.sub(r'<motion\.button[^>]*>', insert_while_tap, content)

    # Replace 'active:scale-95' and 'active:scale-90' to avoid conflict with framer-motion tap?
    # Not strictly necessary, but good to clean up if we want.

    with open(filepath, 'w') as f:
        f.write(content)

add_while_tap('src/components/LandingPage.tsx')

