import re

def add_while_tap(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    content = re.sub(r'<button\b', r'<motion.button whileTap={{ scale: 0.95 }}', content)
    content = re.sub(r'</button>', r'</motion.button>', content)

    def insert_while_tap(match):
        tag = match.group(0)
        if 'whileTap=' not in tag:
            return tag.replace('<motion.button', '<motion.button whileTap={{ scale: 0.95 }}')
        return tag

    content = re.sub(r'<motion\.button[^>]*>', insert_while_tap, content)

    with open(filepath, 'w') as f:
        f.write(content)

add_while_tap('src/components/InvestmentDetailModal.tsx')

