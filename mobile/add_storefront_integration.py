#!/usr/bin/env python3
"""
Tail Me - Storefront Integration Script
Automatically adds StorefrontCustomizer to App.js
"""

import re
import shutil
from datetime import datetime

APP_JS_PATH = "App.js"
BACKUP_PATH = f"App.js.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"

# ════════════════════════════════════════════════════════════
# SNIPPETS TO ADD
# ════════════════════════════════════════════════════════════

IMPORT_LINE = 'import StorefrontCustomizer from "./StorefrontCustomizer";'

USE_STATE_LINE = '  const [showStorefrontCustomizer, setShowStorefrontCustomizer] = useState(false);'

PROFILE_BUTTON = '''
            {/* Storefront Customizer Button */}
            <TouchableOpacity
              onPress={() => setShowStorefrontCustomizer(true)}
              style={{
                marginTop: 14,
                backgroundColor: C.panel,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: C.border,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Text style={{ fontSize: 24 }}>🎨</Text>
                <View>
                  <Text style={{ color: C.text, fontWeight: "900", fontSize: 15 }}>
                    Customize Storefront
                  </Text>
                  <Text style={{ color: C.dim, fontSize: 11 }}>
                    {me?.storefrontConfig?.enabled ? "Enabled" : "Not set up"}
                  </Text>
                </View>
              </View>
              <Text style={{ color: C.muted }}>→</Text>
            </TouchableOpacity>
'''

MODAL_COMPONENT = '''
      {/* Storefront Customizer Modal */}
      <StorefrontCustomizer
        visible={showStorefrontCustomizer}
        initialConfig={me?.storefrontConfig}
        onSave={(config) => {
          setMe((prev) => ({ ...prev, storefrontConfig: config }));
        }}
        onClose={() => setShowStorefrontCustomizer(false)}
        colors={C}
      />
'''

def main():
    print("=" * 60)
    print("🚀 Tail Me - Storefront Integration Script")
    print("=" * 60)
    
    # Read file
    print(f"\n📖 Reading {APP_JS_PATH}...")
    try:
        with open(APP_JS_PATH, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ Error: {APP_JS_PATH} not found!")
        print("   Make sure you're in the /mobile folder")
        return False
    
    # Create backup
    print(f"💾 Creating backup: {BACKUP_PATH}")
    shutil.copy(APP_JS_PATH, BACKUP_PATH)
    
    changes_made = []
    
    # ════════════════════════════════════════════════════════════
    # 1. ADD IMPORT
    # ════════════════════════════════════════════════════════════
    print("\n🔧 Step 1: Adding import...")
    
    if 'StorefrontCustomizer' in content:
        print("   ⏭️  Import already exists, skipping")
    else:
        # Find last import line
        import_pattern = r'(import\s+.*?from\s+["\'].*?["\'];?\s*\n)(?!import)'
        matches = list(re.finditer(import_pattern, content))
        
        if matches:
            last_import = matches[-1]
            insert_pos = last_import.end()
            content = content[:insert_pos] + IMPORT_LINE + "\n" + content[insert_pos:]
            changes_made.append("✅ Added import for StorefrontCustomizer")
            print("   ✅ Import added")
        else:
            # Fallback: add after first import
            first_import = re.search(r'import\s+React', content)
            if first_import:
                line_end = content.find('\n', first_import.end()) + 1
                content = content[:line_end] + IMPORT_LINE + "\n" + content[line_end:]
                changes_made.append("✅ Added import for StorefrontCustomizer")
                print("   ✅ Import added (after React import)")
            else:
                print("   ❌ Could not find import location")
    
    # ════════════════════════════════════════════════════════════
    # 2. ADD useState
    # ════════════════════════════════════════════════════════════
    print("\n🔧 Step 2: Adding useState...")
    
    if 'showStorefrontCustomizer' in content:
        print("   ⏭️  useState already exists, skipping")
    else:
        # Find a good useState to add after (preferably composerOpen or similar)
        patterns_to_try = [
            r'(const\s+\[composerOpen,\s*setComposerOpen\]\s*=\s*useState.*?\n)',
            r'(const\s+\[screen,\s*setScreen\]\s*=\s*useState.*?\n)',
            r'(const\s+\[me,\s*setMe\]\s*=\s*useState.*?\n)',
            r'(const\s+\[\w+,\s*set\w+\]\s*=\s*useState.*?\n)',
        ]
        
        inserted = False
        for pattern in patterns_to_try:
            match = re.search(pattern, content)
            if match:
                insert_pos = match.end()
                content = content[:insert_pos] + USE_STATE_LINE + "\n" + content[insert_pos:]
                changes_made.append("✅ Added useState for showStorefrontCustomizer")
                print(f"   ✅ useState added")
                inserted = True
                break
        
        if not inserted:
            print("   ❌ Could not find useState location")
    
    # ════════════════════════════════════════════════════════════
    # 3. ADD PROFILE BUTTON
    # ════════════════════════════════════════════════════════════
    print("\n🔧 Step 3: Adding Profile button...")
    
    if 'Customize Storefront' in content:
        print("   ⏭️  Profile button already exists, skipping")
    else:
        # Look for Theme section in profile
        patterns_to_try = [
            # Before Theme section
            (r'(\{/\*\s*Theme\s*\*/\})', PROFILE_BUTTON + '\n\n            '),
            # Before "Your Interests" section  
            (r'(\{/\*\s*Your Interests\s*\*/\})', PROFILE_BUTTON + '\n\n            '),
            # Before Account section
            (r'(style=\{\{\s*color:\s*C\.muted,\s*fontWeight:\s*"900",\s*marginBottom:\s*4,?\s*\}\}\s*>\s*\n?\s*Account)', PROFILE_BUTTON + '\n\n            '),
            # Generic: after Tails Sent stat
            (r'(Tails Sent\s*</Text>\s*</View>\s*</View>\s*</View>)', r'\1' + PROFILE_BUTTON),
        ]
        
        inserted = False
        
        # Try finding Theme section more broadly
        theme_match = re.search(r'(<View[^>]*>\s*<Text[^>]*>\s*Theme\s*</Text>)', content, re.DOTALL)
        if theme_match:
            # Find the parent View that contains Theme
            # Go back to find the opening <View that contains the Theme section
            search_start = max(0, theme_match.start() - 500)
            section_pattern = r'(<View\s+style=\{\{\s*marginTop:\s*14,\s*backgroundColor:\s*C\.panel[^}]*\}\}[^>]*>)(\s*<Text[^>]*style=\{\{[^}]*color:\s*C\.muted[^}]*\}\}[^>]*>\s*Theme)'
            
            section_match = re.search(section_pattern, content[search_start:], re.DOTALL)
            if section_match:
                actual_pos = search_start + section_match.start()
                content = content[:actual_pos] + PROFILE_BUTTON + "\n\n            " + content[actual_pos:]
                changes_made.append("✅ Added Storefront button to Profile (before Theme)")
                print("   ✅ Button added before Theme section")
                inserted = True
        
        if not inserted:
            # Try another approach - find the Interests section
            interests_match = re.search(r'Your Interests', content)
            if interests_match:
                # Find the <View that contains "Your Interests"
                search_start = max(0, interests_match.start() - 300)
                view_pattern = r'(<View\s+style=\{\{\s*marginTop:\s*14,)'
                
                # Find all Views before "Your Interests"
                section = content[search_start:interests_match.start()]
                view_matches = list(re.finditer(view_pattern, section))
                
                if view_matches:
                    last_view = view_matches[-1]
                    actual_pos = search_start + last_view.start()
                    content = content[:actual_pos] + PROFILE_BUTTON + "\n\n            " + content[actual_pos:]
                    changes_made.append("✅ Added Storefront button to Profile (before Interests)")
                    print("   ✅ Button added before Interests section")
                    inserted = True
        
        if not inserted:
            # Last resort: find profile screen and add after earnings section
            profile_match = re.search(r'screen === "profile"', content)
            if profile_match:
                # Find a good spot - after "Recent Tails" section or stats
                recent_tails = re.search(r'Recent Tails', content[profile_match.start():])
                if recent_tails:
                    # Find closing of that section
                    section_end = content.find('</View>\n            </View>', profile_match.start() + recent_tails.end())
                    if section_end != -1:
                        insert_pos = section_end + len('</View>\n            </View>')
                        content = content[:insert_pos] + PROFILE_BUTTON + content[insert_pos:]
                        changes_made.append("✅ Added Storefront button to Profile")
                        print("   ✅ Button added after Recent Tails")
                        inserted = True
        
        if not inserted:
            print("   ⚠️  Could not auto-insert button. Manual insertion needed.")
            print("       Look for 'Theme' section in Profile and add button before it.")
    
    # ════════════════════════════════════════════════════════════
    # 4. ADD MODAL COMPONENT
    # ════════════════════════════════════════════════════════════
    print("\n🔧 Step 4: Adding Modal component...")
    
    if '<StorefrontCustomizer' in content:
        print("   ⏭️  Modal already exists, skipping")
    else:
        # Find </SafeAreaView> at the end
        safe_area_pattern = r'(</SafeAreaView>\s*\);\s*})'
        match = re.search(safe_area_pattern, content)
        
        if match:
            insert_pos = match.start()
            content = content[:insert_pos] + MODAL_COMPONENT + "\n    " + content[insert_pos:]
            changes_made.append("✅ Added StorefrontCustomizer modal")
            print("   ✅ Modal added before </SafeAreaView>")
        else:
            # Try finding the closing of the main component
            closing_pattern = r'(\n\s*</SafeAreaView>)'
            match = re.search(closing_pattern, content)
            if match:
                insert_pos = match.start()
                content = content[:insert_pos] + MODAL_COMPONENT + content[insert_pos:]
                changes_made.append("✅ Added StorefrontCustomizer modal")
                print("   ✅ Modal added")
            else:
                print("   ❌ Could not find </SafeAreaView>")
    
    # ════════════════════════════════════════════════════════════
    # SAVE FILE
    # ════════════════════════════════════════════════════════════
    print("\n💾 Saving changes...")
    
    with open(APP_JS_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # ════════════════════════════════════════════════════════════
    # SUMMARY
    # ════════════════════════════════════════════════════════════
    print("\n" + "=" * 60)
    print("📋 SUMMARY")
    print("=" * 60)
    
    if changes_made:
        print("\n✅ Changes made:")
        for change in changes_made:
            print(f"   {change}")
    else:
        print("\n⏭️  No changes needed - everything already integrated!")
    
    print(f"\n💾 Backup saved: {BACKUP_PATH}")
    print("\n🎯 Next steps:")
    print("   1. Check that the file looks correct: head -50 App.js")
    print("   2. Test the app")
    print("   3. If issues, restore backup: cp {BACKUP_PATH} App.js")
    
    return True

if __name__ == "__main__":
    main()
