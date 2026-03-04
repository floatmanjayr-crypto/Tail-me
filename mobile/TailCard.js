// ============================================
// TailCard.js — Slim List Card v7
// Used in public/inbox list screens only
// Grid feed uses TailGridCard inside TailHome
// ============================================
import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

const TYPE_CONFIG = {
  NOW:   { icon: "⚡", color: "#F59E0B" },
  DROP:  { icon: "💧", color: "#EF4444" },
  GEO:   { icon: "📍", color: "#0EA5E9" },
  CHAIN: { icon: "🔗", color: "#22C55E" },
  LOOK:  { icon: "👀", color: "#7C3AED" },
};
const getType = (t) => TYPE_CONFIG[t] || TYPE_CONFIG.LOOK;

function timeLeft(expiresAt) {
  if (!expiresAt) return null;
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function PulseDot({ color }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
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
  const tailType = (t.tailType || "LOOK").toUpperCase();
  const cfg = getType(tailType);
  const expired = !!t.expired || (t.expiresAt && Date.now() > t.expiresAt);
  const isFull = t.catchLimit != null && (t.catchCount || 0) >= t.catchLimit;
  const spotsLeft = t.catchLimit != null ? Math.max(0, t.catchLimit - (t.catchCount || 0)) : null;
  const timer = timeLeft(t.expiresAt);
  const energy = t.energy?.current ?? 100;

  return (
    <TouchableOpacity
      onPress={() => !expired && !isFull && onPressTail?.(t)}
      activeOpacity={0.85}
      disabled={expired || isFull}
      style={{
        marginBottom: 8,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: expired || isFull ? C.border : `${cfg.color}50`,
        backgroundColor: C.panel,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        opacity: expired || isFull ? 0.5 : 1,
      }}
    >
      {/* Icon */}
      <View style={{
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: `${cfg.color}15`,
        alignItems: "center", justifyContent: "center",
        borderWidth: 1, borderColor: `${cfg.color}30`,
      }}>
        <Text style={{ fontSize: 20 }}>{cfg.icon}</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{
            paddingHorizontal: 6, paddingVertical: 2,
            borderRadius: 5, backgroundColor: `${cfg.color}20`,
          }}>
            <Text style={{ color: cfg.color, fontSize: 9, fontWeight: "900" }}>
              {tailType}
            </Text>
          </View>
          {tailType === "NOW" && <PulseDot color={cfg.color} />}
          {t.isAd && (
            <View style={{
              paddingHorizontal: 5, paddingVertical: 2,
              borderRadius: 4, backgroundColor: "rgba(245,158,11,0.15)",
            }}>
              <Text style={{ color: "#F59E0B", fontSize: 9, fontWeight: "900" }}>AD</Text>
            </View>
          )}
        </View>

        <Text style={{ color: C.text, fontWeight: "800", fontSize: 13 }} numberOfLines={1}>
          {t.meta?.title || t.message || t.title || "Tail"}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ color: C.dim, fontSize: 11, fontWeight: "700" }}>
            @{t.from || "user"}
          </Text>
          {timer && (
            <Text style={{ color: C.dim, fontSize: 10 }}>· {timer}</Text>
          )}
          {spotsLeft !== null && (
            <Text style={{ color: cfg.color, fontSize: 10, fontWeight: "900" }}>
              · {spotsLeft} left
            </Text>
          )}
        </View>

        {/* Energy bar */}
        <View style={{ height: 2, backgroundColor: C.border, borderRadius: 1, marginTop: 2 }}>
          <View style={{
            height: 2, width: `${Math.max(2, energy)}%`,
            backgroundColor: cfg.color, borderRadius: 1, opacity: 0.7,
          }} />
        </View>
      </View>

      {/* Catch count */}
      <View style={{ alignItems: "center", gap: 2 }}>
        <Text style={{ color: C.muted, fontSize: 16 }}>🎯</Text>
        <Text style={{ color: C.dim, fontSize: 10, fontWeight: "800" }}>
          {t.catchCount || 0}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
