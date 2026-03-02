// ============================================
// TailCard.js — Tail Me (REBUILT)
// ✅ Full bleed image with gradient overlay
// ✅ Type badges (LOOK / NOW / DROP)
// ✅ DROP progress bar + live spots counter
// ✅ CLOSED overlay when DROP is full
// ✅ Urgency colors (green → amber → red)
// ✅ Live catch counter with pulse dot
// ✅ Reveal hint teaser
// ✅ Expiry timer (urgent when < 1h)
// ✅ Reactions row
// ✅ AD badge
// ============================================

import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function timeLeft(expiresAt) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d left`;
  if (h > 0)   return `${h}h ${m}m left`;
  return `${m}m left`;
}

function isUrgent(expiresAt) {
  if (!expiresAt) return false;
  return (new Date(expiresAt).getTime() - Date.now()) < 3600000;
}

function dropFillColor(pct) {
  if (pct < 0.5) return "#22C55E";
  if (pct < 0.8) return "#F59E0B";
  return "#EF4444";
}

function PulseDot({ color = "#22C55E" }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{
      width: 6, height: 6, borderRadius: 3,
      backgroundColor: color, opacity: anim,
    }} />
  );
}

export default function TailCard({ tail, onPressTail, colors: C, onReact }) {
  const t = tail || {};
  const expired  = !!t.expired || (t.expiresAt && Date.now() > t.expiresAt);
  const tailType = (t.tailType || "LOOK").toUpperCase();
  const isDrop   = tailType === "DROP";
  const isNow    = tailType === "NOW";

  const fillPct    = isDrop && t.catchLimit ? Math.min(1, (t.catchCount || 0) / t.catchLimit) : 0;
  const isFull     = isDrop && t.catchLimit != null && (t.catchCount || 0) >= t.catchLimit;
  const spotsLeft  = isDrop && t.catchLimit != null ? Math.max(0, t.catchLimit - (t.catchCount || 0)) : null;
  const isCritical = isDrop && spotsLeft !== null && spotsLeft <= 3 && spotsLeft > 0;
  const fillColor  = dropFillColor(fillPct);

  const timer  = useMemo(() => timeLeft(t.expiresAt), [t.expiresAt]);
  const urgent = isUrgent(t.expiresAt);

  const TYPE = {
    LOOK: { icon: "👀", badgeBg: "rgba(124,58,237,0.75)", btnColor: "#7C3AED", btnLabel: "🎯 Catch this Tail",        revealColor: "#7C3AED", revealBorder: "rgba(124,58,237,0.25)", revealBg: "rgba(124,58,237,0.07)" },
    NOW:  { icon: "⚡", badgeBg: "rgba(239,68,68,0.75)",  btnColor: "#EF4444", btnLabel: "⚡ Catch before it's gone", revealColor: "#EF4444", revealBorder: "rgba(239,68,68,0.25)",  revealBg: "rgba(239,68,68,0.07)"  },
    DROP: { icon: "💧", badgeBg: "rgba(245,158,11,0.75)", btnColor: "#D97706", btnLabel: spotsLeft !== null ? `💧 Catch Drop — ${spotsLeft} left` : "💧 Catch Drop", revealColor: "#F59E0B", revealBorder: "rgba(245,158,11,0.25)", revealBg: "rgba(245,158,11,0.07)" },
  };
  const tc = TYPE[tailType] || TYPE.LOOK;

  const revealHint = (t.hasReveal || t.reveal)
    ? t.reveal?.kind === "coupon" ? "🎟 Catch to unlock coupon code"
    : t.reveal?.kind === "url"    ? "🔗 Catch to unlock exclusive link"
    : "🎁 Catch to unlock the reveal"
    : null;

  const hasImage = !!t.mediaUrl && t.mediaType === "image";
  const cardBorderColor = expired || isFull ? (C?.border || "#1E293B") : tc.btnColor + "55";

  return (
    <View style={{
      marginBottom: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: cardBorderColor,
      overflow: "hidden",
      opacity: expired || isFull ? 0.6 : 1,
      backgroundColor: C?.panel || "#0D1220",
    }}>

      {/* ── IMAGE / ICON HEADER ── */}
      <TouchableOpacity
        onPress={() => !expired && !isFull && onPressTail?.(t)}
        activeOpacity={0.92}
        disabled={expired || isFull}
      >
        {hasImage ? (
          <View>
            <Image
              source={{ uri: t.mediaUrl }}
              style={{ width: "100%", height: 190 }}
              resizeMode="cover"
            />
            {/* Bottom fade */}
            <View style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
              backgroundColor: C?.panel || "#0D1220",
              opacity: 0.6,
            }} />
          </View>
        ) : (
          <View style={{
            height: 100,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: tailType === "NOW"
              ? "rgba(239,68,68,0.06)"
              : tailType === "DROP"
              ? "rgba(245,158,11,0.06)"
              : "rgba(124,58,237,0.06)",
          }}>
            <Text style={{ fontSize: 40 }}>{tc.icon}</Text>
          </View>
        )}

        {/* TYPE BADGE — top left */}
        <View style={{
          position: "absolute", top: 10, left: 10,
          paddingVertical: 4, paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor: tc.badgeBg,
          borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
          flexDirection: "row", alignItems: "center", gap: 4,
        }}>
          <Text style={{ fontSize: 9 }}>{tc.icon}</Text>
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 10, letterSpacing: 1 }}>
            {tailType}
          </Text>
        </View>

        {/* AD BADGE — top right */}
        {t.isAd ? (
          <View style={{
            position: "absolute", top: 10, right: 10,
            paddingVertical: 3, paddingHorizontal: 8,
            borderRadius: 6,
            backgroundColor: "rgba(245,158,11,0.15)",
            borderWidth: 1, borderColor: "rgba(245,158,11,0.4)",
          }}>
            <Text style={{ color: "#F59E0B", fontWeight: "900", fontSize: 9, letterSpacing: 1 }}>AD</Text>
          </View>
        ) : timer ? (
          /* EXPIRY TIMER — top right */
          <View style={{
            position: "absolute", top: 10, right: 10,
            paddingVertical: 4, paddingHorizontal: 10,
            borderRadius: 999,
            backgroundColor: "rgba(7,10,15,0.8)",
            borderWidth: 1,
            borderColor: urgent ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)",
            flexDirection: "row", alignItems: "center", gap: 4,
          }}>
            <Text style={{ fontSize: 9 }}>{urgent ? "🔴" : "⏱"}</Text>
            <Text style={{
              color: urgent ? "#EF4444" : "#94A3B8",
              fontWeight: "900", fontSize: 10,
            }}>
              {timer}
            </Text>
          </View>
        ) : null}

        {/* CLOSED OVERLAY */}
        {isFull && (
          <View style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(7,10,15,0.6)",
            alignItems: "center", justifyContent: "center",
          }}>
            <View style={{
              paddingVertical: 10, paddingHorizontal: 22,
              borderRadius: 999,
              backgroundColor: "rgba(13,18,32,0.96)",
              borderWidth: 1, borderColor: C?.border || "#1E293B",
            }}>
              <Text style={{ color: C?.dim || "#64748B", fontWeight: "900", fontSize: 13, letterSpacing: 0.5 }}>
                🔒 CLOSED · {t.catchCount}/{t.catchLimit} caught
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* ── SENDER + MESSAGE ── */}
      <View style={{ paddingHorizontal: 14, paddingTop: 12, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "700", fontSize: 12 }}>
            @{t.from || "unknown"}
          </Text>
          {t.isAd && (
            <Text style={{ color: C?.dim || "#64748B", fontSize: 11 }}>· Sponsored</Text>
          )}
        </View>
        {!!t.message && (
          <Text style={{
            color: C?.text || "#E5E7EB",
            fontWeight: "800",
            fontSize: 15,
            lineHeight: 21,
          }} numberOfLines={2}>
            "{t.message}"
          </Text>
        )}
      </View>

      {/* ── REVEAL HINT ── */}
      {revealHint && !expired && !isFull && (
        <View style={{
          marginHorizontal: 14, marginTop: 10,
          paddingVertical: 8, paddingHorizontal: 12,
          borderRadius: 10,
          backgroundColor: tc.revealBg,
          borderWidth: 1, borderColor: tc.revealBorder,
        }}>
          <Text style={{ color: tc.revealColor, fontWeight: "700", fontSize: 12 }}>
            {revealHint}
          </Text>
        </View>
      )}

      {/* ── DROP PROGRESS BAR ── */}
      {isDrop && t.catchLimit != null && (
        <View style={{ paddingHorizontal: 14, marginTop: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{
              fontSize: 12, fontWeight: "900",
              color: isFull ? (C?.dim || "#64748B")
                : isCritical ? "#EF4444"
                : "#F59E0B",
            }}>
              {isFull
                ? "All spots taken"
                : isCritical
                ? `⚠️ ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`
                : `${spotsLeft} spots left`}
            </Text>
            <Text style={{ fontSize: 11, color: C?.dim || "#64748B", fontWeight: "700" }}>
              {t.catchCount || 0} / {t.catchLimit} caught
            </Text>
          </View>
          <View style={{
            height: 5, borderRadius: 999,
            backgroundColor: C?.border || "#1E293B",
            overflow: "hidden",
          }}>
            <View style={{
              height: 5, borderRadius: 999,
              width: `${Math.min(100, Math.round(fillPct * 100))}%`,
              backgroundColor: fillColor,
            }} />
          </View>
        </View>
      )}

      {/* ── REACTIONS + LIVE COUNT ── */}
      <View style={{
        paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4,
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", gap: 8,
      }}>
        <View style={{ flexDirection: "row", gap: 6, flex: 1 }}>
          {Object.entries(t.reactions || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([emoji, count]) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => onReact?.(t.id, emoji)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 3,
                  paddingVertical: 5, paddingHorizontal: 9,
                  borderRadius: 999,
                  borderWidth: 1, borderColor: C?.border || "#1E293B",
                  backgroundColor: "rgba(255,255,255,0.03)",
                }}
              >
                <Text style={{ fontSize: 12 }}>{emoji}</Text>
                <Text style={{ color: C?.muted || "#94A3B8", fontSize: 10, fontWeight: "700" }}>
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
        </View>

        {!expired && !isFull && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <PulseDot color={isNow ? "#EF4444" : "#22C55E"} />
            <Text style={{ color: C?.dim || "#64748B", fontSize: 11, fontWeight: "900" }}>
              {t.catchCount || 0} caught
            </Text>
          </View>
        )}
      </View>

      {/* ── DIVIDER ── */}
      <View style={{ height: 1, backgroundColor: C?.border || "#1E293B", marginHorizontal: 14, marginTop: 8 }} />

      {/* ── CATCH BUTTON ── */}
      <View style={{ padding: 12 }}>
        {expired ? (
          <View style={{
            paddingVertical: 12, borderRadius: 14,
            backgroundColor: C?.border || "#1E293B",
            alignItems: "center",
          }}>
            <Text style={{ color: C?.dim || "#64748B", fontWeight: "900" }}>⏰ Expired</Text>
          </View>
        ) : isFull ? (
          <View style={{
            paddingVertical: 12, borderRadius: 14,
            backgroundColor: C?.border || "#1E293B",
            alignItems: "center",
          }}>
            <Text style={{ color: C?.dim || "#64748B", fontWeight: "900" }}>🔒 Drop Closed</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => onPressTail?.(t)}
            activeOpacity={0.85}
            style={{
              paddingVertical: 13, borderRadius: 14,
              backgroundColor: tc.btnColor,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}>
              {tc.btnLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}