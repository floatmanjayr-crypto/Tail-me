#!/usr/bin/env python3
"""
Tail Me — Complete Design Rebuild
"""

import os

MOBILE_DIR = os.path.dirname(os.path.abspath(__file__))

# ════════════════════════════════════════════════════════════
# FILE 1: design/tokens.js
# ════════════════════════════════════════════════════════════
TOKENS = '''// ============================================================
// tokens.js — Tail Me Design System
// Single source of truth for ALL visual decisions
// ============================================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const FONT_SIZE = {
  hero: 42,
  h1: 28,
  h2: 22,
  h3: 18,
  body: 15,
  caption: 13,
  tiny: 11,
  micro: 9,
};

export const FONT_WEIGHT = {
  black: "900",
  bold: "800",
  semi: "700",
  medium: "600",
  regular: "400",
};

export const LINE_HEIGHT = {
  hero: 48,
  h1: 34,
  h2: 28,
  h3: 24,
  body: 22,
  caption: 18,
  tiny: 14,
};

export const SHADOWS = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  }),
};

export const DARK = {
  bg:       "#050810",
  surface:  "#0B1021",
  panel:    "#111827",
  panel2:   "#1A2236",
  elevated: "#1F2B45",
  border:   "#1E293B",
  border2:  "#2D3A52",

  text:     "#F1F5F9",
  muted:    "#94A3B8",
  dim:      "#64748B",
  faint:    "#475569",

  brand:    "#8B5CF6",
  brandDim: "#6D28D9",
  accent:   "#EC4899",

  green:    "#10B981",
  greenDim: "#059669",
  greenInk: "#ECFDF5",

  red:      "#EF4444",
  redDim:   "#DC2626",

  amber:    "#F59E0B",
  blue:     "#3B82F6",
  cyan:     "#06B6D4",

  gradient: {
    brand:  ["#8B5CF6", "#EC4899"],
    sunset: ["#F97316", "#EF4444"],
    ocean:  ["#06B6D4", "#3B82F6"],
    nature: ["#10B981", "#059669"],
    gold:   ["#F59E0B", "#D97706"],
  },
};

export const LIGHT = {
  bg:       "#FFFFFF",
  surface:  "#F8FAFC",
  panel:    "#F1F5F9",
  panel2:   "#E2E8F0",
  elevated: "#FFFFFF",
  border:   "#E2E8F0",
  border2:  "#CBD5E1",

  text:     "#0F172A",
  muted:    "#475569",
  dim:      "#94A3B8",
  faint:    "#CBD5E1",

  brand:    "#7C3AED",
  brandDim: "#6D28D9",
  accent:   "#EC4899",

  green:    "#10B981",
  greenDim: "#059669",
  greenInk: "#065F46",

  red:      "#EF4444",
  redDim:   "#DC2626",

  amber:    "#F59E0B",
  blue:     "#3B82F6",
  cyan:     "#06B6D4",

  gradient: {
    brand:  ["#7C3AED", "#EC4899"],
    sunset: ["#F97316", "#EF4444"],
    ocean:  ["#06B6D4", "#3B82F6"],
    nature: ["#10B981", "#059669"],
    gold:   ["#F59E0B", "#D97706"],
  },
};

export const TAIL_TYPE_THEME = {
  LOOK:  { color: "#8B5CF6", icon: "👀", bg: "#8B5CF620" },
  NOW:   { color: "#EF4444", icon: "⚡", bg: "#EF444420" },
  DROP:  { color: "#F59E0B", icon: "💧", bg: "#F59E0B20" },
  CHAIN: { color: "#10B981", icon: "🔗", bg: "#10B98120" },
  GEO:   { color: "#3B82F6", icon: "📍", bg: "#3B82F620" },
};

export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { tension: 68, friction: 10 },
  springBouncy: { tension: 40, friction: 5 },
  springSmooth: { tension: 80, friction: 14 },
};
'''

# ════════════════════════════════════════════════════════════
# FILE 2: components/UI.js — Reusable component library
# ════════════════════════════════════════════════════════════
UI_COMPONENTS = '''// ============================================================
// UI.js — Tail Me Component Library
// Every visual building block in one place
// ============================================================

import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  Text as RNText,
  TouchableOpacity,
  View,
  StyleSheet,
  Image,
} from "react-native";
import {
  SPACING as S,
  RADIUS as R,
  FONT_SIZE as FS,
  FONT_WEIGHT as FW,
  LINE_HEIGHT as LH,
  SHADOWS,
  ANIMATION as A,
} from "../design/tokens";

// ── TEXT ──────────────────────────────────────────────────
export function Text({
  variant = "body",
  color,
  align,
  style,
  children,
  numberOfLines,
  ...props
}) {
  const variants = {
    hero:    { fontSize: FS.hero,    fontWeight: FW.black, lineHeight: LH.hero },
    h1:      { fontSize: FS.h1,      fontWeight: FW.black, lineHeight: LH.h1 },
    h2:      { fontSize: FS.h2,      fontWeight: FW.bold,  lineHeight: LH.h2 },
    h3:      { fontSize: FS.h3,      fontWeight: FW.bold,  lineHeight: LH.h3 },
    body:    { fontSize: FS.body,    fontWeight: FW.medium, lineHeight: LH.body },
    caption: { fontSize: FS.caption, fontWeight: FW.semi,  lineHeight: LH.caption },
    tiny:    { fontSize: FS.tiny,    fontWeight: FW.semi,  lineHeight: LH.tiny },
    micro:   { fontSize: FS.micro,   fontWeight: FW.bold,  lineHeight: LH.tiny },
    label:   { fontSize: FS.tiny,    fontWeight: FW.black, letterSpacing: 1.2, textTransform: "uppercase" },
  };

  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[variants[variant], color && { color }, align && { textAlign: align }, style]}
      {...props}
    >
      {children}
    </RNText>
  );
}

// ── CARD ─────────────────────────────────────────────────
export function Card({
  children,
  variant = "default",
  padding = S.lg,
  radius = R.lg,
  shadow = "md",
  style,
  onPress,
  colors: C,
  animated = false,
}) {
  const variants = {
    default:  { backgroundColor: C?.panel || "#111827", borderWidth: 1, borderColor: C?.border || "#1E293B" },
    elevated: { backgroundColor: C?.elevated || "#1F2B45", borderWidth: 0 },
    glass:    { backgroundColor: (C?.panel || "#111827") + "CC", borderWidth: 1, borderColor: (C?.border || "#1E293B") + "80" },
    outline:  { backgroundColor: "transparent", borderWidth: 1.5, borderColor: C?.border2 || "#2D3A52" },
    brand:    { backgroundColor: (C?.brand || "#8B5CF6") + "15", borderWidth: 1, borderColor: (C?.brand || "#8B5CF6") + "40" },
  };

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        ...A.spring,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...A.spring,
        useNativeDriver: true,
      }).start();
    }
  };

  const cardStyle = [
    variants[variant],
    { borderRadius: radius, padding, overflow: "hidden" },
    SHADOWS[shadow],
    style,
  ];

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={cardStyle}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

// ── BUTTON ───────────────────────────────────────────────
export function Button({
  title,
  icon,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onPress,
  colors: C,
  style,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      ...A.spring,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...A.spring,
      useNativeDriver: true,
    }).start();
  };

  const sizes = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: FS.caption, radius: R.sm },
    md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: FS.body, radius: R.md },
    lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: FS.h3, radius: R.lg },
  };

  const variants = {
    primary:   { bg: C?.brand || "#8B5CF6", text: "#FFFFFF", border: "transparent" },
    secondary: { bg: (C?.brand || "#8B5CF6") + "18", text: C?.brand || "#8B5CF6", border: (C?.brand || "#8B5CF6") + "40" },
    danger:    { bg: C?.red || "#EF4444", text: "#FFFFFF", border: "transparent" },
    success:   { bg: C?.green || "#10B981", text: "#FFFFFF", border: "transparent" },
    ghost:     { bg: "transparent", text: C?.muted || "#94A3B8", border: C?.border || "#1E293B" },
    outline:   { bg: "transparent", text: C?.text || "#F1F5F9", border: C?.border2 || "#2D3A52" },
  };

  const s = sizes[size];
  const v = variants[variant] || variants.primary;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={disabled ? null : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          {
            backgroundColor: disabled ? (C?.border || "#1E293B") : v.bg,
            paddingVertical: s.paddingVertical,
            paddingHorizontal: s.paddingHorizontal,
            borderRadius: s.radius,
            borderWidth: v.border !== "transparent" ? 1.5 : 0,
            borderColor: v.border,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          },
          variant === "primary" && !disabled && SHADOWS.md,
        ]}
      >
        {icon && <RNText style={{ fontSize: s.fontSize }}>{icon}</RNText>}
        <RNText
          style={{
            color: disabled ? (C?.dim || "#64748B") : v.text,
            fontSize: s.fontSize,
            fontWeight: FW.black,
          }}
        >
          {loading ? "..." : title}
        </RNText>
      </Pressable>
    </Animated.View>
  );
}

// ── BADGE ────────────────────────────────────────────────
export function Badge({
  label,
  icon,
  color,
  variant = "filled",
  size = "sm",
  style,
}) {
  const sizes = {
    xs: { py: 2, px: 6, fontSize: 9 },
    sm: { py: 4, px: 10, fontSize: 11 },
    md: { py: 6, px: 14, fontSize: 13 },
  };

  const s = sizes[size];
  const bgColor = variant === "filled" ? color : color + "20";
  const textColor = variant === "filled" ? "#FFF" : color;

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          borderRadius: R.full,
          backgroundColor: bgColor,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: color + "60",
        },
        style,
      ]}
    >
      {icon && <RNText style={{ fontSize: s.fontSize }}>{icon}</RNText>}
      <RNText
        style={{
          color: textColor,
          fontSize: s.fontSize,
          fontWeight: FW.black,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </RNText>
    </View>
  );
}

// ── AVATAR ───────────────────────────────────────────────
export function Avatar({ uri, name, size = 40, borderColor, style }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: borderColor ? 2 : 0,
            borderColor,
          },
          style,
        ]}
      />
    );
  }

  // Fallback with initials
  const initial = (name || "?")[0].toUpperCase();
  const colors = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#EF4444"];
  const bg = colors[initial.charCodeAt(0) % colors.length];

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg + "30",
          borderWidth: 2,
          borderColor: bg,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <RNText style={{ color: bg, fontSize: size * 0.4, fontWeight: FW.black }}>
        {initial}
      </RNText>
    </View>
  );
}

// ── DIVIDER ──────────────────────────────────────────────
export function Divider({ color, spacing = S.md, style }) {
  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: color || "#1E293B",
          marginVertical: spacing,
        },
        style,
      ]}
    />
  );
}

// ── STACK (Vertical spacing) ─────────────────────────────
export function Stack({ spacing = S.md, style, children }) {
  return <View style={[{ gap: spacing }, style]}>{children}</View>;
}

// ── ROW (Horizontal spacing) ─────────────────────────────
export function Row({
  spacing = S.md,
  align = "center",
  justify = "flex-start",
  wrap = false,
  style,
  children,
}) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          gap: spacing,
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? "wrap" : "nowrap",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ── PILL / CHIP ──────────────────────────────────────────
export function Pill({
  label,
  icon,
  selected = false,
  onPress,
  color,
  colors: C,
  style,
}) {
  const activeColor = color || C?.brand || "#8B5CF6";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: R.full,
          borderWidth: 1.5,
          borderColor: selected ? activeColor : C?.border || "#1E293B",
          backgroundColor: selected ? activeColor + "18" : "transparent",
        },
        style,
      ]}
    >
      {icon && <RNText style={{ fontSize: 14 }}>{icon}</RNText>}
      <RNText
        style={{
          color: selected ? activeColor : C?.muted || "#94A3B8",
          fontSize: FS.caption,
          fontWeight: FW.bold,
        }}
      >
        {label}
      </RNText>
    </TouchableOpacity>
  );
}

// ── STAT BOX ─────────────────────────────────────────────
export function StatBox({ value, label, icon, color, colors: C, style }) {
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: C?.panel || "#111827",
          borderRadius: R.lg,
          padding: S.lg,
          alignItems: "center",
          gap: 4,
          borderWidth: 1,
          borderColor: C?.border || "#1E293B",
        },
        SHADOWS.sm,
        style,
      ]}
    >
      {icon && <RNText style={{ fontSize: 16, marginBottom: 2 }}>{icon}</RNText>}
      <RNText
        style={{
          color: color || C?.text || "#F1F5F9",
          fontSize: FS.h2,
          fontWeight: FW.black,
        }}
      >
        {value}
      </RNText>
      <RNText
        style={{
          color: C?.dim || "#64748B",
          fontSize: FS.micro,
          fontWeight: FW.black,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </RNText>
    </View>
  );
}

// ── SECTION HEADER ───────────────────────────────────────
export function SectionHeader({ title, subtitle, action, onAction, colors: C, style }) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: S.md,
        },
        style,
      ]}
    >
      <View>
        <RNText
          style={{
            color: C?.text || "#F1F5F9",
            fontSize: FS.h3,
            fontWeight: FW.black,
          }}
        >
          {title}
        </RNText>
        {subtitle && (
          <RNText
            style={{
              color: C?.dim || "#64748B",
              fontSize: FS.caption,
              fontWeight: FW.medium,
              marginTop: 2,
            }}
          >
            {subtitle}
          </RNText>
        )}
      </View>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <RNText
            style={{
              color: C?.brand || "#8B5CF6",
              fontSize: FS.caption,
              fontWeight: FW.black,
            }}
          >
            {action}
          </RNText>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── SKELETON LOADER ──────────────────────────────────────
export function Skeleton({ width, height = 16, radius = R.sm, colors: C, style }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: C?.border || "#1E293B",
          opacity: shimmer.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.7],
          }),
        },
        style,
      ]}
    />
  );
}

// ── EMPTY STATE ──────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action, onAction, colors: C }) {
  return (
    <View style={{ alignItems: "center", padding: S.xxl, gap: S.md }}>
      <RNText style={{ fontSize: 48 }}>{icon}</RNText>
      <RNText
        style={{
          color: C?.text || "#F1F5F9",
          fontSize: FS.h3,
          fontWeight: FW.black,
          textAlign: "center",
        }}
      >
        {title}
      </RNText>
      {subtitle && (
        <RNText
          style={{
            color: C?.dim || "#64748B",
            fontSize: FS.body,
            textAlign: "center",
            lineHeight: LH.body,
          }}
        >
          {subtitle}
        </RNText>
      )}
      {action && (
        <Button
          title={action}
          variant="secondary"
          onPress={onAction}
          colors={C}
          style={{ marginTop: S.sm }}
        />
      )}
    </View>
  );
}

// ── ANIMATED ENTRY ───────────────────────────────────────
export function FadeIn({ delay = 0, duration = 400, children, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
'''

# ════════════════════════════════════════════════════════════
# FILE 3: Redesigned TailCard.js
# ════════════════════════════════════════════════════════════
TAIL_CARD = '''// ============================================================
// TailCard.v2.js — Redesigned Tail Card
// ✅ Glass morphism design
// ✅ Proper typography hierarchy
// ✅ Animated interactions
// ✅ Smart layout system
// ============================================================

import React, { useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  View,
  Text as RNText,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Text, Badge, Row, Avatar, Card } from "./components/UI";
import { SPACING as S, RADIUS as R, SHADOWS, FONT_SIZE as FS, FONT_WEIGHT as FW, ANIMATION as A } from "./design/tokens";

const { width: SW } = Dimensions.get("window");

const TAIL_TYPES = {
  LOOK:  { color: "#8B5CF6", icon: "👀", label: "LOOK"  },
  NOW:   { color: "#EF4444", icon: "⚡", label: "NOW"   },
  DROP:  { color: "#F59E0B", icon: "💧", label: "DROP"  },
  CHAIN: { color: "#10B981", icon: "🔗", label: "CHAIN" },
  GEO:   { color: "#3B82F6", icon: "📍", label: "GEO"   },
};

export default function TailCardV2({
  tail,
  onPress,
  onCatch,
  onProfile,
  colors: C,
  index = 0,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const t = tail || {};
  const type = TAIL_TYPES[(t.tailType || "LOOK").toUpperCase()] || TAIL_TYPES.LOOK;
  const heroImage = t.mediaUrl || t.meta?.image;
  const hasExpiry = !!t.expiresAt;
  const catchCount = t.catchCount || 0;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97, ...A.spring, useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1, ...A.spring, useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        marginHorizontal: S.md,
        marginBottom: S.md,
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: C?.panel || "#111827",
            borderColor: C?.border || "#1E293B",
          },
          SHADOWS.md,
        ]}
      >
        {/* ── HERO IMAGE ── */}
        {heroImage && (
          <View style={styles.heroWrap}>
            <Image
              source={{ uri: heroImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {/* Gradient overlay */}
            <View style={styles.heroGradient} />

            {/* Type badge */}
            <Badge
              icon={type.icon}
              label={type.label}
              color={type.color}
              size="sm"
              style={styles.typeBadge}
            />

            {/* Catch count */}
            <View style={styles.catchBadge}>
              <RNText style={styles.catchBadgeText}>
                🎯 {catchCount}
              </RNText>
            </View>
          </View>
        )}

        {/* ── NO IMAGE HEADER ── */}
        {!heroImage && (
          <View style={[styles.noImageHeader, { backgroundColor: type.color + "12" }]}>
            <Row spacing={S.sm} justify="space-between" style={{ width: "100%" }}>
              <Badge icon={type.icon} label={type.label} color={type.color} size="sm" />
              <View style={styles.catchBadgeSmall}>
                <RNText style={styles.catchBadgeText}>🎯 {catchCount}</RNText>
              </View>
            </Row>
            <RNText style={{ fontSize: 36, marginTop: S.sm }}>{type.icon}</RNText>
          </View>
        )}

        {/* ── CONTENT ── */}
        <View style={styles.content}>
          {/* Sender row */}
          <Pressable onPress={() => onProfile?.(t.from)} style={styles.senderRow}>
            <Avatar name={t.from} size={28} />
            <RNText style={[styles.senderName, { color: C?.muted || "#94A3B8" }]}>
              @{t.from || "user"}
            </RNText>
            {t.isVerified && <RNText style={{ fontSize: 12 }}>✓</RNText>}
          </Pressable>

          {/* Title */}
          <RNText
            style={[styles.title, { color: C?.text || "#F1F5F9" }]}
            numberOfLines={2}
          >
            {t.meta?.title || t.title || "Mystery Drop"}
          </RNText>

          {/* Price */}
          {t.meta?.price && (
            <Row spacing={S.sm} align="baseline">
              <RNText style={styles.price}>{t.meta.price}</RNText>
              {t.meta?.siteName && (
                <RNText style={[styles.siteName, { color: C?.dim || "#64748B" }]}>
                  {t.meta.siteName}
                </RNText>
              )}
            </Row>
          )}

          {/* Message preview */}
          {t.message && (
            <View style={[styles.messagePreview, { borderColor: type.color + "30" }]}>
              <RNText
                style={[styles.messageText, { color: C?.text || "#F1F5F9" }]}
                numberOfLines={2}
              >
                \\"{t.message}\\"
              </RNText>
            </View>
          )}

          {/* Footer */}
          <Row spacing={S.sm} justify="space-between" style={styles.footer}>
            {/* Reactions */}
            <Row spacing={S.xs}>
              {Object.entries(t.reactions || {})
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([emoji, count]) => (
                  <View key={emoji} style={styles.reactionPill}>
                    <RNText style={{ fontSize: 12 }}>{emoji}</RNText>
                    <RNText style={[styles.reactionCount, { color: C?.dim || "#64748B" }]}>
                      {count}
                    </RNText>
                  </View>
                ))}
            </Row>

            {/* Expiry */}
            {hasExpiry && (
              <Badge label="⏱" color={C?.amber || "#F59E0B"} variant="subtle" size="xs" />
            )}
          </Row>
        </View>

        {/* ── STOREFRONT INDICATOR ── */}
        {t.storefront && (
          <View style={[styles.storefrontBar, { backgroundColor: type.color + "10" }]}>
            <RNText style={{ fontSize: 10 }}>
              {t.storefront.emoji || "🎁"}
            </RNText>
            <RNText style={[styles.storefrontText, { color: type.color }]}>
              {t.storefront.brandName || "Custom Storefront"}
            </RNText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: R.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  heroWrap: {
    position: "relative",
    height: 180,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  typeBadge: {
    position: "absolute",
    top: S.sm,
    left: S.sm,
  },
  catchBadge: {
    position: "absolute",
    top: S.sm,
    right: S.sm,
    backgroundColor: "rgba(5,8,16,0.8)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: R.full,
  },
  catchBadgeSmall: {
    backgroundColor: "rgba(5,8,16,0.6)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: R.full,
  },
  catchBadgeText: {
    color: "#F1F5F9",
    fontSize: FS.tiny,
    fontWeight: FW.black,
  },
  noImageHeader: {
    padding: S.lg,
    alignItems: "center",
    paddingBottom: S.md,
  },
  content: {
    padding: S.lg,
    gap: S.sm,
  },
  senderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
  },
  senderName: {
    fontSize: FS.caption,
    fontWeight: FW.black,
  },
  title: {
    fontSize: FS.h3,
    fontWeight: FW.black,
    lineHeight: 24,
  },
  price: {
    color: "#10B981",
    fontSize: FS.h2,
    fontWeight: FW.black,
  },
  siteName: {
    fontSize: FS.caption,
  },
  messagePreview: {
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    borderRadius: R.md,
    borderLeftWidth: 3,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  messageText: {
    fontSize: FS.caption,
    fontStyle: "italic",
    lineHeight: 18,
  },
  footer: {
    marginTop: S.xs,
    paddingTop: S.sm,
  },
  reactionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: R.full,
  },
  reactionCount: {
    fontSize: 10,
    fontWeight: FW.bold,
  },
  storefrontBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: S.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  storefrontText: {
    fontSize: FS.tiny,
    fontWeight: FW.black,
    letterSpacing: 0.5,
  },
});
'''

# ════════════════════════════════════════════════════════════
# WRITE ALL FILES
# ════════════════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("🎨 Tail Me — Design System Builder")
    print("=" * 60)

    # Create directories
    design_dir = os.path.join(MOBILE_DIR, "design")
    comp_dir = os.path.join(MOBILE_DIR, "components")

    os.makedirs(design_dir, exist_ok=True)
    os.makedirs(comp_dir, exist_ok=True)

    files = {
        os.path.join(design_dir, "tokens.js"): TOKENS,
        os.path.join(comp_dir, "UI.js"): UI_COMPONENTS,
        os.path.join(MOBILE_DIR, "TailCard.v2.js"): TAIL_CARD,
    }

    for filepath, content in files.items():
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content.strip() + "\\n")
        rel = os.path.relpath(filepath, MOBILE_DIR)
        lines = content.strip().count("\\n") + 1
        print(f"  ✅ {rel} ({lines} lines)")

    print()
    print("=" * 60)
    print("📋 FILES CREATED")
    print("=" * 60)
    print()
    print("  📁 design/")
    print("     └── tokens.js        — Colors, spacing, typography")
    print("  📁 components/")
    print("     └── UI.js            — Card, Button, Text, Badge, etc.")
    print("  📄 TailCard.v2.js       — Redesigned feed card")
    print()
    print("🎯 HOW TO USE:")
    print()
    print("  // In any screen file:")
    print("  import { Card, Button, Text, Badge, Row, Stack } from './components/UI';")
    print("  import { DARK, SPACING, RADIUS } from './design/tokens';")
    print()
    print("  // Example:")
    print("  <Card colors={C} variant='glass' shadow='lg'>")
    print("    <Text variant='h2' color={C.text}>Hello</Text>")
    print("    <Button title='Catch' variant='primary' colors={C} />")
    print("  </Card>")
    print()
    print("  // Use redesigned TailCard:")
    print("  import TailCardV2 from './TailCard.v2';")
    print("  <TailCardV2 tail={tail} onPress={handleOpen} colors={C} />")
    print()
    print("✅ Design system installed!")

if __name__ == "__main__":
    main()
