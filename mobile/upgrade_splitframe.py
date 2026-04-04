#!/usr/bin/env python3
"""
Upgrade SplitFrameCard + SplitFeedScreen
- Add design tokens
- Add light/dark theme toggle
- Keep sharp edges (no rounded corners)
- Better spacing
- Shadows/depth
"""

import shutil
from datetime import datetime

# Backup
shutil.copy("SplitFrameCard.js", f"SplitFrameCard.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}.js")
shutil.copy("SplitFeedScreen.js", f"SplitFeedScreen.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}.js")
print("✅ Backups created")

# ═══════════════════════════════════════════════════════════
# NEW DESIGN TOKENS FOR FEED (Sharp edges version)
# ═══════════════════════════════════════════════════════════

FEED_TOKENS = '''// ============================================================
// feedTokens.js — Design Tokens for Feed (Sharp Edition)
// ============================================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  none: 0,      // Sharp edges
  xs: 2,        // Subtle
  sm: 4,        // Minimal
  md: 8,        // Only where needed (buttons, badges)
  pill: 999,    // Pills only
};

export const FONT = {
  hero: { size: 28, weight: "900", lineHeight: 32 },
  h1: { size: 22, weight: "900", lineHeight: 28 },
  h2: { size: 18, weight: "800", lineHeight: 24 },
  h3: { size: 16, weight: "800", lineHeight: 22 },
  body: { size: 14, weight: "600", lineHeight: 20 },
  caption: { size: 12, weight: "700", lineHeight: 16 },
  tiny: { size: 10, weight: "700", lineHeight: 14 },
};

export const DARK = {
  bg: "#000000",
  surface: "#0A0A0A",
  panel: "#111111",
  panel2: "#1A1A1A",
  elevated: "#222222",
  border: "#2A2A2A",
  
  text: "#FFFFFF",
  textSecondary: "#E0E0E0",
  muted: "#9CA3AF",
  dim: "#6B7280",
  faint: "#4B5563",
  
  brand: "#7C3AED",
  accent: "#F59E0B",
  
  // Type colors
  look: "#7C3AED",
  now: "#F59E0B",
  drop: "#EF4444",
  geo: "#0EA5E9",
  chain: "#22C55E",
  gift: "#F43F8E",
};

export const LIGHT = {
  bg: "#FFFFFF",
  surface: "#FAFAFA",
  panel: "#F5F5F5",
  panel2: "#EEEEEE",
  elevated: "#FFFFFF",
  border: "#E5E5E5",
  
  text: "#000000",
  textSecondary: "#1A1A1A",
  muted: "#6B7280",
  dim: "#9CA3AF",
  faint: "#D1D5DB",
  
  brand: "#7C3AED",
  accent: "#F59E0B",
  
  // Type colors (same in both themes)
  look: "#7C3AED",
  now: "#F59E0B",
  drop: "#EF4444",
  geo: "#0EA5E9",
  chain: "#22C55E",
  gift: "#F43F8E",
};

export const SHADOWS = {
  none: {},
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Type badge styles
export const TYPE_STYLES = {
  NOW: { 
    bg: "rgba(245,158,11,0.15)", 
    border: "rgba(245,158,11,0.4)", 
    color: "#F59E0B",
    icon: "⚡"
  },
  DROP: { 
    bg: "rgba(239,68,68,0.15)", 
    border: "rgba(239,68,68,0.4)", 
    color: "#EF4444",
    icon: "💧"
  },
  GEO: { 
    bg: "rgba(14,165,233,0.15)", 
    border: "rgba(14,165,233,0.4)", 
    color: "#0EA5E9",
    icon: "📍"
  },
  CHAIN: { 
    bg: "rgba(34,197,94,0.15)", 
    border: "rgba(34,197,94,0.4)", 
    color: "#22C55E",
    icon: "🔗"
  },
  LOOK: { 
    bg: "rgba(124,58,237,0.15)", 
    border: "rgba(124,58,237,0.4)", 
    color: "#7C3AED",
    icon: "👀"
  },
  GIFT: { 
    bg: "rgba(244,63,142,0.15)", 
    border: "rgba(244,63,142,0.4)", 
    color: "#F43F8E",
    icon: "🎁"
  },
};
'''

with open("feedTokens.js", "w") as f:
    f.write(FEED_TOKENS)
print("✅ Created feedTokens.js")

# ═══════════════════════════════════════════════════════════
# UPGRADED SPLITFEEDSCREEN WITH THEME TOGGLE
# ═══════════════════════════════════════════════════════════

SPLIT_FEED_UPGRADE = '''// ============================================================
// SplitFeedScreen.js — Professional Feed with Light/Dark Theme
// ✅ Theme toggle
// ✅ Sharp edges design
// ✅ Design tokens
// ============================================================
import React, { useCallback, useRef, useState } from "react";
import { 
  View, FlatList, Dimensions, StyleSheet, Text, 
  ScrollView, TouchableOpacity, Animated 
} from "react-native";
import SplitFrameCard from "./SplitFrameCard";
import { DARK, LIGHT, SPACING as S, RADIUS as R, FONT } from "./feedTokens";

const { width: SW, height: SH } = Dimensions.get("window");

const DEMO_SPLIT_TAILS = [
  { id: "sf_1", from: "sneaker.plug.atl", tailType: "DROP", message: "SCORED THESE FOR $40 RESELLING $120+ 👟 2 LEFT", frameLayout: "A", previewUrl: "https://videos.pexels.com/video-files/3163534/3163534-sd_640_360_30fps.mp4", box2Url: "https://videos.pexels.com/video-files/3209828/3209828-sd_640_360_25fps.mp4", box3Url: null, revealBox: 1, catchLimit: 2, catchCount: 0, timestamp: Date.now() - 240000 },
  { id: "sf_2", from: "maya.eats.nyc", tailType: "LOOK", message: "THIS SPOT HAS NO BUSINESS BEING THIS GOOD 🌮", frameLayout: "B", previewUrl: "https://videos.pexels.com/video-files/4793504/4793504-sd_640_360_25fps.mp4", box2Url: "https://videos.pexels.com/video-files/3045163/3045163-sd_640_360_25fps.mp4", revealBox: null, catchLimit: null, catchCount: 0, timestamp: Date.now() - 600000 },
  { id: "sf_3", from: "rooftop.social", tailType: "GEO", message: "ROOFTOP TONIGHT 🎉 LOCATION LOCKED CATCH FOR ADDRESS", frameLayout: "B", previewUrl: "https://videos.pexels.com/video-files/3571264/3571264-sd_640_360_30fps.mp4", box2Url: "https://videos.pexels.com/video-files/2795405/2795405-sd_640_360_30fps.mp4", revealBox: 1, catchLimit: 50, catchCount: 31, timestamp: Date.now() - 3600000 },
  { id: "sf_4", from: "dre.williams", tailType: "NOW", message: "3 ANGLES. ONE REVEAL. GUESS WHAT THIS IS 👁", frameLayout: "D", previewUrl: "https://videos.pexels.com/video-files/3926589/3926589-sd_640_360_30fps.mp4", box2Url: "https://videos.pexels.com/video-files/4325579/4325579-sd_640_360_30fps.mp4", box3Url: "https://videos.pexels.com/video-files/3298529/3298529-sd_640_360_25fps.mp4", revealBox: 2, catchLimit: null, catchCount: 0, timestamp: Date.now() - 900000 },
  { id: "sf_5", from: "chef.leon.atl", tailType: "LOOK", message: "BEFORE & AFTER. SAME INGREDIENTS DIFFERENT ENERGY 🔥", frameLayout: "E", previewUrl: "https://videos.pexels.com/video-files/3163534/3163534-sd_640_360_30fps.mp4", box2Url: "https://videos.pexels.com/video-files/3209828/3209828-sd_640_360_25fps.mp4", box3Url: "https://videos.pexels.com/video-files/4793504/4793504-sd_640_360_25fps.mp4", revealBox: null, catchLimit: null, catchCount: 0, timestamp: Date.now() - 7200000 },
  { id: "sf_6", from: "zara.archive__", tailType: "DROP", message: "NEW DROP 🖤 FIRST 10 GET THE CODE", frameLayout: "C", previewUrl: "https://videos.pexels.com/video-files/3045163/3045163-sd_640_360_25fps.mp4", box2Url: null, revealBox: 0, catchLimit: 10, catchCount: 3, timestamp: Date.now() - 1800000 },
];

export default function SplitFeedScreen({ 
  tails = [], 
  onCatch, 
  onShare, 
  colors: C, 
  categoryFilterOptions = [], 
  selectedCategory = "foryou", 
  onCategoryChange, 
  me, 
  isPro = false, 
  streak = 0, 
  earnings = 0, 
  onOpenPrivate, 
  inboxCount = 0 
}) {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [theme, setTheme] = useState("dark"); // "dark" or "light"
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Theme colors
  const T = theme === "light" ? LIGHT : DARK;
  
  const HEADER_TOTAL = categoryFilterOptions.length > 0 ? 100 : 58;
  
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_TOTAL],
    outputRange: [0, -HEADER_TOTAL],
    extrapolate: "clamp",
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_TOTAL * 0.6, HEADER_TOTAL],
    outputRange: [1, 0.35, 0],
    extrapolate: "clamp",
  });
  
  const feedTails = [...DEMO_SPLIT_TAILS, ...tails.filter(t => t.frameLayout)];

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) setVisibleIndex(viewableItems[0].index);
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const renderItem = useCallback(({ item, index }) => (
    <SplitFrameCard 
      tail={item} 
      onCatch={onCatch} 
      onShare={onShare} 
      isVisible={index === visibleIndex}
      theme={theme}
    />
  ), [visibleIndex, onCatch, onShare, theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  if (feedTails.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: T.bg }]}>
        <Text style={styles.emptyIcon}>🎬</Text>
        <Text style={[styles.emptyTitle, { color: T.text }]}>No frame tails yet</Text>
        <Text style={[styles.emptySub, { color: T.muted }]}>Send a tail with a split frame layout</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
      {/* ═══ HEADER ═══ */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          transform: [{ translateY: headerTranslateY }],
          opacity: headerOpacity,
          backgroundColor: T.bg,
        }}
      >
        {/* Top Bar */}
        <View style={[styles.headerBar, { borderBottomColor: T.border }]}>
          <View style={styles.headerLeft}>
            <Text style={{ fontSize: 24 }}>🦊</Text>
            <Text style={[styles.logoText, { color: T.text }]}>Tail Me</Text>
            {isPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          
          <View style={styles.headerRight}>
            {/* Theme Toggle */}
            <TouchableOpacity 
              onPress={toggleTheme}
              style={[styles.iconBtn, { 
                backgroundColor: T.panel, 
                borderColor: T.border 
              }]}
            >
              <Text style={{ fontSize: 15 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
            </TouchableOpacity>
            
            {/* Inbox */}
            <TouchableOpacity 
              onPress={onOpenPrivate} 
              style={[styles.iconBtn, { 
                backgroundColor: inboxCount > 0 ? "rgba(124,58,237,0.2)" : T.panel,
                borderColor: inboxCount > 0 ? "#7C3AED" : T.border,
              }]}
            >
              <Text style={{ fontSize: 15 }}>{inboxCount > 0 ? "📬" : "👤"}</Text>
              {inboxCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {inboxCount > 9 ? "9+" : inboxCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Chips */}
        {categoryFilterOptions.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={[styles.chipsScroll, { borderBottomColor: T.border }]}
            contentContainerStyle={styles.chipsContent}
          >
            {categoryFilterOptions.map(opt => {
              const isSelected = selectedCategory === opt.id;
              return (
                <TouchableOpacity 
                  key={opt.id} 
                  onPress={() => onCategoryChange?.(opt.id)} 
                  style={[
                    styles.chip,
                    { 
                      backgroundColor: isSelected ? "rgba(124,58,237,0.2)" : T.panel,
                      borderColor: isSelected ? "#7C3AED" : T.border,
                    }
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>{opt.icon}</Text>
                  {opt.labelFull && (
                    <Text style={[
                      styles.chipLabel, 
                      { color: isSelected ? T.text : T.muted }
                    ]}>
                      {opt.labelFull}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>

      {/* ═══ FEED ═══ */}
      <Animated.FlatList
        data={feedTails}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        pagingEnabled
        snapToInterval={SH}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={{ paddingTop: HEADER_TOTAL }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  
  // Header
  headerBar: {
    paddingHorizontal: S.md,
    paddingVertical: S.sm + 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
  },
  logoText: {
    fontWeight: "900",
    fontSize: FONT.h2.size,
    letterSpacing: -0.5,
  },
  proBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#F59E0B",
  },
  proBadgeText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 9,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "900",
  },
  
  // Chips
  chipsScroll: {
    borderBottomWidth: 1,
    maxHeight: 46,
  },
  chipsContent: {
    paddingHorizontal: S.sm + 4,
    paddingVertical: S.sm - 1,
    gap: S.sm - 2,
    alignItems: "center",
  },
  chip: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: S.sm + 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  chipLabel: {
    fontWeight: "800",
    fontSize: FONT.caption.size - 1,
  },
  
  // Empty
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: S.sm,
  },
  emptyIcon: { 
    fontSize: 48 
  },
  emptyTitle: { 
    fontSize: FONT.h3.size,
    fontWeight: "900",
  },
  emptySub: { 
    fontSize: FONT.body.size,
  },
});
'''

with open("SplitFeedScreen.js", "w") as f:
    f.write(SPLIT_FEED_UPGRADE)
print("✅ Upgraded SplitFeedScreen.js with theme toggle")

print()
print("=" * 60)
print("📋 CHANGES MADE")
print("=" * 60)
print()
print("✅ Created feedTokens.js — Design system for feed")
print("✅ Upgraded SplitFeedScreen.js:")
print("   • Added theme toggle (☀️/🌙)")
print("   • Light + Dark theme support")
print("   • Sharp edges (no rounded corners)")
print("   • Design tokens integration")
print("   • Better spacing")
print()
print("🎯 NEXT STEP:")
print("   Now I need to update SplitFrameCard.js to accept theme prop")
print()
