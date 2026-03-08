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
import { Video, ResizeMode } from "expo-av";
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
        ]}>
        {/* Video, Photo, or Voice background */}
        {tail?.previewUrl ? (
          <>
            <Video
              source={{ uri: tail.previewUrl }}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: 12 }}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
            <View style={{
              position: "absolute", inset: 0, borderRadius: 12,
              backgroundColor: "rgba(0,0,0,0.25)",
            }} />
          </>
        ) : tail?.mediaUrl ? (
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
        ) : tail?.tailType === "VOICE" ? (
          <View style={{ position: "absolute", inset: 0, justifyContent: "center", alignItems: "center", backgroundColor: cfg.glow }}>
            <Text style={{ fontSize: 32 }}>🎤</Text>
          </View>
        ) : (
          <View style={{
            position: "absolute", top: -20, left: -20,
            width: CARD_SIZE * 0.8, height: CARD_SIZE * 0.8,
            borderRadius: CARD_SIZE,
            backgroundColor: cfg.glow,
          }} />
        )}


        {/* Top row — emoji only */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "flex-start", zIndex: 1 }}>
          <Text style={{ fontSize: 18, lineHeight: 22 }}>{cfg.icon}</Text>
        </View>

        {/* Middle spacer */}
        <View style={{ flex: 1, zIndex: 1 }} />

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
  const [caught, setCaught] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 }),
      Animated.timing(bgOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const close = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: SH, duration: 260, useNativeDriver: true }),
      Animated.timing(bgOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(onClose);
  };

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
    onPanResponderMove: (_, g) => { if (g.dy > 0) panY.setValue(g.dy); },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 80 || g.vy > 0.8) close();
      else Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
    },
  })).current;

  if (!tail) return null;
  const cfg = getType(tail.tailType);
  const tlText = timeLeft(tail.expiresAt);
  const hasMedia = tail.mediaUrl || tail.meta?.image;
  const spotsLeft = tail.catchLimit != null ? Math.max(0, tail.catchLimit - (tail.catchCount || 0)) : null;

  const handleCatch = () => {
    setCaught(true);
    onCatch?.(tail);
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.82)", opacity: bgOpacity }]}>
        <TouchableWithoutFeedback onPress={close}><View style={{ flex: 1 }} /></TouchableWithoutFeedback>
      </Animated.View>

      {/* Full card */}
      <Animated.View
        style={{
          position: "absolute",
          left: 14, right: 14, bottom: 16,
          transform: [{ translateY: Animated.add(translateY, panY) }],
          borderRadius: 28,
          overflow: "hidden",
          backgroundColor: "#0D1220",
          borderWidth: 1.5, borderColor: `${cfg.color}35`,
          shadowColor: cfg.color,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          maxHeight: SH * 0.82,
        }}
        {...panResponder.panHandlers}
      >
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

          {/* ── Full media (65% screen height) ── */}
          {hasMedia ? (
            <View style={{ width: "100%", height: SH * 0.32, position: "relative" }}>
              <Image
                source={{ uri: tail.mediaUrl || tail.meta?.image }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              {/* Dark gradient over bottom of image */}
              <View style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
                backgroundColor: "rgba(0,0,0,0.55)",
              }} />
              {/* Close button top right */}
              <TouchableOpacity onPress={close} hitSlop={16}
                style={{
                  position: "absolute", top: 16, right: 16,
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  alignItems: "center", justifyContent: "center",
                }}>
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}>✕</Text>
              </TouchableOpacity>
              {/* Floating pill over bottom of image */}
              <View style={{
                position: "absolute", bottom: 14, left: 14, right: 14,
                flexDirection: "row", alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(12px)",
                borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
                borderWidth: 1, borderColor: `${cfg.color}30`,
                gap: 8,
              }}>
                <Text style={{ fontSize: 14 }}>{cfg.icon}</Text>
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>@{tail.from}</Text>
                <View style={{ flex: 1 }} />
                {tlText && (
                  <Text style={{ color: cfg.color, fontSize: 10, fontWeight: "800" }}>⏱ {tlText}</Text>
                )}
                {spotsLeft !== null && (
                  <View style={{ backgroundColor: "rgba(239,68,68,0.85)",
                    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "900" }}>{spotsLeft} left</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            /* No media — compact header */
            <View style={{ paddingTop: 14, paddingHorizontal: 20, paddingBottom: 8 }}>
              <View style={{ alignItems: "center", marginBottom: 8 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: `${cfg.color}40` }} />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 22 }}>{cfg.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>@{tail.from}</Text>
                  {tlText && <Text style={{ color: cfg.color, fontSize: 11 }}>⏱ {tlText}</Text>}
                </View>
                <TouchableOpacity onPress={close} hitSlop={12}>
                  <Text style={{ color: "#475569", fontSize: 18, fontWeight: "900" }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Drag handle */}
          {hasMedia && (
            <View style={{ alignItems: "center", paddingTop: 10 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#1E293B" }} />
            </View>
          )}

          {/* ── Content area ── */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 16 }}>

            {/* Hook message */}
            {!!tail.message && (
              <Text style={{ color: "#E2E8F0", fontSize: 17, lineHeight: 26, fontWeight: "500" }}>
                {tail.message}
              </Text>
            )}

            {/* ── BIG reveal box ── */}
            {tail?.reveal && (
              <View style={{
                borderRadius: 20, borderWidth: 1.5,
                borderColor: `${cfg.color}50`,
                backgroundColor: `${cfg.color}0D`,
                overflow: "hidden",
              }}>
                {/* Reveal kind label */}
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 6,
                  paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
                  borderBottomWidth: 1, borderBottomColor: `${cfg.color}20`,
                }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.color }} />
                  <Text style={{ color: cfg.color, fontSize: 10, fontWeight: "900",
                    textTransform: "uppercase", letterSpacing: 1.5 }}>
                    {tail.reveal.kind === "coupon" ? "Coupon Code"
                      : tail.reveal.kind === "message" ? "Message"
                      : tail.reveal.kind === "emoji" ? "Reaction"
                      : tail.reveal.kind === "gift" ? "Gift"
                      : tail.reveal.kind === "voice" ? "Voice Note"
                      : tail.reveal.kind === "url" ? "Link"
                      : "Reveal"}
                  </Text>
                </View>

                {/* Reveal content — BIG */}
                <View style={{ padding: 20, alignItems: "center", gap: 12 }}>

                  {tail.reveal.kind === "message" && (
                    <Text style={{ color: "#F1F5F9", fontSize: 18, lineHeight: 28,
                      textAlign: "center", fontWeight: "500" }}>
                      {tail.reveal.text}
                    </Text>
                  )}

                  {tail.reveal.kind === "coupon" && (
                    <View style={{ alignItems: "center", gap: 8, width: "100%" }}>
                      <View style={{
                        borderWidth: 2, borderColor: cfg.color, borderStyle: "dashed",
                        borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24,
                        width: "100%", alignItems: "center",
                        backgroundColor: `${cfg.color}08`,
                      }}>
                        <Text style={{ color: "#64748B", fontSize: 11, fontWeight: "800",
                          letterSpacing: 2, marginBottom: 6 }}>TAP TO COPY</Text>
                        <Text style={{ color: cfg.color, fontSize: 28, fontWeight: "900",
                          letterSpacing: 4 }}>{tail.reveal.code}</Text>
                      </View>
                    </View>
                  )}

                  {tail.reveal.kind === "emoji" && (
                    <>
                      <Text style={{ fontSize: 80 }}>{tail.reveal.emoji}</Text>
                      <Text style={{ color: "#64748B", fontSize: 13 }}>@{tail.from} sent you this</Text>
                    </>
                  )}

                  {tail.reveal.kind === "gift" && (
                    <>
                      <Text style={{ fontSize: 48 }}>💰</Text>
                      <Text style={{ color: "#F43F8E", fontSize: 42, fontWeight: "900",
                        letterSpacing: -1 }}>${tail.reveal.amount}</Text>
                      {tail.reveal.message && (
                        <Text style={{ color: "#94A3B8", fontSize: 14, textAlign: "center",
                          lineHeight: 22 }}>{tail.reveal.message}</Text>
                      )}
                      <View style={{ flexDirection: "row", flexWrap: "wrap",
                        gap: 8, justifyContent: "center", marginTop: 4 }}>
                        {(tail.reveal.paymentApps || ["cashapp","venmo"]).map(app => (
                          <TouchableOpacity key={app} style={{
                            paddingHorizontal: 14, paddingVertical: 10,
                            borderRadius: 12, backgroundColor: "rgba(244,63,142,0.12)",
                            borderWidth: 1.5, borderColor: "rgba(244,63,142,0.35)",
                          }}>
                            <Text style={{ color: "#F43F8E", fontWeight: "900", fontSize: 13 }}>
                              {app === "cashapp" ? "💵 Cash App"
                                : app === "venmo" ? "🔵 Venmo"
                                : app === "paypal" ? "🅿️ PayPal"
                                : "🍎 Apple Pay"}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

                  {tail.reveal.kind === "voice" && (
                    <>
                      <View style={{
                        width: 72, height: 72, borderRadius: 36,
                        backgroundColor: `${cfg.color}20`,
                        borderWidth: 2, borderColor: `${cfg.color}50`,
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <Text style={{ fontSize: 32 }}>🎙</Text>
                      </View>
                      <Text style={{ color: "#94A3B8", fontSize: 14 }}>
                        Voice note from @{tail.from}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 3, alignItems: "center" }}>
                        {[...Array(20)].map((_, i) => (
                          <View key={i} style={{
                            width: 3, borderRadius: 2,
                            height: Math.random() > 0.5 ? 24 : 12,
                            backgroundColor: `${cfg.color}60`,
                          }} />
                        ))}
                      </View>
                    </>
                  )}

                  {tail.reveal.kind === "url" && (
                    <>
                      <Text style={{ fontSize: 36 }}>🔗</Text>
                      <Text style={{ color: cfg.color, fontSize: 14, fontWeight: "700",
                        textAlign: "center" }} numberOfLines={2}>
                        {tail.reveal.url || tail.url}
                      </Text>
                    </>
                  )}

                </View>
              </View>
            )}

            {/* Stats row */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={[styles.statChip, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}30` }]}>
                <Text style={{ color: cfg.color, fontSize: 11, fontWeight: "900" }}>
                  🎯 {tail.catchCount || 0} caught
                </Text>
              </View>
              {spotsLeft !== null && (
                <View style={[styles.statChip, { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.2)" }]}>
                  <Text style={{ color: "#EF4444", fontSize: 11, fontWeight: "900" }}>{spotsLeft} left</Text>
                </View>
              )}
            </View>

            {/* Reactions */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              {["🔥", "💯", "👀", "🎯"].map((emoji) => (
                <TouchableOpacity key={emoji} onPress={() => onReact?.(tail.id, emoji)}
                  style={[styles.statChip, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }]}>
                  <Text style={{ fontSize: 14 }}>{emoji}</Text>
                  {tail.reactions?.[emoji] > 0 && (
                    <Text style={{ color: "#94A3B8", fontSize: 10, fontWeight: "800" }}>
                      {tail.reactions[emoji]}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Action buttons ── */}
            <View style={{ gap: 10, marginTop: 4 }}>
              {/* Big catch button */}
              <TouchableOpacity onPress={handleCatch} disabled={caught}
                style={{
                  paddingVertical: 18, borderRadius: 20,
                  backgroundColor: caught ? "#1E293B" : cfg.color,
                  alignItems: "center",
                  shadowColor: cfg.color,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: caught ? 0 : 0.45,
                  shadowRadius: 16,
                }}>
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 17 }}>
                  {caught ? "✓ Caught" : `🎯 Catch Tail`}
                </Text>
              </TouchableOpacity>

              {/* Link button below if has URL */}
              {tail.url && (
                <TouchableOpacity
                  onPress={() => onOpenLink?.(tail.monetization?.monetizedUrl || tail.url)}
                  style={{
                    paddingVertical: 14, borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: tail.monetization?.hasMonetizedUrl ? "#22C55E" : "#1E293B",
                    backgroundColor: tail.monetization?.hasMonetizedUrl
                      ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                    alignItems: "center",
                  }}>
                  <Text style={{
                    color: tail.monetization?.hasMonetizedUrl ? "#22C55E" : "#64748B",
                    fontWeight: "900", fontSize: 14,
                  }}>
                    {tail.monetization?.hasMonetizedUrl ? "💰 Open & Earn" : "🔗 Open Link"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

          </View>
        </ScrollView>
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
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const visible = {};
    viewableItems.forEach(({ item }) => {
      if (item?._type === "tail") visible[item.id] = true;
    });
    setVisibleCards(visible);
  }).current;
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 30,
  }).current;

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
      from: "jordan.archivo",
      message: "caught these for $40 reselling for 3x 👟 only 4 left",
      catchLimit: 4, catchCount: 0,
      expiresAt: Date.now() + 3600000 * 2,
      energy: { current: 100 },
      reveal: { kind: "coupon", code: "AIRMAX40" },
      mediaUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
      previewUrl: "https://www.pexels.com/download/video/3163534/",
    },
    {
      id: "demo_2", _type: "tail", tailType: "NOW",
      from: "maya.eats.nyc",
      message: "this ramen is actually insane 😭 2hr wait but worth it",
      catchLimit: null, catchCount: 31,
      expiresAt: Date.now() + 1800000,
      energy: { current: 99 },
      reveal: { kind: "message", text: "Ichiran Ramen, 132 W 49th St. Go Tuesday, no wait 🤫" },
      mediaUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600",
      previewUrl: "https://videos.pexels.com/video-files/3163534/3163534-sd_640_360_30fps.mp4",
    },
    {
      id: "demo_3", _type: "tail", tailType: "GIFT",
      from: "dre.williams",
      message: "happy bday bro lunch on me 🎂",
      catchLimit: 1, catchCount: 0,
      expiresAt: Date.now() + 3600000 * 24,
      energy: { current: 90 },
      reveal: { kind: "gift", amount: 25, paymentApps: ["cashapp","venmo"],
        message: "get something good, happy birthday!" },
      mediaUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600",
      previewUrl: "https://videos.pexels.com/video-files/3209828/3209828-sd_640_360_25fps.mp4",
    },
    {
      id: "demo_4", _type: "tail", tailType: "DROP",
      from: "techdrops_",
      message: "airpods pro $189 — lowest ever. 8 left before price goes back up",
      catchLimit: 8, catchCount: 6,
      expiresAt: Date.now() + 3600000,
      energy: { current: 95 },
      reveal: { kind: "url", url: "https://amazon.com" },
      mediaUrl: "https://images.unsplash.com/photo-1588423771073-b8903fead85b?w=600",
      previewUrl: "https://videos.pexels.com/video-files/4793504/4793504-sd_640_360_25fps.mp4",
    },
    {
      id: "demo_5", _type: "tail", tailType: "NOW",
      from: "coach.rina.fit",
      message: "going live in 10mins — free HIIT 🔥 catch for zoom link",
      catchLimit: 30, catchCount: 18,
      expiresAt: Date.now() + 600000,
      energy: { current: 100 },
      reveal: { kind: "url", url: "https://zoom.us/j/demo" },
      mediaUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600",
      previewUrl: "https://videos.pexels.com/video-files/3045163/3045163-sd_640_360_25fps.mp4",
    },
    {
      id: "demo_6", _type: "tail", tailType: "LOOK",
      from: "zara.archive__",
      message: "found this for $12 at the thrift 👗 styling inspo inside",
      catchLimit: null, catchCount: 89,
      expiresAt: Date.now() + 3600000 * 48,
      energy: { current: 55 },
      reveal: { kind: "message", text: "Goodwill on Broadway & 79th. Tuesday afternoons restock 🔑" },
      mediaUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      previewUrl: "https://videos.pexels.com/video-files/3571264/3571264-sd_640_360_30fps.mp4",
    },
    {
      id: "demo_7", _type: "tail", tailType: "GEO",
      from: "rooftop.social",
      message: "free drinks til 10pm — catch for address 📍 tonight only",
      catchLimit: 50, catchCount: 34,
      expiresAt: Date.now() + 3600000 * 4,
      energy: { current: 78 },
      geo: { distance: 400, distanceLabel: "0.4km" },
      reveal: { kind: "message", text: "230 Fifth Ave rooftop. Tell them you caught the tail 🦊" },
      mediaUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600",
      previewUrl: "https://videos.pexels.com/video-files/2795405/2795405-sd_640_360_30fps.mp4",
    },
    {
      id: "demo_8", _type: "tail", tailType: "DROP",
      from: "sneaker.plug.atl",
      message: "2 pairs jordan 4s retail — first come first serve 🚨",
      catchLimit: 2, catchCount: 0,
      expiresAt: Date.now() + 3600000 * 3,
      energy: { current: 100 },
      reveal: { kind: "message", text: "Text 404-xxx-xxxx, say you caught the tail. Pickup only ATL." },
      mediaUrl: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600",
      previewUrl: "https://videos.pexels.com/video-files/3926589/3926589-sd_640_360_30fps.mp4",
    },
    {
      id: "demo_9", _type: "tail", tailType: "CHAIN",
      from: "marcus.wav",
      message: "passed this to 200 people — something crazy inside 🔗 keep going",
      catchLimit: null, catchCount: 201,
      expiresAt: Date.now() + 3600000 * 12,
      energy: { current: 65 },
      reveal: { kind: "emoji", emoji: "🔥" },
      mediaUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600",
      previewUrl: "https://videos.pexels.com/video-files/4325579/4325579-sd_640_360_30fps.mp4",
    },
    {
      id: "demo_10", _type: "tail", tailType: "NOW",
      from: "kai.records",
      message: "dropping my mixtape in 20mins catch for early link 🎵",
      catchLimit: 100, catchCount: 67,
      expiresAt: Date.now() + 1200000,
      energy: { current: 98 },
      reveal: { kind: "url", url: "https://soundcloud.com" },
      mediaUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600",
      previewUrl: "https://videos.pexels.com/video-files/3298529/3298529-sd_640_360_25fps.mp4",
    },
    {
      id: "demo_11", _type: "tail", tailType: "LOOK",
      from: "foodie.plug.chi",
      message: "this spot been on my list 2 years 🍕 worth every penny",
      catchLimit: null, catchCount: 44,
      expiresAt: Date.now() + 3600000 * 36,
      energy: { current: 40 },
      reveal: { kind: "message", text: "Pequod's Pizza, Morton Grove. Caramelized crust deep dish. Cash only." },
      mediaUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
      previewUrl: "https://videos.pexels.com/video-files/3926589/3926589-uhd_2560_1440_30fps.mp4",
    },
    {
      id: "demo_12", _type: "tail", tailType: "GIFT",
      from: "tailme_drops",
      message: "first 3 to catch get $10 on us ☕ morning coffee on Tail Me",
      catchLimit: 3, catchCount: 1,
      expiresAt: Date.now() + 3600000,
      energy: { current: 85 },
      reveal: { kind: "gift", amount: 10, paymentApps: ["cashapp","venmo","paypal"],
        message: "get your morning coffee, on us ☕" },
      mediaUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600",
      previewUrl: "https://videos.pexels.com/video-files/4325579/4325579-uhd_2560_1440_30fps.mp4",
    },
    {
      id: "demo_13", _type: "tail", tailType: "DROP",
      from: "supreme.resell",
      message: "supreme box logo hoodie size L — $180 retail 👀",
      catchLimit: 1, catchCount: 0,
      expiresAt: Date.now() + 3600000 * 6,
      energy: { current: 92 },
      reveal: { kind: "message", text: "DM @supreme.resell with the word CAUGHT for checkout link" },
      mediaUrl: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600",
      previewUrl: "https://videos.pexels.com/video-files/3045163/3045163-uhd_2560_1440_25fps.mp4",
    },
    {
      id: "demo_14", _type: "tail", tailType: "NOW",
      from: "chef.leon.atl",
      message: "making my grandma jollof recipe live rn 🍛 catch for full recipe",
      catchLimit: null, catchCount: 156,
      expiresAt: Date.now() + 2700000,
      energy: { current: 97 },
      reveal: { kind: "url", url: "https://youtube.com/live/demo" },
      mediaUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600",
      previewUrl: "https://videos.pexels.com/video-files/3298529/3298529-uhd_2560_1440_25fps.mp4",
    },
    {
      id: "demo_15", _type: "tail", tailType: "LOOK",
      from: "crypto.zoe",
      message: "made $4k today on this play 📈 strategy inside",
      catchLimit: null, catchCount: 203,
      expiresAt: Date.now() + 3600000 * 72,
      energy: { current: 30 },
      reveal: { kind: "message", text: "SOL/USDC on Jupiter. Buy dips below $120, sell at $135. Set stop loss at $115." },
      mediaUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600",
      previewUrl: "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4",
    },
    {
      id: "demo_16", _type: "tail", tailType: "GEO",
      from: "popup.miami",
      message: "popup shop open for 2 hours only 🛍️ catch for exact location",
      catchLimit: 200, catchCount: 89,
      expiresAt: Date.now() + 7200000,
      energy: { current: 72 },
      geo: { distance: 1200, distanceLabel: "1.2km" },
      reveal: { kind: "message", text: "Wynwood Walls parking lot. Look for the orange tent. 12-2pm only." },
      mediaUrl: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600",
      previewUrl: "https://videos.pexels.com/video-files/2795405/2795405-uhd_2560_1440_30fps.mp4",
    },
    {
      id: "demo_17", _type: "tail", tailType: "CHAIN",
      from: "lex.thoughts",
      message: "best life advice I ever got — pass it forward 🔗",
      catchLimit: null, catchCount: 892,
      expiresAt: Date.now() + 3600000 * 168,
      energy: { current: 20 },
      reveal: { kind: "message", text: "Stop waiting to feel ready. You never will. Start now, figure it out as you go. That's it." },
      mediaUrl: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600",
      previewUrl: "https://videos.pexels.com/video-files/4793504/4793504-uhd_2560_1440_25fps.mp4",
    },
    {
      id: "demo_18", _type: "tail", tailType: "DROP",
      from: "concert.drops",
      message: "2x front row Travis Scott — $200 face value 🎤 2 left",
      catchLimit: 2, catchCount: 0,
      expiresAt: Date.now() + 3600000 * 5,
      energy: { current: 100 },
      reveal: { kind: "message", text: "Venmo $200 to @concert-drops, include your email. Tickets sent within 1hr." },
      mediaUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600",
      previewUrl: "https://videos.pexels.com/video-files/3045163/3045163-uhd_2560_1440_25fps.mp4",
    },
    {
      id: "demo_19", _type: "tail", tailType: "GIFT",
      from: "ana.sophia__",
      message: "girl ur gonna love this place catch for the rec 💅",
      catchLimit: 1, catchCount: 0,
      expiresAt: Date.now() + 3600000 * 48,
      energy: { current: 88 },
      reveal: { kind: "message", text: "Ciel Spa on Madison. Ask for Rosa, tell her Ana sent you. She'll take care of you 🤍" },
      mediaUrl: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600",
      previewUrl: "https://videos.pexels.com/video-files/3192220/3192220-uhd_2560_1440_25fps.mp4",
    },
    {
      id: "demo_20", _type: "tail", tailType: "NOW",
      from: "nba.plug",
      message: "giving away 2 courtside tickets tonight Lakers game 🏀 catch now",
      catchLimit: 2, catchCount: 0,
      expiresAt: Date.now() + 900000,
      energy: { current: 100 },
      reveal: { kind: "message", text: "DM me your CashApp in the next 5 mins. Will call guest services with your name." },
      mediaUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600",
      previewUrl: "https://videos.pexels.com/video-files/6774279/6774279-uhd_3840_2160_25fps.mp4",
    },
  ];

  // Build grid data — pad to multiple of 3 with placeholders
  const gridData = React.useMemo(() => {
    const source = selectedCategory === "following"
      ? (followingFeed.length > 0 ? followingFeed : DEMO_TAILS)
      : [...DEMO_TAILS, ...allTails];
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
    const isVis = true;
    return (
      <VideoPreviewCard
        tail={item}
        onTap={handleTap}
        onLongPress={handleLongPress}
        isHighlighted={isHighlighted}
        dimmed={isDimmed}
        isVisible={isVis}
      />
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
