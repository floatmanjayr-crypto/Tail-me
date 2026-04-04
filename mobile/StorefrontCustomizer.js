// ============================================================
// StorefrontCustomizer.js — Customize Your Tail Storefront
// ✅ Theme selection (8 presets)
// ✅ Opening animation picker
// ✅ Brand name, emoji, tagline
// ✅ Live preview
// ============================================================

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";

const { width: SW } = Dimensions.get("window");

// ══════════════════════════════════════════════════════════
// THEME PRESETS
// ══════════════════════════════════════════════════════════
const THEMES = [
  { id: "luxury", label: "Luxury", emoji: "👑", color: "#FFD700" },
  { id: "streetwear", label: "Street", emoji: "🔥", color: "#FF4444" },
  { id: "minimalist", label: "Minimal", emoji: "◻️", color: "#000000" },
  { id: "vibrant", label: "Vibrant", emoji: "🌈", color: "#667EEA" },
  { id: "nature", label: "Nature", emoji: "🌿", color: "#71B280" },
  { id: "tech", label: "Tech", emoji: "💻", color: "#00FF88" },
  { id: "sunset", label: "Sunset", emoji: "🌅", color: "#FF6B6B" },
  { id: "ocean", label: "Ocean", emoji: "🌊", color: "#00B4D8" },
];

// ══════════════════════════════════════════════════════════
// OPENING ANIMATIONS
// ══════════════════════════════════════════════════════════
const OPENINGS = [
  { id: "double_door", label: "Double Door", emoji: "🚪" },
  { id: "slide_up", label: "Slide Up", emoji: "⬆️" },
  { id: "slide_down", label: "Slide Down", emoji: "⬇️" },
  { id: "fade", label: "Fade", emoji: "✨" },
];

// ══════════════════════════════════════════════════════════
// BRAND EMOJIS
// ══════════════════════════════════════════════════════════
const EMOJIS = ["🎁", "🔥", "⚡", "💎", "🎯", "🚀", "💫", "✨", "🎪", "🎨", "👟", "🛍️", "💄", "🎮", "🎵", "📸"];

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function StorefrontCustomizer({
  visible,
  initialConfig,
  onSave,
  onClose,
  colors: C,
}) {
  const [config, setConfig] = useState({
    enabled: false,
    theme: "luxury",
    openingType: "double_door",
    brandName: "",
    tagline: "",
    emoji: "🎁",
    ...initialConfig,
  });

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave?.(config.enabled ? config : null);
    onClose?.();
  };

  const selectedTheme = THEMES.find((t) => t.id === config.theme) || THEMES[0];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: C?.bg || "#070A0F" }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.headerBtn, { color: C?.muted || "#94A3B8" }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C?.text || "#fff" }]}>
            Storefront
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.headerBtn, { color: C?.brand || "#7C3AED" }]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Enable toggle */}
          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => updateConfig("enabled", !config.enabled)}
              style={[
                styles.toggleRow,
                {
                  backgroundColor: config.enabled
                    ? (C?.brand || "#7C3AED") + "20"
                    : C?.panel || "#0D1220",
                  borderColor: config.enabled
                    ? C?.brand || "#7C3AED"
                    : C?.border || "#1E293B",
                },
              ]}
            >
              <View>
                <Text style={[styles.toggleLabel, { color: C?.text || "#fff" }]}>
                  Enable Storefront
                </Text>
                <Text style={[styles.toggleDesc, { color: C?.dim || "#64748B" }]}>
                  Add a custom cover to your tails
                </Text>
              </View>
              <View
                style={[
                  styles.toggleSwitch,
                  {
                    backgroundColor: config.enabled
                      ? C?.brand || "#7C3AED"
                      : C?.border || "#1E293B",
                  },
                ]}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  {config.enabled ? "ON" : "OFF"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {config.enabled && (
            <>
              {/* Brand Name */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: C?.muted || "#94A3B8" }]}>
                  Brand Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: C?.panel || "#0D1220",
                      borderColor: C?.border || "#1E293B",
                      color: C?.text || "#fff",
                    },
                  ]}
                  value={config.brandName}
                  onChangeText={(v) => updateConfig("brandName", v)}
                  placeholder="Your brand or username"
                  placeholderTextColor={C?.dim || "#64748B"}
                  maxLength={20}
                />
              </View>

              {/* Tagline */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: C?.muted || "#94A3B8" }]}>
                  Tagline (optional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: C?.panel || "#0D1220",
                      borderColor: C?.border || "#1E293B",
                      color: C?.text || "#fff",
                    },
                  ]}
                  value={config.tagline}
                  onChangeText={(v) => updateConfig("tagline", v)}
                  placeholder="A catchy phrase"
                  placeholderTextColor={C?.dim || "#64748B"}
                  maxLength={30}
                />
              </View>

              {/* Emoji Picker */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: C?.muted || "#94A3B8" }]}>
                  Brand Emoji
                </Text>
                <View style={styles.emojiGrid}>
                  {EMOJIS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => updateConfig("emoji", emoji)}
                      style={[
                        styles.emojiBtn,
                        {
                          borderColor:
                            config.emoji === emoji
                              ? C?.brand || "#7C3AED"
                              : C?.border || "#1E293B",
                          backgroundColor:
                            config.emoji === emoji
                              ? (C?.brand || "#7C3AED") + "20"
                              : "transparent",
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 24 }}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Theme Picker */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: C?.muted || "#94A3B8" }]}>
                  Theme
                </Text>
                <View style={styles.themeGrid}>
                  {THEMES.map((theme) => (
                    <TouchableOpacity
                      key={theme.id}
                      onPress={() => updateConfig("theme", theme.id)}
                      style={[
                        styles.themeCard,
                        {
                          borderColor:
                            config.theme === theme.id
                              ? theme.color
                              : C?.border || "#1E293B",
                          backgroundColor:
                            config.theme === theme.id
                              ? theme.color + "20"
                              : C?.panel || "#0D1220",
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 20 }}>{theme.emoji}</Text>
                      <Text
                        style={[
                          styles.themeLabel,
                          { color: config.theme === theme.id ? theme.color : C?.dim || "#64748B" },
                        ]}
                      >
                        {theme.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Opening Animation */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: C?.muted || "#94A3B8" }]}>
                  Opening Animation
                </Text>
                <View style={styles.openingRow}>
                  {OPENINGS.map((op) => (
                    <TouchableOpacity
                      key={op.id}
                      onPress={() => updateConfig("openingType", op.id)}
                      style={[
                        styles.openingCard,
                        {
                          borderColor:
                            config.openingType === op.id
                              ? C?.brand || "#7C3AED"
                              : C?.border || "#1E293B",
                          backgroundColor:
                            config.openingType === op.id
                              ? (C?.brand || "#7C3AED") + "20"
                              : C?.panel || "#0D1220",
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 24 }}>{op.emoji}</Text>
                      <Text
                        style={[
                          styles.openingLabel,
                          {
                            color:
                              config.openingType === op.id
                                ? C?.brand || "#7C3AED"
                                : C?.dim || "#64748B",
                          },
                        ]}
                      >
                        {op.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Preview */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: C?.muted || "#94A3B8" }]}>
                  Preview
                </Text>
                <View
                  style={[
                    styles.preview,
                    { backgroundColor: selectedTheme.color + "15" },
                  ]}
                >
                  <Text style={{ fontSize: 40 }}>{config.emoji}</Text>
                  <Text
                    style={[
                      styles.previewBrand,
                      { color: selectedTheme.color },
                    ]}
                  >
                    {config.brandName || "YOUR BRAND"}
                  </Text>
                  {config.tagline && (
                    <Text
                      style={[
                        styles.previewTagline,
                        { color: selectedTheme.color + "AA" },
                      ]}
                    >
                      {config.tagline}
                    </Text>
                  )}
                  <View
                    style={[
                      styles.previewBtn,
                      { backgroundColor: selectedTheme.color },
                    ]}
                  >
                    <Text style={styles.previewBtnText}>🎯 Catch</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
  },
  headerBtn: {
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  toggleDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  toggleSwitch: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emojiBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  themeCard: {
    width: (SW - 60) / 4,
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  themeLabel: {
    fontSize: 10,
    fontWeight: "800",
  },
  openingRow: {
    flexDirection: "row",
    gap: 10,
  },
  openingCard: {
    flex: 1,
    aspectRatio: 1.2,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  openingLabel: {
    fontSize: 10,
    fontWeight: "800",
  },
  preview: {
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  previewBrand: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  previewTagline: {
    fontSize: 13,
    fontWeight: "600",
  },
  previewBtn: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  previewBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
});