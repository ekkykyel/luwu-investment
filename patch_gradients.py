import re
import glob

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content
    
    # 1. Dashboard Hitung Kelayakan
    content = re.sub(
        r'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-slate-900 dark:text-white',
        r'bg-emerald-600 hover:bg-emerald-700 text-white',
        content
    )
    
    content = re.sub(
        r'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white',
        r'bg-emerald-600 hover:bg-emerald-700 text-white',
        content
    )

    # 2. Landing Page Login Investor
    content = re.sub(
        r'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white',
        r'bg-emerald-600 hover:bg-emerald-700 text-white',
        content
    )

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Patched {filepath}")

for f in glob.glob('src/components/**/*.tsx', recursive=True):
    patch_file(f)

