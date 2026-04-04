#!/usr/bin/env python3
"""
Add theme support to SplitFrameCard
"""

import re

with open("SplitFrameCard.js", "r") as f:
    content = f.read()

# 1. Add import for tokens
if "feedTokens" not in content:
    # Add after existing imports
    import_section = '''import { DARK, LIGHT, SPACING as S, FONT, TYPE_STYLES } from "./feedTokens";

'''
    # Find last import
    last_import = list(re.finditer(r'import[^;]+;\n', content))[-1]
    content = content[:last_import.end()] + import_section + content[last_import.end():]
    print("✅ Added feedTokens import")

# 2. Add theme prop to function signature
content = re.sub(
    r'export default function SplitFrameCard\(\{([^}]+)\}\)',
    lambda m: f'export default function SplitFrameCard({{ {m.group(1).strip()}, theme = "dark" }})',
    content
)
print("✅ Added theme prop")

# 3. Add theme constant at start of function
theme_line = '''
  // Theme colors
  const T = theme === "light" ? LIGHT : DARK;
'''

# Find function body start
func_match = re.search(r'export default function SplitFrameCard[^{]+\{', content)
if func_match:
    insert_pos = func_match.end()
    content = content[:insert_pos] + theme_line + content[insert_pos:]
    print("✅ Added theme constant")

# 4. Replace hardcoded colors with theme tokens
replacements = [
    ('backgroundColor: "#000"', 'backgroundColor: T.bg'),
    ('backgroundColor: "#0D1220"', 'backgroundColor: T.surface'),
    ('backgroundColor: "#111"', 'backgroundColor: T.panel'),
    ('backgroundColor: "#111827"', 'backgroundColor: T.panel'),
    ('backgroundColor: "#1E293B"', 'backgroundColor: T.panel2'),
    ('color: "#fff"', 'color: T.text'),
    ('color: "#E2E8F0"', 'color: T.textSecondary'),
    ('color: "#94A3B8"', 'color: T.muted'),
    ('color: "#64748B"', 'color: T.dim'),
    ('color: "#334155"', 'color: T.faint'),
    ('borderColor: "#1E293B"', 'borderColor: T.border'),
    ('borderBottomColor: "#1E293B"', 'borderBottomColor: T.border'),
    ('borderTopColor: "#1E293B"', 'borderTopColor: T.border'),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)

print("✅ Replaced hardcoded colors with theme tokens")

# 5. Remove rounded corners (keep sharp)
content = re.sub(r'borderRadius: 20', 'borderRadius: 0', content)
content = re.sub(r'borderRadius: 16', 'borderRadius: 0', content)
content = re.sub(r'borderRadius: 12', 'borderRadius: 0', content)
content = re.sub(r'borderTopLeftRadius: 24', 'borderTopLeftRadius: 0', content)
content = re.sub(r'borderTopRightRadius: 24', 'borderTopRightRadius: 0', content)
print("✅ Removed rounded corners (sharp edges)")

# Save
with open("SplitFrameCard.js", "w") as f:
    f.write(content)

print()
print("=" * 60)
print("✅ SplitFrameCard.js upgraded!")
print("=" * 60)
print()
print("🎯 NOW TEST:")
print("   npm start -- --tunnel")
print()
print("📱 You should see:")
print("   • Theme toggle button (☀️/🌙) in header")
print("   • Light theme = white background, dark text")
print("   • Dark theme = black background, white text")
print("   • Sharp edges everywhere (no rounded corners)")
print()
