#!/usr/bin/env python3
"""
Simple theme support - just add prop and pass through
Don't replace colors, let parent handle it
"""

import re

with open("SplitFrameCard.js", "r") as f:
    content = f.read()

# 1. Add theme prop to function
if 'theme = "dark"' not in content:
    content = re.sub(
        r'export default function SplitFrameCard\(\{([^}]+)\}\)',
        r'export default function SplitFrameCard({ \1, theme = "dark" })',
        content
    )
    print("✅ Added theme prop")

# Save
with open("SplitFrameCard.js", "w") as f:
    f.write(content)

print("✅ Done - SplitFrameCard now accepts theme prop")
print("   (Colors stay as-is, no broken replacements)")
