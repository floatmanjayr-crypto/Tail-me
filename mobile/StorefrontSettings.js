// ============================================
// StorefrontSettings.js — Profile Cover Setup
// ============================================
import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, Dimensions, ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import StorefrontOverlay from "./StorefrontOverlay";

const { width: SW } = Dimensions.get("window");

const ANIMATIONS = [
  { id: "door", label: "Door", icon: "🚪" },
  { id: "fade", label: "Fade", icon: "✨" },
  { id: "slide", label: "Slide", icon: "⬆️" },
];

const COLORS = [
  "#7C3AED", "#F59E0B", "#EF4444", "#0EA5E9", 
  "#22C55E", "#F43F5E", "#6366F1", "#fff",
];

export default function StorefrontSettings({ 
  username = "user",
  currentCover = null,
  currentAnimation = "door",
  currentColor = "#7C3AED",
  onSave,
  onClose,
  colors: C,
}) {
  const [coverUrl, setCoverUrl] = useState(currentCover);
  const [animation, setAnimation] = useState(currentAnimation);
  const [color, setColor] = useState(currentColor);
  const [previewing, setPreviewing] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setCoverUrl(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    onSave?.({ coverUrl, animation, color });
    onClose?.();
  };

  const handleRemoveCover = () => {
    setCoverUrl(null);
  };

  // Preview mode
  if (previewing) {
    return (
      <View style={styles.previewContainer}>
        <StorefrontOverlay
          coverUrl={coverUrl}
          username={username}
          color={color}
          animation={animation}
          onCatch={() => setPreviewing(false)}
        >
          <View style={styles.previewContent}>
            <Text style={styles.previewText}>🎉 Your Tail Content</Text>
            <Text style={styles.previewSub}>This is what receivers see after catching</Text>
          </View>
        </StorefrontOverlay>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C?.bg || "#000" }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Storefront Cover</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveBtn, { color }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Cover Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Cover</Text>
          <View style={styles.coverPreview}>
            {coverUrl ? (
              <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
            ) : (
              <View style={styles.defaultPreview}>
                <Text style={{ fontSize: 48 }}>🦊</Text>
                <Text style={[styles.defaultUsername, { color }]}>@{username}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.coverActions}>
            <TouchableOpacity style={[styles.actionBtn, { borderColor: color }]} onPress={pickImage}>
              <Text style={{ fontSize: 16 }}>📷</Text>
              <Text style={[styles.actionText, { color }]}>
                {coverUrl ? "Change" : "Upload"}
              </Text>
            </TouchableOpacity>
            
            {coverUrl && (
              <TouchableOpacity style={[styles.actionBtn, { borderColor: "#EF4444" }]} onPress={handleRemoveCover}>
                <Text style={{ fontSize: 16 }}>🗑️</Text>
                <Text style={[styles.actionText, { color: "#EF4444" }]}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Animation Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reveal Animation</Text>
          <View style={styles.optionRow}>
            {ANIMATIONS.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[
                  styles.optionBtn,
                  animation === a.id && { backgroundColor: color + "20", borderColor: color },
                ]}
                onPress={() => setAnimation(a.id)}
              >
                <Text style={{ fontSize: 24 }}>{a.icon}</Text>
                <Text style={[styles.optionLabel, animation === a.id && { color }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accent Color</Text>
          <View style={styles.colorRow}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && styles.colorSelected,
                ]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
        </View>

        {/* Preview Button */}
        <TouchableOpacity 
          style={[styles.previewBtn, { backgroundColor: color }]} 
          onPress={() => setPreviewing(true)}
        >
          <Text style={styles.previewBtnText}>👁️ Preview Cover</Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Your cover is shown when you send a Tail directly to someone. 
            They'll see this before catching your Tail.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

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
    borderBottomColor: "#1a1a1a",
  },
  closeBtn: {
    color: "#666",
    fontSize: 18,
    fontWeight: "800",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  saveBtn: {
    fontSize: 16,
    fontWeight: "900",
  },
  scroll: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: "#888",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  // Cover preview
  coverPreview: {
    width: "100%",
    aspectRatio: 0.75,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  defaultPreview: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  defaultUsername: {
    fontSize: 20,
    fontWeight: "900",
  },
  coverActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "800",
  },
  // Animation picker
  optionRow: {
    flexDirection: "row",
    gap: 12,
  },
  optionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#222",
    backgroundColor: "#111",
    gap: 8,
  },
  optionLabel: {
    color: "#666",
    fontSize: 12,
    fontWeight: "800",
  },
  // Color picker
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSelected: {
    borderColor: "#fff",
    transform: [{ scale: 1.1 }],
  },
  // Preview button
  previewBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 24,
  },
  previewBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  // Info
  infoBox: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    color: "#666",
    fontSize: 13,
    lineHeight: 20,
  },
  // Preview mode
  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  previewContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
    gap: 12,
  },
  previewText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  previewSub: {
    color: "#666",
    fontSize: 14,
  },
});
