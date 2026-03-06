// ============================================================
// VideoPreviewCard.js — Real feed card, not gamified
// Clean photo/video fill, minimal overlay
// Just enough to intrigue — nothing that screams "app"
// ============================================================
import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, Image, Dimensions } from "react-native";
import { Video, ResizeMode } from "expo-av";

const { width: SW } = Dimensions.get("window");
const COLS = 3;
const GAP = 1.5;
const CARD_SIZE = (SW - GAP * (COLS + 1)) / COLS;

const TYPE_DOT = {
  NOW:   "#F59E0B",
  DROP:  "#EF4444",
  GEO:   "#0EA5E9",
  CHAIN: "#22C55E",
  LOOK:  "#7C3AED",
  GIFT:  "#F43F8E",
};

const TYPE_ICON = {
  NOW:   "⚡",
  DROP:  "🔴",
  GEO:   "📍",
  CHAIN: "🔗",
  LOOK:  "👁",
  GIFT:  "💰",
};

export default function VideoPreviewCard({
  tail, onTap, onLongPress, isHighlighted, dimmed, isVisible = true,
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const color = TYPE_DOT[tail?.tailType] || "#7C3AED";
  const icon = TYPE_ICON[tail?.tailType] || "👁";
  const hasVideo = tail?.previewUrl && tail.previewUrl.endsWith(".mp4") && !videoError;
  const hasImage = tail?.mediaUrl || tail?.previewUrl;

  const onLoad = () => {
    setImgLoaded(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  const spotsLeft = tail?.catchLimit != null
    ? Math.max(0, tail.catchLimit - (tail.catchCount || 0))
    : null;

  const isAlmostGone = spotsLeft !== null && spotsLeft <= 2;
  const isNow = tail?.tailType === "NOW";

  return (
    <TouchableOpacity
      onPress={() => onTap?.(tail)}
      onLongPress={() => onLongPress?.(tail)}
      activeOpacity={0.95}
      delayLongPress={400}
      style={{
        width: CARD_SIZE,
        height: CARD_SIZE,
        margin: GAP / 2,
        borderRadius: 4,
        overflow: "hidden",
        backgroundColor: "#0a0a0a",
        opacity: dimmed ? 0.25 : 1,
        borderWidth: isHighlighted ? 2 : 0,
        borderColor: isHighlighted ? color : "transparent",
      }}
    >
      {/* ── Media ── */}
      {hasVideo && isVisible ? (
        <Video
          source={{ uri: tail.previewUrl }}
          style={{ position: "absolute", inset: 0 }}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isVisible}
          isLooping
          isMuted
          onLoad={() => { setVideoLoaded(true); onLoad(); }}
          onError={() => setVideoError(true)}
        />
      ) : hasImage ? (
        <Animated.Image
          source={{ uri: tail.mediaUrl || tail.previewUrl }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: fadeAnim }}
          resizeMode="cover"
          onLoad={onLoad}
        />
      ) : (
        // No media — gradient placeholder
        <View style={{
          position: "absolute", inset: 0,
          backgroundColor: "#111",
          alignItems: "center", justifyContent: "center",
        }}>
          <Text style={{ fontSize: 28, opacity: 0.2 }}>{icon}</Text>
        </View>
      )}

      {/* ── Gradient bottom overlay ── */}
      <View style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: CARD_SIZE * 0.5,
        background: "transparent",
        // Simulated gradient via nested views
      }}>
        <View style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "100%",
          backgroundColor: "rgba(0,0,0,0.45)",
          opacity: 0.8,
        }} />
      </View>

      {/* ── Username bottom left ── */}
      <View style={{
        position: "absolute", bottom: 6, left: 6, right: 24,
      }}>
        <Text style={{
          color: "rgba(255,255,255,0.85)",
          fontSize: 9.5, fontWeight: "700",
          letterSpacing: 0.2,
        }} numberOfLines={1}>
          @{tail?.from}
        </Text>
      </View>

      {/* ── Type dot bottom right ── */}
      <View style={{
        position: "absolute", bottom: 7, right: 6,
        width: 7, height: 7, borderRadius: 4,
        backgroundColor: color,
        shadowColor: color, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9, shadowRadius: 4,
      }} />

      {/* ── NOW live pulse top left ── */}
      {isNow && (
        <View style={{
          position: "absolute", top: 6, left: 6,
          flexDirection: "row", alignItems: "center", gap: 3,
          backgroundColor: "rgba(0,0,0,0.55)",
          paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
        }}>
          <View style={{ width: 5, height: 5, borderRadius: 3,
            backgroundColor: "#F59E0B" }} />
          <Text style={{ color: "#F59E0B", fontSize: 8, fontWeight: "900" }}>LIVE</Text>
        </View>
      )}

      {/* ── Almost gone warning ── */}
      {isAlmostGone && (
        <View style={{
          position: "absolute", top: 6, right: 6,
          backgroundColor: "rgba(239,68,68,0.85)",
          paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
        }}>
          <Text style={{ color: "#fff", fontSize: 8, fontWeight: "900" }}>
            {spotsLeft} left
          </Text>
        </View>
      )}

      {/* ── Gift indicator ── */}
      {tail?.tailType === "GIFT" && (
        <View style={{
          position: "absolute", top: 6, left: 6,
          backgroundColor: "rgba(244,63,142,0.85)",
          paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
        }}>
          <Text style={{ color: "#fff", fontSize: 8, fontWeight: "900" }}>💰 GIFT</Text>
        </View>
      )}

      {/* ── Energy bar ── */}
      <View style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 2.5,
        backgroundColor: "rgba(0,0,0,0.2)",
      }}>
        <View style={{
          height: 2.5,
          width: `${Math.max(3, tail?.energy?.current ?? 100)}%`,
          backgroundColor: color,
          opacity: 0.75,
        }} />
      </View>

      {/* ── Highlight ring ── */}
      {isHighlighted && (
        <View style={{
          position: "absolute", inset: 0,
          borderWidth: 2, borderColor: color, borderRadius: 4,
        }} />
      )}
    </TouchableOpacity>
  );
}
