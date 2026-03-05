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

        {/* Top row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", zIndex: 1 }}>
          <View style={[styles.typePill, { backgroundColor: `${cfg.color}25` }]}>
            <Text style={{ fontSize: 8, fontWeight: "900", color: cfg.color, letterSpacing: 0.5 }}>
              {tail?.tailType || "LOOK"}
            </Text>
          </View>
          <Text style={{ fontSize: 18, lineHeight: 22 }}>{cfg.icon}</Text>
        </View>

        {/* Middle — context info */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", zIndex: 1 }}>
          {tail?.tailType === "DROP" && spotsLeft !== null && (
            <Text style={{ fontSize: 9, fontWeight: "900", color: cfg.color }}>
              {spotsLeft} left
            </Text>
          )}
          {tail?.tailType === "GEO" && tail?.geo?.distance != null && (
            <Text style={{ fontSize: 9, fontWeight: "900", color: cfg.color }}>
              {tail.geo.distanceLabel || `${tail.geo.distance}m`}
            </Text>
          )}
          {tail?.tailType === "NOW" && (
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.color }} />
          )}
        </View>

        {/* Bottom row */}
        <View style={{ zIndex: 1, gap: 3 }}>
          <Text style={{ fontSize: 9, fontWeight: "800", color: tail?.mediaUrl ? "#fff" : "#94A3B8" }} numberOfLines={1}>
            @{tail?.from || "user"}
          </Text>
          {/* Energy bar */}
          <View style={{ height: 2, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 1 }}>
            <View style={{
              height: 2,
              width: `${Math.max(3, energy)}%`,
              backgroundColor: cfg.color,
              borderRadius: 1,
              opacity: 0.8,
            }} />
          </View>
        </View>

        {/* Highlight checkmark */}
        {isHighlighted && (
          <View style={{
            position: "absolute", top: 5, right: 5,
            width: 16, height: 16, borderRadius: 8,
            backgroundColor: cfg.color,
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ color: "#fff", fontSize: 8, fontWeight: "900" }}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Expanded Reveal Card ─────────────────────────────────
const ExpandedReveal = ({ tail, onClose, onCatch, onOpenLink, onReact, colors: C }) => {
  const translateY = useRef(new Animated.Value(SH)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
      Animated.timing(bgOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const close = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: SH, duration: 280, useNativeDriver: true }),
      Animated.timing(bgOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(onClose);
  };

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
    onPanResponderMove: (_, g) => {
      if (g.dy > 0) panY.setValue(g.dy);
    },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 80 || g.vy > 0.8) {
        close();
      } else {
        Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  })).current;

  if (!tail) return null;
  const cfg = getType(tail.tailType);
  const tlText = timeLeft(tail.expiresAt);
  const hasImage = tail.mediaUrl || tail.meta?.image;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.75)", opacity: bgOpacity }]}
      >
        <TouchableWithoutFeedback onPress={close}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Card */}
      <Animated.View
        style={{
          position: "absolute",
          left: 16, right: 16,
          bottom: 20,
          transform: [{ translateY: Animated.add(translateY, panY) }],
          borderRadius: 28,
          overflow: "hidden",
          backgroundColor: cfg.gradient[0],
          borderWidth: 1.5,
          borderColor: `${cfg.color}60`,
          shadowColor: cfg.color,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 20,
        }}
        {...panResponder.panHandlers}
      >
        {/* Glow top */}
        <View style={{
          position: "absolute",
          top: -40, left: "20%", right: "20%",
          height: 80, borderRadius: 40,
          backgroundColor: cfg.color, opacity: 0.12,
        }} />

        {/* Drag handle */}
        <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: `${cfg.color}50` }} />
        </View>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 22 }}>{cfg.icon}</Text>
            <View>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
                {tail.tailType} Tail
              </Text>
              <Text style={{ color: "#94A3B8", fontSize: 11, fontWeight: "700" }}>
                @{tail.from}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            {tlText && (
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: `${cfg.color}20` }}>
                <Text style={{ color: cfg.color, fontSize: 10, fontWeight: "900" }}>⏱ {tlText}</Text>
              </View>
            )}
            <TouchableOpacity onPress={close} hitSlop={10}>
              <Text style={{ color: "#64748B", fontWeight: "900", fontSize: 12 }}>✕ Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Image */}
        {hasImage && (
          <Image
            source={{ uri: tail.mediaUrl || tail.meta?.image }}
            style={{ width: "100%", height: 160, marginBottom: 12 }}
            resizeMode="cover"
          />
        )}

        {/* Content */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
          {!!tail.message && (
            <Text style={{ color: "#E5E7EB", fontSize: 14, lineHeight: 20 }}>
              "{tail.message}"
            </Text>
          )}

          {/* ── Universal reveal ── */}
          {tail?.reveal && (
            <View style={{ borderRadius: 16, borderWidth: 1.5,
              borderColor: `${cfg.color}40`, backgroundColor: `${cfg.color}08`,
              padding: 16, alignItems: "center", gap: 8 }}>
              {tail.reveal.kind === "coupon" && (
                <>
                  <Text style={{ color: "#94A3B8", fontSize: 10, fontWeight: "900",
                    textTransform: "uppercase", letterSpacing: 2 }}>Coupon Code</Text>
                  <Text style={{ color: cfg.color, fontSize: 22, fontWeight: "900",
                    letterSpacing: 3 }}>{tail.reveal.code}</Text>
                </>
              )}
              {tail.reveal.kind === "message" && (
                <>
                  <Text style={{ fontSize: 24 }}>💬</Text>
                  <Text style={{ color: "#E5E7EB", fontSize: 15, textAlign: "center",
                    lineHeight: 22, fontStyle: "italic" }}>"{tail.reveal.text}"</Text>
                </>
              )}
              {tail.reveal.kind === "emoji" && (
                <>
                  <Text style={{ fontSize: 64 }}>{tail.reveal.emoji}</Text>
                  <Text style={{ color: "#94A3B8", fontSize: 12 }}>@{tail.from} reacted</Text>
                </>
              )}
              {tail.reveal.kind === "gift" && (
                <>
                  <Text style={{ fontSize: 32 }}>💰</Text>
                  <Text style={{ color: "#F43F8E", fontSize: 28, fontWeight: "900" }}>
                    ${tail.reveal.amount}
                  </Text>
                  <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                    {tail.reveal.message || "A gift for you"}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap",
                    gap: 8, justifyContent: "center" }}>
                    {(tail.reveal.paymentApps || ["cashapp","venmo"]).map(app => (
                      <View key={app} style={{ paddingHorizontal: 12, paddingVertical: 6,
                        borderRadius: 10, backgroundColor: "rgba(244,63,142,0.15)",
                        borderWidth: 1, borderColor: "rgba(244,63,142,0.3)" }}>
                        <Text style={{ color: "#F43F8E", fontWeight: "900", fontSize: 12 }}>
                          {app === "cashapp" ? "💵 Cash App"
                            : app === "venmo" ? "🔵 Venmo"
                            : app === "paypal" ? "🅿️ PayPal"
                            : "🍎 Apple Pay"}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              {tail.reveal.kind === "voice" && (
                <>
                  <Text style={{ fontSize: 40 }}>🎙</Text>
                  <Text style={{ color: "#94A3B8", fontSize: 13 }}>
                    Voice note from @{tail.from}
                  </Text>
                </>
              )}
              {tail.reveal.kind === "url" && tail.reveal.url && (
                <>
                  <Text style={{ fontSize: 24 }}>🔗</Text>
                  <Text style={{ color: cfg.color, fontSize: 13, fontWeight: "800" }}
                    numberOfLines={1}>{tail.reveal.url}</Text>
                </>
              )}
            </View>
          )}

          {/* Coupon code */}
          {tail?.reveal?.kind === "coupon" && tail?.reveal?.code && (
            <View style={{
              borderRadius: 12, borderWidth: 1.5,
              borderColor: "#F59E0B", borderStyle: "dashed",
              backgroundColor: "rgba(245,158,11,0.08)",
              padding: 12, alignItems: "center",
            }}>
              <Text style={{ color: "#94A3B8", fontSize: 10, fontWeight: "700", marginBottom: 4 }}>COUPON CODE</Text>
              <Text style={{ color: "#F59E0B", fontSize: 20, fontWeight: "900", letterSpacing: 3 }}>
                {tail.reveal.code}
              </Text>
            </View>
          )}

          {/* Stats row */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={[styles.statChip, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}30` }]}>
              <Text style={{ color: cfg.color, fontSize: 11, fontWeight: "900" }}>
                🎯 {tail.catchCount || 0} caught
              </Text>
            </View>
            {tail.catchLimit != null && (
              <View style={[styles.statChip, { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.2)" }]}>
                <Text style={{ color: "#EF4444", fontSize: 11, fontWeight: "900" }}>
                  {Math.max(0, tail.catchLimit - (tail.catchCount || 0))} left
                </Text>
              </View>
            )}
            {tail.monetization?.hasMonetizedUrl && (
              <View style={[styles.statChip, { backgroundColor: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.2)" }]}>
                <Text style={{ color: "#22C55E", fontSize: 11, fontWeight: "900" }}>💰 Earns</Text>
              </View>
            )}
          </View>

          {/* Reactions */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {["🔥", "💯", "👀", "🎯"].map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => onReact?.(tail.id, emoji)}
                style={[styles.statChip, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }]}
              >
                <Text style={{ fontSize: 14 }}>{emoji}</Text>
                {tail.reactions?.[emoji] > 0 && (
                  <Text style={{ color: "#94A3B8", fontSize: 10, fontWeight: "800" }}>
                    {tail.reactions[emoji]}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            {tail.url && (
              <TouchableOpacity
                onPress={() => onOpenLink?.(tail.monetization?.monetizedUrl || tail.url)}
                style={{
                  flex: 1, paddingVertical: 13, borderRadius: 16,
                  borderWidth: 1,
                  borderColor: tail.monetization?.hasMonetizedUrl ? "#22C55E" : "rgba(255,255,255,0.15)",
                  backgroundColor: tail.monetization?.hasMonetizedUrl ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: tail.monetization?.hasMonetizedUrl ? "#22C55E" : "#E5E7EB", fontWeight: "900", fontSize: 13 }}>
                  {tail.monetization?.hasMonetizedUrl ? "💰 Open & Earn" : "🔗 Open Link"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => onCatch?.(tail)}
              style={{
                flex: 1.4, paddingVertical: 13, borderRadius: 16,
                backgroundColor: cfg.color,
                alignItems: "center",
                shadowColor: cfg.color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}>
                🎯 Catch Tail
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

// ── Spotlight Bar ────────────────────────────────────────
const SpotlightBar = ({ username, tailCount, onClose, colors: C }) => {
  const slideAnim = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 180 }).start();
    return () => {
      Animated.timing(slideAnim, { toValue: 80, duration: 200, useNativeDriver: true }).start();
    };
  }, [username]);

  return (
    <Animated.View style={{
      transform: [{ translateY: slideAnim }],
      backgroundColor: C.panel,
      borderTopWidth: 1,
      borderTopColor: C.border,
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    }}>
      <View style={{
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: "#7C3AED",
        alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontSize: 14 }}>🦊</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.text, fontWeight: "900", fontSize: 13 }}>{username}</Text>
        <Text style={{ color: C.muted, fontSize: 10 }}>{tailCount} active tail{tailCount !== 1 ? "s" : ""} highlighted</Text>
      </View>
      <TouchableOpacity
        onPress={() => onFollowUser?.(username)}
        style={{
          paddingHorizontal: 12, paddingVertical: 6,
          borderRadius: 10, backgroundColor: following.includes(username) ? "rgba(124,58,237,0.2)" : "#7C3AED",
          borderWidth: 1, borderColor: "#7C3AED",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 11 }}>{following.includes(username) ? "✓ Following" : "Follow"}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onClose} hitSlop={10}>
        <Text style={{ color: C.dim, fontWeight: "900" }}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Main TailHome ────────────────────────────────────────
export default function TailHome({
  me,
  publicCount,
  inboxCount,
  allTails = [],
  trending = [],
  onOpenPublic,
  onOpenPrivate,
  onOpenTail,
  onCatchTail,
  colors: C,
  onReact,
  streak = 0,
  earnings = 0,
  isPro,
  onOpenEarnings,
  onOpenPro,
  onRefresh,
  categoryFilterOptions = [],
  selectedCategory = "foryou",
  onCategoryChange,
  following = [],
  followingFeed = [],
  onFollowUser,
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTail, setExpandedTail] = useState(null);
  const [highlightedUser, setHighlightedUser] = useState(null);
  const flatListRef = useRef(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    onRefresh?.();
    setTimeout(() => setRefreshing(false), 1000);
  }, [onRefresh]);

  // Tap = open reveal
  const handleTap = useCallback((tail) => {
    setHighlightedUser(null);
    setExpandedTail(tail);
  }, []);

  // Long press = highlight creator
  const handleLongPress = useCallback((tail) => {
    if (highlightedUser === tail.from) {
      setHighlightedUser(null);
    } else {
      setHighlightedUser(tail.from);
    }
  }, [highlightedUser]);

  const handleCloseReveal = useCallback(() => {
    setExpandedTail(null);
  }, []);

  const handleCatch = useCallback((tail) => {
    setExpandedTail(null);
    setTimeout(() => onCatchTail?.(tail), 100);
  }, [onCatchTail]);

  const handleOpenLink = useCallback((url) => {
    onOpenTail?.({ url, id: expandedTail?.id });
  }, [expandedTail, onOpenTail]);

  // Rich demo tails — shown when no real tails exist
  const DEMO_TAILS = [
    {
      id: "demo_1", _type: "tail", tailType: "DROP",
      from: "nike_official", message: "🔥 Flash Sale — 40% off Air Max",
      url: "https://nike.com", catchLimit: 50, catchCount: 43,
      expiresAt: Date.now() + 3600000 * 2,
      energy: { current: 88 },
      reveal: { kind: "coupon", code: "AIRMAX40" },
      mediaUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    },
    {
      id: "demo_2", _type: "tail", tailType: "NOW",
      from: "sara_eats", message: "Best ramen in NYC — catch for address 📍",
      url: "https://maps.google.com", catchLimit: null, catchCount: 12,
      expiresAt: Date.now() + 3600000 * 1,
      energy: { current: 95 },
      reveal: { kind: "url" },
      mediaUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400",
    },
    {
      id: "demo_3", _type: "tail", tailType: "LOOK",
      from: "techdeals_", message: "AirPods Pro — lowest price ever 👀",
      url: "https://amazon.com", catchLimit: null, catchCount: 7,
      expiresAt: Date.now() + 3600000 * 6,
      energy: { current: 72 },
      reveal: { kind: "url" },
      mediaUrl: "https://images.unsplash.com/photo-1588423771073-b8903fead85b?w=400",
    },
    {
      id: "demo_4", _type: "tail", tailType: "DROP",
      from: "sneakerhead99", message: "Yeezy 350 — 3 pairs only 👟",
      url: "https://stockx.com", catchLimit: 3, catchCount: 0,
      expiresAt: Date.now() + 3600000 * 4,
      energy: { current: 100 },
      reveal: { kind: "coupon", code: "YZY3ONLY" },
      mediaUrl: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400",
    },
    {
      id: "demo_5", _type: "tail", tailType: "GEO",
      from: "rooftop_nyc", message: "Free rooftop event tonight 🌆",
      url: "https://eventbrite.com", catchLimit: 100, catchCount: 67,
      expiresAt: Date.now() + 3600000 * 5,
      energy: { current: 81 },
      geo: { distance: 800, distanceLabel: "0.8km" },
      reveal: { kind: "url" },
      mediaUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400",
    },
    {
      id: "demo_6", _type: "tail", tailType: "CHAIN",
      from: "cryptobro_", message: "Pass this on — free NFT mint 🔗",
      url: "https://opensea.io", catchLimit: null, catchCount: 234,
      expiresAt: Date.now() + 3600000 * 12,
      energy: { current: 60 },
      reveal: { kind: "url" },
      mediaUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400",
    },
    {
      id: "demo_7", _type: "tail", tailType: "NOW",
      from: "fitlife_coach", message: "30min HIIT class — join live now 💪",
      url: "https://zoom.us", catchLimit: 20, catchCount: 11,
      expiresAt: Date.now() + 1800000,
      energy: { current: 99 },
      reveal: { kind: "url" },
      mediaUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
    },
    {
      id: "demo_8", _type: "tail", tailType: "LOOK",
      from: "fashionweek", message: "Exclusive lookbook drop 👗",
      url: "https://vogue.com", catchLimit: null, catchCount: 19,
      expiresAt: Date.now() + 3600000 * 24,
      energy: { current: 45 },
      reveal: { kind: "url" },
      mediaUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    },
    {
      id: "demo_9", _type: "tail", tailType: "DROP",
      from: "concertdrops", message: "2x front row tickets 🎵",
      url: "https://ticketmaster.com", catchLimit: 2, catchCount: 0,
      expiresAt: Date.now() + 3600000 * 3,
      energy: { current: 100 },
      reveal: { kind: "coupon", code: "FRONT2ROW" },
      mediaUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
    },
  ];

  // Build grid data — pad to multiple of 3 with placeholders
  const gridData = React.useMemo(() => {
    const source = selectedCategory === "following"
      ? (followingFeed.length > 0 ? followingFeed : DEMO_TAILS)
      : allTails.length > 0 ? allTails : DEMO_TAILS;
    const items = source.map(t => ({ ...t, _type: "tail" }));
    const placeholderCount = (3 - (items.length % 3)) % 3;
    for (let i = 0; i < placeholderCount; i++) {
      items.push({ _type: "placeholder", id: `ph_${i}` });
    }
    return items;
  }, [allTails]);

  const highlightedCount = highlightedUser
    ? allTails.filter(t => t.from === highlightedUser).length
    : 0;

  const renderItem = useCallback(({ item }) => {
    if (item._type === "placeholder") {
      return (
        <View style={{ padding: CARD_GAP / 2 }}>
          <ShimmerCard colors={C} />
        </View>
      );
    }
    const isHighlighted = highlightedUser === item.from;
    const isDimmed = highlightedUser !== null && !isHighlighted;
    return (
      <View style={{ padding: CARD_GAP / 2 }}>
        <TailGridCard
          tail={item}
          onTap={handleTap}
          onLongPress={handleLongPress}
          isHighlighted={isHighlighted}
          isDimmed={isDimmed}
          colors={C}
        />
      </View>
    );
  }, [highlightedUser, handleTap, handleLongPress, C]);

  return (
    <View style={{ flex: 1 }}>
      {/* ── Header: 🦊 Tail Me left | badges + avatar right ── */}
      <View style={{
        paddingHorizontal: 16, paddingVertical: 10,
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1, borderBottomColor: C.border,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 24 }}>🦊</Text>
          <Text style={{ color: C.text, fontWeight: "900", fontSize: 20, letterSpacing: -0.5 }}>Tail Me</Text>
          {isPro && (
            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: "#F59E0B" }}>
              <Text style={{ color: "#000", fontWeight: "900", fontSize: 9 }}>PRO</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {streak > 0 && (
            <TouchableOpacity onPress={onOpenEarnings}
              style={{ flexDirection: "row", alignItems: "center", gap: 4,
                paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10,
                backgroundColor: "rgba(245,158,11,0.12)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)" }}>
              <Text style={{ fontSize: 11 }}>🔥</Text>
              <Text style={{ color: "#F59E0B", fontWeight: "900", fontSize: 12 }}>{streak}</Text>
            </TouchableOpacity>
          )}
          {earnings > 0 && (
            <TouchableOpacity onPress={onOpenEarnings}
              style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10,
                backgroundColor: "rgba(34,197,94,0.1)", borderWidth: 1, borderColor: "rgba(34,197,94,0.25)" }}>
              <Text style={{ color: "#22C55E", fontWeight: "900", fontSize: 12 }}>${earnings.toFixed(2)}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onOpenPrivate}
            style={{ width: 36, height: 36, borderRadius: 11,
              backgroundColor: inboxCount > 0 ? "rgba(124,58,237,0.2)" : C.panel,
              borderWidth: 1.5, borderColor: inboxCount > 0 ? "#7C3AED" : C.border,
              alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 15 }}>{inboxCount > 0 ? "📬" : "👤"}</Text>
            {inboxCount > 0 && (
              <View style={{ position: "absolute", top: -4, right: -4,
                width: 15, height: 15, borderRadius: 8, backgroundColor: "#7C3AED",
                alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#fff", fontSize: 8, fontWeight: "900" }}>
                  {inboxCount > 9 ? "9+" : inboxCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Category emoji chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ borderBottomWidth: 1, borderBottomColor: C.border, maxHeight: 46 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 7, gap: 6, alignItems: "center" }}
      >
        {categoryFilterOptions.map((opt) => {
          const isSelected = selectedCategory === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => onCategoryChange?.(opt.id)}
              style={{
                minWidth: 32, height: 32,
                paddingHorizontal: opt.labelFull ? 10 : 0,
                borderRadius: 16, borderWidth: 1,
                borderColor: isSelected ? C.brand : C.border,
                backgroundColor: isSelected ? "rgba(124,58,237,0.2)" : C.panel,
                alignItems: "center", justifyContent: "center",
                flexDirection: "row", gap: 3,
              }}
            >
              <Text style={{ fontSize: 16 }}>{opt.icon}</Text>
              {opt.labelFull && (
                <Text style={{ color: isSelected ? C.text : C.muted, fontWeight: "800", fontSize: 11 }}>
                  {opt.labelFull}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Grid */}
      <FlatList
        ref={flatListRef}
        data={gridData}
        keyExtractor={(item) => item.id || item._id || String(Math.random())}
        numColumns={3}
        renderItem={renderItem}
        contentContainerStyle={{ padding: CARD_GAP / 2, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.brand}
            colors={[C.brand]}
          />
        }
        ListEmptyComponent={
          selectedCategory === "following" ? (
            <View style={{ padding: 24, gap: 16 }}>
              <Text style={{ color: C.text, fontWeight: "900", fontSize: 18, textAlign: "center" }}>
                Follow creators 👥
              </Text>
              <Text style={{ color: C.muted, fontSize: 14, textAlign: "center", marginBottom: 8 }}>
                Long press any tail in the grid to follow its creator
              </Text>
              {["tailme_drops","techdrops_","fooddeals_","fashiondrops_","fitdrops_"].map(u => (
                <View key={u} style={{
                  flexDirection: "row", alignItems: "center", gap: 12,
                  padding: 14, borderRadius: 16,
                  backgroundColor: C.panel, borderWidth: 1, borderColor: C.border,
                }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12,
                    backgroundColor: "rgba(124,58,237,0.2)", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 18 }}>🦊</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontWeight: "900", fontSize: 14 }}>@{u}</Text>
                    <Text style={{ color: C.muted, fontSize: 11 }}>Curated drops daily</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onFollowUser?.(u)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 7,
                      borderRadius: 10,
                      backgroundColor: following.includes(u) ? "rgba(124,58,237,0.2)" : "#7C3AED",
                      borderWidth: 1, borderColor: "#7C3AED",
                    }}>
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>
                      {following.includes(u) ? "✓ Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingTop: 60, gap: 8 }}>
              <Text style={{ fontSize: 40 }}>🦊</Text>
              <Text style={{ color: C.muted, fontWeight: "900", fontSize: 16 }}>No tails yet</Text>
              <Text style={{ color: C.dim, fontSize: 13 }}>Be the first to send one</Text>
            </View>
          )
        }
      />

      {/* Spotlight bar */}
      {highlightedUser && (
        <SpotlightBar
          username={highlightedUser}
          tailCount={highlightedCount}
          onClose={() => setHighlightedUser(null)}
          colors={C}
        />
      )}

      {/* Expanded reveal */}
      {expandedTail && (
        <ExpandedReveal
          tail={expandedTail}
          onClose={handleCloseReveal}
          onCatch={handleCatch}
          onOpenLink={handleOpenLink}
          onReact={onReact}
          colors={C}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 8,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  typePill: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
});
