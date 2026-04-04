#!/usr/bin/env python3
"""
Redesign SplitFrameCard bottom section
- Gradient fade instead of solid black
- Theme aware (light/dark)
- Better spacing
- Floating action buttons
"""

import re

with open("SplitFrameCard.js", "r") as f:
    content = f.read()

# 1. Add LinearGradient import if not present
if "LinearGradient" not in content:
    content = re.sub(
        r'(import \* as Haptics from "expo-haptics";)',
        r'\1\nimport { LinearGradient } from "expo-linear-gradient";',
        content
    )
    print("✅ Added LinearGradient import")

# 2. Update the headlineWrap style for theme support
old_headline_style = '''headlineWrap: { 
    backgroundColor: "#000", 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    paddingBottom: 10 
  }'''

new_headline_style = '''headlineWrap: { 
    paddingHorizontal: 16, 
    paddingTop: 14, 
    paddingBottom: 12,
    // backgroundColor set dynamically via theme
  }'''

content = content.replace(old_headline_style, new_headline_style)

# Also try single line version
content = re.sub(
    r'headlineWrap:\s*\{\s*backgroundColor:\s*"#000",\s*paddingHorizontal:\s*16,\s*paddingTop:\s*12,\s*paddingBottom:\s*10\s*\}',
    'headlineWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 }',
    content
)
print("✅ Updated headlineWrap style")

# 3. Update the card background style
content = re.sub(
    r'(card:\s*\{\s*width:\s*SW,\s*)backgroundColor:\s*"#000"',
    r'\1backgroundColor: "transparent"',
    content
)
print("✅ Made card background transparent")

# 4. Add theme-aware wrapper around the headline section
# Find where headlineWrap is used and wrap it with gradient

# Look for the headline section in the render
old_headline_render = '''<View style={styles.headlineWrap}>
            <Text style={styles.headlineText} numberOfLines={3}>{headlineTop}</Text>'''

new_headline_render = '''<LinearGradient
          colors={theme === "light" 
            ? ["rgba(255,255,255,0)", "rgba(255,255,255,0.9)", "rgba(255,255,255,1)"]
            : ["rgba(0,0,0,0)", "rgba(0,0,0,0.85)", "rgba(0,0,0,1)"]}
          style={styles.headlineGradient}
        >
          <View style={styles.headlineWrap}>
            <Text style={[styles.headlineText, { color: theme === "light" ? "#000" : "#fff" }]} numberOfLines={3}>{headlineTop}</Text>'''

content = content.replace(old_headline_render, new_headline_render)

# Close the gradient tag
content = re.sub(
    r'(<Text style=\{styles\.headlineText\}[^>]*>[^<]*</Text>\s*)(</View>)',
    r'\1</View>\n        </LinearGradient>',
    content
)
print("✅ Added gradient wrapper to headline")

# 5. Add headlineGradient style
new_style = '''
  headlineGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
  },'''

content = re.sub(
    r'(const styles = StyleSheet\.create\(\{)',
    r'\1' + new_style,
    content
)
print("✅ Added headlineGradient style")

# 6. Update text colors to be theme-aware
content = re.sub(
    r'color:\s*"#fff"',
    'color: theme === "light" ? "#000" : "#fff"',
    content
)
content = re.sub(
    r'color:\s*"#E2E8F0"',
    'color: theme === "light" ? "#1a1a1a" : "#E2E8F0"',
    content
)
print("✅ Made text colors theme-aware")

# Save
with open("SplitFrameCard.js", "w") as f:
    f.write(content)

print()
print("=" * 50)
print("✅ Card bottom redesigned with gradient fade!")
print("=" * 50)
