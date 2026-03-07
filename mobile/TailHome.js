// ============================================
// TailHome.js — Grid Redesign v7
// ✅ 3-column tap grid
// ✅ Card expands in-place to reveal
// ✅ Swipe down to dismiss back to grid
// ✅ Long press = creator highlight + spotlight
// ✅ Shimmer placeholders
// ✅ Energy bar per card
// ✅ NOW pulse animation
// ✅ Auto-scroll live feed
// ============================================
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  ScrollView,
  Animated,
  Dimensions,
  RefreshControl,
  PanResponder,
  StyleSheet,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import VideoPreviewCard from "./VideoPreviewCard";

const { width: SW, height: SH } = Dimensions.get("window");
const CARD_GAP = 6;
const COLS = 3;
const CARD_SIZE = (SW - 16 - CARD_GAP * (COLS + 1)) / COLS;

// ── Helpers ─────────────────────────────────────────────
const timeAgo = (ts) => {
  if (!ts) return "now";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

const timeLeft = (expiresAt) => {
  if (!expiresAt) return null;
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const TYPE_CONFIG = {
  NOW:   { icon: "⚡", color: "#F59E0B", glow: "rgba(245,158,11,0.25)",   gradient: ["#2a1a00","#1a1000"] },
  DROP:  { icon: "💧", color: "#EF4444", glow: "rgba(239,68,68,0.25)",    gradient: ["#2a0a0a","#1a0505"] },
  GEO:   { icon: "📍", color: "#0EA5E9", glow: "rgba(14,165,233,0.25)",   gradient: ["#001a2e","#000f1a"] },
  CHAIN: { icon: "🔗", color: "#22C55E", glow: "rgba(34,197,94,0.25)",    gradient: ["#001a0a","#000f05"] },
  LOOK:  { icon: "👀", color: "#7C3AED", glow: "rgba(124,58,237,0.25)",   gradient: ["#0d0520","#070312"] },
};
const getType = (t) => TYPE_CONFIG[t] || TYPE_CONFIG.LOOK;

// ── Shimmer Placeholder ──────────────────────────────────
const ShimmerCard = ({ colors: C }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return (
    <View style={[styles.card, { backgroundColor: C.panel2, borderColor: C.border, width: CARD_SIZE, height: CARD_SIZE }]}>
      <Animated.View style={{ opacity, flex: 1, padding: 6, justifyContent: "space-between" }}>
        <View style={{ width: "45%", height: 12, borderRadius: 4, backgroundColor: C.border }} />
        <View style={{ gap: 4 }}>
          <View style={{ width: "65%", height: 7, borderRadius: 3, backgroundColor: C.border }} />
          <View style={{ width: "100%", height: 2, borderRadius: 1, backgroundColor: C.border }} />
        </View>
      </Animated.View>
    </View>
  );
};

// ── Grid Tail Card ───────────────────────────────────────
const TailGridCard = ({ tail, onTap, onLongPress, isHighlighted, isDimmed, colors: C }) => {
  const cfg = getType(tail?.tailType);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const energy = tail?.energy?.current ?? 100;

  useEffect(() => {
    if (tail?.tailType === "NOW") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [tail?.tailType]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 20 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  const spotsLeft = tail?.catchLimit != null
    ? Math.max(0, tail.catchLimit - (tail.catchCount || 0))
    : null;

  return (
    <Animated.View style={{
      transform: [
        { scale: Animated.multiply(scaleAnim, tail?.tailType === "NOW" ? pulseAnim : new Animated.Value(1)) }
      ],
      opacity: isDimmed ? 0.35 : 1,
      width: CARD_SIZE,
      height: CARD_SIZE,
    }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onTap(tail)}
        onLongPress={() => onLongPress(tail)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={350}
        style={[
          styles.card,
          {
            width: CARD_SIZE,
            height: CARD_SIZE,
            backgroundColor: cfg.gradient[0],
            borderColor: isHighlighted ? cfg.color : `${cfg.color}40`,
            borderWidth: isHighlighted ? 2 : 1.5,
          },
          isHighlighted && {
            shadowColor: cfg.color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 8,
            elevation: 8,
          }
        ]}
      >
        {/* Photo or glow bg */}
        {tail?.mediaUrl ? (
          <>
            <Image
              source={{ uri: tail.mediaUrl }}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: 12 }}
              resizeMode="cover"
            />
            <View style={{
              position: "absolute", inset: 0, borderRadius: 12,
              backgroundColor: "rgba(0,0,0,0.45)",
            }} />
          </>
        ) : (
          <View style={{
            position: "absolute", top: -20, left: -20,
            width: CARD_SIZE * 0.8, height: CARD_SIZE * 0.8,
            borderRadius: CARD_SIZE,
            backgroundColor: cfg.glow,
          }} />
        )}

        {/* Top row — icon only, no text */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "flex-start", zIndex: 1 }}>
          <Text style={{ fontSize: 16, lineHeight: 20, opacity: 0.85 }}>{cfg.icon}</Text>
        </View>

        <View style={{ flex: 1, zIndex: 1 }}></View>
