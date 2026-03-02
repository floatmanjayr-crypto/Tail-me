// ============================================
// App.js - Tail Me (FULLY UPDATED)
// ✅ 3-step composer flow
// ✅ Streak + earnings system
// ✅ Pro paywall screen
// ✅ New TailHome (Live Now, Trending, Explore)
// ✅ Earnings tab replaces Chat in nav
// ✅ Theme in Settings tab
// ============================================

import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  useColorScheme,
} from "react-native";
import { WebView } from "react-native-webview";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

import CatchTailModal from "./CatchTailModal";
import TailHome from "./TailHome";
import TailCard from "./TailCard";
import EarningsScreen from "./EarningsScreen";
import ProScreen from "./ProScreen";
import { socket, SOCKET_URL } from "./socket";

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch {}

const TAIL_TYPES = ["LOOK", "NOW", "DROP"];
const DURATION_PRESETS = [
  { label: "1h", amount: 1, unit: "h" },
  { label: "6h", amount: 6, unit: "h" },
  { label: "24h", amount: 24, unit: "h" },
  { label: "3d", amount: 3, unit: "d" },
];

const DARK = {
  bg: "#070A0F", panel: "#0D1220", panel2: "#0A1020",
  border: "#1E293B", text: "#E5E7EB", muted: "#94A3B8",
  dim: "#64748B", green: "#22C55E", greenInk: "#052E16",
  amber: "#F59E0B", red: "#EF4444", brand: "#7C3AED",
};
const LIGHT = {
  bg: "#FFFFFF", panel: "#F8FAFC", panel2: "#F1F5F9",
  border: "#E5E7EB", text: "#0F172A", muted: "#334155",
  dim: "#64748B", green: "#16A34A", greenInk: "#052E16",
  amber: "#D97706", red: "#DC2626", brand: "#7C3AED",
};

async function copyToClipboard(text) {
  try {
    const Clipboard = await import("expo-clipboard");
    await Clipboard.setStringAsync(String(text || ""));
    return true;
  } catch { return false; }
}

export default function App() {
  const systemScheme = useColorScheme();
  const [themePref, setThemePref] = useState("system");
  const [screen, setScreen] = useState("login");
  const [username, setUsername] = useState("");
  const [me, setMe] = useState(null);

  // Streak + earnings + pro
  const [streak, setStreak] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [tailStats, setTailStats] = useState([]);

  const [publicTails, setPublicTails] = useState([]);
  const [inboxTails, setInboxTails] = useState([]);
  const [smartFeed, setSmartFeed] = useState([]);
  const [toast, setToast] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTail, setModalTail] = useState(null);
  const [activeTail, setActiveTail] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [chatText, setChatText] = useState("");
  const [chatMsgs, setChatMsgs] = useState([]);
  const [revealOpen, setRevealOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");

  // ---- Composer state ----
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerStep, setComposerStep] = useState(1);
  const [composerMode, setComposerMode] = useState("public");
  const [composeUrl, setComposeUrl] = useState("");
  const [composeTo, setComposeTo] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [composeIsAd, setComposeIsAd] = useState(false);
  const [composeMedia, setComposeMedia] = useState(null);
  const [composeTailType, setComposeTailType] = useState("LOOK");
  const [revealKind, setRevealKind] = useState("coupon");
  const [revealValue, setRevealValue] = useState("");
  const [durationPreset, setDurationPreset] = useState(2);
  const [typeFilter, setTypeFilter] = useState("ALL");

  // ============================================
  // THEME
  // ============================================
  const C = useMemo(() => {
    if (themePref === "dark") return DARK;
    if (themePref === "light") return LIGHT;
    return systemScheme === "light" ? LIGHT : DARK;
  }, [themePref, systemScheme]);

  const showToast = (msg, ms = 2000) => {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  };

  // ============================================
  // LOAD PERSISTED DATA
  // ============================================
  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem("tailme_theme_pref");
        if (v === "system" || v === "dark" || v === "light") setThemePref(v);
        const s = await AsyncStorage.getItem("tailme_streak");
        if (s) setStreak(Number(s) || 0);
        const pro = await AsyncStorage.getItem("tailme_is_pro");
        if (pro === "true") setIsPro(true);
        const earn = await AsyncStorage.getItem("tailme_earnings");
        if (earn) setEarnings(parseFloat(earn) || 0);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("tailme_theme_pref", themePref).catch(() => {});
  }, [themePref]);

  useEffect(() => {
    AsyncStorage.setItem("tailme_streak", String(streak)).catch(() => {});
  }, [streak]);

  useEffect(() => {
    AsyncStorage.setItem("tailme_earnings", String(earnings)).catch(() => {});
  }, [earnings]);

  // ============================================
  // NOTIFICATIONS
  // ============================================
  useEffect(() => {
    (async () => {
      try { await Notifications.requestPermissionsAsync(); } catch {}
    })();
    let sub;
    try {
      sub = Notifications.addNotificationReceivedListener((n) => {
        showToast(`📲 ${n?.request?.content?.title || "Notification"}`);
      });
    } catch {}
    return () => { try { sub?.remove?.(); } catch {} };
  }, []);

  // ============================================
  // SOCKET
  // ============================================
  useEffect(() => {
    const onConnect = () => console.log("✅ socket connected", socket.id);
    const onConnectError = (e) => console.log("❌ socket error", e?.message);
    const onDisconnect = (r) => console.log("⚠️ disconnected", r);
    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      try { socket.disconnect(); } catch {}
    };
  }, []);

  useEffect(() => {
    const onPublicFeed = ({ tails }) => setPublicTails(Array.isArray(tails) ? tails : []);
    const onSmartFeed = ({ tails }) => setSmartFeed(Array.isArray(tails) ? tails : []);
    const onPublicCreated = (tail) => {
      setPublicTails((p) => [tail, ...p].slice(0, 120));
      setSmartFeed((p) => [tail, ...p].slice(0, 120));
    };
    const onPrivateReceived = (tail) => {
      setInboxTails((p) => [tail, ...p].slice(0, 200));
      showToast(`📬 New tail from @${tail?.from || "user"}`);
    };
    const onTailUpdated = ({ tailId, patch }) => {
      if (!tailId || !patch) return;
      const apply = (arr) => arr.map((t) => (t?.id === tailId ? { ...t, ...patch } : t));
      setPublicTails(apply); setSmartFeed(apply); setInboxTails(apply);
      setModalTail((t) => (t?.id === tailId ? { ...t, ...patch } : t));
      setActiveTail((t) => (t?.id === tailId ? { ...t, ...patch } : t));
    };
    const onExpired = ({ tailId }) => {
      const mark = (arr) => arr.map((t) => (t?.id === tailId ? { ...t, expired: true } : t));
      setPublicTails(mark); setSmartFeed(mark); setInboxTails(mark);
      if (activeTail?.id === tailId) {
        setActiveTail((t) => (t ? { ...t, expired: true } : t));
        showToast("⏰ This tail has expired");
      }
    };
    const onCatchUpdate = (u) => {
      if (!u?.tailId) return;
      const patch = (arr) => arr.map((t) =>
        t?.id === u.tailId ? { ...t, catchCount: u.catchCount, caughtBy: u.caughtBy } : t
      );
      setPublicTails(patch); setSmartFeed(patch); setInboxTails(patch);
      setModalTail((t) => t?.id === u.tailId ? { ...t, catchCount: u.catchCount, caughtBy: u.caughtBy } : t);
      setActiveTail((t) => t?.id === u.tailId ? { ...t, catchCount: u.catchCount, caughtBy: u.caughtBy } : t);
    };
    const onReactionsUpdate = ({ tailId, reactions, reactionCount }) => {
      const patch = (arr) => arr.map((t) => (t?.id === tailId ? { ...t, reactions, reactionCount } : t));
      setPublicTails(patch); setSmartFeed(patch); setInboxTails(patch);
      setModalTail((t) => (t?.id === tailId ? { ...t, reactions, reactionCount } : t));
      setActiveTail((t) => (t?.id === tailId ? { ...t, reactions, reactionCount } : t));
    };
    const onChatMsg = (m) => setChatMsgs((p) => [...p, m]);

    socket.on("public-feed", onPublicFeed);
    socket.on("smart-feed", onSmartFeed);
    socket.on("public-tail-created", onPublicCreated);
    socket.on("tail-received", onPrivateReceived);
    socket.on("tail-updated", onTailUpdated);
    socket.on("tail-expired", onExpired);
    socket.on("tail-catch-update", onCatchUpdate);
    socket.on("tail-reactions-update", onReactionsUpdate);
    socket.on("new-chat-message", onChatMsg);

    return () => {
      socket.off("public-feed", onPublicFeed);
      socket.off("smart-feed", onSmartFeed);
      socket.off("public-tail-created", onPublicCreated);
      socket.off("tail-received", onPrivateReceived);
      socket.off("tail-updated", onTailUpdated);
      socket.off("tail-expired", onExpired);
      socket.off("tail-catch-update", onCatchUpdate);
      socket.off("tail-reactions-update", onReactionsUpdate);
      socket.off("new-chat-message", onChatMsg);
    };
  }, [activeTail?.id]);

  // ============================================
  // LOGIN
  // ============================================
  const doLogin = async () => {
    const u = username.trim();
    if (!u) return;
    if (!socket.connected) socket.connect();
    let pushToken = null;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === "granted") {
        try { pushToken = (await Notifications.getExpoPushTokenAsync()).data; } catch {}
      }
    } catch {}
    socket.emit("register", { username: u, pushToken });
    socket.once("registration-complete", (res) => {
      if (res?.ok) {
        setMe({ username: u });
        setScreen("hub");
        socket.emit("get-smart-feed");
        socket.emit("get-public-feed");
        showToast(`✨ Welcome ${u}!`);
      } else {
        showToast("❌ Login failed", 2500);
      }
    });
  };

  const openOriginal = (url) => {
    const u = String(url || "").trim();
    if (!u) return;
    setViewerUrl(u);
    setViewerOpen(true);
    if (activeSession?.id) socket.emit("open-link", { tailId: activeSession.id });
  };

  const openTailCard = (tail) => {
    if (!tail?.id) return;
    socket.emit("tail-preview", { tailId: tail.id });
    socket.once("tail-preview-data", (res) => {
      if (res?.tail) { setModalTail(res.tail); setModalOpen(true); }
    });
  };

  // ============================================
  // CATCH + STREAK + EARNINGS
  // ============================================
  const catchTail = (tail) => {
    if (!tail?.id) return;
    setModalOpen(false);
    socket.emit("catch-tail", { tailId: tail.id });
    socket.once("session-started", (res) => {
      if (res?.session) {
        setActiveTail(res.tail || tail);
        setActiveSession(res.session);
        setChatMsgs(res.session.messages || []);
        setRevealOpen(true);
        showToast("🎯 Tail caught!");
        // Streak
        setStreak((s) => {
          const next = s + 1;
          if (next % 7 === 0) showToast(`🔥 ${next} day streak! Bonus unlocked`, 3000);
          return next;
        });
        // Simulated earnings for pro users
        if (isPro) {
          const commission = +(Math.random() * 2 + 0.5).toFixed(2);
          setEarnings((e) => +(e + commission).toFixed(2));
          showToast(`💰 +$${commission} earned!`, 2500);
        }
      }
    });
  };

  const reactToTail = (tailId, emoji) => socket.emit("react-tail", { tailId, emoji });

  // ============================================
  // MEDIA
  // ============================================
  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setComposeMedia({ uri: asset.uri, type: asset.type === "video" ? "video" : "image" });
      }
    } catch { showToast("❌ Could not open media picker"); }
  };

  const uploadMedia = async () => {
    if (!composeMedia) return null;
    try {
      const formData = new FormData();
      formData.append("media", {
        uri: composeMedia.uri,
        type: composeMedia.type === "video" ? "video/mp4" : "image/jpeg",
        name: `upload.${composeMedia.type === "video" ? "mp4" : "jpg"}`,
      });
      const response = await fetch(`${SOCKET_URL}/upload`, {
        method: "POST", body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = await response.json();
      return data?.ok ? { url: `${SOCKET_URL}${data.url}`, type: data.type } : null;
    } catch { return null; }
  };

  const buildReveal = () => {
    const v = revealValue.trim();
    if (!v) return null;
    if (revealKind === "coupon") return { kind: "coupon", code: v };
    if (revealKind === "url") return { kind: "url", url: v };
    return { kind: "text", text: v };
  };

  // ============================================
  // SEND TAIL
  // ============================================
  const sendFromComposer = async () => {
    const url = composeUrl.trim();
    if (!url && !composeMedia) return showToast("⚠️ Add a link or media", 1800);
    const reveal = buildReveal();
    if (!reveal) return showToast("⚠️ Add a reveal for catchers", 1800);

    let mediaUrl = null, mediaType = null;
    if (composeMedia) {
      showToast("⏳ Uploading...");
      const uploaded = await uploadMedia();
      if (!uploaded) return showToast("❌ Upload failed", 2000);
      mediaUrl = uploaded.url;
      mediaType = uploaded.type;
    }

    const preset = DURATION_PRESETS[durationPreset];
    const tailType = composeTailType;

    if (composerMode === "private") {
      const to = composeTo.trim().replace(/^@/, "");
      if (!to) return showToast("⚠️ Enter @username", 1800);
      socket.emit("send-tail", {
        url: url || null, mediaUrl, mediaType, title: "Tail",
        message: composeMessage.trim(), visibility: "private",
        recipients: [to], durationAmount: preset.amount,
        durationUnit: preset.unit, isAd: composeIsAd, tailType, reveal,
      });
    } else {
      socket.emit("send-tail", {
        url: url || null, mediaUrl, mediaType, title: "Tail",
        message: composeMessage.trim(), visibility: "public",
        recipients: [], durationAmount: preset.amount,
        durationUnit: preset.unit, isAd: composeIsAd, tailType, reveal,
      });
    }
  };

  const resetComposer = () => {
    setComposerStep(1);
    setComposerMode("public");
    setComposeUrl("");
    setComposeTo("");
    setComposeMessage("");
    setComposeMedia(null);
    setComposeIsAd(false);
    setComposeTailType("LOOK");
    setRevealKind("coupon");
    setRevealValue("");
    setDurationPreset(2);
  };

  useEffect(() => {
    const onTailSent = (res) => {
      if (res?.ok) {
        showToast("✅ Tail sent!");
        setTailStats((prev) => [{
          title: composeUrl || "Tail",
          tailType: composeTailType,
          catchCount: 0, clicks: 0, earnings: 0,
        }, ...prev].slice(0, 50));
        resetComposer();
        setComposerOpen(false);
        socket.emit("get-smart-feed");
        socket.emit("get-public-feed");
      } else {
        showToast("❌ Failed to send", 2500);
      }
    };
    socket.on("tail-sent", onTailSent);
    return () => socket.off("tail-sent", onTailSent);
  }, [composeTailType, composeUrl]);

  const applyTypeFilter = (list) => {
    const arr = Array.isArray(list) ? list : [];
    if (typeFilter === "ALL") return arr;
    return arr.filter((t) => String(t?.tailType || "LOOK").toUpperCase() === typeFilter);
  };

  const feedTails = smartFeed.length > 0 ? smartFeed : publicTails;
  const trending = [...feedTails].sort((a, b) => (b.catchCount || 0) - (a.catchCount || 0)).slice(0, 8);

  // ============================================
  // REVEAL BODY
  // ============================================
  const renderRevealBody = () => {
    const t = activeTail || modalTail;
    const reveal = t?.reveal;
    if (!reveal) return (
      <Text style={{ color: C.muted, marginTop: 10 }}>No reveal attached.</Text>
    );
    if (reveal.kind === "coupon") return (
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: C.muted, fontWeight: "900" }}>Coupon Code</Text>
        <View style={{
          marginTop: 8, padding: 14, borderRadius: 14,
          borderWidth: 1, borderColor: C.border, backgroundColor: C.panel2,
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        }}>
          <Text style={{ color: C.text, fontWeight: "900", fontSize: 20 }}>
            {String(reveal.code || "").toUpperCase()}
          </Text>
          <TouchableOpacity
            onPress={async () => {
              const ok = await copyToClipboard(reveal.code);
              showToast(ok ? "✅ Copied!" : "❌ Copy failed");
            }}
            style={{
              paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12,
              borderWidth: 1, borderColor: C.border, backgroundColor: "rgba(124,58,237,0.14)",
            }}
          >
            <Text style={{ color: C.text, fontWeight: "900" }}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
    if (reveal.kind === "url") return (
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: C.muted, fontWeight: "900" }}>Reveal Link</Text>
        <TouchableOpacity
          onPress={() => openOriginal(reveal.url)}
          style={{
            marginTop: 8, padding: 14, borderRadius: 14,
            borderWidth: 1, borderColor: C.border, backgroundColor: C.panel2,
          }}
        >
          <Text style={{ color: C.brand, fontWeight: "900" }} numberOfLines={2}>{reveal.url}</Text>
          <Text style={{ color: C.dim, marginTop: 4 }}>Tap to open →</Text>
        </TouchableOpacity>
      </View>
    );
    return (
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: C.muted, fontWeight: "900" }}>Reveal</Text>
        <View style={{
          marginTop: 8, padding: 14, borderRadius: 14,
          borderWidth: 1, borderColor: C.border, backgroundColor: C.panel2,
        }}>
          <Text style={{ color: C.text }}>{reveal.text}</Text>
        </View>
      </View>
    );
  };

  // ============================================
  // COMPOSER STEPS
  // ============================================
  const renderComposerStep = () => {
    if (composerStep === 1) return (
      <View style={{ gap: 14 }}>
        <Text style={{ color: C.dim, fontWeight: "900", textTransform: "uppercase", fontSize: 11, letterSpacing: 1 }}>
          Step 1 of 3 — Content
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {["public", "private"].map((m) => {
            const active = composerMode === m;
            return (
              <Pressable key={m} onPress={() => setComposerMode(m)} style={{
                flex: 1, paddingVertical: 12, borderRadius: 16, borderWidth: 1,
                borderColor: active ? C.brand : C.border,
                backgroundColor: active ? "rgba(124,58,237,0.18)" : "transparent",
                alignItems: "center",
              }}>
                <Text style={{ color: active ? C.text : C.muted, fontWeight: "900" }}>
                  {m === "public" ? "🌐 Public" : "🔒 Private"}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {composerMode === "private" && (
          <TextInput
            value={composeTo} onChangeText={setComposeTo}
            placeholder="@username" placeholderTextColor={C.dim} autoCapitalize="none"
            style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.brand, color: C.text, padding: 12, borderRadius: 14 }}
          />
        )}
        <TextInput
          value={composeUrl} onChangeText={setComposeUrl}
          placeholder="Paste a link (optional)" placeholderTextColor={C.dim}
          autoCapitalize="none" autoCorrect={false}
          style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, color: C.text, padding: 12, borderRadius: 14 }}
        />
        <TouchableOpacity onPress={pickMedia} style={{
          backgroundColor: C.bg, borderWidth: 1,
          borderColor: composeMedia ? C.green : C.border,
          padding: 12, borderRadius: 14, alignItems: "center",
        }}>
          <Text style={{ color: composeMedia ? C.green : C.muted, fontWeight: "900" }}>
            {composeMedia
              ? `✅ ${composeMedia.type === "video" ? "Video" : "Image"} selected`
              : "📷 Add photo or video (optional)"}
          </Text>
        </TouchableOpacity>
        <TextInput
          value={composeMessage} onChangeText={setComposeMessage}
          placeholder="Add a message (optional)" placeholderTextColor={C.dim} multiline
          style={{
            backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
            color: C.text, padding: 12, borderRadius: 14, minHeight: 72, textAlignVertical: "top",
          }}
        />
        <TouchableOpacity onPress={() => setComposerStep(2)} style={{
          paddingVertical: 14, borderRadius: 16, backgroundColor: C.brand, alignItems: "center",
        }}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>Next →</Text>
        </TouchableOpacity>
      </View>
    );

    if (composerStep === 2) return (
      <View style={{ gap: 14 }}>
        <Text style={{ color: C.dim, fontWeight: "900", textTransform: "uppercase", fontSize: 11, letterSpacing: 1 }}>
          Step 2 of 3 — Type & Reveal
        </Text>
        <View>
          <Text style={{ color: C.muted, fontWeight: "900", marginBottom: 8 }}>Tail Type</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {TAIL_TYPES.map((t) => {
              const active = composeTailType === t;
              const icon = t === "LOOK" ? "👀" : t === "NOW" ? "⚡" : "💧";
              return (
                <TouchableOpacity key={t} onPress={() => setComposeTailType(t)} style={{
                  flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1,
                  borderColor: active ? C.brand : C.border,
                  backgroundColor: active ? "rgba(124,58,237,0.18)" : "transparent",
                  alignItems: "center", gap: 4,
                }}>
                  <Text style={{ fontSize: 18 }}>{icon}</Text>
                  <Text style={{ color: active ? C.text : C.muted, fontWeight: "900", fontSize: 12 }}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View>
          <Text style={{ color: C.muted, fontWeight: "900", marginBottom: 8 }}>Reveal — what catchers unlock</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            {[
              { key: "coupon", label: "🎟 Coupon" },
              { key: "url", label: "🔗 Link" },
              { key: "text", label: "📝 Text" },
            ].map(({ key, label }) => {
              const active = revealKind === key;
              return (
                <TouchableOpacity key={key} onPress={() => { setRevealKind(key); setRevealValue(""); }} style={{
                  flex: 1, paddingVertical: 10, borderRadius: 14, borderWidth: 1,
                  borderColor: active ? C.brand : C.border,
                  backgroundColor: active ? "rgba(124,58,237,0.18)" : "transparent",
                  alignItems: "center",
                }}>
                  <Text style={{ color: active ? C.text : C.muted, fontWeight: "900", fontSize: 12 }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            value={revealValue} onChangeText={setRevealValue}
            placeholder={
              revealKind === "coupon" ? "e.g. JORDAN20"
              : revealKind === "url" ? "https://..."
              : "Secret message, instructions..."
            }
            placeholderTextColor={C.dim}
            autoCapitalize={revealKind === "coupon" ? "characters" : "none"}
            autoCorrect={revealKind === "text"}
            multiline={revealKind === "text"}
            style={{
              backgroundColor: C.bg, borderWidth: 1,
              borderColor: revealValue ? C.green : C.border,
              color: C.text, padding: 12, borderRadius: 14,
              minHeight: revealKind === "text" ? 80 : 48,
              textAlignVertical: revealKind === "text" ? "top" : "center",
              fontWeight: revealKind === "coupon" ? "900" : "400",
              fontSize: revealKind === "coupon" ? 16 : 14,
            }}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity onPress={() => setComposerStep(1)} style={{
            flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: C.border, alignItems: "center",
          }}>
            <Text style={{ color: C.muted, fontWeight: "900" }}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setComposerStep(3)} style={{
            flex: 2, paddingVertical: 14, borderRadius: 16, backgroundColor: C.brand, alignItems: "center",
          }}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>Next →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

    if (composerStep === 3) return (
      <View style={{ gap: 14 }}>
        <Text style={{ color: C.dim, fontWeight: "900", textTransform: "uppercase", fontSize: 11, letterSpacing: 1 }}>
          Step 3 of 3 — Duration & Send
        </Text>
        <View>
          <Text style={{ color: C.muted, fontWeight: "900", marginBottom: 8 }}>Expires in</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {DURATION_PRESETS.map((p, i) => {
              const active = durationPreset === i;
              return (
                <TouchableOpacity key={p.label} onPress={() => setDurationPreset(i)} style={{
                  flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1,
                  borderColor: active ? C.brand : C.border,
                  backgroundColor: active ? "rgba(124,58,237,0.18)" : "transparent",
                  alignItems: "center",
                }}>
                  <Text style={{ color: active ? C.text : C.muted, fontWeight: "900" }}>{p.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={{
          backgroundColor: C.panel2, borderRadius: 16,
          borderWidth: 1, borderColor: C.border, padding: 14, gap: 6,
        }}>
          <Text style={{ color: C.muted, fontWeight: "900", marginBottom: 4 }}>Summary</Text>
          <Text style={{ color: C.text }}>
            <Text style={{ color: C.dim }}>Mode: </Text>
            {composerMode === "private" ? `🔒 Private → @${composeTo || "?"}` : "🌐 Public"}
          </Text>
          <Text style={{ color: C.text }}>
            <Text style={{ color: C.dim }}>Type: </Text>{composeTailType}
          </Text>
          <Text style={{ color: C.text }}>
            <Text style={{ color: C.dim }}>Reveal: </Text>
            {revealKind.toUpperCase()} — {revealValue ? "✅ set" : "⚠️ empty"}
          </Text>
          <Text style={{ color: C.text }}>
            <Text style={{ color: C.dim }}>Expires: </Text>{DURATION_PRESETS[durationPreset].label}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setComposeIsAd(!composeIsAd)}
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1,
            borderColor: composeIsAd ? C.amber : C.border,
            backgroundColor: composeIsAd ? C.amber + "20" : "transparent",
          }}
        >
          <Text style={{ color: composeIsAd ? C.amber : C.muted, fontWeight: "900" }}>Mark as Sponsored</Text>
          <View style={{
            width: 44, height: 24, borderRadius: 12,
            backgroundColor: composeIsAd ? C.amber : C.border,
            justifyContent: "center", paddingHorizontal: 2,
          }}>
            <View style={{
              width: 20, height: 20, borderRadius: 10, backgroundColor: "white",
              alignSelf: composeIsAd ? "flex-end" : "flex-start",
            }} />
          </View>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity onPress={() => setComposerStep(2)} style={{
            flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: C.border, alignItems: "center",
          }}>
            <Text style={{ color: C.muted, fontWeight: "900" }}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={sendFromComposer} style={{
            flex: 2, paddingVertical: 14, borderRadius: 16, backgroundColor: C.green, alignItems: "center",
          }}>
            <Text style={{ color: C.greenInk, fontWeight: "900" }}>🚀 Send Tail</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={C === LIGHT ? "dark-content" : "light-content"} />

      {/* TOAST */}
      {!!toast && (
        <View style={{
          position: "absolute", top: 18, left: 16, right: 16,
          backgroundColor: C.panel, borderWidth: 1, borderColor: C.border,
          padding: 12, borderRadius: 16, zIndex: 999,
        }}>
          <Text style={{ color: C.text, fontWeight: "800", textAlign: "center" }}>{toast}</Text>
        </View>
      )}

      {/* REVEAL MODAL */}
      <Modal visible={revealOpen} transparent animationType="fade" onRequestClose={() => setRevealOpen(false)} statusBarTranslucent>
        <Pressable onPress={() => setRevealOpen(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 14 }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{
            backgroundColor: C.panel, borderRadius: 22, borderWidth: 1, borderColor: C.border, overflow: "hidden",
          }}>
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: C.text, fontWeight: "900", fontSize: 16 }}>🎯 Revealed</Text>
                <Pressable onPress={() => setRevealOpen(false)} hitSlop={10}>
                  <Text style={{ color: C.muted, fontWeight: "900" }}>Close</Text>
                </Pressable>
              </View>
              <View style={{ marginTop: 10, gap: 6 }}>
                <Text style={{ color: C.text, fontWeight: "900" }} numberOfLines={1}>
                  {activeTail?.meta?.title || activeTail?.title || "Tail"}
                </Text>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <Text style={{ color: C.muted, fontWeight: "900" }}>@{activeTail?.from || "user"}</Text>
                  <View style={{
                    paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999,
                    borderWidth: 1, borderColor: C.border, backgroundColor: "rgba(255,255,255,0.06)",
                  }}>
                    <Text style={{ color: C.brand, fontWeight: "900", fontSize: 12 }}>
                      {(activeTail?.tailType || "LOOK").toUpperCase()}
                    </Text>
                  </View>
                </View>
                {!!activeTail?.message && <Text style={{ color: C.muted }}>"{activeTail.message}"</Text>}
                {!!activeTail?.mediaUrl && activeTail?.mediaType === "image" ? (
                  <Image source={{ uri: activeTail.mediaUrl }} style={{ width: "100%", height: 160, borderRadius: 14 }} resizeMode="cover" />
                ) : !!activeTail?.meta?.image ? (
                  <Image source={{ uri: activeTail.meta.image }} style={{ width: "100%", height: 160, borderRadius: 14 }} resizeMode="cover" />
                ) : null}
              </View>
              {renderRevealBody()}
              <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TextInput
                    value={chatText} onChangeText={setChatText}
                    placeholder="Leave a comment…" placeholderTextColor={C.dim}
                    style={{
                      flex: 1, color: C.text, backgroundColor: C.bg,
                      borderWidth: 1, borderColor: C.border, padding: 12, borderRadius: 14,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      const t = chatText.trim();
                      if (!t || !activeSession) return;
                      socket.emit("tail-chat", { tailId: activeSession.id, text: t });
                      setChatText("");
                    }}
                    style={{ paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.green, alignItems: "center", justifyContent: "center" }}
                  >
                    <Text style={{ color: C.greenInk, fontWeight: "900" }}>Send</Text>
                  </TouchableOpacity>
                </View>
                {chatMsgs.slice(-3).map((m, idx) => (
                  <Text key={idx} style={{ color: C.muted, marginTop: 6 }}>
                    <Text style={{ color: C.text, fontWeight: "900" }}>{m.from}: </Text>{m.text}
                  </Text>
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                <TouchableOpacity onPress={() => openOriginal(activeTail?.url)} style={{
                  flex: 1, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: C.border, alignItems: "center",
                }}>
                  <Text style={{ color: C.text, fontWeight: "900" }}>Open Link</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setRevealOpen(false); setScreen("chat"); }} style={{
                  flex: 1, paddingVertical: 12, borderRadius: 16, backgroundColor: C.brand, alignItems: "center",
                }}>
                  <Text style={{ color: "#fff", fontWeight: "900" }}>Open Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* COMPOSER MODAL */}
      <Modal visible={composerOpen} transparent animationType="slide" onRequestClose={() => setComposerOpen(false)} statusBarTranslucent>
        <Pressable onPress={() => setComposerOpen(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{
            backgroundColor: C.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24,
            borderWidth: 1, borderColor: C.border, maxHeight: "88%",
          }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <Text style={{ color: C.text, fontWeight: "900", fontSize: 17 }}>Send a Tail</Text>
                    <Pressable onPress={() => { setComposerOpen(false); resetComposer(); }} hitSlop={10}>
                      <Text style={{ color: C.muted, fontWeight: "900" }}>Cancel</Text>
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
                    {[1, 2, 3].map((s) => (
                      <View key={s} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        backgroundColor: s <= composerStep ? C.brand : C.border,
                      }} />
                    ))}
                  </View>
                  {renderComposerStep()}
                  <View style={{ height: 30 }} />
                </ScrollView>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* VIEWER MODAL */}
      <Modal visible={viewerOpen} animationType="slide" onRequestClose={() => setViewerOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <View style={{
            padding: 12, borderBottomWidth: 1, borderBottomColor: C.border,
            backgroundColor: C.panel, flexDirection: "row", justifyContent: "space-between", alignItems: "center",
          }}>
            <Text style={{ color: C.text, fontWeight: "900" }} numberOfLines={1}>Original</Text>
            <Pressable onPress={() => setViewerOpen(false)} style={{
              paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border,
            }}>
              <Text style={{ color: C.muted, fontWeight: "900" }}>Back</Text>
            </Pressable>
          </View>
          <WebView source={{ uri: viewerUrl }} startInLoadingState />
        </SafeAreaView>
      </Modal>

      {/* ── LOGIN ── */}
      {screen === "login" && (
        <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Text style={{ color: C.brand, fontSize: 56 }}>🦊</Text>
            <Text style={{ color: C.text, fontSize: 34, fontWeight: "900", marginTop: 8 }}>Tail Me</Text>
            <Text style={{ color: C.muted, marginTop: 6, textAlign: "center" }}>Catch moments — don't scroll.</Text>
          </View>
          <View style={{ backgroundColor: C.panel, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16 }}>
            <Text style={{ color: C.muted, fontWeight: "800", marginBottom: 8 }}>Username</Text>
            <TextInput
              value={username} onChangeText={setUsername}
              placeholder="alice" placeholderTextColor={C.dim} autoCapitalize="none"
              style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, color: C.text, padding: 12, borderRadius: 14 }}
            />
            <TouchableOpacity onPress={doLogin} style={{ marginTop: 12, backgroundColor: C.green, padding: 14, borderRadius: 14, alignItems: "center" }}>
              <Text style={{ color: C.greenInk, fontWeight: "900" }}>Enter</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              {["system", "dark", "light"].map((k) => {
                const active = themePref === k;
                return (
                  <TouchableOpacity key={k} onPress={() => setThemePref(k)} style={{
                    flex: 1, paddingVertical: 10, borderRadius: 14, borderWidth: 1,
                    borderColor: active ? C.brand : C.border,
                    backgroundColor: active ? "rgba(124,58,237,0.18)" : "transparent",
                    alignItems: "center",
                  }}>
                    <Text style={{ color: active ? C.text : C.muted, fontWeight: "900" }}>{k.toUpperCase()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* ── HUB ── */}
      {screen === "hub" && me && (
        <View style={{ flex: 1, paddingBottom: 92 }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {["ALL", ...TAIL_TYPES].map((t) => (
                <TouchableOpacity key={t} onPress={() => setTypeFilter(t)} style={{
                  flex: 1, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
                  borderColor: typeFilter === t ? C.brand : C.border,
                  backgroundColor: typeFilter === t ? "rgba(124,58,237,0.18)" : "transparent",
                  alignItems: "center",
                }}>
                  <Text style={{ color: typeFilter === t ? C.text : C.muted, fontWeight: "900", fontSize: 11 }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TailHome
            me={me}
            publicCount={publicTails.length}
            inboxCount={inboxTails.length}
            allTails={applyTypeFilter(feedTails)}
            trending={applyTypeFilter(trending)}
            onOpenPublic={() => { setScreen("public"); socket.emit("get-public-feed"); }}
            onOpenPrivate={() => setScreen("private")}
            onOpenTail={openTailCard}
            colors={C}
            onReact={reactToTail}
            streak={streak}
            earnings={earnings}
            isPro={isPro}
            onOpenEarnings={() => setScreen("earnings")}
            onOpenPro={() => setScreen("pro")}
          />
        </View>
      )}

      {/* ── PUBLIC ── */}
      {screen === "public" && me && (
        <View style={{ flex: 1, padding: 16, paddingBottom: 92 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <TouchableOpacity onPress={() => setScreen("hub")}>
              <Text style={{ color: C.muted, fontWeight: "900" }}>← Home</Text>
            </TouchableOpacity>
            <Text style={{ color: C.text, fontWeight: "900", fontSize: 18 }}>Public Arena</Text>
            <Text style={{ color: C.dim, fontWeight: "800" }}>@{me.username}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            {["ALL", ...TAIL_TYPES].map((t) => (
              <TouchableOpacity key={t} onPress={() => setTypeFilter(t)} style={{
                flex: 1, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
                borderColor: typeFilter === t ? C.brand : C.border,
                backgroundColor: typeFilter === t ? "rgba(124,58,237,0.18)" : "transparent",
                alignItems: "center",
              }}>
                <Text style={{ color: typeFilter === t ? C.text : C.muted, fontWeight: "900", fontSize: 12 }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <ScrollView style={{ marginTop: 12 }} showsVerticalScrollIndicator={false}>
            {applyTypeFilter(publicTails).map((t) => (
              <TailCard key={t.id} tail={t} onPressTail={openTailCard} colors={C} onReact={reactToTail} />
            ))}
            {publicTails.length === 0 && (
              <Text style={{ color: C.dim, marginTop: 24, textAlign: "center" }}>No public tails yet.</Text>
            )}
          </ScrollView>
          <CatchTailModal visible={modalOpen} tail={modalTail} onClose={() => setModalOpen(false)} onCatch={catchTail} onOpenLink={() => openOriginal(modalTail?.url)} onReact={reactToTail} colors={C} />
        </View>
      )}

      {/* ── PRIVATE ── */}
      {screen === "private" && me && (
        <View style={{ flex: 1, padding: 16, paddingBottom: 92 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <TouchableOpacity onPress={() => setScreen("hub")}>
              <Text style={{ color: C.muted, fontWeight: "900" }}>← Home</Text>
            </TouchableOpacity>
            <Text style={{ color: C.text, fontWeight: "900", fontSize: 18 }}>Private Inbox</Text>
            <Text style={{ color: C.dim, fontWeight: "800" }}>@{me.username}</Text>
          </View>
          <ScrollView style={{ marginTop: 14 }} showsVerticalScrollIndicator={false}>
            {inboxTails.map((t) => (
              <TailCard key={t.id} tail={t} onPressTail={openTailCard} colors={C} onReact={reactToTail} />
            ))}
            {inboxTails.length === 0 && (
              <Text style={{ color: C.dim, marginTop: 24, textAlign: "center" }}>Your inbox is empty.</Text>
            )}
          </ScrollView>
          <CatchTailModal visible={modalOpen} tail={modalTail} onClose={() => setModalOpen(false)} onCatch={catchTail} onOpenLink={() => openOriginal(modalTail?.url)} onReact={reactToTail} colors={C} />
        </View>
      )}

      {/* ── EARNINGS ── */}
      {screen === "earnings" && me && (
        <View style={{ flex: 1, paddingBottom: 92 }}>
          <EarningsScreen
            me={me} colors={C} streak={streak}
            earnings={earnings} tailStats={tailStats}
            isPro={isPro}
            onBack={() => setScreen("hub")}
            onOpenPro={() => setScreen("pro")}
          />
        </View>
      )}

      {/* ── PRO ── */}
      {screen === "pro" && (
        <View style={{ flex: 1, paddingBottom: 92 }}>
          <ProScreen
            colors={C} isPro={isPro}
            onBack={() => setScreen("hub")}
            onUpgrade={() => {
              setIsPro(true);
              AsyncStorage.setItem("tailme_is_pro", "true").catch(() => {});
              showToast("🎉 Welcome to Pro!", 3000);
              setScreen("hub");
            }}
          />
        </View>
      )}

      {/* ── SETTINGS ── */}
      {screen === "settings" && me && (
        <View style={{ flex: 1, padding: 16, paddingBottom: 92 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <TouchableOpacity onPress={() => setScreen("hub")}>
              <Text style={{ color: C.muted, fontWeight: "900" }}>← Home</Text>
            </TouchableOpacity>
            <Text style={{ color: C.text, fontWeight: "900", fontSize: 18 }}>Settings</Text>
            <Text style={{ color: C.dim, fontWeight: "800" }}>@{me.username}</Text>
          </View>
          <View style={{ marginTop: 24, backgroundColor: C.panel, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16 }}>
            <Text style={{ color: C.muted, fontWeight: "900", marginBottom: 12 }}>Theme</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {["system", "dark", "light"].map((k) => {
                const active = themePref === k;
                return (
                  <TouchableOpacity key={k} onPress={() => setThemePref(k)} style={{
                    flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1,
                    borderColor: active ? C.brand : C.border,
                    backgroundColor: active ? "rgba(124,58,237,0.18)" : "transparent",
                    alignItems: "center",
                  }}>
                    <Text style={{ color: active ? C.text : C.muted, fontWeight: "900" }}>
                      {k === "system" ? "⚙️" : k === "dark" ? "🌙" : "☀️"}
                    </Text>
                    <Text style={{ color: active ? C.text : C.muted, fontWeight: "900", fontSize: 12, marginTop: 4 }}>
                      {k.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={{ marginTop: 14, backgroundColor: C.panel, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16 }}>
            <Text style={{ color: C.muted, fontWeight: "900", marginBottom: 4 }}>Account</Text>
            <Text style={{ color: C.text, fontWeight: "900", fontSize: 18 }}>@{me.username}</Text>
            {isPro && (
              <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999, backgroundColor: C.brand + "30", borderWidth: 1, borderColor: C.brand }}>
                  <Text style={{ color: C.brand, fontWeight: "900", fontSize: 12 }}>PRO</Text>
                </View>
                <Text style={{ color: C.muted, fontSize: 12 }}>Active subscription</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => { setMe(null); setScreen("login"); setPublicTails([]); setInboxTails([]); setSmartFeed([]); socket.disconnect(); }}
              style={{ marginTop: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: C.red, alignItems: "center" }}
            >
              <Text style={{ color: C.red, fontWeight: "900" }}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── CHAT ── */}
      {screen === "chat" && activeSession && me && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={60}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={{ flex: 1, padding: 16, paddingBottom: 92 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <TouchableOpacity onPress={() => setScreen("hub")}>
                  <Text style={{ color: C.muted, fontWeight: "900" }}>← Home</Text>
                </TouchableOpacity>
                <Text style={{ color: C.text, fontWeight: "900", fontSize: 18 }}>Tail Chat</Text>
                <Text style={{ color: C.dim, fontWeight: "800" }}>@{me.username}</Text>
              </View>
              <View style={{ marginTop: 14, backgroundColor: C.panel, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 12, gap: 6 }}>
                <Text style={{ color: C.text, fontWeight: "900" }}>{activeTail?.meta?.title || activeTail?.title || "Tail"}</Text>
                <TouchableOpacity onPress={() => openOriginal(activeTail?.url)}>
                  <Text style={{ color: C.brand }} numberOfLines={1}>{activeTail?.url || ""}</Text>
                </TouchableOpacity>
                {!!activeTail?.meta?.image && (
                  <Image source={{ uri: activeTail.meta.image }} style={{ width: "100%", height: 160, borderRadius: 14 }} resizeMode="cover" />
                )}
                {!!activeTail?.message && <Text style={{ color: C.muted }}>💬 {activeTail.message}</Text>}
                <Text style={{ color: C.muted, fontWeight: "900" }}>🔥 {Number(activeTail?.catchCount || 0)}</Text>
              </View>
              <ScrollView style={{ marginTop: 12, flex: 1 }} showsVerticalScrollIndicator={false}>
                {chatMsgs.map((m, idx) => (
                  <View key={idx} style={{ paddingVertical: 8 }}>
                    <Text style={{ color: m.from === "system" ? C.dim : C.text }}>
                      <Text style={{ color: C.muted, fontWeight: "800" }}>{m.from}: </Text>{m.text}
                    </Text>
                  </View>
                ))}
              </ScrollView>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <TextInput
                  value={chatText} onChangeText={setChatText}
                  placeholder="Type message…" placeholderTextColor={C.dim} autoCapitalize="none"
                  style={{ flex: 1, color: C.text, backgroundColor: C.panel, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: C.border }}
                />
                <TouchableOpacity
                  onPress={() => {
                    const t = chatText.trim();
                    if (!t || !activeSession) return;
                    socket.emit("tail-chat", { tailId: activeSession.id, text: t });
                    setChatText("");
                  }}
                  style={{ paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.green, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ color: C.greenInk, fontWeight: "900" }}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}

      {/* ── FAB + TABS ── */}
      {me && screen !== "login" && (
        <>
          <Pressable onPress={() => { resetComposer(); setComposerOpen(true); }} style={{
            position: "absolute", bottom: 88, right: 16,
            backgroundColor: C.brand, borderRadius: 18,
            paddingHorizontal: 18, paddingVertical: 14,
            borderWidth: 1, borderColor: C.border,
          }}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>+ Send</Text>
          </Pressable>

          <View style={{
            position: "absolute", left: 0, right: 0, bottom: 0,
            borderTopWidth: 1, borderTopColor: C.border,
            backgroundColor: C.panel,
            paddingBottom: 14, paddingTop: 10, paddingHorizontal: 10,
            flexDirection: "row", gap: 6,
          }}>
            {[
              { key: "hub", label: "Home", icon: "🏠" },
              { key: "public", label: "Public", icon: "🌐" },
              { key: "private", label: "Inbox", icon: "📬" },
              { key: "earnings", label: "Earnings", icon: streak > 0 ? "🔥" : "💰" },
              { key: "settings", label: "Settings", icon: "⚙️" },
            ].map((it) => {
              const active = screen === it.key;
              return (
                <Pressable key={it.key} onPress={() => setScreen(it.key)} style={{
                  flex: 1, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
                  borderColor: active ? C.brand : C.border,
                  backgroundColor: active ? "rgba(124,58,237,0.18)" : "transparent",
                  alignItems: "center", gap: 2,
                }}>
                  <Text style={{ fontSize: 14 }}>{it.icon}</Text>
                  <Text style={{ color: active ? C.text : C.muted, fontWeight: "900", fontSize: 9 }}>{it.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}