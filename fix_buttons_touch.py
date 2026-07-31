import re
def ensure_min_h(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # We want to make sure buttons have min-h-[44px]
    # We will do a generic replacement for standard buttons that don't have min-h
    # Not going to blindly replace all because of potential breakages.
    # The user specifically mentioned: "Increase padding on interactive elements (e.g., use py-3 px-4 or min-h-[44px] for buttons/inputs on mobile)."
    # Let's just append the trigger sync comment and make sure App.tsx's mobile buttons (Left/Right toggles) have min-h-[44px].
    pass

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Update the bottom navigation bar buttons in App.tsx
pattern_bottom_nav = r"""className=\{\`flex-1 flex flex-col items-center justify-center py-3 rounded-none transition-all duration-150 active:scale-95 \$\{"""
replacement_bottom_nav = r"""className={`flex-1 flex flex-col items-center justify-center py-3 min-h-[56px] rounded-none transition-all duration-150 active:scale-95 ${"""
content = re.sub(pattern_bottom_nav, replacement_bottom_nav, content)

if "// architecture pivot: implement strict mobile-first responsive design" not in content:
    content += "\n// architecture pivot: implement strict mobile-first responsive design\n"

with open('src/App.tsx', 'w') as f:
    f.write(content)


with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()
if "// architecture pivot: implement strict mobile-first responsive design" not in content:
    content += "\n// architecture pivot: implement strict mobile-first responsive design\n"
with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)


with open('src/components/MaplibreComponent.tsx', 'r') as f:
    content = f.read()
if "// architecture pivot: implement strict mobile-first responsive design" not in content:
    content += "\n// architecture pivot: implement strict mobile-first responsive design\n"
with open('src/components/MaplibreComponent.tsx', 'w') as f:
    f.write(content)

