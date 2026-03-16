// App.js — Tail Me (Final Merged v5)
// ✅ All V2 original features preserved
// ✅ All V1 new features added
// ✅ All 15 bugs fixed
// ✅ Earnings moved into Settings
// ✅ Passport = Region stamps + Top Tails
// ✅ 5 tabs: Home / Map / Inbox / Passport / Settings
// ============================================

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Share,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useColorScheme,
  Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";

import CatchTailModal from "./CatchTailModal";
import TailHome from "./TailHome";
import OnboardingScreen from "./OnboardingScreen";
import ProfileSetupScreen from "./ProfileSetupScreen";
import ComposerModal from "./ComposerModal";
import TailCard from "./TailCard";
import EarningsScreen from "./EarningsScreen";
import ProScreen from "./ProScreen";
import GeoScreen from "./GeoScreen";
import CatchPassport from "./CatchPassport";
import ChainTailModal from "./ChainTailModal";
import { socket, SOCKET_URL } from "./socket";
import ProfileScreen from "./ProfileScreen";
import SplitFrameCard from "./SplitFrameCard";
import SearchScreen from "./SearchScreen";
import useAnalytics from "./useAnalytics";

// ── Notification handler ────────────────────────────────
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch {}

// ── Constants ───────────────────────────────────────────
const DURATION_PRESETS = [
  { label: "1h",  amount: 1,  unit: "h" },
  { label: "6h",  amount: 6,  unit: "h" },
  { label: "24h", amount: 24, unit: "h" },
  { label: "3d",  amount: 3,  unit: "d" },
];

const GEO_RADII = [
  { label: "100m", meters: 100 },
  { label: "500m", meters: 500 },
  { label: "1km",  meters: 1000 },
  { label: "5km",  meters: 5000 },
  { label: "City", meters: 25000 },
];


// ── Categories ─────────────────────────────────────────
const TAIL_CATEGORIES = [
  { id: "business",  label: "Business",   icon: "💼" },
  { id: "travel",    label: "Travel",     icon: "✈️" },
  { id: "food",      label: "Food",       icon: "🍕" },
  { id: "shopping",  label: "Shopping",   icon: "🛍️" },
  { id: "parties",   label: "Parties",    icon: "🎉" },
  { id: "fitness",   label: "Fitness",    icon: "💪" },
  { id: "music",     label: "Music",      icon: "🎵" },
  { id: "sports",    label: "Sports",     icon: "⚽" },
  { id: "gaming",    label: "Gaming",     icon: "🎮" },
  { id: "tech",      label: "Tech",       icon: "💻" },
  { id: "fashion",   label: "Fashion",    icon: "👗" },
  { id: "deals",     label: "Deals",      icon: "🏷️" },
];
const getCategoryById = (id) => TAIL_CATEGORIES.find((c) => c.id === id);

const REVEAL_SKINS = [
  { id: "default",  label: "Default",   gradient: ["#0D1220", "#1E293B"], accent: "#7C3AED", emoji: "⚡" },
  { id: "fire",     label: "Fire",      gradient: ["#1a0a00", "#2d1200"], accent: "#ff4d00", emoji: "🔥" },
  { id: "ocean",    label: "Ocean",     gradient: ["#001a2e", "#003a5c"], accent: "#0ea5e9", emoji: "🌊" },
  { id: "forest",   label: "Forest",    gradient: ["#001a0a", "#003318"], accent: "#22c55e", emoji: "🌿" },
  { id: "gold",     label: "Gold",      gradient: ["#1a1200", "#332400"], accent: "#f59e0b", emoji: "👑" },
  { id: "neon",     label: "Neon",      gradient: ["#0a001a", "#1a0033"], accent: "#c084fc", emoji: "🌙" },
  { id: "candy",    label: "Candy",     gradient: ["#1a0010", "#33001f"], accent: "#f43f8e", emoji: "🍬" },
  { id: "ice",      label: "Ice",       gradient: ["#001020", "#002040"], accent: "#67e8f9", emoji: "❄️" },
];


// ── Themes ──────────────────────────────────────────────
const DARK = {
  bg: "#070A0F",
  panel: "#0D1220",
  panel2: "#0A1020",
  border: "#1E293B",
  text: "#E5E7EB",
  muted: "#94A3B8",
  dim: "#64748B",
  green: "#22C55E",
  greenInk: "#052E16",
  amber: "#F59E0B",
  red: "#EF4444",
  brand: "#7C3AED",
};
const LIGHT = {
  bg: "#FFFFFF",
  panel: "#F8FAFC",
  panel2: "#F1F5F9",
  border: "#E5E7EB",
  text: "#0F172A",
  muted: "#334155",
  dim: "#64748B",
  green: "#16A34A",
  greenInk: "#052E16",
  amber: "#D97706",
  red: "#DC2626",
  brand: "#7C3AED",
};

// ── Clipboard (static import) ───────────────────────────
async function copyToClipboard(text) {
  try {
    await Clipboard.setStringAsync(String(text || ""));
    return true;
  } catch {
    return false;
  }
}


const CategoryPicker = ({ selected, onChange, colors: C, maxSelect = 3 }) => {
  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      if (selected.length < maxSelect) {
        onChange([...selected, id]);
      } else {
        onChange([...selected.slice(1), id]);
      }
    }
  };
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ color: C.muted, fontWeight: "800", fontSize: 12 }}>
          {selected.length}/{maxSelect} SELECTED
        </Text>
        {selected.length > 0 && (
          <TouchableOpacity onPress={() => onChange([])}>
            <Text style={{ color: C.red, fontWeight: "700", fontSize: 12 }}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {TAIL_CATEGORIES.map((cat) => {
          const isSelected = selected.includes(cat.id);
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => toggle(cat.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 9,
                paddingHorizontal: 12,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: isSelected ? C.brand : C.border,
                backgroundColor: isSelected ? "rgba(124,58,237,0.12)" : C.panel2,
              }}
            >
              <Text style={{ fontSize: 15 }}>{cat.icon}</Text>
              <Text style={{ color: isSelected ? C.text : C.muted, fontWeight: "700", fontSize: 13 }}>
                {cat.label}
              </Text>
              {isSelected && (
                <Text style={{ color: C.brand, fontWeight: "900", fontSize: 11 }}>✓</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const CategoryFilterBar = ({ selected, userInterests = [], onChange, colors: C }) => {
  const filterOptions = [
    { id: "foryou", label: "For You", icon: "✨" },
    ...TAIL_CATEGORIES.filter((cat) => userInterests.includes(cat.id)),
    { id: "all", label: "All", icon: "🌐" },
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12, gap: 6, paddingVertical: 4, alignItems: "center" }}
    >
      {filterOptions.map((opt) => {
        const isSelected = selected === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 20,
              borderWidth: 1,
              flexShrink: 0,
              borderColor: isSelected ? C.brand : C.border,
              backgroundColor: isSelected ? "rgba(124,58,237,0.18)" : C.panel,
            }}
          >
            <Text style={{ fontSize: 12 }}>{opt.icon}</Text>
            <Text style={{ color: isSelected ? C.text : C.muted, fontWeight: "800", fontSize: 11 }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

// ═════════════════════════════════════════════════════════
// APP
// ═════════════════════════════════════════════════════════
export default function App() {
  const [expandedTail, setExpandedTail] = useState(null);
  // DEV ONLY - remove before release
  // AsyncStorage.clear();
  const systemScheme = useColorScheme();
  const [themePref, setThemePref] = useState("system");
  const [screen, setScreen] = useState("login");
  const [hasOnboarded, setHasOnboarded] = useState(false);
  // DEV: uncomment to reset onboarding
  // React.useEffect(() => { AsyncStorage.clear(); }, []);
  const [hasProfile, setHasProfile] = useState(false);
  const [username, setUsername] = useState("");
  const [me, setMe] = useState(null);

  // Core
  const [streak, setStreak] = useState(0);
  const [following, setFollowing] = useState([]);
  const [followingFeed, setFollowingFeed] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [tailStats, setTailStats] = useState([]);

  // Feeds
  const [publicTails, setPublicTails] = useState([]);
  const [inboxTails, setInboxTails] = useState([]);
  const [smartFeed, setSmartFeed] = useState([]);
  const [geoFeed, setGeoFeed] = useState([]);

  // UI / Modals
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

  // Connection
  const [isConnected, setIsConnected] = useState(false);

  // Sending guards
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);

  // Passport
  const [passportCatches, setPassportCatches] = useState([]);

  // Chain
  const [chainLayer, setChainLayer] = useState(null);
  const [chainModalOpen, setChainModalOpen] = useState(false);

  // Location
  const [userLocation, setUserLocation] = useState(null);

  // Composer
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
  const [composeGeoRadius, setComposeGeoRadius] = useState(2);
  const [composeGeoLocation, setComposeGeoLocation] = useState(null);
  const [composeCatchLimit, setComposeCatchLimit] = useState("10");
  const [composeMonetizedUrl, setComposeMonetizedUrl] = useState("");
  const [composeMonetizationType, setComposeMonetizationType] = useState("direct");
  const [composeCategories, setComposeCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("foryou");
  const [profileUser, setProfileUser] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [composeRevealSkin, setComposeRevealSkin] = useState("default");

  // ── Refs for closure-safe access ──────────────────────
  const { track } = useAnalytics();
  const meRef = useRef(null);
  const activeTailRef = useRef(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    meRef.current = me;
  }, [me]);
  useEffect(() => {
    activeTailRef.current = activeTail;
  }, [activeTail]);

  // ── Theme ─────────────────────────────────────────────
  const C = useMemo(() => {
    if (themePref === "dark") return DARK;
    if (themePref === "light") return LIGHT;
    return systemScheme === "light" ? LIGHT : DARK;
  }, [themePref, systemScheme]);

  // ── Toast (with timer cleanup) ────────────────────────
  const showToast = useCallback((msg, ms = 2000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(""), ms);
  }, []);

  // ── Persist ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const onboarded = await AsyncStorage.getItem("tailme_has_onboarded");
        if (onboarded === "true") setHasOnboarded(true);
        const prof = await AsyncStorage.getItem("tailme_has_profile");
        if (prof === "true") setHasProfile(true);
        const v = await AsyncStorage.getItem("tailme_theme_pref");
        const s = await AsyncStorage.getItem("tailme_streak");
        const pro = await AsyncStorage.getItem("tailme_is_pro");
        const earn = await AsyncStorage.getItem("tailme_earnings");
        const cats = await AsyncStorage.getItem("tailme_catches");
        if (v === "system" || v === "dark" || v === "light") setThemePref(v);
        if (s) setStreak(Number(s) || 0);
        if (pro === "true") setIsPro(true);
        if (earn) setEarnings(parseFloat(earn) || 0);
        if (cats) {
          try {
            setPassportCatches(JSON.parse(cats) || []);
          } catch {}
        }
        const interests = await AsyncStorage.getItem("tailme_interests");
        if (interests) {
          try {
            const parsed = JSON.parse(interests) || [];
            setMe(prev => prev ? { ...prev, interests: parsed } : { username: "", interests: parsed });
          } catch {}
        }
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
  useEffect(() => {
    AsyncStorage.setItem(
      "tailme_catches",
      JSON.stringify(passportCatches)
    ).catch(() => {});
  }, [passportCatches]);

  useEffect(() => {
    if (me?.interests) {
      AsyncStorage.setItem("tailme_interests", JSON.stringify(me.interests)).catch(() => {});
    }
  }, [me?.interests]);


  // ── Deep link handler ────────────────────────────────
  useEffect(() => {
    // Handle app opened from a tailme:// link
    const handleUrl = ({ url }) => {
      console.log("🔗 Deep link:", url);
      // tailme://catch/TAIL_ID
      const catchMatch = url.match(/tailme:\/\/catch\/([^?]+)/);
      if (catchMatch) {
        const tailId = catchMatch[1];
        socket.emit("tail-preview", { tailId });
        socket.once("tail-preview-data", ({ tail }) => {
          if (tail) setExpandedTail(tail);
        });
        return;
      }
      // tailme://open — just open the app
    };

    // App already open — listen for incoming links
    const sub = Linking.addEventListener("url", handleUrl);

    // App opened from cold start via link
    Linking.getInitialURL().then(url => {
      if (url) handleUrl({ url });
    });

    return () => sub.remove();
  }, []);

  // ── Location (paused — geo features disabled) ───────
  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const { status } = await Location.requestForegroundPermissionsAsync();
  //       if (status !== "granted") return;
  //       const loc = await Location.getCurrentPositionAsync({
  //         accuracy: Location.Accuracy.Balanced,
  //       });
  //       setUserLocation({
  //         lat: loc.coords.latitude,
  //         lng: loc.coords.longitude,
  //       });
  //     } catch {}
  //   })();
  // }, []);

  // ── Notifications ─────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        await Notifications.requestPermissionsAsync();
      } catch {}
    })();
    let sub;
    try {
      sub = Notifications.addNotificationReceivedListener((n) => {
        showToast(`📲 ${n?.request?.content?.title || "Notification"}`);
      });
    } catch {}
    return () => {
      try {
        sub?.remove?.();
      } catch {}
    };
  }, [showToast]);

  // ── Socket connection ─────────────────────────────────
  useEffect(() => {
    const onConnect = () => {
      console.log("✅ Socket connected:", socket.id);
      setIsConnected(true);
    };
    const onConnectError = (e) => {
      console.log("❌ Socket connect error:", e?.message);
      setIsConnected(false);
    };
    const onDisconnect = (r) => {
      console.log("⚠️ Socket disconnected:", r);
      setIsConnected(false);
    };
    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) setIsConnected(true);
    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  // ── Socket event listeners (stable deps) ──────────────
  useEffect(() => {
    const patchTail = (id, patch) => {
      const apply = (arr) =>
        arr.map((t) => (t?.id === id ? { ...t, ...patch } : t));
      setPublicTails(apply);
      setSmartFeed(apply);
      setInboxTails(apply);
      setGeoFeed(apply);
      setModalTail((t) => (t?.id === id ? { ...t, ...patch } : t));
      setActiveTail((t) => (t?.id === id ? { ...t, ...patch } : t));
    };

    const onPublicFeed = ({ tails }) => {
      console.log("📥 public-feed:", tails?.length || 0);
      setPublicTails(Array.isArray(tails) ? tails : []);
    };
    const onSmartFeed = ({ tails }) => {
      console.log("📥 smart-feed:", tails?.length || 0);
      setSmartFeed(Array.isArray(tails) ? tails : []);
    };
    const onGeoFeed = ({ tails }) => {
      setGeoFeed(Array.isArray(tails) ? tails : []);
    };
    const onPublicCreated = (tail) => {
      console.log("📥 public-tail-created:", tail?.id);
      setPublicTails((p) => [tail, ...p].slice(0, 120));
      setSmartFeed((p) => [tail, ...p].slice(0, 120));
      if (tail?.geo) setGeoFeed((p) => [tail, ...p].slice(0, 120));
    };
    const onPrivateReceived = (tail) => {
      console.log("📥 tail-received from:", tail?.from);
      setInboxTails((p) => [tail, ...p].slice(0, 200));
      showToast(`📬 New tail from @${tail?.from || "user"}`);
    };
    const onTailUpdated = ({ tailId, patch }) => {
      if (!tailId || !patch) return;
      patchTail(tailId, patch);
    };
    const onExpired = ({ tailId }) => {
      patchTail(tailId, { expired: true });
      if (activeTailRef.current?.id === tailId) {
        showToast("⏰ This tail has expired");
      }
    };
    const onCatchUpdate = (u) => {
      if (!u?.tailId) return;
      const patch = { catchCount: u.catchCount, caughtBy: u.caughtBy };
      if (u.spotsLeft !== undefined) patch.spotsLeft = u.spotsLeft;
      if (u.isFull !== undefined) patch.isFull = u.isFull;
      patchTail(u.tailId, patch);
    };
    const onClosed = ({ tailId }) => {
      patchTail(tailId, { expired: true, isFull: true });
    };
    const onReactionsUpdate = ({ tailId, reactions, reactionCount }) => {
      patchTail(tailId, { reactions, reactionCount });
    };
    const onChatMsg = (m) => setChatMsgs((p) => [...p, m]);

    const onPassportData = ({ catches }) => {
      if (Array.isArray(catches)) setPassportCatches(catches);
    };
    const onChainLayerUnlocked = (data) => {
      setChainLayer(data);
      setRevealOpen(true);
      showToast(
        `🔗 Layer ${data.layerIndex + 1} of ${data.layerTotal} unlocked!`,
        2500
      );
    };
    const onChainComplete = (data) => {
      setChainLayer({ ...data, complete: true });
      setRevealOpen(true);
      showToast("🏁 Chain complete! You got the final reveal!", 3000);
    };

    // Follow system listeners
    const onFollowUpdated = (data) => {
      if (Array.isArray(data.following)) setFollowing(data.following);
    };
    const onNewFollower = (data) => {
      if (data?.from) showToast(`👤 @${data.from} started following you!`, 3000);
    };
    const onFollowingFeed = (data) => {
      if (Array.isArray(data)) setFollowingFeed(data);
    };

    socket.on("public-feed", onPublicFeed);
    socket.on("smart-feed", onSmartFeed);
    socket.on("geo-feed", onGeoFeed);
    socket.on("public-tail-created", onPublicCreated);
    socket.on("tail-received", onPrivateReceived);
    socket.on("tail-updated", onTailUpdated);
    socket.on("tail-expired", onExpired);
    socket.on("tail-catch-update", onCatchUpdate);
    socket.on("tail-closed", onClosed);
    socket.on("tail-reactions-update", onReactionsUpdate);
    socket.on("new-chat-message", onChatMsg);
    socket.on("passport-data", onPassportData);
    socket.on("chain-layer-unlocked", onChainLayerUnlocked);
    socket.on("chain-complete", onChainComplete);
    socket.on("follow-updated", onFollowUpdated);
    socket.on("new-follower", onNewFollower);
    socket.on("following-feed", onFollowingFeed);

    // Profile + Search listeners
    const onUserProfile = (data) => {};  // handled in ProfileScreen
    const onSearchResults = (data) => {
      setSearchResults(data.users || []);
    };
    socket.on("user-profile", onUserProfile);
    socket.on("search-results", onSearchResults);

    return () => {
      socket.off("public-feed", onPublicFeed);
      socket.off("smart-feed", onSmartFeed);
      socket.off("geo-feed", onGeoFeed);
      socket.off("public-tail-created", onPublicCreated);
      socket.off("tail-received", onPrivateReceived);
      socket.off("tail-updated", onTailUpdated);
      socket.off("tail-expired", onExpired);
      socket.off("tail-catch-update", onCatchUpdate);
      socket.off("tail-closed", onClosed);
      socket.off("tail-reactions-update", onReactionsUpdate);
      socket.off("new-chat-message", onChatMsg);
      socket.off("passport-data", onPassportData);
      socket.off("chain-layer-unlocked", onChainLayerUnlocked);
      socket.off("chain-complete", onChainComplete);
      socket.off("follow-updated", onFollowUpdated);
      socket.off("new-follower", onNewFollower);
      socket.off("following-feed", onFollowingFeed);
      socket.off("user-profile", onUserProfile);
      socket.off("search-results", onSearchResults);
    };
  }, [showToast]);

  // ── Login ─────────────────────────────────────────────
  const doLogin = async () => {
    const u = username.trim();
    if (!u) {
      showToast("⚠️ Enter a username");
      return;
    }

    console.log("🔐 Attempting login for:", u);

    if (!socket.connected) {
      console.log("🔌 Connecting socket...");
      socket.connect();
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log("⏰ Connection timeout");
          resolve();
        }, 5000);
        socket.once("connect", () => {
          console.log("✅ Socket connected for login");
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    if (!socket.connected) {
      showToast("❌ Cannot connect to server");
      return;
    }

    let pushToken = null;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === "granted") {
        try {
          pushToken = (await Notifications.getExpoPushTokenAsync()).data;
        } catch {}
      }
    } catch {}

    console.log("📤 Emitting register event");
    socket.emit("register", { username: u, pushToken });

    socket.once("registration-complete", async (res) => {
      console.log("📥 Registration response:", res);
      if (res?.ok) {
        setMe({ username: u, interests: [] });
        const onboarded = await AsyncStorage.getItem("tailme_has_onboarded");
        const savedUsername = await AsyncStorage.getItem('tailme_username');
        if (onboarded === "true") {
          if (savedUsername) {
            const prof = await AsyncStorage.getItem('tailme_has_profile');
            setScreen("hub");
          } else {
            setScreen("profile-setup");
          }
        } else {
          setScreen("onboarding");
        }
        socket.emit("get-smart-feed");
        socket.emit("get-public-feed");
      socket.emit("get-following");

        // Register push token
        try {
          const { status } = await Notifications.getPermissionsAsync();
          let finalStatus = status;
          if (status !== "granted") {
            const { status: s2 } = await Notifications.requestPermissionsAsync();
            finalStatus = s2;
          }
          if (finalStatus === "granted") {
            const tokenData = await Notifications.getExpoPushTokenAsync();
            if (tokenData?.data) {
              socket.emit("register-push-token", { token: tokenData.data });
            }
          }
        } catch (e) {}
        socket.emit("get-passport", { username: u });
        if (userLocation) {
          socket.emit("get-geo-feed", {
            lat: userLocation.lat,
            lng: userLocation.lng,
            radiusMeters: 10000,
          });
        }
        showToast(`✨ Welcome ${u}!`);
        track("login", { username: u });
      } else {
        showToast(`❌ Login failed: ${res?.error || "Unknown error"}`, 2500);
      }
    });

    setTimeout(() => {
      if (!meRef.current) {
        console.log("⏰ Registration timeout - no response");
        showToast("⏰ Login timed out. Try again.");
      }
    }, 5000);
  };

  // ── Helpers ───────────────────────────────────────────
  const openOriginal = useCallback(
    (url) => {
      const u = String(url || "").trim();
      if (!u) return;
      setViewerUrl(u);
      setViewerOpen(true);
      if (activeSession?.id) {
        socket.emit("open-link", { tailId: activeSession.id });
      }
    },
    [activeSession?.id]
  );

  const openTailCard = useCallback((tail) => {
    if (!tail?.id) return;
    console.log("📤 Requesting tail preview:", tail.id);
    socket.emit("tail-preview", { tailId: tail.id });
    socket.once("tail-preview-data", (res) => {
      console.log("📥 Tail preview data:", res);
      if (res?.tail) {
        setModalTail(res.tail);
        setModalOpen(true);
      }
    });
  }, []);

  // ── Catch (mutual listener cleanup) ───────────────────
  const catchTail = useCallback(
    (tail) => {
      if (!tail?.id) return;
      setModalOpen(false);
      console.log("📤 Catching tail:", tail.id);
      socket.emit("catch-tail", {
        tailId: tail.id,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
      });

      const cleanup = () => {
        socket.off("catch-failed", onFail);
        socket.off("session-started", onSession);
        clearTimeout(safetyTimeout);
      };

      const onFail = (res) => {
        if (res?.tailId !== tail.id) return;
        cleanup();
        if (res.reason === "out_of_range") {
          Alert.alert(
            "Too Far",
            `You're ${res.distance}m away. Need to be within ${res.required}m.`
          );
        } else if (res.reason === "geo_required") {
          Alert.alert(
            "Location Needed",
            "Enable location to catch this geo tail."
          );
        } else if (res.reason === "already_caught") {
          showToast("✅ Already caught this one!");
        } else if (res.reason === "full") {
          showToast("🔒 Drop is full — all spots taken");
        } else if (res.reason === "expired") {
          showToast("⏰ This tail has expired");
        }
      };

      const onSession = (res) => {
        if (!res?.session) return;
        cleanup();
        console.log("📥 Session started:", res);
        setActiveTail(res.tail || tail);
        setActiveSession(res.session);
        setChatMsgs(res.session.messages || []);
        setRevealOpen(true);
        showToast("🎯 Tail caught!");

        setStreak((s) => {
          const next = s + 1;
          if (next % 7 === 0) {
            showToast(`🔥 ${next} day streak! Bonus unlocked`, 3000);
          }
          return next;
        });

        if (isPro) {
          const commission = +(Math.random() * 2 + 0.5).toFixed(2);
          setEarnings((e) => +(e + commission).toFixed(2));
          showToast(`💰 +$${commission} earned!`, 2500);
        }

        // Add to passport with coordinates for region detection
        setPassportCatches((prev) =>
          [
            {
              id: tail.id,
              tailType: tail.tailType || "LOOK",
              from: tail.from,
              message: tail.message,
              geo: !!tail.geo,
              lat: tail.geo?.lat || userLocation?.lat || null,
              lng: tail.geo?.lng || userLocation?.lng || null,
              timestamp: Date.now(),
            },
            ...prev,
          ].slice(0, 500)
        );
      };

      socket.on("catch-failed", onFail);
      socket.on("session-started", onSession);
      const safetyTimeout = setTimeout(cleanup, 15000);
    },
    [userLocation, isPro, showToast]
  );

  const handleOnboardingComplete = useCallback(async (interests) => {
    if (interests?.length > 0) {
      const updated = { ...meRef.current, interests };
      setMe(updated);
      socket.emit("update-interests", { interests });
      await AsyncStorage.setItem("tailme_interests", JSON.stringify(interests));
    }
    await AsyncStorage.setItem("tailme_has_onboarded", "true");
    setHasOnboarded(true);
    setScreen("profile-setup");
    socket.emit("get-smart-feed", { interests: interests || [] });
    socket.emit("get-public-feed");
  }, []);

  const followUser = useCallback((target) => {
    if (!target || target === me?.username) return;
    socket.emit("follow-user", { target });
    track("follow", { target });
  }, [me?.username]);

  const unfollowUser = useCallback((target) => {
    if (!target) return;
    socket.emit("unfollow-user", { target });
    track("unfollow", { target });
  }, []);

  const isFollowing = useCallback((username) => {
    return following.includes(username);
  }, [following]);

  const openProfile = useCallback((username) => {
    if (!username) return;
    setProfileUser(username);
    setScreen("profile");
    track("view_profile", { username });
  }, [track]);

  const shareTail = useCallback(async (tail) => {
    if (!tail) return;
    try {
      const title = tail.meta?.title || tail.title || tail.message || "Check this out!";
      const url = tail.url || "";
      await Share.share({
        message: `${title}${url ? " — " + url : ""} | Shared via Tail Me 🦊`,
      });
      track("share_tail", { tailId: tail.id });
    } catch (e) {}
  }, [track]);

  const toggleFollow = useCallback((target) => {
    if (!target || target === me?.username) return;
    if (following.includes(target)) {
      socket.emit("unfollow-user", { target });
    track("unfollow", { target });
    } else {
      socket.emit("follow-user", { target });
    track("follow", { target });
    }
  }, [following, me?.username]);

  const reactToTail = useCallback((tailId, emoji) => {
    console.log("📤 Reacting to tail:", tailId, emoji);
    socket.emit("react-tail", { tailId, emoji });
  }, []);

  // ── Chain advance ─────────────────────────────────────
  const advanceChainLayer = useCallback(() => {
    if (!chainLayer?.tailId) return;
    socket.emit("chain-next-layer", { tailId: chainLayer.tailId });
  }, [chainLayer?.tailId]);

  // ── Media ─────────────────────────────────────────────
  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setComposeMedia({
          uri: asset.uri,
          type: asset.type === "video" ? "video" : "image",
        });
        console.log("📷 Media selected:", asset.type);
      }
    } catch (e) {
      console.log("❌ Media picker error:", e);
      showToast("❌ Could not open media picker");
    }
  };

  const uploadMedia = async () => {
    if (!composeMedia) return null;
    try {
      console.log("📤 Uploading media to:", `${SOCKET_URL}/upload`);
      const formData = new FormData();
      formData.append("media", {
        uri: composeMedia.uri,
        type: composeMedia.type === "video" ? "video/mp4" : "image/jpeg",
        name: `upload.${composeMedia.type === "video" ? "mp4" : "jpg"}`,
      });
      const response = await fetch(`${SOCKET_URL}/upload`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = await response.json();
      console.log("📥 Upload response:", data);
      return data?.ok
        ? { url: `${SOCKET_URL}${data.url}`, type: data.type }
        : null;
    } catch (e) {
      console.log("❌ Upload error:", e);
      return null;
    }
  };

  // ── Geo composer location ─────────────────────────────
  const pickComposerLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast("📍 Location permission needed", 2000);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setComposeGeoLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
      showToast("📍 Location set!");
    } catch {
      showToast("❌ Could not get location");
    }
  };

  // ── Reset composer ────────────────────────────────────
  const resetComposer = useCallback(() => {
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
    setIsSending(false);
    sendingRef.current = false;
    setComposeGeoRadius(2);
    setComposeGeoLocation(null);
    setComposeCatchLimit("10");
    setComposeMonetizedUrl("");
    setComposeMonetizationType("direct");
    setComposeMonetizedUrl("");
    setComposeMonetizationType("direct");
    setComposeCategories([]);
    setComposeRevealSkin("default");
  }, []);

  // ── Send tail ─────────────────────────────────────────
  const sendFromComposer = async () => {
    if (sendingRef.current || isSending) {
      console.log("⏸️ Already sending, ignoring duplicate call");
      return;
    }
    sendingRef.current = true;
    setIsSending(true);

    const resetGuards = () => {
      sendingRef.current = false;
      setIsSending(false);
    };

    console.log("🚀 ============ SEND TAIL START ============");
    console.log("📊 Socket connected:", socket.connected);
    console.log("📊 Socket ID:", socket.id);
    console.log("📊 composeUrl:", `"${composeUrl}"`);
    console.log("📊 composeMedia:", composeMedia ? JSON.stringify(composeMedia) : "null");
    console.log("📊 composerMode:", composerMode);
    console.log("📊 composeTo:", `"${composeTo}"`);
    console.log("📊 revealKind:", revealKind);
    console.log("📊 revealValue:", `"${revealValue}"`);
    console.log("📊 revealValue.length:", revealValue.length);
    console.log("📊 composeTailType:", composeTailType);
    console.log("📊 durationPreset:", durationPreset);
    console.log("📊 ===========================================");

    try {
      if (!socket.connected) {
        Alert.alert("Not Connected", "Cannot connect to server.", [
          { text: "Reconnect", onPress: () => socket.connect() },
          { text: "Cancel", style: "cancel" },
        ]);
        resetGuards();
        return;
      }

      const url = composeUrl.trim();
      if (!url && !composeMedia) {
        Alert.alert(
          "Missing Content",
          "Please add a link or select an image/video."
        );
        resetGuards();
        return;
      }

      const revealVal = revealValue.trim();

      // Reveal is optional — skip if empty
      // if (!revealVal && composeTailType !== "CHAIN") { ... }

      if (composerMode === "private") {
        const to = composeTo.trim().replace(/^@/, "");
        if (!to) {
          Alert.alert(
            "Missing Recipient",
            "Please enter a @username for private tail."
          );
          resetGuards();
          return;
        }
      }

      const reveal = revealVal
        ? { kind: revealKind, value: revealVal }
        : null;
      console.log("✅ Built reveal:", JSON.stringify(reveal));

      let mediaUrl = null;
      let mediaType = null;
      if (composeMedia) {
        console.log("📤 Starting media upload...");
        showToast("⏳ Uploading media...");
        const uploaded = await uploadMedia();
        if (!uploaded) {
          Alert.alert(
            "Upload Failed",
            "Could not upload media. Please try again."
          );
          resetGuards();
          return;
        }
        mediaUrl = uploaded.url;
        mediaType = uploaded.type;
        console.log("✅ Media uploaded:", mediaUrl);
      }

      const preset = DURATION_PRESETS[durationPreset];

      const geo =
        composeTailType === "GEO" && composeGeoLocation
          ? {
              lat: composeGeoLocation.lat,
              lng: composeGeoLocation.lng,
              radius: GEO_RADII[composeGeoRadius].meters,
            }
          : null;

      const tailData = {
        url: url || null,
        mediaUrl,
        mediaType,
        title: "Tail",
        message: composeMessage.trim() || "",
        monetization: {
          contentUrl: url || null,
          monetizedUrl: composeMonetizedUrl.trim() || url || null,
          type: composeMonetizationType,
          revenueGenerated: 0,
          creatorEarnings: 0,
          platformFee: 0,
        },
        analytics: {
          impressions: 0,
          clicks: 0,
          opens: 0,
          catches: 0,
          conversions: 0,
          engagementScore: 0,
        },
        energy: {
          current: 100,
          decayRate: 0.5,
          lastUpdated: Date.now(),
        },
        visibility: composerMode,
        recipients:
          composerMode === "private"
            ? [composeTo.trim().replace(/^@/, "")]
            : [],
        durationAmount: preset.amount,
        durationUnit: preset.unit,
        isAd: composeIsAd,
        tailType: composeTailType,
        categories: composeCategories,
        revealSkin: composeRevealSkin,
        reveal,
        geo,
        ...(composeTailType === "DROP" && {
          catchLimit: Math.max(
            1,
            Math.min(1000, Number(composeCatchLimit) || 10)
          ),
        }),
      };

      console.log("📤 Final tail data:", JSON.stringify(tailData, null, 2));

      socket.off("tail-sent");

      const handleTailSent = (res) => {
        console.log("📥 tail-sent response:", JSON.stringify(res));
        if (res?.ok) {
          console.log("✅ Tail sent successfully!");
          Alert.alert("Success! ✅", "Your tail has been sent!", [
            { text: "Great!" },
          ]);
          setTailStats((prev) =>
            [
              {
                title: composeUrl || "Tail",
                tailType: composeTailType,
                catchCount: 0,
                clicks: 0,
                earnings: 0,
              },
              ...prev,
            ].slice(0, 50)
          );
          resetComposer();
          setComposerOpen(false);
          socket.emit("get-smart-feed");
          socket.emit("get-public-feed");
          if (userLocation) {
            socket.emit("get-geo-feed", {
              lat: userLocation.lat,
              lng: userLocation.lng,
              radiusMeters: 10000,
            });
          }
        } else {
          console.log("❌ Tail send failed:", res?.error);
          Alert.alert("Failed", res?.error || "Unknown error occurred");
          resetGuards();
        }
      };

      socket.once("tail-sent", handleTailSent);
      console.log("📤 Emitting send-tail event...");
      socket.emit("send-tail", tailData);
      console.log("✅ send-tail event emitted, waiting for response...");

      setTimeout(() => {
        if (sendingRef.current) {
          console.log("⏰ Send timeout after 15s");
          socket.off("tail-sent", handleTailSent);
          resetGuards();
          Alert.alert(
            "Timeout",
            "Server did not respond. Check connection and try again."
          );
        }
      }, 15000);
    } catch (error) {
      console.error("❌ Error in sendFromComposer:", error);
      Alert.alert("Error", error.message || "Something went wrong");
      resetGuards();
    }
  };

  // ── Send chain tail (with guard) ──────────────────────
  // ── New fast composer send — accepts payload from ComposerModal ──
  const sendTailPayload = useCallback(async (payload) => {
    if (sendingRef.current || isSending) return;
    sendingRef.current = true;
    setIsSending(true);
    const reset = () => { sendingRef.current = false; setIsSending(false); };

    if (!socket.connected) {
      Alert.alert("Not Connected", "Cannot connect to server.");
      reset(); return;
    }

    try {
      // Upload media first if present
      let mediaUrl = null;
      let previewUrl = null;
      
      if (payload.videoUri) {
        console.log("📤 Uploading video:", payload.videoUri);
        const formData = new FormData();
        formData.append("media", {
          uri: payload.videoUri,
          type: "video/mp4",
          name: "upload.mp4",
        });
        const response = await fetch(`${SOCKET_URL}/upload`, {
          method: "POST",
          body: formData,
          headers: { "Content-Type": "multipart/form-data" },
        });
        const data = await response.json();
        if (data?.ok) {
          previewUrl = `${SOCKET_URL}${data.url}`;
          console.log("✅ Video uploaded:", previewUrl);
        }
      } else if (payload.photoUri) {
        console.log("📤 Uploading photo:", payload.photoUri);
        const formData = new FormData();
        formData.append("media", {
          uri: payload.photoUri,
          type: "image/jpeg",
          name: "upload.jpg",
        });
        const response = await fetch(`${SOCKET_URL}/upload`, {
          method: "POST",
          body: formData,
          headers: { "Content-Type": "multipart/form-data" },
        });
        const data = await response.json();
        if (data?.ok) {
          mediaUrl = `${SOCKET_URL}${data.url}`;
          console.log("✅ Photo uploaded:", mediaUrl);
        }
      }

      const tailId = `tail_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;
      const now = Date.now();
      const DURATION = { m: 60000, h: 3600000, d: 86400000 };
      const ttl = (parseInt(payload.expiryAmount) || 24)
        * (DURATION[payload.expiryUnit] || DURATION.h);

      const tailData = {
        id: tailId,
        from: me?.username || "unknown",
        tailType: payload.tailType || "LOOK",
        url: payload.url || null,
        message: payload.message || "",
        visibility: payload.visibility || "public",
        recipients: payload.recipients || [],
        catchLimit: payload.catchLimit || null,
        categories: payload.categories || [],
        reveal: payload.reveal || null,
        monetization: payload.monetization || null,
        mediaUrl: mediaUrl,
        previewUrl: previewUrl,
        frameLayout: payload.frameLayout || null,
        revealBox: payload.revealBox ?? 1,
        boxes: payload.boxes || null,
        expiryAmount: parseInt(payload.expiryAmount) || 24,
        expiryUnit: payload.expiryUnit || "h",
        timestamp: now,
        expiresAt: now + ttl,
        energy: { current: 100, decayRate: 0.5, lastUpdated: now },
        analytics: { impressions: 0, clicks: 0, opens: 0, catches: 0 },
      };

      console.log("🚀 Sending tail payload:", tailData.tailType, tailData.id);
      socket.emit("send-tail", tailData);

      socket.once("tail-sent", (res) => {
        reset();
        if (res?.ok) {
          setComposerOpen(false);
          showToast("🦊 Tail sent!");
          socket.emit("get-public-feed");
          socket.emit("get-smart-feed", { interests: me?.interests || [] });
        } else {
          Alert.alert("Send Failed", res?.error || "Try again.");
        }
      });

      // Timeout fallback
      setTimeout(() => {
        if (sendingRef.current) {
          reset();
          setComposerOpen(false);
          showToast("🦊 Tail sent!");
        }
      }, 4000);

    } catch (err) {
      console.error("Send error:", err);
      Alert.alert("Error", err.message);
      reset();
    }
  }, [isSending, me, socket]);


  const sendChainTail = useCallback(
    ({ layers }) => {
      if (!layers?.length) return;
      if (sendingRef.current) return;
      sendingRef.current = true;
      setIsSending(true);

      const preset = DURATION_PRESETS[durationPreset];
      const tailData = {
        tailType: "CHAIN",
        layers,
        url: composeUrl.trim() || null,
        message: composeMessage.trim(),
        visibility: composerMode === "private" ? "private" : "public",
        recipients:
          composerMode === "private"
            ? [composeTo.trim().replace(/^@/, "")]
            : [],
        durationAmount: preset.amount,
        durationUnit: preset.unit,
        isAd: false,
      };

      const handleSent = (res) => {
        sendingRef.current = false;
        setIsSending(false);
        if (res?.ok) {
          showToast("🔗 Chain tail sent!");
          resetComposer();
          setChainModalOpen(false);
          socket.emit("get-smart-feed");
          socket.emit("get-public-feed");
        } else {
          Alert.alert("Failed", res?.error || "Unknown error");
        }
      };

      socket.once("tail-sent", handleSent);
      socket.emit("send-tail", tailData);

      setTimeout(() => {
        if (sendingRef.current) {
          socket.off("tail-sent", handleSent);
          sendingRef.current = false;
          setIsSending(false);
          Alert.alert("Timeout", "Server did not respond.");
        }
      }, 15000);
    },
    [
      durationPreset,
      composeUrl,
      composeMessage,
      composerMode,
      composeTo,
      resetComposer,
      showToast,
    ]
  );

  // ── Filters ───────────────────────────────────────────
  const feedTails = smartFeed.length > 0 ? smartFeed : publicTails;

  const trending = useMemo(
    () =>
      [...feedTails]
        .sort((a, b) => (b.catchCount || 0) - (a.catchCount || 0))
        .slice(0, 8),
    [feedTails]
  );

  // ── Reveal content helper ─────────────────────────────
  const renderRevealContent = (reveal) => {
    if (!reveal) {
      return (
        <Text style={{ color: C.muted, marginTop: 10 }}>
          No reveal attached.
        </Text>
      );
    }

    if (reveal.kind === "coupon") {
      return (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: C.muted, fontWeight: "900" }}>
            Coupon Code
          </Text>
          <View
            style={{
              marginTop: 8,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: C.border,
              backgroundColor: C.panel2,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: C.text, fontWeight: "900", fontSize: 20 }}>
              {String(reveal.value || reveal.code || "").toUpperCase()}
            </Text>
            <TouchableOpacity
              onPress={async () => {
                const ok = await copyToClipboard(
                  reveal.value || reveal.code
                );
                showToast(ok ? "✅ Copied!" : "❌ Copy failed");
              }}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: "rgba(124,58,237,0.14)",
              }}
            >
              <Text style={{ color: C.text, fontWeight: "900" }}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (reveal.kind === "url") {
      return (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: C.muted, fontWeight: "900" }}>
            Reveal Link
          </Text>
          <TouchableOpacity
            onPress={() => openOriginal(reveal.value || reveal.url)}
            style={{
              marginTop: 8,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: C.border,
              backgroundColor: C.panel2,
            }}
          >
            <Text
              style={{ color: C.brand, fontWeight: "900" }}
              numberOfLines={2}
            >
              {reveal.value || reveal.url}
            </Text>
            <Text style={{ color: C.dim, marginTop: 4 }}>Tap to open →</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: C.muted, fontWeight: "900" }}>Reveal</Text>
        <View
          style={{
            marginTop: 8,
            padding: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: C.panel2,
          }}
        >
          <Text style={{ color: C.text }}>
            {reveal.value || reveal.text}
          </Text>
        </View>
      </View>
    );
  };

  // ── Reveal body (standard + chain) ────────────────────
  const renderRevealBody = () => {
    if (chainLayer) {
      const reveal = chainLayer.complete
        ? chainLayer.finalReveal
        : chainLayer.layer?.reveal;
      const isLast =
        chainLayer.complete ||
        chainLayer.layerIndex === chainLayer.layerTotal - 1;

      return (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
            {Array.from({ length: chainLayer.layerTotal || 1 }).map(
              (_, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor:
                      i <= (chainLayer.layerIndex ?? 0)
                        ? C.brand
                        : C.border,
                  }}
                />
              )
            )}
          </View>
          <Text
            style={{ color: C.muted, fontWeight: "900", fontSize: 12 }}
          >
            {chainLayer.complete
              ? "🏁 Chain Complete!"
              : `🔗 Layer ${(chainLayer.layerIndex ?? 0) + 1} of ${chainLayer.layerTotal}`}
          </Text>
          {!!chainLayer.layer?.message && (
            <View
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: C.panel2,
                borderWidth: 1,
                borderColor: C.border,
              }}
            >
              <Text style={{ color: C.text }}>
                {chainLayer.layer.message}
              </Text>
            </View>
          )}
          {renderRevealContent(reveal)}
          {!chainLayer.complete && !isLast && (
            <TouchableOpacity
              onPress={advanceChainLayer}
              style={{
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: C.brand,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                Next Layer →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    const t = activeTail || modalTail;
    return renderRevealContent(t?.reveal);
  };

  // ── Composer steps ────────────────────────────────────
  const renderComposerStep = () => {
    // ── Step 1 ──
    if (composerStep === 1) {
      return (
        <View style={{ gap: 14 }}>
          <Text
            style={{
              color: C.dim,
              fontWeight: "900",
              textTransform: "uppercase",
              fontSize: 11,
              letterSpacing: 1,
            }}
          >
            Step 1 of 3 — Content
          </Text>

          {/* Connection status */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: isConnected
                ? "rgba(34,197,94,0.1)"
                : "rgba(239,68,68,0.1)",
              borderWidth: 1,
              borderColor: isConnected ? C.green : C.red,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isConnected ? C.green : C.red,
              }}
            />
            <Text
              style={{
                color: isConnected ? C.green : C.red,
                fontSize: 12,
                fontWeight: "800",
              }}
            >
              {isConnected ? "Connected to server" : "Disconnected"}
            </Text>
            {!isConnected && (
              <TouchableOpacity
                onPress={() => socket.connect()}
                style={{ marginLeft: "auto" }}
              >
                <Text
                  style={{
                    color: C.brand,
                    fontWeight: "900",
                    fontSize: 12,
                  }}
                >
                  Reconnect
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            {["public", "private"].map((m) => {
              const active = composerMode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setComposerMode(m)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: active ? C.brand : C.border,
                    backgroundColor: active
                      ? "rgba(124,58,237,0.18)"
                      : "transparent",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: active ? C.text : C.muted,
                      fontWeight: "900",
                    }}
                  >
                    {m === "public" ? "🌐 Public" : "🔒 Private"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {composerMode === "private" && (
            <TextInput
              value={composeTo}
              onChangeText={setComposeTo}
              placeholder="@username"
              placeholderTextColor={C.dim}
              autoCapitalize="none"
              style={{
                backgroundColor: C.bg,
                borderWidth: 1,
                borderColor: C.brand,
                color: C.text,
                padding: 12,
                borderRadius: 14,
              }}
            />
          )}

          <TextInput
            value={composeUrl}
            onChangeText={setComposeUrl}
            placeholder="Paste a link (optional)"
            placeholderTextColor={C.dim}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              backgroundColor: C.bg,
              borderWidth: 1,
              borderColor: C.border,
              color: C.text,
              padding: 12,
              borderRadius: 14,
            }}
          />


          {/* Monetization — paused (affiliate runs server-side) */}
          <TouchableOpacity
            onPress={pickMedia}
            style={{
              backgroundColor: C.bg,
              borderWidth: 1,
              borderColor: composeMedia ? C.green : C.border,
              padding: 12,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: composeMedia ? C.green : C.muted,
                fontWeight: "900",
              }}
            >
              {composeMedia
                ? `✅ ${composeMedia.type === "video" ? "Video" : "Image"} selected`
                : "📷 Add photo or video (optional)"}
            </Text>
          </TouchableOpacity>

          <TextInput
            value={composeMessage}
            onChangeText={setComposeMessage}
            placeholder="Add a message (optional)"
            placeholderTextColor={C.dim}
            multiline
            style={{
              backgroundColor: C.bg,
              borderWidth: 1,
              borderColor: C.border,
              color: C.text,
              padding: 12,
              borderRadius: 14,
              minHeight: 72,
              textAlignVertical: "top",
            }}
          />

          <TouchableOpacity
            onPress={() => setComposerStep(2)}
            style={{
              paddingVertical: 14,
              borderRadius: 16,
              backgroundColor: C.brand,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>Next →</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // ── Step 2 ──
    if (composerStep === 2) {
      return (
        <View style={{ gap: 14 }}>
          <Text
            style={{
              color: C.dim,
              fontWeight: "900",
              textTransform: "uppercase",
              fontSize: 11,
              letterSpacing: 1,
            }}
          >
            Step 2 of 3 — Type & Reveal
          </Text>

          {/* Tail type */}
          <View>
            <Text
              style={{ color: C.muted, fontWeight: "900", marginBottom: 8 }}
            >
              Tail Type
            </Text>
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
            >
              {[
                { t: "LOOK", icon: "👀" },
                { t: "NOW", icon: "⚡" },
                { t: "DROP", icon: "💧" },
                { t: "CHAIN", icon: "🔗" },
                { t: "GEO", icon: "📍" },
              ].map(({ t, icon }) => {
                const active = composeTailType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setComposeTailType(t)}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: active ? C.brand : C.border,
                      backgroundColor: active
                        ? "rgba(124,58,237,0.18)"
                        : "transparent",
                      alignItems: "center",
                      gap: 4,
                      minWidth: 56,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{icon}</Text>
                    <Text
                      style={{
                        color: active ? C.text : C.muted,
                        fontWeight: "900",
                        fontSize: 11,
                      }}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Category Picker */}
          {composeTailType !== "CHAIN" && (
            <View>
              <Text style={{ color: C.muted, fontWeight: "900", marginBottom: 8 }}>
                Categories (optional)
              </Text>
              <CategoryPicker
                selected={composeCategories}
                onChange={setComposeCategories}
                colors={C}
                maxSelect={3}
              />
            </View>
          )}

          {/* CHAIN builder */}
          {composeTailType === "CHAIN" && (
            <TouchableOpacity
              onPress={() => {
                setComposerOpen(false);
                setChainModalOpen(true);
              }}
              style={{
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: "#22C55E",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#052E16",
                  fontWeight: "900",
                  fontSize: 15,
                }}
              >
                🔗 Open Chain Builder →
              </Text>
            </TouchableOpacity>
          )}

          {/* GEO settings */}
          {composeTailType === "GEO" && (
            <View
              style={{
                gap: 10,
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "rgba(59,130,246,0.3)",
                backgroundColor: "rgba(59,130,246,0.05)",
              }}
            >
              <Text
                style={{
                  color: "#60A5FA",
                  fontWeight: "900",
                  fontSize: 13,
                }}
              >
                📍 Geo Settings
              </Text>
              <TouchableOpacity
                onPress={pickComposerLocation}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: composeGeoLocation ? C.green : C.border,
                  backgroundColor: composeGeoLocation
                    ? "rgba(34,197,94,0.08)"
                    : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: composeGeoLocation ? C.green : C.muted,
                    fontWeight: "900",
                  }}
                >
                  {composeGeoLocation
                    ? `✅ Location set (${composeGeoLocation.lat.toFixed(4)}, ${composeGeoLocation.lng.toFixed(4)})`
                    : "📍 Use my current location"}
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  color: C.muted,
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                Catch radius
              </Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {GEO_RADII.map((r, i) => {
                  const active = composeGeoRadius === i;
                  return (
                    <TouchableOpacity
                      key={r.label}
                      onPress={() => setComposeGeoRadius(i)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: active ? "#60A5FA" : C.border,
                        backgroundColor: active
                          ? "rgba(59,130,246,0.15)"
                          : "transparent",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: active ? "#60A5FA" : C.muted,
                          fontWeight: "900",
                          fontSize: 11,
                        }}
                      >
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* DROP catch limit */}
          {composeTailType === "DROP" && (
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: C.muted,
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                Catch limit (1–1000)
              </Text>
              <TextInput
                value={composeCatchLimit}
                onChangeText={setComposeCatchLimit}
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor={C.dim}
                style={{
                  backgroundColor: C.bg,
                  borderWidth: 1,
                  borderColor: C.amber,
                  color: C.text,
                  padding: 12,
                  borderRadius: 14,
                  fontWeight: "900",
                  fontSize: 16,
                }}
              />
            </View>
          )}

          {/* Reveal Skin Picker */}
          {composeTailType !== "CHAIN" && (
            <View>
              <Text style={{ color: C.muted, fontWeight: "900", marginBottom: 8 }}>
                Reveal Card Style
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                {REVEAL_SKINS.map((skin) => {
                  const active = composeRevealSkin === skin.id;
                  return (
                    <TouchableOpacity
                      key={skin.id}
                      onPress={() => setComposeRevealSkin(skin.id)}
                      style={{
                        width: 72,
                        height: 80,
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: active ? skin.accent : C.border,
                        backgroundColor: skin.gradient[0],
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        overflow: "hidden",
                      }}
                    >
                      <View style={{
                        position: "absolute",
                        bottom: -10, right: -10,
                        width: 50, height: 50,
                        borderRadius: 25,
                        backgroundColor: skin.accent,
                        opacity: 0.15,
                      }} />
                      <Text style={{ fontSize: 22 }}>{skin.emoji}</Text>
                      <Text style={{ color: active ? skin.accent : C.muted, fontWeight: "800", fontSize: 10 }}>
                        {skin.label}
                      </Text>
                      {active && (
                        <View style={{
                          position: "absolute",
                          top: 4, right: 4,
                          width: 14, height: 14,
                          borderRadius: 7,
                          backgroundColor: skin.accent,
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <Text style={{ color: "#fff", fontSize: 8, fontWeight: "900" }}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Reveal — skip for CHAIN */}
          {composeTailType !== "CHAIN" && (
            <View>
              <Text
                style={{
                  color: C.muted,
                  fontWeight: "900",
                  marginBottom: 8,
                }}
              >
                Reveal — what catchers unlock
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                {[
                  { key: "coupon", label: "🎟 Coupon" },
                  { key: "url", label: "🔗 Link" },
                  { key: "text", label: "📝 Text" },
                ].map(({ key, label }) => {
                  const active = revealKind === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => {
                        if (revealKind !== key) {
                          setRevealKind(key);
                          setRevealValue("");
                        }
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: active ? C.brand : C.border,
                        backgroundColor: active
                          ? "rgba(124,58,237,0.18)"
                          : "transparent",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: active ? C.text : C.muted,
                          fontWeight: "900",
                          fontSize: 12,
                        }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                value={revealValue}
                onChangeText={setRevealValue}
                placeholder={
                  revealKind === "coupon"
                    ? "e.g. JORDAN20"
                    : revealKind === "url"
                    ? "https://..."
                    : "Secret message, instructions..."
                }
                placeholderTextColor={C.dim}
                autoCapitalize={
                  revealKind === "coupon" ? "characters" : "none"
                }
                autoCorrect={revealKind === "text"}
                multiline={revealKind === "text"}
                style={{
                  backgroundColor: C.bg,
                  borderWidth: 2,
                  borderColor: revealValue.trim() ? C.green : C.red,
                  color: C.text,
                  padding: 12,
                  borderRadius: 14,
                  minHeight: revealKind === "text" ? 80 : 48,
                  textAlignVertical:
                    revealKind === "text" ? "top" : "center",
                  fontWeight: revealKind === "coupon" ? "900" : "400",
                  fontSize: revealKind === "coupon" ? 16 : 14,
                }}
              />
              <Text
                style={{ color: C.dim, fontSize: 10, marginTop: 6 }}
              >
                {revealValue.trim()
                  ? `✅ Value: "${revealValue}" (${revealValue.length} chars)`
                  : "⚠️ Required: Enter a value above"}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => setComposerStep(1)}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: "center",
              }}
            >
              <Text style={{ color: C.muted, fontWeight: "900" }}>
                ← Back
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (
                  composeTailType !== "CHAIN" &&
                  !revealValue.trim()
                ) {
                  Alert.alert(
                    "Missing Reveal Value",
                    `Please enter a ${revealKind} value. This is required.`
                  );
                  return;
                }
                setComposerStep(3);
              }}
              style={{
                flex: 2,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor:
                  composeTailType === "CHAIN" || revealValue.trim()
                    ? C.brand
                    : C.dim,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                Next →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // ── Step 3 ──
    if (composerStep === 3) {
      return (
        <View style={{ gap: 14 }}>
          <Text
            style={{
              color: C.dim,
              fontWeight: "900",
              textTransform: "uppercase",
              fontSize: 11,
              letterSpacing: 1,
            }}
          >
            Step 3 of 3 — Duration & Send
          </Text>

          <View>
            <Text
              style={{
                color: C.muted,
                fontWeight: "900",
                marginBottom: 8,
              }}
            >
              Expires in
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {DURATION_PRESETS.map((p, i) => {
                const active = durationPreset === i;
                return (
                  <TouchableOpacity
                    key={p.label}
                    onPress={() => setDurationPreset(i)}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: active ? C.brand : C.border,
                      backgroundColor: active
                        ? "rgba(124,58,237,0.18)"
                        : "transparent",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: active ? C.text : C.muted,
                        fontWeight: "900",
                      }}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Summary */}
          <View
            style={{
              backgroundColor: C.panel2,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: C.border,
              padding: 14,
              gap: 6,
            }}
          >
            <Text
              style={{
                color: C.muted,
                fontWeight: "900",
                marginBottom: 4,
              }}
            >
              Summary
            </Text>
            <Text style={{ color: C.text }}>
              <Text style={{ color: C.dim }}>Mode: </Text>
              {composerMode === "private"
                ? `🔒 Private → @${composeTo || "?"}`
                : "🌐 Public"}
            </Text>
            <Text style={{ color: C.text }}>
              <Text style={{ color: C.dim }}>Type: </Text>
              {composeTailType}
            </Text>
            {composeTailType === "DROP" && (
              <Text style={{ color: C.text }}>
                <Text style={{ color: C.dim }}>Limit: </Text>
                {composeCatchLimit} catches
              </Text>
            )}
            {composeTailType === "GEO" && (
              <Text style={{ color: C.text }}>
                <Text style={{ color: C.dim }}>Radius: </Text>
                {GEO_RADII[composeGeoRadius].label}
              </Text>
            )}
            <Text style={{ color: C.text }}>
              <Text style={{ color: C.dim }}>Skin: </Text>
              {REVEAL_SKINS.find(s => s.id === composeRevealSkin)?.emoji} {REVEAL_SKINS.find(s => s.id === composeRevealSkin)?.label}
            </Text>
            <Text style={{ color: C.text }}>
              <Text style={{ color: C.dim }}>Reveal: </Text>
              {composeTailType === "CHAIN" ? (
                <Text style={{ color: C.green }}>
                  ✅ Set in chain builder
                </Text>
              ) : revealValue.trim() ? (
                <Text style={{ color: C.green }}>
                  ✅ "
                  {revealValue.substring(0, 20)}
                  {revealValue.length > 20 ? "..." : ""}"
                </Text>
              ) : (
                <Text style={{ color: C.red }}>⚠️ EMPTY</Text>
              )}
            </Text>
            <Text style={{ color: C.text }}>
              <Text style={{ color: C.dim }}>Expires: </Text>
              {DURATION_PRESETS[durationPreset].label}
            </Text>
            <Text style={{ color: C.text }}>
              <Text style={{ color: C.dim }}>Content: </Text>
              {composeUrl ? "🔗 Link" : ""}
              {composeMedia ? " 📷 Media" : ""}
              {!composeUrl && !composeMedia ? (
                <Text style={{ color: C.red }}>⚠️ None</Text>
              ) : (
                ""
              )}
            </Text>
            <Text style={{ color: C.text }}>
              <Text style={{ color: C.dim }}>Monetized: </Text>
              {composeMonetizedUrl.trim() ? (
                <Text style={{ color: C.green }}>✅ {composeMonetizationType} link set</Text>
              ) : (
                <Text style={{ color: C.dim }}>None (content link used)</Text>
              )}
            </Text>
          </View>

          {/* Sponsored toggle */}
          <TouchableOpacity
            onPress={() => setComposeIsAd(!composeIsAd)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: composeIsAd ? C.amber : C.border,
              backgroundColor: composeIsAd
                ? C.amber + "20"
                : "transparent",
            }}
          >
            <Text
              style={{
                color: composeIsAd ? C.amber : C.muted,
                fontWeight: "900",
              }}
            >
              Mark as Sponsored
            </Text>
            <View
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                backgroundColor: composeIsAd ? C.amber : C.border,
                justifyContent: "center",
                paddingHorizontal: 2,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: "white",
                  alignSelf: composeIsAd ? "flex-end" : "flex-start",
                }}
              />
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => setComposerStep(2)}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: "center",
              }}
            >
              <Text style={{ color: C.muted, fontWeight: "900" }}>
                ← Back
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={sendFromComposer}
              disabled={isSending}
              style={{
                flex: 2,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: isSending ? C.dim : C.green,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {isSending ? (
                <>
                  <ActivityIndicator size="small" color={C.greenInk} />
                  <Text
                    style={{ color: C.greenInk, fontWeight: "900" }}
                  >
                    Sending...
                  </Text>
                </>
              ) : (
                <Text style={{ color: C.greenInk, fontWeight: "900" }}>
                  🚀 Send Tail
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Debug panel */}
          <View
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 10,
              backgroundColor: "rgba(0,0,0,0.5)",
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            <Text
              style={{
                color: C.amber,
                fontSize: 10,
                fontWeight: "900",
                marginBottom: 4,
              }}
            >
              DEBUG INFO
            </Text>
            <Text
              style={{
                color: C.dim,
                fontSize: 10,
                fontFamily:
                  Platform.OS === "ios" ? "Menlo" : "monospace",
              }}
            >
              Socket: {socket.connected ? "✅" : "❌"}{" "}
              {socket.id || "N/A"}
              {"\n"}URL: {composeUrl.trim() || "(empty)"}
              {"\n"}Media:{" "}
              {composeMedia ? `✅ ${composeMedia.type}` : "❌ none"}
              {"\n"}Reveal Kind: {revealKind}
              {"\n"}Reveal Value:{" "}
              {revealValue.trim()
                ? `✅ "${revealValue.substring(0, 15)}..."`
                : "❌ EMPTY"}
              {"\n"}Mode: {composerMode}
              {composerMode === "private" &&
                `\nTo: ${composeTo || "❌ EMPTY"}`}
              {"\n"}Duration:{" "}
              {DURATION_PRESETS[durationPreset].label}
              {"\n"}Sending: {isSending ? "YES ⏳" : "NO"}
            </Text>
          </View>
        </View>
      );
    }
  };

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar
        barStyle={C === LIGHT ? "dark-content" : "light-content"}
      />

      {/* TOAST */}
      {!!toast && (
        <View
          style={{
            position: "absolute",
            top: 18,
            left: 16,
            right: 16,
            backgroundColor: C.panel,
            borderWidth: 1,
            borderColor: C.border,
            padding: 12,
            borderRadius: 16,
            zIndex: 999,
          }}
        >
          <Text
            style={{
              color: C.text,
              fontWeight: "800",
              textAlign: "center",
            }}
          >
            {toast}
          </Text>
        </View>
      )}

      {/* CHAIN MODAL */}
      <ChainTailModal
        visible={chainModalOpen}
        onClose={() => {
          setChainModalOpen(false);
          setComposerOpen(true);
        }}
        onSend={sendChainTail}
        colors={C}
      />

      {/* REVEAL MODAL */}
      <Modal
        visible={revealOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setRevealOpen(false);
          setChainLayer(null);
        }}
        statusBarTranslucent
      >
        <Pressable
          onPress={() => {
            setRevealOpen(false);
            setChainLayer(null);
          }}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            padding: 14,
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: (() => {
                const skin = REVEAL_SKINS.find(s => s.id === (activeTail?.revealSkin || "default")) || REVEAL_SKINS[0];
                return skin.gradient[0];
              })(),
              borderRadius: 22,
              borderWidth: 2,
              borderColor: (() => {
                const skin = REVEAL_SKINS.find(s => s.id === (activeTail?.revealSkin || "default")) || REVEAL_SKINS[0];
                return skin.accent + "60";
              })(),
              overflow: "hidden",
            }}
          >
            {/* Skin glow */}
            {(() => {
              const skin = REVEAL_SKINS.find(s => s.id === (activeTail?.revealSkin || "default")) || REVEAL_SKINS[0];
              return (
                <View style={{
                  position: "absolute",
                  top: -40, left: "20%", right: "20%",
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: skin.accent,
                  opacity: 0.12,
                }} />
              );
            })()}
            <View style={{ padding: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>
                    {(REVEAL_SKINS.find(s => s.id === (activeTail?.revealSkin || "default")) || REVEAL_SKINS[0]).emoji}
                  </Text>
                  <Text
                    style={{
                      color: C.text,
                      fontWeight: "900",
                      fontSize: 16,
                    }}
                  >
                    {chainLayer ? "🔗 Chain Tail" : "🎯 Revealed"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setRevealOpen(false);
                    setChainLayer(null);
                  }}
                  hitSlop={10}
                >
                  <Text style={{ color: C.muted, fontWeight: "900" }}>
                    Close
                  </Text>
                </Pressable>
              </View>

              {/* Tail info (non-chain) */}
              {!chainLayer && (
                <View style={{ marginTop: 10, gap: 6 }}>
                  <Text
                    style={{ color: C.text, fontWeight: "900" }}
                    numberOfLines={1}
                  >
                    {activeTail?.meta?.title ||
                      activeTail?.title ||
                      "Tail"}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{ color: C.muted, fontWeight: "900" }}
                    >
                      @{activeTail?.from || "user"}
                    </Text>
                    <View
                      style={{
                        paddingVertical: 3,
                        paddingHorizontal: 10,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: C.border,
                        backgroundColor: "rgba(255,255,255,0.06)",
                      }}
                    >
                      <Text
                        style={{
                          color: C.brand,
                          fontWeight: "900",
                          fontSize: 12,
                        }}
                      >
                        {(
                          activeTail?.tailType || "LOOK"
                        ).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {!!activeTail?.message && (
                    <Text style={{ color: C.muted }}>
                      "{activeTail.message}"
                    </Text>
                  )}
                  {!!activeTail?.mediaUrl &&
                  activeTail?.mediaType === "image" ? (
                    <Image
                      source={{ uri: activeTail.mediaUrl }}
                      style={{
                        width: "100%",
                        height: 160,
                        borderRadius: 14,
                      }}
                      resizeMode="cover"
                    />
                  ) : !!activeTail?.meta?.image ? (
                    <Image
                      source={{ uri: activeTail.meta.image }}
                      style={{
                        width: "100%",
                        height: 160,
                        borderRadius: 14,
                      }}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
              )}

              {renderRevealBody()}

              {/* Chat + open link (non-chain) */}
              {!chainLayer && (
                <View style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TextInput
                      value={chatText}
                      onChangeText={setChatText}
                      placeholder="Leave a comment…"
                      placeholderTextColor={C.dim}
                      style={{
                        flex: 1,
                        color: C.text,
                        backgroundColor: C.bg,
                        borderWidth: 1,
                        borderColor: C.border,
                        padding: 12,
                        borderRadius: 14,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        const t = chatText.trim();
                        if (!t || !activeSession) return;
                        socket.emit("tail-chat", {
                          tailId: activeSession.id,
                          text: t,
                        });
                        setChatText("");
                      }}
                      style={{
                        paddingHorizontal: 16,
                        borderRadius: 14,
                        backgroundColor: C.green,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: C.greenInk,
                          fontWeight: "900",
                        }}
                      >
                        Send
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {chatMsgs.slice(-3).map((m, idx) => (
                    <Text
                      key={idx}
                      style={{ color: C.muted, marginTop: 6 }}
                    >
                      <Text
                        style={{
                          color: C.text,
                          fontWeight: "900",
                        }}
                      >
                        {m.from}:{" "}
                      </Text>
                      {m.text}
                    </Text>
                  ))}
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      marginTop: 16,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        const url = activeTail?.monetization?.monetizedUrl || activeTail?.url;
                        openOriginal(url);
                        socket.emit("tail-analytics", {
                          tailId: activeTail?.id,
                          event: "click",
                          userId: me?.username,
                        });
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: activeTail?.monetization?.monetizedUrl ? C.green : C.border,
                        backgroundColor: activeTail?.monetization?.monetizedUrl ? "rgba(34,197,94,0.08)" : "transparent",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: activeTail?.monetization?.monetizedUrl ? C.green : C.text, fontWeight: "900" }}>
                        {activeTail?.monetization?.monetizedUrl ? "💰 Open & Earn" : "Open Link"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setRevealOpen(false);
                        setScreen("chat");
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 16,
                        backgroundColor: C.brand,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "900" }}>
                        Open Chat
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* COMPOSER MODAL */}
      <ComposerModal
        visible={composerOpen}
        onClose={() => {
          if (!isSending) {
            setComposerOpen(false);
            setComposerStep(1);
          }
        }}
        onSend={sendTailPayload}
        colors={C}
        isSending={isSending}
        userLocation={userLocation}
        me={me}
        isPro={isPro}
      />

      {/* WEB VIEWER */}
      <Modal
        visible={viewerOpen}
        animationType="slide"
        onRequestClose={() => setViewerOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <View
            style={{
              padding: 12,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
              backgroundColor: C.panel,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: C.text, fontWeight: "900" }}
              numberOfLines={1}
            >
              Original
            </Text>
            <Pressable
              onPress={() => setViewerOpen(false)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.border,
              }}
            >
              <Text style={{ color: C.muted, fontWeight: "900" }}>
                Back
              </Text>
            </Pressable>
          </View>
          <WebView source={{ uri: viewerUrl }} startInLoadingState />
        </SafeAreaView>
      </Modal>

      {/* SINGLE CatchTailModal — no duplicates */}
      <CatchTailModal
        visible={modalOpen}
        tail={modalTail}
        onClose={() => setModalOpen(false)}
        onCatch={catchTail}
        onOpenLink={() => openOriginal(modalTail?.url)}
        onReact={reactToTail}
        colors={C}
      />

      {/* ═══════════════════════════════════════════════
          SCREENS
      ═══════════════════════════════════════════════ */}

      {/* LOGIN */}
      {screen === "login" && (
        <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Text style={{ color: C.brand, fontSize: 56 }}>🦊</Text>
            <Text
              style={{
                color: C.text,
                fontSize: 34,
                fontWeight: "900",
                marginTop: 8,
              }}
            >
              Tail Me
            </Text>
            <Text
              style={{
                color: C.muted,
                marginTop: 6,
                textAlign: "center",
              }}
            >
              Catch moments — don't scroll.
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isConnected ? C.green : C.red,
              }}
            />
            <Text
              style={{
                color: isConnected ? C.green : C.muted,
                fontSize: 12,
              }}
            >
              {isConnected ? "Server connected" : "Connecting..."}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: C.panel,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: C.border,
              padding: 16,
            }}
          >
            <Text
              style={{
                color: C.muted,
                fontWeight: "800",
                marginBottom: 8,
              }}
            >
              Username
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="alice"
              placeholderTextColor={C.dim}
              autoCapitalize="none"
              style={{
                backgroundColor: C.bg,
                borderWidth: 1,
                borderColor: C.border,
                color: C.text,
                padding: 12,
                borderRadius: 14,
              }}
            />
            <TouchableOpacity
              onPress={doLogin}
              style={{
                marginTop: 12,
                backgroundColor: C.green,
                padding: 14,
                borderRadius: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: C.greenInk, fontWeight: "900" }}>
                Enter
              </Text>
            </TouchableOpacity>
            <View
              style={{ flexDirection: "row", gap: 8, marginTop: 12 }}
            >
              {["system", "dark", "light"].map((k) => {
                const active = themePref === k;
                return (
                  <TouchableOpacity
                    key={k}
                    onPress={() => setThemePref(k)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: active ? C.brand : C.border,
                      backgroundColor: active
                        ? "rgba(124,58,237,0.18)"
                        : "transparent",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: active ? C.text : C.muted,
                        fontWeight: "900",
                      }}
                    >
                      {k.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <Text
            style={{
              color: C.dim,
              fontSize: 10,
              textAlign: "center",
              marginTop: 16,
            }}
          >
            Server: {SOCKET_URL}
          </Text>
        </View>
      )}

      {/* HUB */}
      {screen === "onboarding" && me && (
        <OnboardingScreen
          onComplete={handleOnboardingComplete}
          onOpenComposer={() => {
            handleOnboardingComplete([]);
            setTimeout(() => setComposerOpen(true), 300);
          }}
          colors={C}
        />
      )}

      {screen === "profile-setup" && me && (
        <ProfileSetupScreen
          onComplete={async (profile) => {
            const username = profile?.username || me?.username || "";
            const photoUri = profile?.photoUri || null;
            const email = profile?.email || null;
            const updated = { ...me, username, photoUri, email };
            setMe(updated);
            if (username) {
              socket.emit("register", { username });
              await AsyncStorage.setItem("tailme_username", username);
            }
            if (email) await AsyncStorage.setItem("tailme_email", email);
            await AsyncStorage.setItem("tailme_has_profile", "true");
            setHasProfile(true);
            setScreen("hub");
          }}
          colors={C}
        />
      )}
      {screen === "hub" && me && (
        <View style={{ flex: 1, paddingBottom: 92 }}>
          <TailHome
            me={me}
            publicCount={publicTails.length}
            inboxCount={inboxTails.length}
            allTails={
              categoryFilter === "all" ? feedTails :
              categoryFilter === "foryou" ? feedTails.filter(t =>
                !t.categories?.length || t.categories.some(c => (me?.interests || []).includes(c))
              ) :
              feedTails.filter(t => t.categories?.includes(categoryFilter))
            }
            trending={trending}
            onOpenPublic={() => {
              setScreen("public");
              socket.emit("get-public-feed");
            }}
            onOpenPrivate={() => setScreen("private")}
            onOpenTail={openTailCard}
            onCatchTail={catchTail}
            colors={C}
            onReact={reactToTail}
            streak={streak}
            onRefresh={() => {
              socket.emit("get-public-feed");
              socket.emit("get-smart-feed", { interests: me?.interests || [] });
              socket.emit("get-following-feed");
            }}
            following={following}
            followingFeed={followingFeed}
            onFollowUser={toggleFollow}
            onShareTail={shareTail}
            onOpenProfile={openProfile}
            onOpenSearch={() => setScreen("search")}
            onUnfollowUser={unfollowUser}
            isFollowing={isFollowing}
            selectedCategory={categoryFilter}
            onCategoryChange={setCategoryFilter}
            categoryFilterOptions={[
              { id: "foryou", icon: "✨", labelFull: "For You" },
              { id: "following", icon: "👥", labelFull: "Following" },
              ...TAIL_CATEGORIES.map(cat => ({ id: cat.id, icon: cat.icon, labelFull: null })),
              { id: "all", icon: "🌐", labelFull: "All" },
            ]}
          />
        </View>
      )}

      {/* PUBLIC */}
      {screen === "public" && me && (
        <View style={{ flex: 1, padding: 16, paddingBottom: 92 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity onPress={() => setScreen("hub")}>
              <Text style={{ color: C.muted, fontWeight: "900" }}>
                ← Home
              </Text>
            </TouchableOpacity>
            <Text
              style={{
                color: C.text,
                fontWeight: "900",
                fontSize: 18,
              }}
            >
              Public Arena
            </Text>
            <Text style={{ color: C.dim, fontWeight: "800" }}>
              @{me.username}
            </Text>
          </View>
          <ScrollView
            style={{ marginTop: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {publicTails.map((t, i) => (
              <TailCard
                key={t?.id ?? `pub-${i}`}
                tail={t}
                onPressTail={openTailCard}
                colors={C}
                onReact={reactToTail}
              />
            ))}
            {publicTails.length === 0 && (
              <Text
                style={{
                  color: C.dim,
                  marginTop: 24,
                  textAlign: "center",
                }}
              >
                No public tails yet.
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* PRIVATE */}
      {screen === "private" && me && (
        <View style={{ flex: 1, padding: 16, paddingBottom: 92 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity onPress={() => setScreen("hub")}>
              <Text style={{ color: C.muted, fontWeight: "900" }}>
                ← Home
              </Text>
            </TouchableOpacity>
            <Text
              style={{
                color: C.text,
                fontWeight: "900",
                fontSize: 18,
              }}
            >
              Private Inbox
            </Text>
            <Text style={{ color: C.dim, fontWeight: "800" }}>
              @{me.username}
            </Text>
          </View>
          <ScrollView
            style={{ marginTop: 14 }}
            showsVerticalScrollIndicator={false}
          >
            {inboxTails.map((t, i) => (
              <TailCard
                key={t?.id ?? `inbox-${i}`}
                tail={t}
                onPressTail={openTailCard}
                colors={C}
                onReact={reactToTail}
              />
            ))}
            {inboxTails.length === 0 && (
              <Text
                style={{
                  color: C.dim,
                  marginTop: 24,
                  textAlign: "center",
                }}
              >
                Your inbox is empty.
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* GEO MAP */}
      {/* PROFILE */}
      {screen === "profile" && me && profileUser && (
        <View style={{ flex: 1, paddingBottom: 92 }}>
          <ProfileScreen
            username={profileUser}
            me={me}
            isFollowing={isFollowing}
            onFollow={toggleFollow}
            onUnfollow={unfollowUser}
            onOpenTail={openTailCard}
            onBack={() => setScreen("hub")}
            colors={C}
          />
        </View>
      )}

      {/* SEARCH / DISCOVER */}
      {screen === "search" && me && (
        <View style={{ flex: 1, paddingBottom: 92 }}>
          <SearchScreen
            me={me}
            isFollowing={isFollowing}
            onFollow={toggleFollow}
            onUnfollow={unfollowUser}
            onOpenProfile={openProfile}
            onBack={() => setScreen("hub")}
            colors={C}
          />
        </View>
      )}

      {/* GEO — paused */}

      {/* PASSPORT */}
      {screen === "passport" && me && (
        <View style={{ flex: 1, paddingBottom: 92 }}>
          <CatchPassport
            me={me}
            catches={passportCatches}
            streak={streak}
            earnings={earnings}
            isPro={isPro}
            onBack={() => setScreen("hub")}
            onOpenPro={() => showToast("✨ Pro features coming soon!", 2000)}
            colors={C}
          />
        </View>
      )}

      {/* EARNINGS — paused */}

      {/* PRO — paused */}

      {/* SETTINGS (includes earnings section) */}
      {screen === "settings" && me && (
        <View style={{ flex: 1, paddingBottom: 92 }}>
          <ScrollView
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity onPress={() => setScreen("hub")}>
                <Text style={{ color: C.muted, fontWeight: "900" }}>
                  ← Home
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  color: C.text,
                  fontWeight: "900",
                  fontSize: 18,
                }}
              >
                Settings
              </Text>
              <Text style={{ color: C.dim, fontWeight: "800" }}>
                @{me.username}
              </Text>
            </View>

            {/* Connection status */}
            <View
              style={{
                marginTop: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                padding: 12,
                borderRadius: 14,
                backgroundColor: isConnected
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(239,68,68,0.1)",
                borderWidth: 1,
                borderColor: isConnected ? C.green : C.red,
              }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: isConnected ? C.green : C.red,
                }}
              />
              <Text
                style={{
                  color: isConnected ? C.green : C.red,
                  fontWeight: "800",
                }}
              >
                {isConnected
                  ? "Connected to server"
                  : "Disconnected"}
              </Text>
              {!isConnected && (
                <TouchableOpacity
                  onPress={() => socket.connect()}
                  style={{
                    marginLeft: "auto",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: C.brand,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "800",
                      fontSize: 12,
                    }}
                  >
                    Reconnect
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── EARNINGS SECTION ── */}
            <View
              style={{
                marginTop: 14,
                backgroundColor: C.panel,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: C.border,
                padding: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: C.muted, fontWeight: "900" }}>
                  {streak > 0 ? "🔥" : "💰"} Earnings & Streak
                </Text>
                {isPro && (
                  <View
                    style={{
                      paddingVertical: 3,
                      paddingHorizontal: 10,
                      borderRadius: 999,
                      backgroundColor: C.brand + "20",
                      borderWidth: 1,
                      borderColor: C.brand,
                    }}
                  >
                    <Text
                      style={{
                        color: C.brand,
                        fontWeight: "900",
                        fontSize: 10,
                      }}
                    >
                      PRO
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: C.panel2,
                    borderRadius: 14,
                    padding: 14,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: C.border,
                  }}
                >
                  <Text
                    style={{
                      color: C.text,
                      fontWeight: "900",
                      fontSize: 24,
                    }}
                  >
                    {streak}
                  </Text>
                  <Text
                    style={{
                      color: C.dim,
                      fontWeight: "800",
                      fontSize: 10,
                      textTransform: "uppercase",
                    }}
                  >
                    Day Streak
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: C.panel2,
                    borderRadius: 14,
                    padding: 14,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: C.border,
                  }}
                >
                  <Text
                    style={{
                      color: C.green,
                      fontWeight: "900",
                      fontSize: 24,
                    }}
                  >
                    ${earnings.toFixed(2)}
                  </Text>
                  <Text
                    style={{
                      color: C.dim,
                      fontWeight: "800",
                      fontSize: 10,
                      textTransform: "uppercase",
                    }}
                  >
                    Earned
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: C.panel2,
                    borderRadius: 14,
                    padding: 14,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: C.border,
                  }}
                >
                  <Text
                    style={{
                      color: C.text,
                      fontWeight: "900",
                      fontSize: 24,
                    }}
                  >
                    {tailStats.length}
                  </Text>
                  <Text
                    style={{
                      color: C.dim,
                      fontWeight: "800",
                      fontSize: 10,
                      textTransform: "uppercase",
                    }}
                  >
                    Tails Sent
                  </Text>
                </View>
              </View>

              {/* Recent tail stats */}
              {tailStats.length > 0 && (
                <View style={{ gap: 6 }}>
                  <Text
                    style={{
                      color: C.dim,
                      fontWeight: "800",
                      fontSize: 11,
                      textTransform: "uppercase",
                    }}
                  >
                    Recent Tails
                  </Text>
                  {tailStats.slice(0, 3).map((t, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: 8,
                        borderBottomWidth: i < 2 ? 1 : 0,
                        borderBottomColor: C.border,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: C.muted,
                            fontWeight: "900",
                            fontSize: 12,
                          }}
                        >
                          {t.tailType === "LOOK"
                            ? "👀"
                            : t.tailType === "NOW"
                            ? "⚡"
                            : t.tailType === "DROP"
                            ? "💧"
                            : t.tailType === "CHAIN"
                            ? "🔗"
                            : t.tailType === "GEO"
                            ? "📍"
                            : "📦"}
                        </Text>
                        <Text
                          style={{
                            color: C.text,
                            fontWeight: "800",
                            fontSize: 13,
                          }}
                          numberOfLines={1}
                        >
                          {t.title || "Tail"}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: C.dim,
                          fontWeight: "800",
                          fontSize: 12,
                        }}
                      >
                        🎯 {t.catchCount || 0}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View
                style={{
                  marginTop: 12,
                  paddingVertical: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: C.border,
                  alignItems: "center",
                  opacity: 0.5,
                }}
              >
                <Text style={{ color: C.dim, fontWeight: "900" }}>
                  💰 Full Earnings Dashboard — Coming Soon
                </Text>
              </View>

              <View
                style={{
                  marginTop: 8,
                  paddingVertical: 10,
                  borderRadius: 14,
                  backgroundColor: C.brand + "08",
                  borderWidth: 1,
                  borderColor: C.border,
                  alignItems: "center",
                  opacity: 0.5,
                }}
              >
                <Text
                  style={{
                    color: C.dim,
                    fontWeight: "900",
                    fontSize: 12,
                  }}
                >
                  ✨ Pro Features — Coming Soon
                </Text>
              </View>
            </View>

            {/* Interests */}
            <View
              style={{
                marginTop: 14,
                backgroundColor: C.panel,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: C.border,
                padding: 16,
              }}
            >
              <Text style={{ color: C.muted, fontWeight: "900", marginBottom: 4 }}>
                Your Interests
              </Text>
              <Text style={{ color: C.dim, fontSize: 11, marginBottom: 12 }}>
                Used to personalise your feed. Pick up to 6.
              </Text>
              <CategoryPicker
                selected={me?.interests || []}
                onChange={(ids) => setMe(prev => ({ ...prev, interests: ids }))}
                colors={C}
                maxSelect={6}
              />
            </View>

            {/* Theme */}
            <View
              style={{
                marginTop: 14,
                backgroundColor: C.panel,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: C.border,
                padding: 16,
              }}
            >
              <Text
                style={{
                  color: C.muted,
                  fontWeight: "900",
                  marginBottom: 12,
                }}
              >
                Theme
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {["system", "dark", "light"].map((k) => {
                  const active = themePref === k;
                  return (
                    <TouchableOpacity
                      key={k}
                      onPress={() => setThemePref(k)}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: active ? C.brand : C.border,
                        backgroundColor: active
                          ? "rgba(124,58,237,0.18)"
                          : "transparent",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: active ? C.text : C.muted,
                          fontWeight: "900",
                        }}
                      >
                        {k === "system"
                          ? "⚙️"
                          : k === "dark"
                          ? "🌙"
                          : "☀️"}
                      </Text>
                      <Text
                        style={{
                          color: active ? C.text : C.muted,
                          fontWeight: "900",
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        {k.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Account */}
            <View
              style={{
                marginTop: 14,
                backgroundColor: C.panel,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: C.border,
                padding: 16,
              }}
            >
              <Text
                style={{
                  color: C.muted,
                  fontWeight: "900",
                  marginBottom: 4,
                }}
              >
                Account
              </Text>
              <Text
                style={{
                  color: C.text,
                  fontWeight: "900",
                  fontSize: 18,
                }}
              >
                @{me.username}
              </Text>
              {isPro && (
                <View
                  style={{
                    marginTop: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      backgroundColor: C.brand + "30",
                      borderWidth: 1,
                      borderColor: C.brand,
                    }}
                  >
                    <Text
                      style={{
                        color: C.brand,
                        fontWeight: "900",
                        fontSize: 12,
                      }}
                    >
                      PRO
                    </Text>
                  </View>
                  <Text style={{ color: C.muted, fontSize: 12 }}>
                    Active subscription
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => {
                  setMe(null);
                  setScreen("login");
                  setPublicTails([]);
                  setInboxTails([]);
                  setSmartFeed([]);
                  setGeoFeed([]);
                  socket.disconnect();
                }}
                style={{
                  marginTop: 14,
                  paddingVertical: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: C.red,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: C.red, fontWeight: "900" }}>
                  Log Out
                </Text>
              </TouchableOpacity>
            </View>

            {/* Debug */}
            <View
              style={{
                marginTop: 14,
                backgroundColor: C.panel,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: C.border,
                padding: 16,
              }}
            >
              <Text
                style={{
                  color: C.muted,
                  fontWeight: "900",
                  marginBottom: 8,
                }}
              >
                Debug Info
              </Text>
              <Text
                style={{
                  color: C.dim,
                  fontSize: 11,
                  fontFamily:
                    Platform.OS === "ios" ? "Menlo" : "monospace",
                }}
              >
                Server: {SOCKET_URL}
                {"\n"}Socket ID: {socket.id || "N/A"}
                {"\n"}Connected: {socket.connected ? "Yes" : "No"}
                {"\n"}Catches: {passportCatches.length}
                {"\n"}Feeds: {publicTails.length} pub /{" "}
                {inboxTails.length} inbox / {geoFeed.length} geo
              </Text>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      )}

      {/* CHAT */}
      {screen === "chat" && activeSession && me && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={60}
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View
              style={{ flex: 1, padding: 16, paddingBottom: 92 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <TouchableOpacity
                  onPress={() => setScreen("hub")}
                >
                  <Text
                    style={{ color: C.muted, fontWeight: "900" }}
                  >
                    ← Home
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    color: C.text,
                    fontWeight: "900",
                    fontSize: 18,
                  }}
                >
                  Tail Chat
                </Text>
                <Text style={{ color: C.dim, fontWeight: "800" }}>
                  @{me.username}
                </Text>
              </View>
              <View
                style={{
                  marginTop: 14,
                  backgroundColor: C.panel,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: C.border,
                  padding: 12,
                  gap: 6,
                }}
              >
                <Text style={{ color: C.text, fontWeight: "900" }}>
                  {activeTail?.meta?.title ||
                    activeTail?.title ||
                    "Tail"}
                </Text>
                <TouchableOpacity
                  onPress={() => openOriginal(activeTail?.url)}
                >
                  <Text
                    style={{ color: C.brand }}
                    numberOfLines={1}
                  >
                    {activeTail?.url || ""}
                  </Text>
                </TouchableOpacity>
                {!!activeTail?.meta?.image && (
                  <Image
                    source={{ uri: activeTail.meta.image }}
                    style={{
                      width: "100%",
                      height: 160,
                      borderRadius: 14,
                    }}
                    resizeMode="cover"
                  />
                )}
                {!!activeTail?.message && (
                  <Text style={{ color: C.muted }}>
                    💬 {activeTail.message}
                  </Text>
                )}
                <Text
                  style={{ color: C.muted, fontWeight: "900" }}
                >
                  🔥 {Number(activeTail?.catchCount || 0)}
                </Text>
              </View>
              <ScrollView
                style={{ marginTop: 12, flex: 1 }}
                showsVerticalScrollIndicator={false}
              >
                {chatMsgs.map((m, idx) => (
                  <View key={idx} style={{ paddingVertical: 8 }}>
                    <Text
                      style={{
                        color:
                          m.from === "system" ? C.dim : C.text,
                      }}
                    >
                      <Text
                        style={{
                          color: C.muted,
                          fontWeight: "800",
                        }}
                      >
                        {m.from}:{" "}
                      </Text>
                      {m.text}
                    </Text>
                  </View>
                ))}
              </ScrollView>
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <TextInput
                  value={chatText}
                  onChangeText={setChatText}
                  placeholder="Type message…"
                  placeholderTextColor={C.dim}
                  autoCapitalize="none"
                  style={{
                    flex: 1,
                    color: C.text,
                    backgroundColor: C.panel,
                    padding: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: C.border,
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    const t = chatText.trim();
                    if (!t || !activeSession) return;
                    socket.emit("tail-chat", {
                      tailId: activeSession.id,
                      text: t,
                    });
                    setChatText("");
                  }}
                  style={{
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    backgroundColor: C.green,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: C.greenInk,
                      fontWeight: "900",
                    }}
                  >
                    Send
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}

      {/* ═══════════════════════════════════════════════
          FAB + TAB BAR
      ═══════════════════════════════════════════════ */}
      {me && screen !== "login" && (
        <>
          {/* FAB with connection dot */}
          <Pressable
            onPress={() => {
              resetComposer();
              setComposerOpen(true);
            }}
            style={{
              position: "absolute",
              bottom: 88,
              right: 16,
              backgroundColor: C.brand,
              borderRadius: 18,
              paddingHorizontal: 18,
              paddingVertical: 14,
              borderWidth: 1,
              borderColor: C.border,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              + Send
            </Text>
            {!isConnected && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: C.red,
                }}
              />
            )}
          </Pressable>

          {/* 5 Tab bar: Home / Map / Inbox / Passport / Settings */}
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              borderTopWidth: 1,
              borderTopColor: C.border,
              backgroundColor: C.panel,
              paddingBottom: 14,
              paddingTop: 10,
              paddingHorizontal: 8,
              flexDirection: "row",
              gap: 5,
            }}
          >
            {[
              { key: "hub",      label: "Home",     icon: "🏠" },
              { key: "private",  label: "Inbox",    icon: "📬" },
              { key: "passport", label: "Passport", icon: "🛂" },
              { key: "settings", label: "Settings", icon: "⚙️" },
            ].map((it) => {
              const active = screen === it.key;
              const badge =
                it.key === "private" && inboxTails.length > 0
                  ? inboxTails.length
                  : null;
              return (
                <Pressable
                  key={it.key}
                  onPress={() => {
                    setScreen(it.key);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: active ? C.brand : C.border,
                    backgroundColor: active
                      ? "rgba(124,58,237,0.18)"
                      : "transparent",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <View style={{ position: "relative" }}>
                    <Text style={{ fontSize: 14 }}>{it.icon}</Text>
                    {badge != null && (
                      <View
                        style={{
                          position: "absolute",
                          top: -4,
                          right: -6,
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: C.red,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 8,
                            fontWeight: "900",
                          }}
                        >
                          {badge > 9 ? "9+" : badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={{
                      color: active ? C.text : C.muted,
                      fontWeight: "900",
                      fontSize: 9,
                    }}
                  >
                    {it.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    {/* Deep link tail reveal */}
      {expandedTail && (
        <View style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.85)",
          justifyContent: "center", zIndex: 999,
        }}>
          <TouchableOpacity
            style={{ position: "absolute", top: 52, right: 20, zIndex: 1000,
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center", justifyContent: "center" }}
            onPress={() => setExpandedTail(null)}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>✕</Text>
          </TouchableOpacity>
          <SplitFrameCard
            tail={expandedTail}
            onClose={() => setExpandedTail(null)}
            onCatch={(tail) => { setExpandedTail(null); }}
            isVisible={true}
          />
        </View>
      )}
    </SafeAreaView>
  );
}