import os
import re
import json

def scan_files():
    files = [
        "src/components/PortalMPP.tsx",
        "src/components/MppVisionModal.tsx",
        "src/components/MppAirportKioskModal.tsx"
    ]
    if os.path.exists("src/components/mpp"):
        for f in os.listdir("src/components/mpp"):
            if f.endswith(".tsx"):
                files.append(os.path.join("src/components/mpp", f))

    untranslated_jsx = []

    for fpath in files:
        with open(fpath, "r", encoding="utf-8") as f:
            code = f.read()

        # Find JSX string nodes
        matches = re.findall(r">\s*([^<>{}\n\t]+)\s*<", code)
        for text in matches:
            text = text.strip()
            # Ignore numbers, code expressions, comments, short symbols
            if len(text) > 2 and not text.startswith("//") and not text.startswith("t(") and not text.startswith("process."):
                if not re.match(r"^[\d\s\:\-\.,/\+%\(\)\|\$#]+$", text) and not text.startswith("import ") and not text.startswith("export "):
                    untranslated_jsx.append((fpath, text))

    print(f"Total untranslated JSX text nodes found: {len(untranslated_jsx)}")
    for fpath, text in untranslated_jsx:
        print(f"  [{fpath}]: {text}")

if __name__ == "__main__":
    scan_files()
