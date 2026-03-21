import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, FlatList, Animated, Dimensions, Modal, Pressable, Alert } from "react-native";
const { width: SW, height: SH } = Dimensions.get("window");

function timeAgo(ts) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

function GhostViewer({ ghost, onClose, onSeen }) {
  const [timeLeft, setTimeLeft] = useState(ghost.viewDuration || 10);
  const [screenshotWarning, setScreenshotWarning] = useState(false);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const duration = ghost.viewDuration || 10;

  useEffect(() => {
    onSeen?.(ghost.id);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    Animated.timing(progressAnim, { toValue: 0, duration: duration * 1000, useNativeDriver: false }).start();
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); setTimeout(onClose, 500); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={{ flex: 1, backgroundColor: "#000", opacity: fadeAnim }}>
        {/* Progress bar */}
        <Animated.View style={{ position: "absolute", top: 0, left: 0, height: 3, backgroundColor: "#7C3AED", width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }} />

        {/* Close */}
        <TouchableOpacity onPress={onClose} style={{ position: "absolute", top: 52, right: 20, zIndex: 100, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>✕</Text>
        </TouchableOpacity>

        {/* Timer */}
        <View style={{ position: "absolute", top: 52, left: 20, zIndex: 100, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(124,58,237,0.3)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#7C3AED" }}>
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "900" }}>{timeLeft}</Text>
        </View>

        {/* From */}
        <View style={{ position: "absolute", top: 100, left: 0, right: 0, alignItems: "center" }}>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "800" }}>👻 from @{ghost.from}</Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          {ghost.type === "text" && (
            <View style={{ backgroundColor: "rgba(124,58,237,0.15)", borderRadius: 20, borderWidth: 1.5, borderColor: "rgba(124,58,237,0.4)", padding: 28, alignItems: "center" }}>
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", textAlign: "center", lineHeight: 32 }}>{ghost.content}</Text>
            </View>
          )}
          {ghost.type === "emoji" && (
            <Text style={{ fontSize: 120 }}>{ghost.content}</Text>
          )}
          {(!ghost.type || ghost.type === "text") && !ghost.content && (
            <View style={{ alignItems: "center", gap: 16 }}>
              <Text style={{ fontSize: 80 }}>👻</Text>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>Ghost tail</Text>
            </View>
          )}
        </View>

        {/* Screenshot warning */}
        {screenshotWarning && (
          <View style={{ position: "absolute", bottom: 100, left: 20, right: 20, backgroundColor: "#EF4444", borderRadius: 14, padding: 14, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}>⚠️ Screenshot detected — sender notified</Text>
          </View>
        )}

        {/* Bottom hint */}
        <View style={{ position: "absolute", bottom: 48, left: 0, right: 0, alignItems: "center" }}>
          <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>🔥 Disappears in {timeLeft}s</Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

export default function GhostScreen({ me, ghostTails = [], onSendGhost, onSeenGhost, onBack, colors: C }) {
  const [viewing, setViewing] = useState(null);

  const bg = C?.bg || "#070A0F";
  const txt = C?.text || "#E5E7EB";
  const muted = C?.muted || "#94A3B8";
  const dim = C?.dim || "#64748B";
  const bdr = C?.border || "#1E293B";
  const panel = C?.panel || "#0D1220";

  const unread = ghostTails.filter(g => !g.seen);
  const read = ghostTails.filter(g => g.seen);

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: bdr }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 28 }}>👻</Text>
            <View>
              <Text style={{ color: txt, fontWeight: "900", fontSize: 20 }}>Ghost</Text>
              <Text style={{ color: dim, fontSize: 12 }}>Disappears after viewing</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => onSendGhost?.()} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: "rgba(124,58,237,0.15)", borderWidth: 1, borderColor: "rgba(124,58,237,0.4)" }}>
            <Text style={{ color: "#7C3AED", fontWeight: "900", fontSize: 13 }}>+ Send Ghost</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={[...unread, ...read]}
        keyExtractor={(item, i) => item.id || String(i)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 80, gap: 16 }}>
            <Text style={{ fontSize: 64, opacity: 0.3 }}>👻</Text>
            <Text style={{ color: muted, fontSize: 18, fontWeight: "900" }}>No ghost tails</Text>
            <Text style={{ color: dim, fontSize: 14, textAlign: "center", lineHeight: 22, maxWidth: 260 }}>
              Ghost tails disappear forever after viewing. Send one to someone special.
            </Text>
            <TouchableOpacity onPress={() => onSendGhost?.()} style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: "rgba(124,58,237,0.15)", borderWidth: 1, borderColor: "rgba(124,58,237,0.4)", marginTop: 8 }}>
              <Text style={{ color: "#7C3AED", fontWeight: "900", fontSize: 15 }}>👻 Send a Ghost Tail</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const isUnread = !item.seen;
          const expired = item.expiresAt && item.expiresAt < Date.now();
          return (
            <TouchableOpacity
              onPress={() => { if (!expired && isUnread) setViewing(item); }}
              style={{ backgroundColor: panel, borderRadius: 16, borderWidth: 1.5, borderColor: isUnread ? "rgba(124,58,237,0.5)" : bdr, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, opacity: expired ? 0.4 : 1 }}>
              {/* Ghost avatar */}
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isUnread ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: isUnread ? "rgba(124,58,237,0.5)" : bdr }}>
                <Text style={{ fontSize: 22 }}>{expired ? "💀" : isUnread ? "👻" : "🫥"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: txt, fontWeight: "900", fontSize: 14 }}>@{item.from}</Text>
                <Text style={{ color: dim, fontSize: 12, marginTop: 2 }}>
                  {expired ? "Expired" : isUnread ? `Tap to open · ${item.viewDuration || 10}s view` : "Seen · gone forever"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={{ color: dim, fontSize: 10 }}>{timeAgo(item.timestamp)}</Text>
                {isUnread && !expired && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#7C3AED" }} />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Viewer modal */}
      {viewing && (
        <GhostViewer
          ghost={viewing}
          onClose={() => setViewing(null)}
          onSeen={(id) => onSeenGhost?.(id)}
        />
      )}
    </View>
  );
}
