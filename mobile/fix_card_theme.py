#!/usr/bin/env python3
"""
Fix SplitFrameCard to properly use theme colors
- Card backgrounds
- Text colors
- Spacing between cards
"""

import re

with open("SplitFrameCard.js", "r") as f:
    content = f.read()

# 1. Find the card style and add theme-aware background
# Look for the main card container style

# Add theme colors at the top of the component (after const T line or add it)
if "const T = theme" not in content:
    # Find function start and add T constant
    func_match = re.search(r'(export default function SplitFrameCard\([^)]+\)\s*\{)', content)
    if func_match:
        insert_pos = func_match.end()
        theme_block = '''
  // Theme colors
  const T = {
    bg: theme === "light" ? "#FFFFFF" : "#000000",
    surface: theme === "light" ? "#F5F5F5" : "#0A0A0A",
    card: theme === "light" ? "#FFFFFF" : "#111111",
    border: theme === "light" ? "#E5E5E5" : "#2A2A2A",
    text: theme === "light" ? "#000000" : "#FFFFFF",
    muted: theme === "light" ? "#6B7280" : "#9CA3AF",
    dim: theme === "light" ? "#9CA3AF" : "#6B7280",
  };
'''
        content = content[:insert_pos] + theme_block + content[insert_pos:]
        print("✅ Added T theme object")

# 2. Find the main card container and update its style
# Look for: <View style={[styles.card, ...]}> or similar

# Replace card background
content = re.sub(
    r'(styles\.card,?\s*\{?\s*)(backgroundColor:\s*["\']#[0-9a-fA-F]+["\'])',
    r'\1backgroundColor: T.card',
    content
)

# 3. Replace hardcoded dark backgrounds with T.card or T.bg
replacements = [
    (r'backgroundColor:\s*"#000000"', 'backgroundColor: T.bg'),
    (r'backgroundColor:\s*"#000"', 'backgroundColor: T.bg'),
    (r'backgroundColor:\s*"#0D1220"', 'backgroundColor: T.surface'),
    (r'backgroundColor:\s*"#111827"', 'backgroundColor: T.card'),
    (r'backgroundColor:\s*"#111"', 'backgroundColor: T.card'),
    (r'backgroundColor:\s*"#0A0A0A"', 'backgroundColor: T.surface'),
    (r'backgroundColor:\s*"#1A1A1A"', 'backgroundColor: T.surface'),
]

for pattern, replacement in replacements:
    count = len(re.findall(pattern, content))
    if count > 0:
        content = re.sub(pattern, replacement, content)
        print(f"✅ Replaced {count}x: {pattern[:30]}...")

# 4. Replace text colors
text_replacements = [
    (r'color:\s*"#fff"', 'color: T.text'),
    (r'color:\s*"#FFFFFF"', 'color: T.text'),
    (r'color:\s*"#ffffff"', 'color: T.text'),
    (r'color:\s*"#E2E8F0"', 'color: T.text'),
    (r'color:\s*"#94A3B8"', 'color: T.muted'),
    (r'color:\s*"#64748B"', 'color: T.dim'),
]

for pattern, replacement in text_replacements:
    count = len(re.findall(pattern, content))
    if count > 0:
        content = re.sub(pattern, replacement, content)
        print(f"✅ Replaced {count}x text: {pattern[:25]}...")

# 5. Replace border colors
content = re.sub(r'borderColor:\s*"#1E293B"', 'borderColor: T.border', content)
content = re.sub(r'borderColor:\s*"#2A2A2A"', 'borderColor: T.border', content)

# Save
with open("SplitFrameCard.js", "w") as f:
    f.write(content)

print()
print("=" * 50)
print("✅ SplitFrameCard.js updated with theme support!")
print("=" * 50)
