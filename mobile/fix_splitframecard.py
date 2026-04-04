#!/usr/bin/env python3
"""
Fix SplitFrameCard.js - proper syntax
"""

import re
import glob

# Find and use backup
backups = glob.glob("SplitFrameCard.backup.*.js")
if backups:
    source = sorted(backups)[-1]  # Most recent backup
    print(f"✅ Using backup: {source}")
    with open(source, "r") as f:
        content = f.read()
else:
    with open("SplitFrameCard.js", "r") as f:
        content = f.read()

# 1. Add import at TOP of file (after existing imports)
if "feedTokens" not in content:
    import_line = 'import { DARK, LIGHT, SPACING as S, FONT, TYPE_STYLES } from "./feedTokens";\n'
    
    # Find last import statement
    last_import_match = list(re.finditer(r'^import[^;]+;[ \t]*\n', content, re.MULTILINE))
    if last_import_match:
        insert_pos = last_import_match[-1].end()
        content = content[:insert_pos] + import_line + content[insert_pos:]
        print("✅ Added import for feedTokens")

# 2. Find the function signature and add theme prop correctly
# Original: export default function SplitFrameCard({ tail, onCatch, onClose, isVisible = true, onShare }) {
# New: export default function SplitFrameCard({ tail, onCatch, onClose, isVisible = true, onShare, theme = "dark" }) {

pattern = r'export default function SplitFrameCard\(\{([^}]+)\}\)'
match = re.search(pattern, content)

if match:
    props = match.group(1).strip()
    if "theme" not in props:
        new_props = props.rstrip() + ', theme = "dark"'
        content = content[:match.start()] + f'export default function SplitFrameCard({{ {new_props} }})' + content[match.end():]
        print("✅ Added theme prop to function signature")

# 3. Add theme constant INSIDE function body (after the opening brace)
func_pattern = r'(export default function SplitFrameCard\([^)]+\)\s*\{)'
func_match = re.search(func_pattern, content)

if func_match and "const T = theme" not in content:
    insert_pos = func_match.end()
    theme_const = '\n  // Theme colors\n  const T = theme === "light" ? LIGHT : DARK;\n'
    content = content[:insert_pos] + theme_const + content[insert_pos:]
    print("✅ Added theme constant inside function")

# 4. Replace hardcoded colors (carefully)
color_replacements = [
    # Background colors
    (r'backgroundColor:\s*"#000"', 'backgroundColor: T.bg'),
    (r'backgroundColor:\s*"#0D1220"', 'backgroundColor: T.surface'),
    (r'backgroundColor:\s*"#111827"', 'backgroundColor: T.panel'),
    (r'backgroundColor:\s*"#111"', 'backgroundColor: T.panel'),
    
    # Text colors
    (r'color:\s*"#fff"', 'color: T.text'),
    (r'color:\s*"#E2E8F0"', 'color: T.textSecondary'),
    (r'color:\s*"#94A3B8"', 'color: T.muted'),
    (r'color:\s*"#64748B"', 'color: T.dim'),
    
    # Border colors
    (r'borderColor:\s*"#1E293B"', 'borderColor: T.border'),
    (r'borderBottomColor:\s*"#1E293B"', 'borderBottomColor: T.border'),
]

for pattern, replacement in color_replacements:
    content = re.sub(pattern, replacement, content)

print("✅ Replaced hardcoded colors")

# 5. Save
with open("SplitFrameCard.js", "w") as f:
    f.write(content)

print()
print("=" * 50)
print("✅ SplitFrameCard.js FIXED!")
print("=" * 50)
print()
print("Run: npm start -- --tunnel")
