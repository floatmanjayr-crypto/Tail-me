#!/usr/bin/env python3
import re

with open("SplitFrameCard.js", "r") as f:
    content = f.read()

# Find the main return and wrap the card with themed background
# Look for: return ( ... <View style={styles.card}>
# Change to use inline backgroundColor

# Replace the card View to include theme-aware background
content = re.sub(
    r'<View style=\{styles\.card\}>',
    '<View style={[styles.card, { backgroundColor: theme === "light" ? "#F5F5F5" : "#000" }]}>',
    content
)

print("✅ Added theme background to card")

with open("SplitFrameCard.js", "w") as f:
    f.write(content)
