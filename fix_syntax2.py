import re
with open('src/components/LandingPage.tsx', 'r') as f:
    lines = f.readlines()

def fix(l, old, new):
    lines[l] = lines[l].replace(old, new)

# 230
fix(227, "  }", "  }];")

# 241
# wait, what was the error at 241? TS1005: ',' expected.
# Actually, the best way to fix this is to copy the LandingPage from the staging container or reset the whole file if I can find a way to get the blob...
