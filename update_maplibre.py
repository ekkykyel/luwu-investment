import re
with open('src/components/MaplibreComponent.tsx', 'r') as f:
    content = f.read()

pattern = r"""(<Map\n        ref=\{mapRef\}\n        onClick=\{handleMapClick\}\n        // @ts-ignore\n        preserveDrawingBuffer=\{true\})"""
replacement = r"""\1
        dragRotate={true}
        touchPitch={true}
        touchZoomRotate={true}"""

content = re.sub(pattern, replacement, content)

if "// ux polish: enable native maplibre touch gestures" not in content:
    content += "\n// ux polish: enable native maplibre touch gestures\n"

with open('src/components/MaplibreComponent.tsx', 'w') as f:
    f.write(content)
