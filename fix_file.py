import re

with open('src/components/LandingPage.tsx', 'r') as f:
    lines = f.readlines()

def fix_line(num, search, replace):
    idx = num - 1
    lines[idx] = lines[idx].replace(search, replace)

# 153, 154, 155, 156 fixed already by fix_arrays.py? Let's check.
# Wait, fix_arrays.py fixed "Investment[".
# 231:   } ->   }];
fix_line(230, "  }", "  }];")

# Let's check what else.
