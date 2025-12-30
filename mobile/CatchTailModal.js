import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";

export default function CatchTailModal({ visible, tail, onClose, onCatch }) {
  if (!tail) return null;

  const expired = tail.expired;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" }}>
        <View
          style={{
            backgroundColor: "#0B0F14",
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            padding: 18,
            borderWidth: 1,
            borderColor: "#1E293B",
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 10 }}>
            <View style={{ width: 48, height: 4, borderRadius: 999, backgroundColor: "#1E293B" }} />
          </View>

          <Text style={{ color: "#E5E7EB", fontSize: 18, fontWeight: "900" }}>
            {tail.title || "Tail"}
          </Text>

          <Text style={{ color: "#9CA3AF", marginTop: 6 }} numberOfLines={2}>
            {tail.url}
          </Text>

          {!!tail.message && (
            <Text style={{ color: "#CBD5E1", marginTop: 10 }}>
              {tail.message}
            </Text>
          )}

          <Text style={{ color: "#6B7280", marginTop: 10, fontSize: 12 }}>
            from {tail.from} • {tail.visibility === "private" ? "private" : "public"}
            {tail.catchCount ? ` • caught ${tail.catchCount}` : ""}
          </Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#1E293B",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#CBD5E1", fontWeight: "800" }}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onCatch(tail)}
              disabled={expired}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 14,
                backgroundColor: expired ? "#334155" : "#FF5C5C",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#0B0F14", fontWeight: "900" }}>
                {expired ? "Expired" : "Catch"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
