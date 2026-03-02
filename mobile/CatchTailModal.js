// ============================================================
// CatchTailModal.js — Tail Me Production
// ✅ Visual burn ring countdown
// ✅ Geo lock with distance indicator
// ✅ Mint #1 badge (first catcher)
// ✅ Price display from scraped meta
// ✅ DROP spots remaining bar
// ✅ Type-colored action button
// ✅ Share button (after preview)
// ✅ React row
// ✅ Smooth open animation
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ── helpers ──────────────────────────────────────────────
function timeLeft(expiresAt) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h >= 24) return `${Math.floor(h / 24)}d left`;
  if (h > 0)   return `${h}h ${m}m left`;
  if (m > 0)   return `${m}m ${s}s left`;
  return `${s}s left`;
}

function isUrgent(expiresAt) {
  if (!expiresAt) return false;
  return Date.now() > new Date(expiresAt).getTime() - 300000; // < 5 min
}

const TYPE_CONFIG = {
  LOOK:  { icon: "👀", color: "#7C3AED", label: "LOOK",  btn: "🎯 Catch this Tail"         },
  NOW:   { icon: "⚡", color: "#EF4444", label: "NOW",   btn: "⚡ Catch before it's gone"   },
  DROP:  { icon: "💧", color: "#F59E0B", label: "DROP",  btn: "💧 Catch this Drop"          },
  CHAIN: { icon: "🔗", color: "#22C55E", label: "CHAIN", btn: "🔗 Start the Chain Hunt"     },
  GEO:   { icon: "📍", color: "#3B82F6", label: "GEO",   btn: "📍 Catch Nearby"             },
};

const QUICK_REACTIONS = ["🔥", "👀", "😍", "🎯", "💯", "👏"];

// ── Animated burn ring ────────────────────────────────────
function BurnRing({ expiresAt, size = 56, color = "#7C3AED" }) {
  const progress = useRef(new Animated.Value(1)).current;
  const urgent   = isUrgent(expiresAt);

  useEffect(() => {
    if (!expiresAt) return;
    const total  = new Date(expiresAt).getTime() - Date.now();
    if (total <= 0) return;
    const anim = Animated.timing(progress, {
      toValue: 0, duration: total, useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [expiresAt]);

  const CIRCUMFERENCE = 2 * Math.PI * (size / 2 - 4);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Background ring */}
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 3, borderColor: "rgba(255,255,255,0.1)",
        position: "absolute",
      }} />
      {/* Foreground ring using border trick */}
      <Animated.View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 3,
        borderColor: urgent ? "#EF4444" : color,
        opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
        position: "absolute",
      }} />
      <Text style={{ fontSize: size > 44 ? 22 : 16 }}>
        {urgent ? "⏰" : "⏱"}
      </Text>
    </View>
  );
}

// ── PulseDot ──────────────────────────────────────────────
function PulseDot({ color = "#22C55E" }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={{
      width: 7, height: 7, borderRadius: 3.5,
      backgroundColor: color, opacity: anim,
    }} />
  );
}

// ── Main component ────────────────────────────────────────
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
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true,
        tension: 65, friction: 11,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  // Live countdown tick
  useEffect(() => {
    if (!visible || !tail?.expiresAt) return;
    const tick = () => setTimer(timeLeft(tail.expiresAt));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [visible, tail?.expiresAt]);

  const t = tail || {};
  const tailType   = (t.tailType || "LOOK").toUpperCase();
  const tc         = TYPE_CONFIG[tailType] || TYPE_CONFIG.LOOK;
  const expired    = !!t.expired || (t.expiresAt && Date.now() > t.expiresAt);
  const urgent     = isUrgent(t.expiresAt);

  // DROP bar
  const isDrop   = tailType === "DROP";
  const fillPct  = isDrop && t.catchLimit ? Math.min(1, (t.catchCount || 0) / t.catchLimit) : 0;
  const spotsLeft = isDrop && t.catchLimit != null
    ? Math.max(0, t.catchLimit - (t.catchCount || 0)) : null;
  const isFull   = isDrop && t.catchLimit != null && (t.catchCount || 0) >= t.catchLimit;
  const barColor = fillPct < 0.5 ? "#22C55E" : fillPct < 0.8 ? "#F59E0B" : "#EF4444";

  // Geo lock
  const isGeoLocked = !!t.geo?.distance && t.geo.distance > (t.geo.radius || 1000);

  // Image source
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
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end" }}
      >
        <Animated.View
          style={{ transform: [{ translateY: slideAnim }] }}
        >
          <Pressable
            onPress={e => e.stopPropagation()}
            style={{
              backgroundColor: C?.panel || "#0D1220",
              borderTopLeftRadius: 28, borderTopRightRadius: 28,
              borderWidth: 1, borderColor: tc.color + "44",
              maxHeight: "92%",
              overflow: "hidden",
            }}
          >
            {/* Top handle */}
            <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C?.border || "#1E293B" }} />
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
                    style={{ width: "100%", height: 200 }}
                    resizeMode="cover"
                  />
                  {/* Dark gradient fade */}
                  <View style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
                    backgroundColor: C?.panel || "#0D1220", opacity: 0.6,
                  }} />
                  {/* Type badge */}
                  <View style={{
                    position: "absolute", top: 12, left: 12,
                    flexDirection: "row", alignItems: "center", gap: 5,
                    paddingVertical: 5, paddingHorizontal: 12,
                    borderRadius: 999, backgroundColor: tc.color + "CC",
                    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
                  }}>
                    <Text style={{ fontSize: 11 }}>{tc.icon}</Text>
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 11, letterSpacing: 1 }}>
                      {tailType}
                    </Text>
                  </View>
                  {/* Timer badge */}
                  {!!timer && (
                    <View style={{
                      position: "absolute", top: 12, right: 12,
                      paddingVertical: 5, paddingHorizontal: 12,
                      borderRadius: 999, backgroundColor: "rgba(7,10,15,0.85)",
                      borderWidth: 1, borderColor: urgent ? "#EF4444" : "rgba(255,255,255,0.15)",
                    }}>
                      <Text style={{
                        color: urgent ? "#EF4444" : "#94A3B8",
                        fontWeight: "900", fontSize: 11,
                      }}>
                        {urgent ? "🔴 " : "⏱ "}{timer}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                /* No image: icon placeholder */
                <View style={{
                  height: 120, alignItems: "center", justifyContent: "center",
                  backgroundColor: tc.color + "18",
                  position: "relative",
                }}>
                  <Text style={{ fontSize: 52 }}>{tc.icon}</Text>
                  {/* Type + timer row */}
                  <View style={{
                    position: "absolute", top: 12, left: 0, right: 0,
                    flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14,
                  }}>
                    <View style={{
                      flexDirection: "row", alignItems: "center", gap: 5,
                      paddingVertical: 5, paddingHorizontal: 12,
                      borderRadius: 999, backgroundColor: tc.color + "CC",
                    }}>
                      <Text style={{ fontSize: 11 }}>{tc.icon}</Text>
                      <Text style={{ color: "#fff", fontWeight: "900", fontSize: 11 }}>{tailType}</Text>
                    </View>
                    {!!timer && (
                      <View style={{
                        paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999,
                        backgroundColor: "rgba(7,10,15,0.85)",
                        borderWidth: 1, borderColor: urgent ? "#EF4444" : "rgba(255,255,255,0.15)",
                      }}>
                        <Text style={{ color: urgent ? "#EF4444" : "#94A3B8", fontWeight: "900", fontSize: 11 }}>
                          {urgent ? "🔴 " : "⏱ "}{timer}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* ── BODY ── */}
              <View style={{ paddingHorizontal: 18, paddingTop: 14, gap: 10 }}>

                {/* Sender + stats row */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "900", fontSize: 13 }}>
                    @{t.from || "user"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <PulseDot color={tc.color} />
                    <Text style={{ color: C?.dim || "#64748B", fontSize: 12, fontWeight: "800" }}>
                      {t.catchCount || 0} caught
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={{
                  color: C?.text || "#E5E7EB", fontWeight: "900",
                  fontSize: 19, lineHeight: 24,
                }}>
                  {t.meta?.title || t.title || "Mystery Drop"}
                </Text>

                {/* Price from scrape */}
                {t.meta?.price && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ color: "#22C55E", fontWeight: "900", fontSize: 20 }}>
                      {t.meta.price}
                    </Text>
                    {t.meta?.siteName && (
                      <Text style={{ color: C?.dim || "#64748B", fontSize: 13 }}>
                        · {t.meta.siteName}
                      </Text>
                    )}
                  </View>
                )}

                {/* Message */}
                {!!t.message && (
                  <View style={{
                    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14,
                    backgroundColor: tc.color + "12",
                    borderWidth: 1, borderColor: tc.color + "30",
                  }}>
                    <Text style={{ color: C?.text || "#E5E7EB", fontStyle: "italic" }}>
                      "{t.message}"
                    </Text>
                  </View>
                )}

                {/* Reveal teaser */}
                {t.hasReveal && !expired && !isFull && (
                  <View style={{
                    flexDirection: "row", alignItems: "center", gap: 8,
                    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14,
                    backgroundColor: tc.color + "18",
                    borderWidth: 1, borderColor: tc.color + "44",
                  }}>
                    <Text style={{ fontSize: 16 }}>
                      {tailType === "DROP" ? "💧" : tailType === "CHAIN" ? "🔗" : "🎁"}
                    </Text>
                    <Text style={{ color: tc.color, fontWeight: "900", fontSize: 13 }}>
                      Catch to unlock the reveal
                    </Text>
                  </View>
                )}

                {/* Chain teaser */}
                {t.isChain && (
                  <View style={{
                    flexDirection: "row", alignItems: "center", gap: 8,
                    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14,
                    backgroundColor: "#22C55E18", borderWidth: 1, borderColor: "#22C55E44",
                  }}>
                    <Text style={{ fontSize: 16 }}>🔗</Text>
                    <Text style={{ color: "#22C55E", fontWeight: "900", fontSize: 13 }}>
                      {t.chainLength || 0}-layer chain hunt — unlock step by step
                    </Text>
                  </View>
                )}

                {/* Geo indicator */}
                {t.geo && (
                  <View style={{
                    flexDirection: "row", alignItems: "center", gap: 8,
                    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14,
                    backgroundColor: isGeoLocked ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                    borderWidth: 1, borderColor: isGeoLocked ? "#EF444444" : "#22C55E44",
                  }}>
                    <Text style={{ fontSize: 16 }}>{isGeoLocked ? "🔒" : "📍"}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        color: isGeoLocked ? "#EF4444" : "#22C55E",
                        fontWeight: "900", fontSize: 13,
                      }}>
                        {isGeoLocked
                          ? `${t.geo.distanceLabel || t.geo.distance + "m"} away — walk closer to catch`
                          : `You're within range — ${t.geo.distanceLabel || "nearby"}`}
                      </Text>
                      <Text style={{ color: C?.dim || "#64748B", fontSize: 11, marginTop: 2 }}>
                        Catch radius: {t.geo.radius >= 1000
                          ? `${(t.geo.radius / 1000).toFixed(1)}km`
                          : `${t.geo.radius}m`}
                      </Text>
                    </View>
                  </View>
                )}

                {/* DROP bar */}
                {isDrop && t.catchLimit != null && (
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{
                        fontWeight: "900", fontSize: 13,
                        color: isFull ? (C?.dim || "#64748B")
                          : spotsLeft != null && spotsLeft <= 3 ? "#EF4444"
                          : "#F59E0B",
                      }}>
                        {isFull ? "All spots taken"
                          : spotsLeft != null && spotsLeft <= 3
                            ? `⚠️ Only ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left!`
                            : `${spotsLeft} spots remaining`}
                      </Text>
                      <Text style={{ color: C?.dim || "#64748B", fontSize: 12, fontWeight: "700" }}>
                        {t.catchCount || 0}/{t.catchLimit}
                      </Text>
                    </View>
                    <View style={{
                      height: 6, borderRadius: 3,
                      backgroundColor: C?.border || "#1E293B",
                      overflow: "hidden",
                    }}>
                      <View style={{
                        height: 6, borderRadius: 3, backgroundColor: barColor,
                        width: `${Math.round(fillPct * 100)}%`,
                      }} />
                    </View>
                  </View>
                )}

                {/* Reactions */}
                {Object.keys(t.reactions || {}).length > 0 && (
                  <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                    {Object.entries(t.reactions || {})
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([emoji, count]) => (
                        <TouchableOpacity
                          key={emoji}
                          onPress={() => onReact?.(t.id, emoji)}
                          style={{
                            flexDirection: "row", alignItems: "center", gap: 4,
                            paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999,
                            borderWidth: 1, borderColor: C?.border || "#1E293B",
                            backgroundColor: "rgba(255,255,255,0.04)",
                          }}
                        >
                          <Text style={{ fontSize: 13 }}>{emoji}</Text>
                          <Text style={{ color: C?.muted || "#94A3B8", fontSize: 11, fontWeight: "700" }}>
                            {count}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                )}

                {/* Quick react row */}
                <View style={{ flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 2 }}>
                  {QUICK_REACTIONS.map(emoji => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => onReact?.(t.id, emoji)}
                      style={{
                        width: 40, height: 40, borderRadius: 20,
                        alignItems: "center", justifyContent: "center",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderWidth: 1, borderColor: C?.border || "#1E293B",
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* ── ACTION BUTTONS ── */}
                <View style={{ marginTop: 8, gap: 10 }}>

                  {/* CATCH button */}
                  {!expired && !isFull ? (
                    <TouchableOpacity
                      onPress={() => onCatch?.(t)}
                      disabled={isGeoLocked}
                      activeOpacity={0.85}
                      style={{
                        paddingVertical: 16, borderRadius: 18,
                        backgroundColor: isGeoLocked ? (C?.border || "#1E293B") : tc.color,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{
                        color: isGeoLocked ? (C?.dim || "#64748B") : "#fff",
                        fontWeight: "900", fontSize: 16,
                      }}>
                        {isGeoLocked ? `📍 ${t.geo.distanceLabel || "Too far"} away` : tc.btn}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{
                      paddingVertical: 16, borderRadius: 18,
                      backgroundColor: C?.border || "#1E293B",
                      alignItems: "center",
                    }}>
                      <Text style={{ color: C?.dim || "#64748B", fontWeight: "900", fontSize: 15 }}>
                        {expired ? "⏰ Tail Expired" : "🔒 Drop Full"}
                      </Text>
                    </View>
                  )}

                  {/* Open link */}
                  {!!t.url && (
                    <TouchableOpacity
                      onPress={onOpenLink}
                      style={{
                        paddingVertical: 14, borderRadius: 18,
                        borderWidth: 1, borderColor: C?.border || "#1E293B",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "900" }}>
                        🔗 Open Original Link
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Close */}
                  <TouchableOpacity
                    onPress={onClose}
                    style={{
                      paddingVertical: 12, alignItems: "center",
                    }}
                  >
                    <Text style={{ color: C?.dim || "#64748B", fontWeight: "800" }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}