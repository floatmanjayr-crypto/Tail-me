// ============================================================
// SplitFrameCard.js — Split frame feed card
// No labels. No "teaser". Just frames + story.
// Lock is optional. Catch button lives inside the locked box.
// ============================================================
import React, { useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, Dimensions,
  Animated, StyleSheet, Pressable,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Image } from "react-native";

const { width: SW, height: SH } = Dimensions.get("window");

const TYPE_COLOR = {
  NOW:   "#F59E0B",
  DROP:  "#EF4444",
  GEO:   "#0EA5E9",
  CHAIN: "#22C55E",
  LOOK:  "#7C3AED",
  GIFT:  "#F43F8E",
};

const BADGE_COLOR = {
  NOW:   { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  text: "#F59E0B" },
  DROP:  { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   text: "#EF4444" },
  GEO:   { bg: "rgba(14,165,233,0.12)",  border: "rgba(14,165,233,0.3)",  text: "#0EA5E9" },
  CHAIN: { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.3)",   text: "#22C55E" },
  LOOK:  { bg: "rgba(124,58,237,0.12)",  border: "rgba(124,58,237,0.3)",  text: "#7C3AED" },
  GIFT:  { bg: "rgba(244,63,142,0.12)",  border: "rgba(244,63,142,0.3)",  text: "#F43F8E" },
};

function MediaBox({ uri, style, muted = true, play = true }) {
  const [err, setErr] = useState(false);
  const isVideo = uri && (
    uri.includes(".mp4") || uri.includes(".mov") ||
    uri.includes(".MOV") || uri.includes("uploads/")
  );
  if (!uri) {
    return (
      <View style={[style, { backgroundColor: "#111", alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ fontSize: 32, opacity: 0.15 }}>📷</Text>
      </View>
    );
  }
  if (isVideo && !err) {
    return (
      <Video
        source={{ uri }}
        style={style}
        resizeMode={ResizeMode.COVER}
        shouldPlay={play}
        isLooping
        isMuted={muted}
        onError={() => setErr(true)}
      />
    );
  }
  return <Image source={{ uri }} style={style} resizeMode="cover" />;
}

function BlurBox({ uri, onCatch, caught, color, style }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onCatch?.();
  };
  return (
    <Pressable onPress={handlePress} style={[style, { overflow: "hidden" }]}>
      {uri ? (
        <MediaBox uri={uri} style={StyleSheet.absoluteFill} muted play />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0d0500" }]} />
      )}
      {!caught ? (
        <View style={[StyleSheet.absoluteFill, styles.blurOverlay]}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 28 }}>🔒</Text>
            <View style={[styles.catchPill, { backgroundColor: color }]}>
              <Text style={styles.catchPillText}>🎯 Catch</Text>
            </View>
            <Text style={styles.tapHint}>tap to reveal</Text>
          </Animated.View>
        </View>
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.caughtOverlay]}>
          <Text style={{ fontSize: 36 }}>✅</Text>
          <Text style={styles.caughtText}>Caught!</Text>
        </View>
      )}
    </Pressable>
  );
}

function LayoutA({ tail, onCatch, caught, color }) {
  const revealIdx = tail?.revealBox ?? 1;
  const boxes = [tail?.previewUrl || tail?.mediaUrl, tail?.box2Url, tail?.box3Url];
  const renderBox = (uri, idx, style) => {
    if (idx === revealIdx) return <BlurBox key={idx} uri={uri} onCatch={onCatch} caught={caught} color={color} style={style} />;
    return <MediaBox key={idx} uri={uri} style={style} />;
  };
  return (
    <View style={styles.gridA}>
      {renderBox(boxes[0], 0, styles.cellSmallA)}
      {renderBox(boxes[1], 1, styles.cellBigA)}
      {renderBox(boxes[2], 2, styles.cellSmallA)}
    </View>
  );
}

function LayoutB({ tail, onCatch, caught, color }) {
  const revealIdx = tail?.revealBox ?? 1;
  const boxes = [tail?.previewUrl || tail?.mediaUrl, tail?.box2Url];
  const renderBox = (uri, idx, style) => {
    if (idx === revealIdx) return <BlurBox key={idx} uri={uri} onCatch={onCatch} caught={caught} color={color} style={style} />;
    return <MediaBox key={idx} uri={uri} style={style} />;
  };
  return (
    <View style={styles.gridB}>
      {renderBox(boxes[0], 0, styles.cellHalf)}
      {renderBox(boxes[1], 1, styles.cellHalf)}
    </View>
  );
}

function LayoutC({ tail, onCatch, caught, color }) {
  const hasLock = tail?.revealBox === 0;
  const uri = tail?.previewUrl || tail?.mediaUrl;
  if (hasLock) return <BlurBox uri={uri} onCatch={onCatch} caught={caught} color={color} style={styles.gridC} />;
  return <MediaBox uri={uri} style={styles.gridC} muted play />;
}

function LayoutD({ tail, onCatch, caught, color }) {
  const revealIdx = tail?.revealBox ?? 2;
  const boxes = [tail?.previewUrl || tail?.mediaUrl, tail?.box2Url, tail?.box3Url];
  const renderBox = (uri, idx) => {
    if (idx === revealIdx) return <BlurBox key={idx} uri={uri} onCatch={onCatch} caught={caught} color={color} style={styles.cellThird} />;
    return <MediaBox key={idx} uri={uri} style={styles.cellThird} />;
  };
  return <View style={styles.gridD}>{boxes.map((uri, i) => renderBox(uri, i))}</View>;
}

function LayoutE({ tail, onCatch, caught, color }) {
  const revealIdx = tail?.revealBox ?? 2;
  const boxes = [tail?.previewUrl || tail?.mediaUrl, tail?.box2Url, tail?.box3Url];
  const renderBox = (uri, idx, style) => {
    if (idx === revealIdx) return <BlurBox key={idx} uri={uri} onCatch={onCatch} caught={caught} color={color} style={style} />;
    return <MediaBox key={idx} uri={uri} style={style} />;
  };
  return (
    <View style={{ gap: 2 }}>
      {renderBox(boxes[0], 0, styles.cellBigTop)}
      <View style={styles.gridB}>
        {renderBox(boxes[1], 1, styles.cellHalf)}
        {renderBox(boxes[2], 2, styles.cellHalf)}
      </View>
    </View>
  );
}

const LAYOUTS = { A: LayoutA, B: LayoutB, C: LayoutC, D: LayoutD, E: LayoutE };

export default function SplitFrameCard({ tail, onCatch, isVisible = true }) {
  const [caught, setCaught] = useState(false);
  const color = TYPE_COLOR[tail?.tailType] || "#7C3AED";
  const badge = BADGE_COLOR[tail?.tailType] || BADGE_COLOR.LOOK;
  const layout = tail?.frameLayout || "B";
  const Layout = LAYOUTS[layout] || LayoutB;
  const spotsLeft = tail?.catchLimit != null ? Math.max(0, tail.catchLimit - (tail.catchCount || 0)) : null;
  const handleCatch = () => {
    if (caught) return;
    setCaught(true);
    onCatch?.(tail);
  };
  return (
    <View style={styles.card}>
      {tail?.message ? (
        <View style={styles.hookBar}>
          <Text style={styles.hookText} numberOfLines={3}>{tail.message}</Text>
        </View>
      ) : null}
      <View style={{ gap: 2, backgroundColor: "#000" }}>
        <Layout tail={tail} onCatch={handleCatch} caught={caught} color={color} isVisible={isVisible} />
      </View>
      <View style={styles.bottomBar}>
        <View style={styles.userRow}>
          <View style={[styles.avi, { backgroundColor: color }]}>
            <Text style={styles.aviText}>{(tail?.from || "?")[0].toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.username}>@{tail?.from}</Text>
            <Text style={styles.time}>{spotsLeft !== null ? `${spotsLeft} left · ` : ""}{tail?.tailType}</Text>
          </View>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
          <Text style={[styles.typeBadgeText, { color: badge.text }]}>{tail?.tailType}</Text>
        </View>
      </View>
    </View>
  );
}

const FRAME_H = SW * 0.72;
const SMALL_H = FRAME_H / 2 - 1;

const styles = StyleSheet.create({
  card: { width: SW, backgroundColor: "#000", borderBottomWidth: 1, borderBottomColor: "#111", marginBottom: 8 },
  hookBar: { backgroundColor: "#000", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#111" },
  hookText: { fontSize: 20, fontWeight: "900", color: "#fff", lineHeight: 26, textAlign: "center", letterSpacing: 0.2, textTransform: "uppercase" },
  gridA: { flexDirection: "row", flexWrap: "wrap", gap: 2, backgroundColor: "#000" },
  cellSmallA: { width: SW / 2 - 1, height: SMALL_H, backgroundColor: "#111" },
  cellBigA: { width: SW / 2 - 1, height: FRAME_H, position: "absolute", right: 0, top: 0, backgroundColor: "#111" },
  gridB: { flexDirection: "row", gap: 2, backgroundColor: "#000" },
  cellHalf: { flex: 1, height: FRAME_H, backgroundColor: "#111" },
  gridC: { width: SW, height: FRAME_H * 1.1, backgroundColor: "#111" },
  gridD: { flexDirection: "row", gap: 2, backgroundColor: "#000" },
  cellThird: { flex: 1, height: FRAME_H * 0.85, backgroundColor: "#111" },
  cellBigTop: { width: SW, height: FRAME_H * 0.65, backgroundColor: "#111" },
  blurOverlay: { backgroundColor: "rgba(0,0,0,0.62)", alignItems: "center", justifyContent: "center", gap: 12 },
  catchPill: { borderRadius: 30, paddingHorizontal: 22, paddingVertical: 11 },
  catchPillText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 0.3 },
  tapHint: { fontSize: 9, fontWeight: "800", color: "rgba(255,255,255,0.35)", letterSpacing: 2, textTransform: "uppercase" },
  caughtOverlay: { backgroundColor: "rgba(0,180,60,0.25)", alignItems: "center", justifyContent: "center", gap: 8 },
  caughtText: { fontSize: 13, fontWeight: "900", color: "#00e676", letterSpacing: 2, textTransform: "uppercase" },
  bottomBar: { backgroundColor: "#000", paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#111" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avi: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  aviText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  username: { color: "#fff", fontSize: 12, fontWeight: "700" },
  time: { color: "#444", fontSize: 10, fontWeight: "500", marginTop: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  typeBadgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
});
