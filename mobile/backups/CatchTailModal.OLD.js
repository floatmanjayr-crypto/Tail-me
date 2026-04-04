// ============================================================
// CatchTailModal.js — Tail Me Production v2
// ✅ Supports tails WITH and WITHOUT storefront
// ✅ Auto-increment catch count (no "Caught!" alert)
// ✅ Reward system integration
// ✅ Storefront door animations
// ✅ Smooth transitions
// ============================================================

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ══════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════
function timeLeft(expiresAt) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h >= 24) return `${Math.floor(h / 24)}d left`;
  if (h > 0) return `${h}h ${m}m left`;
  if (m > 0) return `${m}m ${s}s left`;
  return `${s}s left`;
}

function isUrgent(expiresAt) {
  if (!expiresAt) return false;
  return Date.now() > new Date(expiresAt).getTime() - 300000;
}

// ══════════════════════════════════════════════════════════
// TYPE CONFIG
// ══════════════════════════════════════════════════════════
const TYPE_CONFIG = {
  LOOK:  { icon: "👀", color: "#7C3AED", label: "LOOK",  btn: "🎯 Catch this Tail" },
  NOW:   { icon: "⚡", color: "#EF4444", label: "NOW",   btn: "⚡ Catch before it's gone" },
  DROP:  { icon: "💧", color: "#F59E0B", label: "DROP",  btn: "💧 Catch this Drop" },
  CHAIN: { icon: "🔗", color: "#22C55E", label: "CHAIN", btn: "🔗 Start the Chain Hunt" },
  GEO:   { icon: "📍", color: "#3B82F6", label: "GEO",   btn: "📍 Catch Nearby" },
};

// ══════════════════════════════════════════════════════════
// STOREFRONT THEMES
// ══════════════════════════════════════════════════════════
const STOREFRONT_THEMES = {
  luxury: {
    gradient: ["#1a1a2e", "#16213e", "#0f3460"],
    accent: "#FFD700",
    textColor: "#FFD700",
    buttonBg: "#FFD700",
    buttonText: "#000",
    pattern: "diamonds",
  },
  streetwear: {
    gradient: ["#0d0d0d", "#1a1a1a", "#2d2d2d"],
    accent: "#FF4444",
    textColor: "#FFFFFF",
    buttonBg: "#FF4444",
    buttonText: "#FFF",
    pattern: "grid",
  },
  minimalist: {
    gradient: ["#ffffff", "#f5f5f5", "#eeeeee"],
    accent: "#000000",
    textColor: "#000000",
    buttonBg: "#000000",
    buttonText: "#FFF",
    pattern: "none",
  },
  vibrant: {
    gradient: ["#667eea", "#764ba2", "#f093fb"],
    accent: "#00D4FF",
    textColor: "#FFFFFF",
    buttonBg: "#00D4FF",
    buttonText: "#000",
    pattern: "waves",
  },
  nature: {
    gradient: ["#134e5e", "#71b280", "#a8e063"],
    accent: "#FFECD2",
    textColor: "#FFFFFF",
    buttonBg: "#FFECD2",
    buttonText: "#134e5e",
    pattern: "leaves",
  },
  tech: {
    gradient: ["#0c0c0c", "#1a1a2e", "#16213e"],
    accent: "#00FF88",
    textColor: "#00FF88",
    buttonBg: "#00FF88",
    buttonText: "#000",
    pattern: "circuit",
  },
  sunset: {
    gradient: ["#ff6b6b", "#feca57", "#ff9ff3"],
    accent: "#5F27CD",
    textColor: "#FFFFFF",
    buttonBg: "#5F27CD",
    buttonText: "#FFF",
    pattern: "none",
  },
  ocean: {
    gradient: ["#0077b6", "#00b4d8", "#90e0ef"],
    accent: "#03045E",
    textColor: "#FFFFFF",
    buttonBg: "#FFFFFF",
    buttonText: "#0077b6",
    pattern: "waves",
  },
};

// ══════════════════════════════════════════════════════════
// REWARD TYPES
// ══════════════════════════════════════════════════════════
const REWARD_TYPES = {
  COINS: { icon: "🪙", label: "Tail Coins", color: "#FFD700" },
  XP: { icon: "⚡", label: "XP Earned", color: "#A855F7" },
  STREAK: { icon: "🔥", label: "Streak!", color: "#FF4444" },
  FIRST: { icon: "🥇", label: "First Catch!", color: "#FFD700" },
  RARE: { icon: "💎", label: "Rare Find!", color: "#00D4FF" },
};

const QUICK_REACTIONS = ["🔥", "👀", "😍", "🎯", "💯", "👏"];

// ══════════════════════════════════════════════════════════
// PATTERN OVERLAY
// ══════════════════════════════════════════════════════════
function PatternOverlay({ pattern, color = "#fff" }) {
  if (!pattern || pattern === "none") return null;

  const patterns = {
    diamonds: "◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆\n◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇\n",
    grid: "┼───┼───┼───┼───┼───┼\n│   │   │   │   │   │\n",
    waves: "∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿\n∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿\n",
    circuit: "○─┬─○─┬─○─┬─○─┬─○\n  │   │   │   │\n",
    leaves: "🌿  🍃  🌿  🍃  🌿\n  🍃  🌿  🍃  🌿  \n",
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Text
        style={{
          color,
          opacity: 0.08,
          fontSize: 16,
          lineHeight: 24,
          textAlign: "center",
        }}
      >
        {(patterns[pattern] || "").repeat(20)}
      </Text>
    </View>
  );
}

// ══════════════════════════════════════════════════════════
// FLOATING CATCH BUTTON (Simple)
// ══════════════════════════════════════════════════════════
function FloatingCatchButton({ onPress, theme }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gentle float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 6,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ scale: pulseAnim }, { translateY: floatAnim }],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={{
          backgroundColor: theme.buttonBg,
          paddingVertical: 16,
          paddingHorizontal: 40,
          borderRadius: 30,
          shadowColor: theme.buttonBg,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <Text
          style={{
            color: theme.buttonText,
            fontSize: 18,
            fontWeight: "900",
            letterSpacing: 0.5,
          }}
        >
          🎯 Catch
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════
// REWARD POPUP
// ══════════════════════════════════════════════════════════
function RewardPopup({ visible, reward, onComplete }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && reward) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Pop in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 1.5s
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onComplete?.());
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [visible, reward]);

  if (!visible || !reward) return null;

  const r = REWARD_TYPES[reward.type] || REWARD_TYPES.COINS;

  return (
    <Animated.View
      style={[
        styles.rewardPopup,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={[styles.rewardBadge, { borderColor: r.color }]}>
        <Text style={{ fontSize: 40 }}>{r.icon}</Text>
        <Text style={[styles.rewardLabel, { color: r.color }]}>{r.label}</Text>
        {reward.value && (
          <Text style={[styles.rewardValue, { color: r.color }]}>
            +{reward.value}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════
// STOREFRONT COVER (Full Screen)
// ══════════════════════════════════════════════════════════
function StorefrontCover({
  storefront,
  onCatch,
  isOpening,
  openProgress,
}) {
  const themeName = storefront?.theme || "luxury";
  const theme = STOREFRONT_THEMES[themeName] || STOREFRONT_THEMES.luxury;
  const openingType = storefront?.openingType || "double_door";

  // Animation values for doors
  const leftDoorAnim = useRef(new Animated.Value(0)).current;
  const rightDoorAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOpening) {
      const duration = 500;
      const easing = Easing.bezier(0.25, 0.1, 0.25, 1);

      switch (openingType) {
        case "double_door":
          Animated.parallel([
            Animated.timing(leftDoorAnim, {
              toValue: 1,
              duration,
              easing,
              useNativeDriver: true,
            }),
            Animated.timing(rightDoorAnim, {
              toValue: 1,
              duration,
              easing,
              useNativeDriver: true,
            }),
          ]).start();
          break;

        case "slide_up":
          Animated.timing(slideAnim, {
            toValue: -1,
            duration,
            easing,
            useNativeDriver: true,
          }).start();
          break;

        case "slide_down":
          Animated.timing(slideAnim, {
            toValue: 1,
            duration,
            easing,
            useNativeDriver: true,
          }).start();
          break;

        case "fade":
        default:
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start();
          break;
      }
    }
  }, [isOpening, openingType]);

  // Storefront content
  const StorefrontContent = () => (
    <View style={[styles.storefrontInner, { backgroundColor: theme.gradient[0] }]}>
      {/* Gradient background simulation */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: theme.gradient[1],
            opacity: 0.7,
          },
        ]}
      />

      {/* Pattern */}
      <PatternOverlay pattern={theme.pattern} color={theme.textColor} />

      {/* Content */}
      <View style={styles.storefrontCenter}>
        {/* Logo/Emoji */}
        {storefront?.logo ? (
          <Image
            source={{ uri: storefront.logo }}
            style={styles.storefrontLogo}
          />
        ) : (
          <View
            style={[
              styles.storefrontEmoji,
              { borderColor: theme.accent + "40" },
            ]}
          >
            <Text style={{ fontSize: 48 }}>{storefront?.emoji || "🎁"}</Text>
          </View>
        )}

        {/* Brand Name */}
        <Text style={[styles.storefrontBrand, { color: theme.textColor }]}>
          {storefront?.brandName || "TAIL DROP"}
        </Text>

        {/* Tagline */}
        {storefront?.tagline && (
          <Text
            style={[styles.storefrontTagline, { color: theme.textColor + "CC" }]}
          >
            {storefront.tagline}
          </Text>
        )}

        {/* Decorative line */}
        <View style={[styles.storefrontLine, { backgroundColor: theme.accent }]} />
      </View>

      {/* Floating Catch Button */}
      {!isOpening && (
        <View style={styles.floatingButtonWrap}>
          <FloatingCatchButton onPress={onCatch} theme={theme} />
        </View>
      )}
    </View>
  );

  // Render based on opening type
  if (openingType === "double_door") {
    return (
      <>
        {/* Left Door */}
        <Animated.View
          style={[
            styles.door,
            styles.doorLeft,
            {
              transform: [
                {
                  translateX: leftDoorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -SCREEN_WIDTH / 2],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.doorInnerLeft}>
            <StorefrontContent />
          </View>
        </Animated.View>

        {/* Right Door */}
        <Animated.View
          style={[
            styles.door,
            styles.doorRight,
            {
              transform: [
                {
                  translateX: rightDoorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, SCREEN_WIDTH / 2],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.doorInnerRight}>
            <StorefrontContent />
          </View>
        </Animated.View>
      </>
    );
  }

  if (openingType === "slide_up" || openingType === "slide_down") {
    return (
      <Animated.View
        style={[
          styles.fullCover,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-SCREEN_HEIGHT, 0, SCREEN_HEIGHT],
                }),
              },
            ],
          },
        ]}
      >
        <StorefrontContent />
      </Animated.View>
    );
  }

  // Default: fade
  return (
    <Animated.View style={[styles.fullCover, { opacity: fadeAnim }]}>
      <StorefrontContent />
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════
// PULSE DOT
// ══════════════════════════════════════════════════════════
function PulseDot({ color = "#22C55E" }) {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: color,
        opacity: anim,
      }}
    />
  );
}

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function CatchTailModal({
  visible,
  tail,
  onClose,
  onCatch,
  onOpenLink,
  onReact,
  colors: C,
}) {
  const [timer, setTimer] = useState("");
  const [showStorefront, setShowStorefront] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [reward, setReward] = useState(null);
  const [caught, setCaught] = useState(false);

  const slideAnim = useRef(new Animated.Value(300)).current;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setShowStorefront(!!tail?.storefront);
      setIsOpening(false);
      setShowReward(false);
      setReward(null);
      setCaught(false);

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible, tail]);

  // Live countdown
  useEffect(() => {
    if (!visible || !tail?.expiresAt) return;
    const tick = () => setTimer(timeLeft(tail.expiresAt));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [visible, tail?.expiresAt]);

  // Handle catch
  const handleCatch = useCallback(() => {
    if (caught) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // If has storefront, trigger opening animation
    if (tail?.storefront && showStorefront) {
      setIsOpening(true);

      // After doors open, complete catch
      setTimeout(() => {
        completeCatch();
      }, 500);
    } else {
      // No storefront, catch directly
      completeCatch();
    }
  }, [tail, showStorefront, caught]);

  const completeCatch = () => {
    setCaught(true);
    setShowStorefront(false);

    // Determine reward
    const isFirstCatch = !tail.catchCount || tail.catchCount === 0;
    const rewards = [
      { type: "COINS", value: Math.floor(Math.random() * 30) + 10, chance: 0.5 },
      { type: "XP", value: Math.floor(Math.random() * 50) + 20, chance: 0.3 },
      { type: "STREAK", value: 1, chance: 0.15 },
      { type: "RARE", value: 1, chance: 0.05 },
    ];

    if (isFirstCatch) {
      setReward({ type: "FIRST", value: 100 });
    } else {
      const roll = Math.random();
      let cumulative = 0;
      for (const r of rewards) {
        cumulative += r.chance;
        if (roll <= cumulative) {
          setReward(r);
          break;
        }
      }
    }

    setShowReward(true);

    // Call parent onCatch (auto-increments count)
    onCatch?.(tail);
  };

  const handleRewardComplete = () => {
    setShowReward(false);
  };

  // Tail data
  const t = tail || {};
  const tailType = (t.tailType || "LOOK").toUpperCase();
  const tc = TYPE_CONFIG[tailType] || TYPE_CONFIG.LOOK;
  const expired = !!t.expired || (t.expiresAt && Date.now() > t.expiresAt);
  const urgent = isUrgent(t.expiresAt);

  // DROP bar
  const isDrop = tailType === "DROP";
  const fillPct =
    isDrop && t.catchLimit
      ? Math.min(1, (t.catchCount || 0) / t.catchLimit)
      : 0;
  const spotsLeft =
    isDrop && t.catchLimit != null
      ? Math.max(0, t.catchLimit - (t.catchCount || 0))
      : null;
  const isFull =
    isDrop && t.catchLimit != null && (t.catchCount || 0) >= t.catchLimit;
  const barColor =
    fillPct < 0.5 ? "#22C55E" : fillPct < 0.8 ? "#F59E0B" : "#EF4444";

  // Geo lock
  const isGeoLocked =
    !!t.geo?.distance && t.geo.distance > (t.geo.radius || 1000);

  // Image
  const heroImage = t.mediaUrl || t.meta?.image;

  if (!visible || !tail) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Background tap to close */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Main content */}
        <Animated.View
          style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.modalInner,
              {
                backgroundColor: C?.panel || "#0D1220",
                borderColor: tc.color + "44",
              },
            ]}
          >
            {/* ═══════════════════════════════════════
                STOREFRONT COVER (if exists & not caught)
            ═══════════════════════════════════════ */}
            {t.storefront && showStorefront && !caught && (
              <StorefrontCover
                storefront={t.storefront}
                onCatch={handleCatch}
                isOpening={isOpening}
              />
            )}

            {/* ═══════════════════════════════════════
                MAIN CONTENT (shown when no storefront OR after catch)
            ═══════════════════════════════════════ */}
            {(!t.storefront || !showStorefront || caught) && (
              <>
                {/* Top handle */}
                <View style={styles.handleWrap}>
                  <View
                    style={[
                      styles.handle,
                      { backgroundColor: C?.border || "#1E293B" },
                    ]}
                  />
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  contentContainerStyle={{ paddingBottom: 32 }}
                >
                  {/* ── HERO IMAGE ── */}
                  {heroImage ? (
                    <View style={{ position: "relative" }}>
                      <Image
                        source={{ uri: heroImage }}
                        style={styles.heroImage}
                        resizeMode="cover"
                      />
                      {/* Gradient fade */}
                      <View
                        style={[
                          styles.heroGradient,
                          { backgroundColor: C?.panel || "#0D1220" },
                        ]}
                      />
                      {/* Type badge */}
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: tc.color + "CC" },
                        ]}
                      >
                        <Text style={{ fontSize: 11 }}>{tc.icon}</Text>
                        <Text style={styles.typeBadgeText}>{tailType}</Text>
                      </View>
                      {/* Timer badge */}
                      {!!timer && (
                        <View
                          style={[
                            styles.timerBadge,
                            {
                              borderColor: urgent
                                ? "#EF4444"
                                : "rgba(255,255,255,0.15)",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.timerText,
                              { color: urgent ? "#EF4444" : "#94A3B8" },
                            ]}
                          >
                            {urgent ? "🔴 " : "⏱ "}
                            {timer}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.heroPlaceholder,
                        { backgroundColor: tc.color + "18" },
                      ]}
                    >
                      <Text style={{ fontSize: 52 }}>{tc.icon}</Text>
                      {/* Type + timer row */}
                      <View style={styles.heroPlaceholderRow}>
                        <View
                          style={[
                            styles.typeBadge,
                            { backgroundColor: tc.color + "CC", position: "relative", top: 0, left: 0 },
                          ]}
                        >
                          <Text style={{ fontSize: 11 }}>{tc.icon}</Text>
                          <Text style={styles.typeBadgeText}>{tailType}</Text>
                        </View>
                        {!!timer && (
                          <View
                            style={[
                              styles.timerBadge,
                              {
                                position: "relative",
                                top: 0,
                                right: 0,
                                borderColor: urgent
                                  ? "#EF4444"
                                  : "rgba(255,255,255,0.15)",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.timerText,
                                { color: urgent ? "#EF4444" : "#94A3B8" },
                              ]}
                            >
                              {urgent ? "🔴 " : "⏱ "}
                              {timer}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* ── BODY ── */}
                  <View style={styles.body}>
                    {/* Sender + stats row */}
                    <View style={styles.senderRow}>
                      <Text
                        style={[
                          styles.senderName,
                          { color: C?.muted || "#94A3B8" },
                        ]}
                      >
                        @{t.from || "user"}
                      </Text>
                      <View style={styles.statsRow}>
                        <PulseDot color={tc.color} />
                        <Text
                          style={[
                            styles.statsText,
                            { color: C?.dim || "#64748B" },
                          ]}
                        >
                          {(t.catchCount || 0) + (caught ? 1 : 0)} caught
                        </Text>
                      </View>
                    </View>

                    {/* Title */}
                    <Text
                      style={[styles.title, { color: C?.text || "#E5E7EB" }]}
                    >
                      {t.meta?.title || t.title || "Mystery Drop"}
                    </Text>

                    {/* Price */}
                    {t.meta?.price && (
                      <View style={styles.priceRow}>
                        <Text style={styles.price}>{t.meta.price}</Text>
                        {t.meta?.siteName && (
                          <Text
                            style={[
                              styles.siteName,
                              { color: C?.dim || "#64748B" },
                            ]}
                          >
                            · {t.meta.siteName}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Message */}
                    {!!t.message && (
                      <View
                        style={[
                          styles.messageBox,
                          {
                            backgroundColor: tc.color + "12",
                            borderColor: tc.color + "30",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            { color: C?.text || "#E5E7EB" },
                          ]}
                        >
                          "{t.message}"
                        </Text>
                      </View>
                    )}

                    {/* Reveal teaser */}
                    {t.hasReveal && !expired && !isFull && !caught && (
                      <View
                        style={[
                          styles.revealBox,
                          {
                            backgroundColor: tc.color + "18",
                            borderColor: tc.color + "44",
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 16 }}>
                          {tailType === "DROP"
                            ? "💧"
                            : tailType === "CHAIN"
                            ? "🔗"
                            : "🎁"}
                        </Text>
                        <Text style={[styles.revealText, { color: tc.color }]}>
                          Catch to unlock the reveal
                        </Text>
                      </View>
                    )}

                    {/* Chain teaser */}
                    {t.isChain && (
                      <View style={styles.chainBox}>
                        <Text style={{ fontSize: 16 }}>🔗</Text>
                        <Text style={styles.chainText}>
                          {t.chainLength || 0}-layer chain hunt — unlock step by
                          step
                        </Text>
                      </View>
                    )}

                    {/* Geo indicator */}
                    {t.geo && (
                      <View
                        style={[
                          styles.geoBox,
                          {
                            backgroundColor: isGeoLocked
                              ? "rgba(239,68,68,0.08)"
                              : "rgba(34,197,94,0.08)",
                            borderColor: isGeoLocked ? "#EF444444" : "#22C55E44",
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 16 }}>
                          {isGeoLocked ? "🔒" : "📍"}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.geoText,
                              { color: isGeoLocked ? "#EF4444" : "#22C55E" },
                            ]}
                          >
                            {isGeoLocked
                              ? `${t.geo.distanceLabel || t.geo.distance + "m"} away — walk closer to catch`
                              : `You're within range — ${t.geo.distanceLabel || "nearby"}`}
                          </Text>
                          <Text
                            style={[
                              styles.geoRadius,
                              { color: C?.dim || "#64748B" },
                            ]}
                          >
                            Catch radius:{" "}
                            {t.geo.radius >= 1000
                              ? `${(t.geo.radius / 1000).toFixed(1)}km`
                              : `${t.geo.radius}m`}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* DROP bar */}
                    {isDrop && t.catchLimit != null && (
                      <View style={styles.dropBar}>
                        <View style={styles.dropBarHeader}>
                          <Text
                            style={[
                              styles.dropBarLabel,
                              {
                                color: isFull
                                  ? C?.dim || "#64748B"
                                  : spotsLeft != null && spotsLeft <= 3
                                  ? "#EF4444"
                                  : "#F59E0B",
                              },
                            ]}
                          >
                            {isFull
                              ? "All spots taken"
                              : spotsLeft != null && spotsLeft <= 3
                              ? `⚠️ Only ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left!`
                              : `${spotsLeft} spots remaining`}
                          </Text>
                          <Text
                            style={[
                              styles.dropBarCount,
                              { color: C?.dim || "#64748B" },
                            ]}
                          >
                            {t.catchCount || 0}/{t.catchLimit}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.dropBarTrack,
                            { backgroundColor: C?.border || "#1E293B" },
                          ]}
                        >
                          <View
                            style={[
                              styles.dropBarFill,
                              {
                                backgroundColor: barColor,
                                width: `${Math.round(fillPct * 100)}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    )}

                    {/* Reactions */}
                    {Object.keys(t.reactions || {}).length > 0 && (
                      <View style={styles.reactionsRow}>
                        {Object.entries(t.reactions || {})
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5)
                          .map(([emoji, count]) => (
                            <TouchableOpacity
                              key={emoji}
                              onPress={() => onReact?.(t.id, emoji)}
                              style={[
                                styles.reactionChip,
                                { borderColor: C?.border || "#1E293B" },
                              ]}
                            >
                              <Text style={{ fontSize: 13 }}>{emoji}</Text>
                              <Text
                                style={[
                                  styles.reactionCount,
                                  { color: C?.muted || "#94A3B8" },
                                ]}
                              >
                                {count}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    )}

                    {/* Quick react row */}
                    <View style={styles.quickReactRow}>
                      {QUICK_REACTIONS.map((emoji) => (
                        <TouchableOpacity
                          key={emoji}
                          onPress={() => onReact?.(t.id, emoji)}
                          style={[
                            styles.quickReactBtn,
                            { borderColor: C?.border || "#1E293B" },
                          ]}
                        >
                          <Text style={{ fontSize: 18 }}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* ── ACTION BUTTONS ── */}
                    <View style={styles.actionButtons}>
                      {/* CATCH button (only if not caught) */}
                      {!caught && !expired && !isFull ? (
                        <TouchableOpacity
                          onPress={handleCatch}
                          disabled={isGeoLocked}
                          activeOpacity={0.85}
                          style={[
                            styles.catchButton,
                            {
                              backgroundColor: isGeoLocked
                                ? C?.border || "#1E293B"
                                : tc.color,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.catchButtonText,
                              {
                                color: isGeoLocked
                                  ? C?.dim || "#64748B"
                                  : "#fff",
                              },
                            ]}
                          >
                            {isGeoLocked
                              ? `📍 ${t.geo?.distanceLabel || "Too far"} away`
                              : tc.btn}
                          </Text>
                        </TouchableOpacity>
                      ) : caught ? (
                        <View
                          style={[
                            styles.caughtBadge,
                            { backgroundColor: "#22C55E20", borderColor: "#22C55E" },
                          ]}
                        >
                          <Text style={styles.caughtText}>✅ Caught!</Text>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.disabledButton,
                            { backgroundColor: C?.border || "#1E293B" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.disabledButtonText,
                              { color: C?.dim || "#64748B" },
                            ]}
                          >
                            {expired ? "⏰ Tail Expired" : "🔒 Drop Full"}
                          </Text>
                        </View>
                      )}

                      {/* Open link */}
                      {!!t.url && (
                        <TouchableOpacity
                          onPress={onOpenLink}
                          style={[
                            styles.linkButton,
                            { borderColor: C?.border || "#1E293B" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.linkButtonText,
                              { color: C?.muted || "#94A3B8" },
                            ]}
                          >
                            🔗 Open Original Link
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Close */}
                      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text
                          style={[
                            styles.closeButtonText,
                            { color: C?.dim || "#64748B" },
                          ]}
                        >
                          Close
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}

            {/* ═══════════════════════════════════════
                REWARD POPUP
            ═══════════════════════════════════════ */}
            <RewardPopup
              visible={showReward}
              reward={reward}
              onComplete={handleRewardComplete}
            />
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  modalContent: {
    maxHeight: "92%",
  },
  modalInner: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    minHeight: SCREEN_HEIGHT * 0.5,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },

  // Hero
  heroImage: {
    width: "100%",
    height: 200,
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    opacity: 0.6,
  },
  heroPlaceholder: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  heroPlaceholderRow: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },

  // Badges
  typeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  typeBadgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1,
  },
  timerBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(7,10,15,0.85)",
    borderWidth: 1,
  },
  timerText: {
    fontWeight: "900",
    fontSize: 11,
  },

  // Body
  body: {
    paddingHorizontal: 18,
    paddingTop: 14,
    gap: 10,
  },
  senderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  senderName: {
    fontWeight: "900",
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statsText: {
    fontSize: 12,
    fontWeight: "800",
  },
  title: {
    fontWeight: "900",
    fontSize: 19,
    lineHeight: 24,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  price: {
    color: "#22C55E",
    fontWeight: "900",
    fontSize: 20,
  },
  siteName: {
    fontSize: 13,
  },
  messageBox: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  messageText: {
    fontStyle: "italic",
  },
  revealBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  revealText: {
    fontWeight: "900",
    fontSize: 13,
  },
  chainBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#22C55E18",
    borderWidth: 1,
    borderColor: "#22C55E44",
  },
  chainText: {
    color: "#22C55E",
    fontWeight: "900",
    fontSize: 13,
  },
  geoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  geoText: {
    fontWeight: "900",
    fontSize: 13,
  },
  geoRadius: {
    fontSize: 11,
    marginTop: 2,
  },
  dropBar: {
    gap: 6,
  },
  dropBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dropBarLabel: {
    fontWeight: "900",
    fontSize: 13,
  },
  dropBarCount: {
    fontSize: 12,
    fontWeight: "700",
  },
  dropBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  dropBarFill: {
    height: 6,
    borderRadius: 3,
  },
  reactionsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  reactionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: "700",
  },
  quickReactRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 2,
  },
  quickReactBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
  },

  // Action buttons
  actionButtons: {
    marginTop: 8,
    gap: 10,
  },
  catchButton: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  catchButtonText: {
    fontWeight: "900",
    fontSize: 16,
  },
  caughtBadge: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
  },
  caughtText: {
    color: "#22C55E",
    fontWeight: "900",
    fontSize: 16,
  },
  disabledButton: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  disabledButtonText: {
    fontWeight: "900",
    fontSize: 15,
  },
  linkButton: {
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
  },
  linkButtonText: {
    fontWeight: "900",
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  closeButtonText: {
    fontWeight: "800",
  },

  // Storefront
  fullCover: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  door: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH / 2,
    zIndex: 10,
    overflow: "hidden",
  },
  doorLeft: {
    left: 0,
  },
  doorRight: {
    right: 0,
  },
  doorInnerLeft: {
    width: SCREEN_WIDTH,
    height: "100%",
  },
  doorInnerRight: {
    width: SCREEN_WIDTH,
    height: "100%",
    marginLeft: -SCREEN_WIDTH / 2,
  },
  storefrontInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  storefrontCenter: {
    alignItems: "center",
    gap: 12,
  },
  storefrontLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
  },
  storefrontEmoji: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  storefrontBrand: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  storefrontTagline: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
  },
  storefrontLine: {
    width: 50,
    height: 3,
    borderRadius: 2,
    marginTop: 8,
  },
  floatingButtonWrap: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  // Reward popup
  rewardPopup: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  rewardBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
  },
  rewardLabel: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  rewardValue: {
    fontSize: 32,
    fontWeight: "900",
  },
});