#!/usr/bin/env python3
import re

with open("SplitFrameCard.js", "r") as f:
    content = f.read()

# Just add theme prop to function signature
if 'theme = "dark"' not in content:
    content = re.sub(
        r'export default function SplitFrameCard\(\{\s*([^}]+)\s*\}\)',
        lambda m: f'export default function SplitFrameCard({{ {m.group(1).strip()}, theme = "dark" }})',
        content
    )
    print("✅ Added theme prop")
else:
    print("✅ Theme prop exists")

with open("SplitFrameCard.js", "w") as f:
    f.write(content)

print("✅ Done - minimal fix applied")
