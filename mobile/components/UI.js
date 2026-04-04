// ============================================================
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
}\n