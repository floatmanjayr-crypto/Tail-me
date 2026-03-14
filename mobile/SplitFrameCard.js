// ============================================================
// SplitFrameCard.js — v4
// ✅ Video expand full screen on long press
// ✅ Comment sheet with 💬 button
// ✅ Like button
// ✅ Reveal box pulse animation
// ✅ Selfie, voice, text, logo, link, image boxes
// ============================================================
import React, { useRef, useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, Dimensions,
  Animated, StyleSheet, Pressable, Linking, Modal, Image,
  TextInput, KeyboardAvoidingView, Platform, FlatList,
} from "react-native";
import { Video, ResizeMode } from "expo-av";

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

// ── VIDEO EXPAND MODAL ───────────────────────────────────
function VideoExpandModal({ uri, visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <Video
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping
          isMuted={false}
        />
        <TouchableOpacity onPress={onClose} style={{
          position: "absolute", top: 52, right: 20,
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: "rgba(0,0,0,0.6)",
          alignItems: "center", justifyContent: "center",
          borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
        }}>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>✕</Text>
        </TouchableOpacity>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </View>
    </Modal>
  );
}

// ── COMMENT SHEET ────────────────────────────────────────
function CommentSheet({ visible, onClose, color }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([
    { id: "1", user: "sneaker.plug.atl", text: "🔥 this is crazy", time: "2m" },
    { id: "2", user: "maya.eats.nyc", text: "caught it, worth it 💯", time: "5m" },
    { id: "3", user: "rooftop.social", text: "sending to the group chat rn", time: "8m" },
    { id: "4", user: "dre.williams", text: "need this asap 👀", time: "12m" },
  ]);

  const slideAnim = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : SH,
      useNativeDriver: true, damping: 20, stiffness: 200,
    }).start();
  }, [visible]);

  const handleSend = () => {
    if (!comment.trim()) return;
    setComments(prev => [{ id: Date.now().toString(), user: "you", text: comment.trim(), time: "now" }, ...prev]);
    setComment("");
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={onClose} />
        <Animated.View style={{
          transform: [{ translateY: slideAnim }],
          backgroundColor: "#0D1220",
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          borderWidth: 1, borderColor: "#1E293B",
          maxHeight: SH * 0.75,
        }}>
          <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 6 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: `${color}50` }} />
          </View>
          <View style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingHorizontal: 18, paddingBottom: 12,
            borderBottomWidth: 1, borderBottomColor: "#1E293B",
          }}>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>💬 Comments</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={{ color: "#64748B", fontWeight: "900", fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={comments}
            keyExtractor={item => item.id}
            style={{ maxHeight: SH * 0.45 }}
            contentContainerStyle={{ padding: 16, gap: 14 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: color + "30", alignItems: "center", justifyContent: "center",
                  borderWidth: 1, borderColor: color + "50",
                }}>
                  <Text style={{ color, fontSize: 12, fontWeight: "900" }}>{item.user[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: "#94A3B8", fontWeight: "800", fontSize: 12 }}>@{item.user}</Text>
                    <Text style={{ color: "#334155", fontSize: 10 }}>{item.time}</Text>
                  </View>
                  <Text style={{ color: "#E2E8F0", fontSize: 14, marginTop: 2, lineHeight: 20 }}>{item.text}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 30, gap: 8 }}>
                <Text style={{ fontSize: 32 }}>💬</Text>
                <Text style={{ color: "#64748B", fontSize: 14 }}>No comments yet</Text>
              </View>
            }
          />
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 10,
            padding: 14, borderTopWidth: 1, borderTopColor: "#1E293B",
          }}>
            <TextInput
              value={comment} onChangeText={setComment}
              placeholder="Add a comment..." placeholderTextColor="#334155"
              style={{
                flex: 1, backgroundColor: "#111827", borderRadius: 20,
                paddingHorizontal: 14, paddingVertical: 10, color: "#fff", fontSize: 14,
                borderWidth: 1, borderColor: "#1E293B",
              }}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity onPress={handleSend} style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: comment.trim() ? color : "#1E293B",
              alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ fontSize: 16, color: "#fff" }}>↑</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── VIDEO BOX ────────────────────────────────────────────
function VideoBox({ uri, style, muted: defaultMuted = true, play = true }) {
  const [err, setErr] = useState(false);
  const [isMuted, setIsMuted] = useState(defaultMuted);
  const [expanded, setExpanded] = useState(false);

  if (!uri || err) {
    return (
      <View style={[style, { backgroundColor: "#111", alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ fontSize: 32, opacity: 0.15 }}>🎥</Text>
      </View>
    );
  }
  return (
    <>
      <Pressable style={[style, { overflow: "hidden" }]}
        onPress={() => setIsMuted(!isMuted)}
        onLongPress={() => setExpanded(true)}
        delayLongPress={300}>
        <Video
          source={{ uri }} style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER} shouldPlay={play}
          isLooping isMuted={isMuted} onError={() => setErr(true)}
        />
        <View style={styles.soundBadge}>
          <Text style={{ fontSize: 10 }}>{isMuted ? "🔇" : "🔊"}</Text>
        </View>
        <View style={styles.expandHint}>
          <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.5)" }}>hold to expand</Text>
        </View>
      </Pressable>
      <VideoExpandModal uri={uri} visible={expanded} onClose={() => setExpanded(false)} />
    </>
  );
}

// ── IMAGE BOX ────────────────────────────────────────────
function ImageBox({ uri, style }) {
  const [zoomed, setZoomed] = useState(false);
  if (!uri) {
    return (
      <View style={[style, { backgroundColor: "#111", alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ fontSize: 32, opacity: 0.15 }}>📷</Text>
      </View>
    );
  }
  return (
    <>
      <Pressable style={style} onPress={() => setZoomed(true)}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.zoomHint}>
          <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.6)" }}>tap to zoom</Text>
        </View>
      </Pressable>
      <Modal visible={zoomed} transparent animationType="fade" onRequestClose={() => setZoomed(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" }} onPress={() => setZoomed(false)}>
          <Image source={{ uri }} style={{ width: SW * 0.92, height: SW * 0.92, borderRadius: 16 }} resizeMode="contain" />
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 16 }}>tap to close</Text>
        </Pressable>
      </Modal>
    </>
  );
}

// ── SELFIE BOX ───────────────────────────────────────────
function SelfieBox({ uri, style, color }) {
  const [zoomed, setZoomed] = useState(false);
  return (
    <>
      <Pressable style={[style, styles.selfieBox]} onPress={() => uri && setZoomed(true)}>
        <View style={[styles.selfieCircle, { borderColor: color }]}>
          {uri ? <Image source={{ uri }} style={styles.selfieImage} resizeMode="cover" />
            : <Text style={{ fontSize: 32, opacity: 0.3 }}>🤳</Text>}
        </View>
        <Text style={[styles.selfieLabel, { color }]}>Creator</Text>
      </Pressable>
      {uri && (
        <Modal visible={zoomed} transparent animationType="fade" onRequestClose={() => setZoomed(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" }} onPress={() => setZoomed(false)}>
            <Image source={{ uri }} style={{ width: SW * 0.7, height: SW * 0.7, borderRadius: SW * 0.35 }} resizeMode="cover" />
          </Pressable>
        </Modal>
      )}
    </>
  );
}

// ── VOICE BOX ────────────────────────────────────────────
function VoiceBox({ color, style }) {
  const bars = useRef([...Array(24)].map(() => new Animated.Value(0.3))).current;
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (playing) {
      const anims = bars.map((bar, i) =>
        Animated.loop(Animated.sequence([
          Animated.timing(bar, { toValue: Math.random() * 0.7 + 0.3, duration: 150 + i * 30, useNativeDriver: true }),
          Animated.timing(bar, { toValue: 0.2, duration: 150 + i * 30, useNativeDriver: true }),
        ]))
      );
      anims.forEach(a => a.start());
      return () => anims.forEach(a => a.stop());
    } else {
      bars.forEach(b => b.setValue(0.3));
    }
  }, [playing]);

  return (
    <Pressable style={[style, styles.voiceBox]} onPress={() => setPlaying(!playing)}>
      <View style={styles.voiceWave}>
        {bars.map((bar, i) => (
          <Animated.View key={i} style={[styles.voiceBar, { backgroundColor: color, transform: [{ scaleY: bar }] }]} />
        ))}
      </View>
      <View style={[styles.voicePlayBtn, { backgroundColor: color }]}>
        <Text style={{ fontSize: 12, color: "#fff" }}>{playing ? "⏸" : "▶"}</Text>
      </View>
      <Text style={[styles.voiceLabel, { color }]}>{playing ? "Playing..." : "Tap to play"}</Text>
    </Pressable>
  );
}

// ── LOGO / TEXT / LINK BOXES ─────────────────────────────
function LogoBox({ uri, text, color, style }) {
  return (
    <View style={[style, styles.logoBox, { borderColor: color + "40" }]}>
      {uri ? <Image source={{ uri }} style={styles.logoImage} resizeMode="contain" />
        : <View style={{ alignItems: "center", gap: 4 }}>
            <View style={[styles.logoDot, { backgroundColor: color }]} />
            <Text style={[styles.logoText, { color }]}>{text || "BRAND"}</Text>
          </View>}
    </View>
  );
}

function TextBox({ text, color, style }) {
  return (
    <View style={[style, styles.textBox, { borderColor: color + "30" }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color + "08" }]} />
      <Text style={[styles.textContent, { color: color || "#fff" }]} numberOfLines={5}>{text}</Text>
    </View>
  );
}

function LinkBox({ url, label, color, style }) {
  const domain = url ? url.replace(/https?:\/\//, "").split("/")[0] : "";
  return (
    <Pressable style={[style, styles.linkBox, { borderColor: color + "50" }]} onPress={() => url && Linking.openURL(url).catch(() => {})}>
      <View style={[styles.linkIcon, { backgroundColor: color + "20" }]}><Text style={{ fontSize: 20 }}>🔗</Text></View>
      <Text style={[styles.linkLabel, { color }]} numberOfLines={1}>{label || domain || "Open link"}</Text>
      <View style={[styles.linkArrow, { backgroundColor: color }]}><Text style={{ fontSize: 10, color: "#fff" }}>→</Text></View>
    </Pressable>
  );
}

// ── REVEAL BOX ───────────────────────────────────────────
function RevealBox({ uri, onCatch, caught, color, style }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!caught) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]));
      loop.start();
      return () => loop.stop();
    }
  }, [caught]);

  const handlePress = () => {
    if (caught) return;
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start(() => {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 8 }),
      ]).start();
      onCatch?.();
    });
  };

  return (
    <Pressable onPress={handlePress} style={[style, { overflow: "hidden" }]}>
      {uri ? <VideoBox uri={uri} style={StyleSheet.absoluteFill} muted play />
        : <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0d0500" }]} />}
      {!caught ? (
        <View style={[StyleSheet.absoluteFill, styles.blurOverlay]}>
          <Animated.View style={{ transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }, { translateX: shakeAnim }], alignItems: "center", gap: 10 }}>
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

// ── MAGIC BOX ────────────────────────────────────────────
function MagicBox({ box, idx, onCatch, caught, color, style }) {
  const type = box?.type || "video";
  switch (type) {
    case "reveal":  return <RevealBox uri={box?.uri} onCatch={onCatch} caught={caught} color={color} style={style} />;
    case "voice":   return <VoiceBox color={color} style={style} />;
    case "logo":    return <LogoBox uri={box?.uri} text={box?.text} color={color} style={style} />;
    case "text":    return <TextBox text={box?.text} color={color} style={style} />;
    case "link":    return <LinkBox url={box?.url} label={box?.label} color={color} style={style} />;
    case "selfie":  return <SelfieBox uri={box?.uri} color={color} style={style} />;
    case "image":   return <ImageBox uri={box?.uri} style={style} />;
    case "video":
    default:        return <VideoBox uri={box?.uri} style={style} />;
  }
}

// ── LAYOUTS ──────────────────────────────────────────────
function LayoutA({ boxes, onCatch, caught, color }) {
  return (
    <View style={styles.gridA}>
      <MagicBox box={boxes[0]} idx={0} onCatch={onCatch} caught={caught} color={color} style={styles.cellSmallA} />
      <MagicBox box={boxes[1]} idx={1} onCatch={onCatch} caught={caught} color={color} style={styles.cellBigA} />
      <MagicBox box={boxes[2]} idx={2} onCatch={onCatch} caught={caught} color={color} style={styles.cellSmallA} />
    </View>
  );
}
function LayoutB({ boxes, onCatch, caught, color }) {
  return (
    <View style={styles.gridB}>
      <MagicBox box={boxes[0]} idx={0} onCatch={onCatch} caught={caught} color={color} style={styles.cellHalf} />
      <MagicBox box={boxes[1]} idx={1} onCatch={onCatch} caught={caught} color={color} style={styles.cellHalf} />
    </View>
  );
}
function LayoutC({ boxes, onCatch, caught, color }) {
  return (
    <View style={styles.gridC}>
      <MagicBox box={boxes[0]} idx={0} onCatch={onCatch} caught={caught} color={color} style={{ flex: 1 }} />
    </View>
  );
}
function LayoutD({ boxes, onCatch, caught, color }) {
  return (
    <View style={styles.gridD}>
      <MagicBox box={boxes[0]} idx={0} onCatch={onCatch} caught={caught} color={color} style={styles.cellThird} />
      <MagicBox box={boxes[1]} idx={1} onCatch={onCatch} caught={caught} color={color} style={styles.cellThird} />
      <MagicBox box={boxes[2]} idx={2} onCatch={onCatch} caught={caught} color={color} style={styles.cellThird} />
    </View>
  );
}
function LayoutE({ boxes, onCatch, caught, color }) {
  return (
    <View style={{ gap: 2 }}>
      <MagicBox box={boxes[0]} idx={0} onCatch={onCatch} caught={caught} color={color} style={styles.cellBigTop} />
      <View style={styles.gridB}>
        <MagicBox box={boxes[1]} idx={1} onCatch={onCatch} caught={caught} color={color} style={styles.cellHalf} />
        <MagicBox box={boxes[2]} idx={2} onCatch={onCatch} caught={caught} color={color} style={styles.cellHalf} />
      </View>
    </View>
  );
}

const LAYOUTS = { A: LayoutA, B: LayoutB, C: LayoutC, D: LayoutD, E: LayoutE };

// ── Build boxes from tail data ───────────────────────────
function buildBoxes(tail) {
  if (tail?.boxes && Array.isArray(tail.boxes)) return tail.boxes;
  const boxes = [];
  const revealIdx = tail?.revealBox ?? 1;
  if (tail?.previewUrl || tail?.mediaUrl) {
    boxes.push({ type: revealIdx === 0 ? "reveal" : "video", uri: tail.previewUrl || tail.mediaUrl });
  } else if (tail?.message) {
    boxes.push({ type: "text", text: tail.message });
  } else {
    boxes.push({ type: "video", uri: null });
  }
  if (tail?.box2Url) {
    boxes.push({ type: revealIdx === 1 ? "reveal" : "image", uri: tail.box2Url });
  } else if (tail?.tailType === "VOICE" || tail?.reveal?.kind === "voice") {
    boxes.push({ type: "voice" });
  } else {
    boxes.push({ type: revealIdx === 1 ? "reveal" : "video", uri: tail?.previewUrl || tail?.mediaUrl });
  }
  if (tail?.box3Url) {
    boxes.push({ type: revealIdx === 2 ? "reveal" : "image", uri: tail.box3Url });
  } else if (tail?.logoUrl) {
    boxes.push({ type: "logo", uri: tail.logoUrl });
  } else {
    boxes.push({ type: revealIdx === 2 ? "reveal" : "video", uri: null });
  }
  return boxes;
}

// ── MAIN EXPORT ──────────────────────────────────────────
export default function SplitFrameCard({ tail, onCatch, onClose, isVisible = true }) {
  const [caught, setCaught] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount] = useState(Math.floor(Math.random() * 80) + 5);
  const [likeTotal, setLikeTotal] = useState(likeCount);

  const color = TYPE_COLOR[tail?.tailType] || "#7C3AED";
  const badge = BADGE_COLOR[tail?.tailType] || BADGE_COLOR.LOOK;
  const layout = tail?.frameLayout || "B";
  const Layout = LAYOUTS[layout] || LayoutB;
  const spotsLeft = tail?.catchLimit != null ? Math.max(0, tail.catchLimit - (tail.catchCount || 0)) : null;
  const boxes = buildBoxes(tail);

  const handleCatch = () => {
    if (caught) return;
    setCaught(true);
    onCatch?.(tail);
  };

  const handleLike = () => {
    setLiked(prev => {
      setLikeTotal(t => prev ? t - 1 : t + 1);
      return !prev;
    });
  };

  return (
    <>
      <View style={styles.card}>
        {/* Hook */}
        {tail?.message ? (
          <View style={styles.hookBar}>
            <Text style={styles.hookText} numberOfLines={3}>{tail.message}</Text>
          </View>
        ) : null}

        {/* Frame */}
        <View style={{ gap: 2, backgroundColor: "#0D1220" }}>
          <Layout boxes={boxes} onCatch={handleCatch} caught={caught} color={color} isVisible={isVisible} />
        </View>

        {/* Bottom bar */}
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

          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            {/* Like */}
            <TouchableOpacity onPress={handleLike} style={{ alignItems: "center", gap: 1 }}>
              <Text style={{ fontSize: 18 }}>{liked ? "❤️" : "🤍"}</Text>
              <Text style={{ color: liked ? "#EF4444" : "#475569", fontSize: 9, fontWeight: "800" }}>{likeTotal}</Text>
            </TouchableOpacity>

            {/* Comment */}
            <TouchableOpacity onPress={() => setCommentsOpen(true)} style={{ alignItems: "center", gap: 1 }}>
              <Text style={{ fontSize: 18 }}>💬</Text>
              <Text style={{ color: "#475569", fontSize: 9, fontWeight: "800" }}>
                {Math.floor(Math.random() * 20) + 1}
              </Text>
            </TouchableOpacity>

            {/* Badge */}
            <View style={[styles.typeBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
              <Text style={[styles.typeBadgeText, { color: badge.text }]}>{tail?.tailType}</Text>
            </View>
          </View>
        </View>
      </View>

      <CommentSheet visible={commentsOpen} onClose={() => setCommentsOpen(false)} color={color} />
    </>
  );
}

const FRAME_H = SW * 0.72;
const SMALL_H = FRAME_H / 2 - 1;

const styles = StyleSheet.create({
  card: {
    width: SW - 24, marginHorizontal: 12, marginVertical: 8,
    backgroundColor: "#0D1220", borderRadius: 20, overflow: "hidden",
    borderWidth: 1, borderColor: "#1E293B",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  hookBar: { backgroundColor: "#0D1220", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#1E293B" },
  hookText: { fontSize: 18, fontWeight: "900", color: "#fff", lineHeight: 26, textAlign: "center", letterSpacing: 0.2, textTransform: "uppercase" },
  gridA: { flexDirection: "row", flexWrap: "wrap", gap: 2, backgroundColor: "#0D1220" },
  cellSmallA: { width: SW / 2 - 1, height: SMALL_H, backgroundColor: "#111" },
  cellBigA: { width: SW / 2 - 1, height: FRAME_H, position: "absolute", right: 0, top: 0, backgroundColor: "#111" },
  gridB: { flexDirection: "row", gap: 2, backgroundColor: "#0D1220" },
  cellHalf: { flex: 1, height: FRAME_H, backgroundColor: "#111" },
  gridC: { width: SW, height: FRAME_H * 1.1, backgroundColor: "#111" },
  gridD: { flexDirection: "row", gap: 2, backgroundColor: "#0D1220" },
  cellThird: { flex: 1, height: FRAME_H * 0.85, backgroundColor: "#111" },
  cellBigTop: { width: SW, height: FRAME_H * 0.65, backgroundColor: "#111" },
  soundBadge: { position: "absolute", bottom: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  expandHint: { position: "absolute", bottom: 8, left: 8, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  zoomHint: { position: "absolute", bottom: 6, left: 6, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  selfieBox: { backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center", gap: 8 },
  selfieCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "#111" },
  selfieImage: { width: 80, height: 80, borderRadius: 40 },
  selfieLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  voiceBox: { backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center", gap: 10 },
  voiceWave: { flexDirection: "row", alignItems: "center", gap: 2, height: 40 },
  voiceBar: { width: 3, height: 40, borderRadius: 2 },
  voicePlayBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  voiceLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  logoBox: { backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center", borderWidth: 1 },
  logoImage: { width: "60%", height: "60%" },
  logoDot: { width: 8, height: 8, borderRadius: 4 },
  logoText: { fontSize: 16, fontWeight: "900", letterSpacing: 3, textTransform: "uppercase" },
  textBox: { backgroundColor: "#0a0a0a", padding: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  textContent: { fontSize: 15, fontWeight: "700", textAlign: "center", lineHeight: 22 },
  linkBox: { backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 1, padding: 12 },
  linkIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  linkLabel: { fontSize: 11, fontWeight: "700" },
  linkArrow: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  blurOverlay: { backgroundColor: "rgba(0,0,0,0.65)", alignItems: "center", justifyContent: "center", gap: 12 },
  catchPill: { borderRadius: 30, paddingHorizontal: 22, paddingVertical: 11 },
  catchPillText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 0.3 },
  tapHint: { fontSize: 9, fontWeight: "800", color: "rgba(255,255,255,0.35)", letterSpacing: 2, textTransform: "uppercase" },
  caughtOverlay: { backgroundColor: "rgba(0,180,60,0.25)", alignItems: "center", justifyContent: "center", gap: 8 },
  caughtText: { fontSize: 13, fontWeight: "900", color: "#00e676", letterSpacing: 2, textTransform: "uppercase" },
  bottomBar: { backgroundColor: "#0D1220", paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#1E293B" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avi: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  aviText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  username: { color: "#E2E8F0", fontSize: 12, fontWeight: "700" },
  time: { color: "#475569", fontSize: 10, fontWeight: "500", marginTop: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  typeBadgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
});