#!/usr/bin/env python3
"""
Fix feed spacing - add gaps between cards and theme background
"""

import re

with open("SplitFeedScreen.js", "r") as f:
    content = f.read()

# 1. Find FlatList and add ItemSeparatorComponent for spacing
if "ItemSeparatorComponent" not in content:
    # Find the FlatList
    content = re.sub(
        r'(<Animated\.FlatList\s+data=\{feedTails\})',
        r'''<Animated.FlatList
        data={feedTails}
        ItemSeparatorComponent={() => (
          <View style={{ 
            height: 12, 
            backgroundColor: theme === "light" ? "#F0F0F0" : "#000000" 
          }} />
        )}''',
        content,
        count=1
    )
    print("✅ Added ItemSeparatorComponent for spacing")

# 2. Update container background to use theme
# Already done but let's make sure the background between cards is themed
content = re.sub(
    r'backgroundColor:\s*"#000000"',
    'backgroundColor: theme === "light" ? "#F0F0F0" : "#000000"',
    content
)

# Save
with open("SplitFeedScreen.js", "w") as f:
    f.write(content)

print("✅ SplitFeedScreen.js updated with spacing!")
