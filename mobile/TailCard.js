import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export default function TailCard({ tail, onPressTail }) {
  const expired = !!tail?.expired;

  return (
    <TouchableOpacity
      onPress={() => onPressTail?.(tail)}
      disabled={expired}
      style={{
        marginBottom: 12,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#1E293B",
        backgroundColor: expired ? "#0B0F14" : "#121826",
        opacity: expired ? 0.5 : 1,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: "#E5E7EB", fontWeight: "900" }}>
          🦊 {tail?.title || "Tail"}
        </Text>
        <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
          @{tail?.from || "unknown"}
        </Text>
      </View>

      <Text style={{ color: "#94A3B8", marginTop: 6 }} numberOfLines={1}>
        {tail?.url || ""}
      </Text>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <Text style={{ color: "#6B7280", fontSize: 12 }}>
          Catches: {tail?.catchCount ?? 0}
        </Text>
        {expired && (
          <Text style={{ color: "#F87171", fontSize: 12, fontWeight: "800" }}>
            Expired
          </Text>
        )}
        {!expired && tail?.visibility === "private" && (
          <Text style={{ color: "#B4F8C0", fontSize: 12, fontWeight: "800" }}>
            Private
          </Text>
        )}
        {!expired && tail?.visibility !== "private" && (
          <Text style={{ color: "#FF5C5C", fontSize: 12, fontWeight: "800" }}>
            Public
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
