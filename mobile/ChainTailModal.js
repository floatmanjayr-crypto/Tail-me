// ============================================
// ChainTailModal.js — Tail Me
// ✅ Multi-layer chain tail composer
// ✅ Up to 5 layers per chain
// ✅ Each layer has its own message + reveal
// ✅ Layer preview cards with reorder
// ✅ Chain summary before sending
// ✅ Animated layer transitions
// ============================================

import React, { useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const MAX_LAYERS = 5;

const REVEAL_TYPES = [
  { key: "text",   label: "📝 Text",   placeholder: "Secret message, instructions, clue..." },
  { key: "coupon", label: "🎟 Coupon", placeholder: "e.g. CHAIN50" },
  { key: "url",    label: "🔗 Link",   placeholder: "https://..." },
];

function LayerCard({ layer, index, total, onEdit, onRemove, colors: C }) {
  const isLast = index === total - 1;
  return (
    <View style={{ marginBottom: 4 }}>
      <View style={{
        backgroundColor: C?.panel2 || "#0A1020",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: isLast ? (C?.brand || "#7C3AED") + "80" : (C?.border || "#1E293B"),
        padding: 14,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: (C?.brand || "#7C3AED") + "30",
              borderWidth: 1, borderColor: (C?.brand || "#7C3AED") + "60",
              alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ color: C?.brand || "#7C3AED", fontWeight: "900", fontSize: 12 }}>
                {index + 1}
              </Text>
            </View>
            <View>
              <Text style={{ color: C?.text || "#E5E7EB", fontWeight: "900", fontSize: 13 }}>
                Layer {index + 1} {isLast ? "🏁" : ""}
              </Text>
              {layer.message ? (
                <Text style={{ color: C?.muted || "#94A3B8", fontSize: 11 }} numberOfLines={1}>
                  "{layer.message}"
                </Text>
              ) : (
                <Text style={{ color: C?.dim || "#64748B", fontSize: 11 }}>No message</Text>
              )}
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <TouchableOpacity onPress={() => onEdit(index)} style={{
              paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8,
              borderWidth: 1, borderColor: C?.border || "#1E293B",
            }}>
              <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "900", fontSize: 11 }}>Edit</Text>
            </TouchableOpacity>
            {total > 1 && (
              <TouchableOpacity onPress={() => onRemove(index)} style={{
                paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8,
                borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
                backgroundColor: "rgba(239,68,68,0.07)",
              }}>
                <Text style={{ color: "#EF4444", fontWeight: "900", fontSize: 11 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Reveal preview */}
        <View style={{
          marginTop: 10, paddingVertical: 6, paddingHorizontal: 10,
          borderRadius: 8,
          backgroundColor: layer.reveal?.value
            ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.06)",
          borderWidth: 1,
          borderColor: layer.reveal?.value
            ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.2)",
          flexDirection: "row", alignItems: "center", gap: 6,
        }}>
          <Text style={{ fontSize: 11 }}>
            {layer.reveal?.value ? "✅" : "⚠️"}
          </Text>
          <Text style={{
            fontSize: 11, fontWeight: "700",
            color: layer.reveal?.value ? "#22C55E" : "#EF4444",
          }}>
            {layer.reveal?.value
              ? `${layer.reveal.type.toUpperCase()} reveal set`
              : "No reveal — add one"}
          </Text>
        </View>
      </View>

      {/* Connector arrow */}
      {!isLast && (
        <View style={{ alignItems: "center", paddingVertical: 4 }}>
          <Text style={{ color: C?.dim || "#64748B", fontSize: 18 }}>↓</Text>
        </View>
      )}
    </View>
  );
}

export default function ChainTailModal({ visible, onClose, onSend, colors: C }) {
  const [layers, setLayers] = useState([
    { message: "", reveal: { type: "text", value: "" } },
  ]);
  const [editingIdx, setEditingIdx] = useState(null); // null = overview
  const [step, setStep] = useState("overview"); // overview | edit | confirm

  // Editing state
  const [editMsg, setEditMsg]         = useState("");
  const [editRevealType, setEditRevealType] = useState("text");
  const [editRevealValue, setEditRevealValue] = useState("");

  const openEdit = (idx) => {
    const l = layers[idx];
    setEditMsg(l.message);
    setEditRevealType(l.reveal?.type || "text");
    setEditRevealValue(l.reveal?.value || "");
    setEditingIdx(idx);
    setStep("edit");
  };

  const saveEdit = () => {
    setLayers(prev => prev.map((l, i) =>
      i === editingIdx
        ? { ...l, message: editMsg, reveal: { type: editRevealType, value: editRevealValue } }
        : l
    ));
    setStep("overview");
    setEditingIdx(null);
  };

  const addLayer = () => {
    if (layers.length >= MAX_LAYERS) return;
    setLayers(prev => [...prev, { message: "", reveal: { type: "text", value: "" } }]);
  };

  const removeLayer = (idx) => {
    setLayers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSend = () => {
    const valid = layers.every(l => l.reveal?.value?.trim());
    if (!valid) return;
    onSend?.({ layers });
    // Reset
    setLayers([{ message: "", reveal: { type: "text", value: "" } }]);
    setStep("overview");
    onClose?.();
  };

  const allValid = layers.every(l => l.reveal?.value?.trim());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}
      >
        <Pressable
          onPress={e => e.stopPropagation()}
          style={{
            backgroundColor: C?.panel || "#0D1220",
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            borderWidth: 1, borderColor: C?.border || "#1E293B",
            maxHeight: "90%",
          }}
        >
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 18 }}
            >
              {/* Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <View>
                  <Text style={{ color: C?.text || "#E5E7EB", fontWeight: "900", fontSize: 18 }}>
                    🔗 Chain Tail
                  </Text>
                  <Text style={{ color: C?.dim || "#64748B", fontSize: 12, marginTop: 2 }}>
                    Multi-layer treasure hunt
                  </Text>
                </View>
                <Pressable onPress={onClose} hitSlop={10}>
                  <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "900" }}>Cancel</Text>
                </Pressable>
              </View>

              {/* ── OVERVIEW ── */}
              {step === "overview" && (
                <View style={{ gap: 6 }}>
                  <Text style={{ color: C?.muted || "#94A3B8", fontSize: 12, fontWeight: "900", marginBottom: 12, letterSpacing: 0.5 }}>
                    {layers.length} layer{layers.length !== 1 ? "s" : ""} · Each catcher unlocks the next
                  </Text>

                  {layers.map((l, i) => (
                    <LayerCard
                      key={i}
                      layer={l}
                      index={i}
                      total={layers.length}
                      onEdit={openEdit}
                      onRemove={removeLayer}
                      colors={C}
                    />
                  ))}

                  {/* Add layer */}
                  {layers.length < MAX_LAYERS && (
                    <TouchableOpacity
                      onPress={addLayer}
                      style={{
                        marginTop: 8,
                        paddingVertical: 14, borderRadius: 14,
                        borderWidth: 1, borderColor: (C?.brand || "#7C3AED") + "50",
                        borderStyle: "dashed",
                        alignItems: "center",
                        backgroundColor: "rgba(124,58,237,0.04)",
                      }}
                    >
                      <Text style={{ color: C?.brand || "#7C3AED", fontWeight: "900" }}>
                        + Add Layer ({layers.length}/{MAX_LAYERS})
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Info box */}
                  <View style={{
                    marginTop: 12, padding: 14, borderRadius: 14,
                    backgroundColor: "rgba(34,197,94,0.06)",
                    borderWidth: 1, borderColor: "rgba(34,197,94,0.2)",
                    gap: 4,
                  }}>
                    <Text style={{ color: "#22C55E", fontWeight: "900", fontSize: 12 }}>💡 How chains work</Text>
                    <Text style={{ color: C?.muted || "#94A3B8", fontSize: 12, lineHeight: 18 }}>
                      Catchers complete Layer 1 to unlock Layer 2, then Layer 2 to unlock Layer 3, and so on. The final layer is the grand reveal.
                    </Text>
                  </View>

                  {/* Send button */}
                  <TouchableOpacity
                    onPress={handleSend}
                    disabled={!allValid}
                    style={{
                      marginTop: 16,
                      paddingVertical: 14, borderRadius: 14,
                      backgroundColor: allValid ? "#22C55E" : (C?.border || "#1E293B"),
                      alignItems: "center",
                    }}
                  >
                    <Text style={{
                      color: allValid ? "#052E16" : (C?.dim || "#64748B"),
                      fontWeight: "900", fontSize: 15,
                    }}>
                      {allValid ? `🔗 Drop Chain (${layers.length} layers)` : "⚠️ Complete all reveals first"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── EDIT LAYER ── */}
              {step === "edit" && editingIdx !== null && (
                <View style={{ gap: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <TouchableOpacity onPress={() => setStep("overview")}>
                      <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "900" }}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={{ color: C?.text || "#E5E7EB", fontWeight: "900", fontSize: 16 }}>
                      Layer {editingIdx + 1} {editingIdx === layers.length - 1 ? "🏁 (Final)" : ""}
                    </Text>
                  </View>

                  {/* Message */}
                  <View>
                    <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "900", marginBottom: 8, fontSize: 13 }}>
                      Hint or message for catchers
                    </Text>
                    <TextInput
                      value={editMsg}
                      onChangeText={setEditMsg}
                      placeholder={
                        editingIdx === 0
                          ? "e.g. Find the red door on 5th Ave..."
                          : editingIdx === layers.length - 1
                          ? "You made it! Here's your reward..."
                          : `Clue to layer ${editingIdx + 2}...`
                      }
                      placeholderTextColor={C?.dim || "#64748B"}
                      multiline
                      style={{
                        backgroundColor: C?.bg || "#070A0F",
                        borderWidth: 1, borderColor: C?.border || "#1E293B",
                        color: C?.text || "#E5E7EB",
                        padding: 12, borderRadius: 14,
                        minHeight: 80, textAlignVertical: "top",
                      }}
                    />
                  </View>

                  {/* Reveal type */}
                  <View>
                    <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "900", marginBottom: 8, fontSize: 13 }}>
                      Reveal type
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                      {REVEAL_TYPES.map(rt => {
                        const active = editRevealType === rt.key;
                        return (
                          <TouchableOpacity
                            key={rt.key}
                            onPress={() => { setEditRevealType(rt.key); setEditRevealValue(""); }}
                            style={{
                              flex: 1, paddingVertical: 10, borderRadius: 12,
                              borderWidth: 1,
                              borderColor: active ? (C?.brand || "#7C3AED") : (C?.border || "#1E293B"),
                              backgroundColor: active ? "rgba(124,58,237,0.18)" : "transparent",
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ color: active ? (C?.text || "#E5E7EB") : (C?.muted || "#94A3B8"), fontWeight: "900", fontSize: 11 }}>
                              {rt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <TextInput
                      value={editRevealValue}
                      onChangeText={setEditRevealValue}
                      placeholder={REVEAL_TYPES.find(r => r.key === editRevealType)?.placeholder}
                      placeholderTextColor={C?.dim || "#64748B"}
                      autoCapitalize={editRevealType === "coupon" ? "characters" : "none"}
                      multiline={editRevealType === "text"}
                      style={{
                        backgroundColor: C?.bg || "#070A0F",
                        borderWidth: 1,
                        borderColor: editRevealValue ? "#22C55E" : (C?.border || "#1E293B"),
                        color: C?.text || "#E5E7EB",
                        padding: 12, borderRadius: 14,
                        minHeight: editRevealType === "text" ? 80 : 48,
                        textAlignVertical: editRevealType === "text" ? "top" : "center",
                      }}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={saveEdit}
                    style={{
                      paddingVertical: 14, borderRadius: 14,
                      backgroundColor: C?.brand || "#7C3AED",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
                      ✅ Save Layer {editingIdx + 1}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}