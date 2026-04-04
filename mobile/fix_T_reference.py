#!/usr/bin/env python3
"""
Fix T reference errors - make sure T is available everywhere
"""

import re

# Read the file
with open("SplitFrameCard.js", "r") as f:
    content = f.read()

# Check if T is defined correctly
if "const T = theme" not in content:
    print("❌ T constant is missing! Adding it...")
    
    # Find function start
    func_match = re.search(r'(export default function SplitFrameCard\([^)]+\)\s*\{)', content)
    if func_match:
        insert_pos = func_match.end()
        theme_const = '\n  // Theme colors\n  const T = theme === "light" ? LIGHT : DARK;\n'
        content = content[:insert_pos] + theme_const + content[insert_pos:]
else:
    print("✅ T constant exists")

# The problem: T.bg, T.text etc are used but T might be out of scope
# OR some places still have hardcoded colors mixed with T references

# Replace any remaining T. references with safe fallbacks
# Actually, let's just use the colors directly with fallback

replacements = [
    # Replace T.xxx with inline ternary that doesn't need T
    (r'backgroundColor: T\.bg', 'backgroundColor: theme === "light" ? "#FFFFFF" : "#000000"'),
    (r'backgroundColor: T\.surface', 'backgroundColor: theme === "light" ? "#FAFAFA" : "#0A0A0A"'),
    (r'backgroundColor: T\.panel', 'backgroundColor: theme === "light" ? "#F5F5F5" : "#111111"'),
    (r'backgroundColor: T\.panel2', 'backgroundColor: theme === "light" ? "#EEEEEE" : "#1A1A1A"'),
    (r'color: T\.text', 'color: theme === "light" ? "#000000" : "#FFFFFF"'),
    (r'color: T\.textSecondary', 'color: theme === "light" ? "#1A1A1A" : "#E0E0E0"'),
    (r'color: T\.muted', 'color: theme === "light" ? "#6B7280" : "#9CA3AF"'),
    (r'color: T\.dim', 'color: theme === "light" ? "#9CA3AF" : "#6B7280"'),
    (r'borderColor: T\.border', 'borderColor: theme === "light" ? "#E5E5E5" : "#2A2A2A"'),
    (r'borderBottomColor: T\.border', 'borderBottomColor: theme === "light" ? "#E5E5E5" : "#2A2A2A"'),
]

for pattern, replacement in replacements:
    if re.search(pattern, content):
        content = re.sub(pattern, replacement, content)
        print(f"✅ Fixed: {pattern[:30]}...")

# Also check SplitFeedScreen.js for same issue
with open("SplitFeedScreen.js", "r") as f:
    feed_content = f.read()

# Make sure SplitFeedScreen passes theme prop
if 'theme={theme}' not in feed_content:
    # Find where SplitFrameCard is used
    feed_content = re.sub(
        r'<SplitFrameCard\s+tail=\{item\}\s+onCatch=\{onCatch\}\s+onShare=\{onShare\}\s+isVisible=\{index === visibleIndex\}',
        '<SplitFrameCard tail={item} onCatch={onCatch} onShare={onShare} isVisible={index === visibleIndex} theme={theme}',
        feed_content
    )
    with open("SplitFeedScreen.js", "w") as f:
        f.write(feed_content)
    print("✅ Added theme prop to SplitFrameCard in SplitFeedScreen")

# Save SplitFrameCard
with open("SplitFrameCard.js", "w") as f:
    f.write(content)

print()
print("=" * 50)
print("✅ Fixed T reference errors!")
print("=" * 50)
print()
print("Now run: npx expo start --tunnel")
