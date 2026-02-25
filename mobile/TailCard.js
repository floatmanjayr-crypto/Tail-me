import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";

export default function TailCard({ tail, onPressTail, colors: C, onReact }) {
  const expired = !!tail?.expired;
  const isCaught = !!tail?.caught;

  const color = C || {
    bg: "#070A0F",
    panel: "#0D1220",
    panel2: "#0A1020",
    border: "#1E293B",
    text: "#E5E7EB",
    muted: "#94A3B8",
    dim: "#64748B",
    green: "#22C55E",
    amber: "#F59E0B",
    red: "#EF4444",
    brand: "#7C3AED",
  };

  // ⏳ Countdown calculation (if expiresAt exists)
  const timeLeft = useMemo(() => {
    if (!tail?.expiresAt) return null;
    const diff = new Date(tail.expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
  }, [tail?.expiresAt]);

  // 🌟 Rarity Glow
  const rarityGlow = {
    common: color.border,
    rare: "#3B82F6",
    epic: "#A855F7",
    legendary: "#F59E0B",
  };

  const glowColor = rarityGlow[tail?.rarity] || color.border;

  return (
    <View
      style={{
        marginBottom: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: glowColor,
        backgroundColor: color.panel,
        overflow: "hidden",
        shadowColor: glowColor,
        shadowOpacity: tail?.rarity && tail?.rarity !== "common" ? 0.4 : 0,
        shadowRadius: 12,
      }}
    >
      <TouchableOpacity
        onPress={() => onPressTail?.(tail)}
        disabled={expired}
        activeOpacity={0.9}
        style={{
          padding: 16,
          opacity: expired ? 0.5 : 1,
          gap: 10,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: color.muted, fontWeight: "900" }}>
            @{tail?.from || "unknown"}
          </Text>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {tail?.rarity && (
              <Text style={{ color: glowColor, fontSize: 11, fontWeight: "900" }}>
                {tail.rarity.toUpperCase()}
              </Text>
            )}

            {timeLeft && (
              <Text style={{ color: color.amber, fontSize: 11, fontWeight: "800" }}>
                ⏳ {timeLeft}
              </Text>
            )}
          </View>
        </View>

        {/* Image Preview */}
        {!!tail?.mediaUrl && tail?.mediaType === "image" && (
          <View>
            <Image
              source={{ uri: tail.mediaUrl }}
              style={{
                width: "100%",
                height: 170,
                borderRadius: 14,
                opacity: isCaught ? 1 : 0.4, // 🔒 Blur effect simulation
              }}
              resizeMode="cover"
            />

            {!isCaught && !expired && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
                  🔒 Catch to Reveal
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Title */}
        {!!(tail?.meta?.title || tail?.title) && (
          <Text
            style={{
              color: color.text,
              fontWeight: "900",
              fontSize: 16,
            }}
            numberOfLines={1}
          >
            {isCaught ? tail?.meta?.title || tail?.title : "Hidden Tail"}
          </Text>
        )}

        {/* Message Preview */}
        {!!tail?.message && (
          <Text style={{ color: color.muted }} numberOfLines={2}>
            {isCaught ? `"${tail.message}"` : "???"}
          </Text>
        )}

        {/* Footer */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 6,
          }}
        >
          <Text style={{ color: color.dim, fontSize: 12 }}>
            🔥 {Number(tail?.catchCount || 0)} caught
          </Text>

          {expired ? (
            <Text style={{ color: color.red, fontWeight: "800" }}>
              Expired
            </Text>
          ) : !isCaught ? (
            <View
              style={{
                backgroundColor: color.brand,
                paddingVertical: 6,
                paddingHorizontal: 14,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                🎯 Catch
              </Text>
            </View>
          ) : (
            <Text style={{ color: color.green, fontWeight: "800" }}>
              Unlocked
            </Text>
          )}
        </View>

        {/* Reactions (only after catch) */}
        {isCaught && !!tail?.reactionCount && tail.reactionCount > 0 && (
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(tail.reactions || {})
              .slice(0, 5)
              .map(([emoji, count]) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => onReact?.(tail.id, emoji)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: color.border,
                    backgroundColor: "rgba(255,255,255,0.04)",
                  }}
                >
                  <Text>{emoji}</Text>
                  <Text style={{ color: color.muted, fontSize: 11 }}>
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}