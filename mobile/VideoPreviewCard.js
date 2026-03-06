// ============================================================
// VideoPreviewCard.js — Silent looping preview in grid
// ✅ Auto-plays when visible, pauses when off screen
// ✅ Silent loop — sound only after catch
// ✅ Fallback to image if no video
// ✅ Shimmer while loading
// ✅ Type badge + energy bar overlay
// ============================================================
import React, { useRef, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, TouchableWithoutFeedback,
  Animated, Image, Dimensions,
} from "react-native";
import { Video, ResizeMode } from "expo-av";

const { width: SW } = Dimensions.get("window");
const CARD_GAP = 2;
const CARD_SIZE = (SW - 16 - CARD_GAP * 4) / 3;

const TYPE_CONFIG = {
  NOW:   { color: "#F59E0B", icon: "⚡",  label: "NOW"   },
  DROP:  { color: "#EF4444", icon: "💧",  label: "DROP"  },
  GEO:   { color: "#0EA5E9", icon: "📍",  label: "GEO"   },
  CHAIN: { color: "#22C55E", icon: "🔗",  label: "CHAIN" },
  LOOK:  { color: "#7C3AED", icon: "👀",  label: "LOOK"  },
  GIFT:  { color: "#F43F8E", icon: "💰",  label: "GIFT"  },
};

export default function VideoPreviewCard({
  tail,
  onTap,
  onLongPress,
  isHighlighted,
  dimmed,
  isVisible = true,
}) {
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const cfg = TYPE_CONFIG[tail?.tailType] || TYPE_CONFIG.LOOK;
  const energy = tail?.energy?.current ?? 100;

  // Shimmer animation
  React.useEffect(() => {
    if (!videoLoaded) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [videoLoaded]);

  // NOW pulse
  React.useEffect(() => {
    if (tail?.tailType === "NOW") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [tail?.tailType]);

  const hasVideo = tail?.previewUrl && !videoError;
  const hasImage = tail?.mediaUrl;

  // Spots left for DROP
  const spotsLeft = tail?.catchLimit != null
    ? Math.max(0, tail.catchLimit - (tail.catchCount || 0))
    : null;

  return (
    <Animated.View style={{
      transform: [{ scale: tail?.tailType === "NOW" ? pulseAnim : 1 }],
      opacity: dimmed ? 0.3 : 1,
    }}>
      <TouchableOpacity
        onPress={() => onTap?.(tail)}
        onLongPress={() => onLongPress?.(tail)}
        activeOpacity={0.92}
        delayLongPress={400}
        style={{
          width: CARD_SIZE, height: CARD_SIZE,
          borderRadius: 14, overflow: "hidden",
          backgroundColor: "#0D1220",
          borderWidth: isHighlighted ? 2 : 1,
          borderColor: isHighlighted ? cfg.color : "#1E293B",
        }}
      >
        {/* ── Video preview ── */}
        {hasVideo && isVisible && (
          <Video
            ref={videoRef}
            source={{ uri: tail.previewUrl }}
            style={{ position: "absolute", inset: 0 }}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isVisible}
            isLooping
            isMuted
            onLoad={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
          />
        )}

        {/* ── Image fallback ── */}
        {!hasVideo && hasImage && (
          <Image
            source={{ uri: tail.mediaUrl }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        )}

        {/* ── Gradient fallback ── */}
        {!hasVideo && !hasImage && (
          <View style={{
            position: "absolute", inset: 0,
            backgroundColor: `${cfg.color}15`,
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 32, opacity: 0.4 }}>{cfg.icon}</Text>
          </View>
        )}

        {/* ── Shimmer overlay while loading ── */}
        {hasVideo && !videoLoaded && (
          <Animated.View style={{
            position: "absolute", inset: 0,
            backgroundColor: "#0D1220",
            opacity: shimmerAnim.interpolate({ inputRange: [0,1], outputRange: [0.9, 0.6] }),
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 28 }}>{cfg.icon}</Text>
          </Animated.View>
        )}

        {/* ── Dark overlay ── */}
        <View style={{
          position: "absolute", inset: 0,
          backgroundColor: hasVideo || hasImage ? "rgba(0,0,0,0.35)" : "transparent",
        }} />

        {/* ── Type badge ── */}
        <View style={{
          position: "absolute", top: 6, left: 6,
          flexDirection: "row", alignItems: "center", gap: 3,
          paddingHorizontal: 6, paddingVertical: 3,
          borderRadius: 8, backgroundColor: `${cfg.color}30`,
          borderWidth: 1, borderColor: `${cfg.color}50`,
        }}>
          <Text style={{ fontSize: 8 }}>{cfg.icon}</Text>
          <Text style={{ color: cfg.color, fontSize: 8, fontWeight: "900" }}>
            {cfg.label}
          </Text>
        </View>

        {/* ── Video indicator ── */}
        {hasVideo && videoLoaded && (
          <View style={{
            position: "absolute", top: 6, right: 6,
            width: 16, height: 16, borderRadius: 8,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 8 }}>▶</Text>
          </View>
        )}

        {/* ── DROP spots left ── */}
        {tail?.tailType === "DROP" && spotsLeft !== null && (
          <View style={{
            position: "absolute", top: 6, right: 6,
            paddingHorizontal: 5, paddingVertical: 2,
            borderRadius: 6, backgroundColor: "rgba(239,68,68,0.25)",
            borderWidth: 1, borderColor: "rgba(239,68,68,0.5)",
          }}>
            <Text style={{ color: "#EF4444", fontSize: 8, fontWeight: "900" }}>
              {spotsLeft} left
            </Text>
          </View>
        )}

        {/* ── From username ── */}
        <View style={{ position: "absolute", bottom: 18, left: 6, right: 6 }}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 9,
            fontWeight: "700" }} numberOfLines={1}>
            @{tail?.from}
          </Text>
        </View>

        {/* ── Energy bar ── */}
        <View style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 3, backgroundColor: "rgba(0,0,0,0.3)",
        }}>
          <View style={{
            height: 3, width: `${Math.max(2, energy)}%`,
            backgroundColor: cfg.color,
            borderRadius: 2,
            opacity: 0.8,
          }} />
        </View>

        {/* ── Highlight checkmark ── */}
        {isHighlighted && (
          <View style={{
            position: "absolute", bottom: 8, right: 6,
            width: 18, height: 18, borderRadius: 9,
            backgroundColor: cfg.color, alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "900" }}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
