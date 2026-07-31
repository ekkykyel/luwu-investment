import re
with open('src/components/LandingPage.tsx', 'r') as f:
    lines = f.readlines()

def f(l, a, b):
    idx = l - 1
    lines[idx] = lines[idx].replace(a, b)

f(230, "  }", "  }];")

with open('src/components/LandingPage.tsx', 'w') as fh:
    fh.writelines(lines)
