// ============================================================
// ComposerModal.js — v9 SplitFrame Studio
// Step 1: FRAME — pick layout, fill boxes
// Step 2: HOOK  — hook message, tail type, reveal content
// Step 3: LAUNCH — audience, expiry, send
// ============================================================
import React, { useState, useRef, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  View, Text, Modal, TouchableOpacity, TextInput,
  ScrollView, Animated, Pressable,
  KeyboardAvoidingView, Platform, Alert, Dimensions,
} from "react-native";

const { width: SW } = Dimensions.get("window");

const TYPE_OPTIONS = [
  { id: "LOOK",  icon: "👀", label: "LOOK",  desc: "Standard tail",   color: "#7C3AED" },
  { id: "NOW",   icon: "⚡", label: "NOW",   desc: "Expires fast",    color: "#F59E0B" },
  { id: "DROP",  icon: "💧", label: "DROP",  desc: "Limited catches", color: "#EF4444" },
  { id: "GEO",   icon: "📍", label: "GEO",   desc: "Location-based",  color: "#0EA5E9" },
  { id: "CHAIN", icon: "🔗", label: "CHAIN", desc: "Pass it on",      color: "#22C55E" },
];

const REVEAL_TYPES = [
  { id: "message", icon: "💬", label: "Message",  sub: "secret text"     },
  { id: "coupon",  icon: "🎟", label: "Coupon",   sub: "discount code"   },
  { id: "gift",    icon: "💰", label: "Gift",     sub: "send money"      },
  { id: "link",    icon: "🔗", label: "Link",     sub: "any URL"         },
  { id: "voice",   icon: "🎙", label: "Voice",    sub: "coming soon"     },
];

const PAYMENT_APPS = [
  { id: "cashapp",  icon: "💵", label: "Cash App"  },
  { id: "venmo",    icon: "🔵", label: "Venmo"     },
  { id: "paypal",   icon: "🅿️", label: "PayPal"    },
  { id: "applepay", icon: "🍎", label: "Apple Pay" },
];

const CATEGORIES = [
  { id: "business", icon: "💼" }, { id: "travel",   icon: "✈️" },
  { id: "food",     icon: "🍕" }, { id: "shopping", icon: "🛍️" },
  { id: "parties",  icon: "🎉" }, { id: "fitness",  icon: "💪" },
  { id: "music",    icon: "🎵" }, { id: "sports",   icon: "⚽" },
  { id: "gaming",   icon: "🎮" }, { id: "tech",     icon: "💻" },
  { id: "fashion",  icon: "👗" }, { id: "deals",    icon: "🏷️" },
];

// Layout definitions with visual preview structure
const LAYOUTS = [
  {
    id: "B", label: "Split", icon: "◧", desc: "2 equal",
    boxes: 2,
    preview: [{ flex: 1 }, { flex: 1 }],
    direction: "row",
  },
  {
    id: "A", label: "Feature", icon: "◫", desc: "Big + 2",
    boxes: 3,
    preview: [{ flex: 2 }, { flex: 1, column: [{ flex: 1 }, { flex: 1 }] }],
    direction: "row",
  },
  {
    id: "C", label: "Full", icon: "▣", desc: "Single",
    boxes: 1,
    preview: [{ flex: 1 }],
    direction: "row",
  },
  {
    id: "D", label: "Triple", icon: "☰", desc: "3 cols",
    boxes: 3,
    preview: [{ flex: 1 }, { flex: 1 }, { flex: 1 }],
    direction: "row",
  },
  {
    id: "E", label: "Hero", icon: "⬒", desc: "Big + 2 bottom",
    boxes: 3,
    preview: [{ flex: 2, full: true }, { flex: 1, bottom: [{ flex: 1 }, { flex: 1 }] }],
    direction: "column",
  },
];

const BOX_CONTENT_OPTIONS = [
  { id: "video",  icon: "🎥", label: "Video"  },
  { id: "image",  icon: "📸", label: "Photo"  },
  { id: "reveal", icon: "🔒", label: "Reveal" },
  { id: "voice",  icon: "🎙", label: "Voice"  },
  { id: "text",   icon: "💬", label: "Text"   },
  { id: "logo",   icon: "🏷", label: "Logo"   },
  { id: "link",   icon: "🔗", label: "Link"   },
];

// ── Layout Preview Component ─────────────────────────────
const LayoutPreview = ({ layout, boxes, isSelected, color, onPress, size = 72 }) => {
  const bdr = isSelected ? color : "#1E293B";
  const bg = isSelected ? `${color}20` : "#0A1020";

  const renderMiniBox = (box, idx, h, w = "100%") => {
    const type = box?.type;
    const hasMedia = box?.uri;
    return (
      <View key={idx} style={{
        flex: 1, height: h, width: w,
        borderRadius: 4, margin: 1.5,
        backgroundColor: type === "reveal" ? "rgba(239,68,68,0.3)"
          : hasMedia ? `${color}30` : "#111827",
        borderWidth: 1,
        borderColor: type === "reveal" ? "#EF4444" : isSelected ? `${color}40` : "#1E293B",
        alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontSize: 10 }}>
          {type === "reveal" ? "🔒"
            : type === "video" ? "🎥"
            : type === "image" ? "📸"
            : type === "text" ? "💬"
            : type === "logo" ? "🏷"
            : type === "voice" ? "🎙"
            : type === "link" ? "🔗"
            : "＋"}
        </Text>
      </View>
    );
  };

  const renderPreview = () => {
    if (layout.id === "E") {
      return (
        <View style={{ flex: 1, gap: 1 }}>
          {renderMiniBox(boxes[0], 0, size * 0.5)}
          <View style={{ flexDirection: "row", flex: 1, gap: 1 }}>
            {renderMiniBox(boxes[1], 1, size * 0.35)}
            {renderMiniBox(boxes[2], 2, size * 0.35)}
          </View>
        </View>
      );
    }
    if (layout.id === "A") {
      return (
        <View style={{ flex: 1, flexDirection: "row", gap: 1 }}>
          {renderMiniBox(boxes[0], 0, size * 0.7)}
          <View style={{ flex: 1, gap: 1 }}>
            {renderMiniBox(boxes[1], 1, size * 0.3)}
            {renderMiniBox(boxes[2], 2, size * 0.3)}
          </View>
        </View>
      );
    }
    return (
      <View style={{ flex: 1, flexDirection: "row", gap: 1 }}>
        {(boxes.length > 0 ? boxes : Array(layout.boxes).fill({})).map((b, i) =>
          renderMiniBox(b, i, size * 0.7)
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity onPress={onPress} style={{
      width: size + 16, alignItems: "center", gap: 6,
    }}>
      <View style={{
        width: size + 16, height: size,
        borderRadius: 12, borderWidth: 2,
        borderColor: bdr, backgroundColor: bg,
        padding: 4, overflow: "hidden",
      }}>
        {renderPreview()}
      </View>
      <Text style={{
        color: isSelected ? color : "#64748B",
        fontSize: 10, fontWeight: "900",
      }}>{layout.label}</Text>
      <Text style={{ color: "#334155", fontSize: 8 }}>{layout.desc}</Text>
    </TouchableOpacity>
  );
};

// ── Box Editor ───────────────────────────────────────────
const BoxEditor = ({ box, index, isSelected, color, onSelect, onUpdate, bg2, bdr, txt, dim, muted }) => {
  const type = box?.type || "empty";
  const hasMedia = box?.uri;

  const pickMedia = async (isVideo) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: isVideo ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      quality: isVideo ? 0.7 : 0.8,
      videoMaxDuration: isVideo ? 60 : undefined,
    });
    if (!result.canceled && result.assets?.[0]) {
      onUpdate({ uri: result.assets[0].uri });
    }
  };

  return (
    <View style={{
      marginBottom: 10, borderRadius: 16,
      borderWidth: 1.5,
      borderColor: isSelected ? color : bdr,
      backgroundColor: isSelected ? `${color}08` : bg2,
      overflow: "hidden",
    }}>
      {/* Box header */}
      <TouchableOpacity onPress={onSelect} style={{
        flexDirection: "row", alignItems: "center", gap: 10,
        padding: 12,
      }}>
        <View style={{
          width: 32, height: 32, borderRadius: 8,
          backgroundColor: type === "reveal" ? "rgba(239,68,68,0.2)" : `${color}20`,
          alignItems: "center", justifyContent: "center",
        }}>
          <Text style={{ fontSize: 16 }}>
            {type === "reveal" ? "🔒" : type === "video" ? "🎥" : type === "image" ? "📸"
              : type === "voice" ? "🎙" : type === "text" ? "💬" : type === "logo" ? "🏷"
              : type === "link" ? "🔗" : "＋"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: isSelected ? color : txt, fontWeight: "900", fontSize: 13 }}>
            Box {index + 1} — {type === "reveal" ? "🔒 Reveal (locked)" : type === "empty" ? "Tap to set up" : type}
          </Text>
          {hasMedia && <Text style={{ color: "#22C55E", fontSize: 10, fontWeight: "800" }}>✓ Media added</Text>}
        </View>
        <Text style={{ color: dim, fontSize: 14 }}>{isSelected ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {/* Expanded editor */}
      {isSelected && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 14, gap: 10 }}>
          {/* Type chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {BOX_CONTENT_OPTIONS.map(bt => (
              <TouchableOpacity key={bt.id} onPress={() => onUpdate({ type: bt.id })}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 5,
                  paddingVertical: 7, paddingHorizontal: 11, borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: type === bt.id ? (bt.id === "reveal" ? "#EF4444" : color) : bdr,
                  backgroundColor: type === bt.id ? (bt.id === "reveal" ? "rgba(239,68,68,0.12)" : `${color}15`) : "#0A1020",
                }}>
                <Text style={{ fontSize: 12 }}>{bt.icon}</Text>
                <Text style={{
                  color: type === bt.id ? (bt.id === "reveal" ? "#EF4444" : color) : muted,
                  fontWeight: "800", fontSize: 10,
                }}>{bt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Media picker */}
          {(type === "video" || type === "image" || type === "reveal") && (
            <TouchableOpacity onPress={() => pickMedia(type === "video" || type === "reveal")}
              style={{
                padding: 11, borderRadius: 12,
                backgroundColor: hasMedia ? "rgba(34,197,94,0.1)" : `${color}12`,
                borderWidth: 1,
                borderColor: hasMedia ? "#22C55E40" : `${color}30`,
                alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
              }}>
              <Text style={{ fontSize: 14 }}>{hasMedia ? "✓" : "📎"}</Text>
              <Text style={{
                color: hasMedia ? "#22C55E" : color,
                fontWeight: "800", fontSize: 12,
              }}>{hasMedia ? "Media added — tap to change" : `Add ${type === "image" ? "photo" : "video"}`}</Text>
            </TouchableOpacity>
          )}

          {/* Text input */}
          {(type === "text" || type === "logo") && (
            <TextInput
              value={box?.text || ""}
              onChangeText={t => onUpdate({ text: t })}
              placeholder={type === "logo" ? "Brand name..." : "Box text..."}
              placeholderTextColor={dim}
              style={{
                backgroundColor: "#0A1020", borderRadius: 12,
                borderWidth: 1, borderColor: bdr,
                color: txt, padding: 12, fontSize: 14,
              }}
            />
          )}

          {type === "link" && (
            <TextInput
              value={box?.url || ""}
              onChangeText={t => onUpdate({ url: t })}
              placeholder="https://..."
              placeholderTextColor={dim}
              autoCapitalize="none" keyboardType="url"
              style={{
                backgroundColor: "#0A1020", borderRadius: 12,
                borderWidth: 1, borderColor: bdr,
                color: txt, padding: 12, fontSize: 14,
              }}
            />
          )}

          {type === "voice" && (
            <View style={{
              padding: 12, borderRadius: 12,
              backgroundColor: "rgba(124,58,237,0.1)",
              alignItems: "center",
            }}>
              <Text style={{ color: muted, fontSize: 12 }}>🎙 Voice notes coming soon</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// ── Main ComposerModal ───────────────────────────────────
export default function ComposerModal({
  visible, onClose, onSend, colors: C,
  isSending, me, isPro,
}) {
  const [step, setStep] = useState(1);

  // Step 1 — Frame
  const [frameLayout, setFrameLayout] = useState("B");
  const [boxes, setBoxes] = useState([{ type: "video" }, { type: "reveal" }]);
  const [editingBox, setEditingBox] = useState(null);

  // Step 2 — Hook
  const [tailType, setTailType] = useState("LOOK");
  const [message, setMessage] = useState("");
  const [revealType, setRevealType] = useState("message");
  const [revealText, setRevealText] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [giftAmount, setGiftAmount] = useState("");
  const [giftApps, setGiftApps] = useState(["cashapp", "venmo"]);
  const [linkUrl, setLinkUrl] = useState("");
  const [monetizedUrl, setMonetizedUrl] = useState("");

  // Step 3 — Launch
  const [mode, setMode] = useState("public");
  const [recipients, setRecipients] = useState("");
  const [expiryAmount, setExpiryAmount] = useState("24");
  const [expiryUnit, setExpiryUnit] = useState("h");
  const [catchLimit, setCatchLimit] = useState("");
  const [categories, setCategories] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const cfg = TYPE_OPTIONS.find(t => t.id === tailType) || TYPE_OPTIONS[0];
  const currentLayout = LAYOUTS.find(l => l.id === frameLayout) || LAYOUTS[0];

  const bg   = C?.panel    || "#0D1220";
  const bg2  = C?.panel2   || "#111827";
  const bdr  = C?.border   || "#1E293B";
  const txt  = C?.text     || "#E5E7EB";
  const muted = C?.muted   || "#94A3B8";
  const dim  = C?.dim      || "#64748B";

  const reset = () => {
    setStep(1);
    setFrameLayout("B"); setBoxes([{ type: "video" }, { type: "reveal" }]); setEditingBox(null);
    setTailType("LOOK"); setMessage(""); setRevealType("message");
    setRevealText(""); setCouponCode(""); setGiftAmount("");
    setGiftApps(["cashapp", "venmo"]); setLinkUrl(""); setMonetizedUrl("");
    setMode("public"); setRecipients(""); setExpiryAmount("24");
    setExpiryUnit("h"); setCatchLimit(""); setCategories([]); setShowAdvanced(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const animateStep = (nextStep, direction = 1) => {
    Animated.timing(slideAnim, {
      toValue: -400 * direction, duration: 200, useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      slideAnim.setValue(400 * direction);
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200,
      }).start();
    });
  };

  const goNext = () => {
    if (step === 1) {
      animateStep(2, 1);
    } else if (step === 2) {
      if (!message.trim()) { Alert.alert("Add a hook", "Write something to draw people in."); return; }
      animateStep(3, 1);
    }
  };

  const goBack = () => {
    if (step === 2) animateStep(1, -1);
    else if (step === 3) animateStep(2, -1);
  };

  const selectLayout = (layoutId) => {
    const lo = LAYOUTS.find(l => l.id === layoutId);
    if (!lo) return;
    setFrameLayout(layoutId);
    setEditingBox(null);
    // Build default boxes — last box is always reveal
    const newBoxes = Array(lo.boxes).fill(null).map((_, i) => {
      if (i === 0) return { type: "video" };
      if (i === lo.boxes - 1) return { type: "reveal" };
      return { type: "video" };
    });
    setBoxes(newBoxes);
  };

  const updateBox = (index, updates) => {
    const updated = [...boxes];
    // If setting as reveal, clear other reveals
    if (updates.type === "reveal") {
      updated.forEach((b, j) => { if (b.type === "reveal" && j !== index) updated[j] = { ...b, type: "video" }; });
    }
    updated[index] = { ...updated[index], ...updates };
    setBoxes(updated);
  };

  const buildReveal = () => {
    switch (revealType) {
      case "coupon":  return { kind: "coupon",  code: couponCode };
      case "gift":    return { kind: "gift",    amount: parseFloat(giftAmount), paymentApps: giftApps, message: revealText };
      case "link":    return { kind: "url",     url: linkUrl };
      case "voice":   return { kind: "voice" };
      case "message": 
      default:        return { kind: "message", text: revealText };
    }
  };

  const handleSend = () => {
    const videoBox = boxes.find(b => b.type === "video" && b.uri);
    const imageBox = boxes.find(b => b.type === "image" && b.uri);
    const revealBoxIndex = boxes.findIndex(b => b.type === "reveal");

    onSend({
      tailType,
      message,
      visibility: mode,
      recipients: recipients ? recipients.split(",").map(r => r.trim()).filter(Boolean) : [],
      catchLimit: catchLimit ? parseInt(catchLimit) : null,
      categories,
      reveal: buildReveal(),
      videoUri: videoBox?.uri || null,
      photoUri: imageBox?.uri || null,
      previewUrl: videoBox?.uri || null,
      mediaUrl: imageBox?.uri || videoBox?.uri || null,
      monetization: monetizedUrl ? { type: "affiliate", monetizedUrl } : null,
      expiryAmount: parseInt(expiryAmount) || 24,
      expiryUnit,
      frameLayout,
      revealBox: revealBoxIndex >= 0 ? revealBoxIndex : boxes.length - 1,
      boxes,
    });
    reset();
  };

  const revealBoxIndex = boxes.findIndex(b => b.type === "reveal");
  const hasReveal = revealBoxIndex >= 0;

  if (!visible) return null;

  const STEP_LABELS = ["Frame", "Hook", "Launch"];

  return (
    <Modal visible={visible} transparent animationType="slide"
      onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)" }} onPress={handleClose} />

        <View style={{
          backgroundColor: bg,
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          borderWidth: 1, borderColor: bdr, maxHeight: "93%",
        }}>
          {/* Handle */}
          <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 2 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: `${cfg.color}50` }} />
          </View>

          {/* Header */}
          <View style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingHorizontal: 18, paddingVertical: 10,
            borderBottomWidth: 1, borderBottomColor: bdr,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {step > 1 && (
                <TouchableOpacity onPress={goBack} hitSlop={12}
                  style={{
                    width: 32, height: 32, borderRadius: 10,
                    backgroundColor: bg2, borderWidth: 1, borderColor: bdr,
                    alignItems: "center", justifyContent: "center",
                  }}>
                  <Text style={{ color: muted, fontWeight: "900", fontSize: 14 }}>←</Text>
                </TouchableOpacity>
              )}
              <View>
                <Text style={{ color: txt, fontWeight: "900", fontSize: 16 }}>
                  {step === 1 ? "🎬 Build Your Frame" : step === 2 ? "✍️ Write Your Hook" : "🚀 Launch"}
                </Text>
                <Text style={{ color: dim, fontSize: 10 }}>
                  Step {step} of 3 — {STEP_LABELS[step - 1]}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {/* Step dots */}
              <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                {[1, 2, 3].map(s => (
                  <View key={s} style={{
                    height: 6, borderRadius: 3,
                    width: s === step ? 18 : 6,
                    backgroundColor: s <= step ? cfg.color : bdr,
                  }} />
                ))}
              </View>
              <TouchableOpacity onPress={handleClose} hitSlop={10}>
                <Text style={{ color: dim, fontWeight: "900", fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
            <ScrollView showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 18, paddingBottom: 52 }}>

              {/* ══════════ STEP 1: FRAME ══════════ */}
              {step === 1 && (
                <View style={{ gap: 22 }}>

                  {/* Layout picker — BIG and visual */}
                  <View>
                    <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
                      Choose Layout
                    </Text>
                    <Text style={{ color: dim, fontSize: 12, marginBottom: 14 }}>
                      Your frame is the canvas — pick how you want to split it
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
                      {LAYOUTS.map(lo => (
                        <LayoutPreview
                          key={lo.id}
                          layout={lo}
                          boxes={frameLayout === lo.id ? boxes : Array(lo.boxes).fill({})}
                          isSelected={frameLayout === lo.id}
                          color={cfg.color}
                          onPress={() => selectLayout(lo.id)}
                          size={80}
                        />
                      ))}
                    </ScrollView>
                  </View>

                  {/* Divider */}
                  <View style={{ height: 1, backgroundColor: bdr }} />

                  {/* Box editors */}
                  <View>
                    <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
                      Fill Your Boxes
                    </Text>
                    <Text style={{ color: dim, fontSize: 12, marginBottom: 14 }}>
                      Tap each box to add content · Set one as 🔒 Reveal to lock it
                    </Text>
                    {boxes.map((box, i) => (
                      <BoxEditor
                        key={i}
                        box={box}
                        index={i}
                        isSelected={editingBox === i}
                        color={box.type === "reveal" ? "#EF4444" : cfg.color}
                        onSelect={() => setEditingBox(editingBox === i ? null : i)}
                        onUpdate={(updates) => updateBox(i, updates)}
                        bg2={bg2} bdr={bdr} txt={txt} dim={dim} muted={muted}
                      />
                    ))}
                  </View>

                  {/* Reveal hint */}
                  {!hasReveal && (
                    <View style={{
                      padding: 12, borderRadius: 14,
                      backgroundColor: "rgba(245,158,11,0.08)",
                      borderWidth: 1, borderColor: "rgba(245,158,11,0.25)",
                      flexDirection: "row", alignItems: "center", gap: 10,
                    }}>
                      <Text style={{ fontSize: 18 }}>💡</Text>
                      <Text style={{ color: "#F59E0B", fontSize: 12, flex: 1, lineHeight: 18 }}>
                        No locked box — this tail will be fully visible. Set a box to 🔒 Reveal to create a catch.
                      </Text>
                    </View>
                  )}

                  {/* Next */}
                  <TouchableOpacity onPress={goNext} style={{
                    backgroundColor: cfg.color, borderRadius: 16,
                    paddingVertical: 16, alignItems: "center",
                    shadowColor: cfg.color, shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4, shadowRadius: 12,
                  }}>
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
                      Next → Write Hook
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ══════════ STEP 2: HOOK ══════════ */}
              {step === 2 && (
                <View style={{ gap: 20 }}>

                  {/* Frame preview summary */}
                  <View style={{
                    flexDirection: "row", alignItems: "center", gap: 12,
                    padding: 12, borderRadius: 14, backgroundColor: bg2,
                    borderWidth: 1, borderColor: bdr,
                  }}>
                    <LayoutPreview
                      layout={currentLayout}
                      boxes={boxes}
                      isSelected={false}
                      color={cfg.color}
                      onPress={() => {}}
                      size={48}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: txt, fontWeight: "900", fontSize: 13 }}>
                        {currentLayout.label} Frame · {boxes.length} box{boxes.length !== 1 ? "es" : ""}
                      </Text>
                      <Text style={{ color: dim, fontSize: 11, marginTop: 2 }}>
                        {hasReveal ? `Box ${revealBoxIndex + 1} is locked 🔒` : "No locked boxes"}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => animateStep(1, -1)}
                      style={{
                        paddingHorizontal: 10, paddingVertical: 6,
                        borderRadius: 8, backgroundColor: `${cfg.color}15`,
                        borderWidth: 1, borderColor: `${cfg.color}30`,
                      }}>
                      <Text style={{ color: cfg.color, fontSize: 10, fontWeight: "900" }}>Edit</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Tail type */}
                  <View>
                    <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>
                      Tail Type
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8 }}>
                      {TYPE_OPTIONS.map(opt => (
                        <TouchableOpacity key={opt.id} onPress={() => setTailType(opt.id)}
                          style={{
                            paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14,
                            borderWidth: 1.5, alignItems: "center", gap: 4, minWidth: 68,
                            borderColor: tailType === opt.id ? opt.color : bdr,
                            backgroundColor: tailType === opt.id ? `${opt.color}15` : bg2,
                          }}>
                          <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                          <Text style={{
                            color: tailType === opt.id ? opt.color : muted,
                            fontWeight: "900", fontSize: 10,
                          }}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Hook text */}
                  <View>
                    <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
                      Hook Message
                    </Text>
                    <TextInput
                      value={message} onChangeText={setMessage}
                      placeholder="Make them want to catch it..."
                      placeholderTextColor={dim} multiline
                      style={{
                        backgroundColor: bg2, borderRadius: 16,
                        borderWidth: 1.5, borderColor: message ? `${cfg.color}50` : bdr,
                        color: txt, padding: 14, fontSize: 15,
                        minHeight: 90, textAlignVertical: "top", lineHeight: 22,
                      }}
                    />
                    <Text style={{ color: dim, fontSize: 10, marginTop: 4, textAlign: "right" }}>
                      {message.length}/280
                    </Text>
                  </View>

                  {/* Reveal content — only if locked box exists */}
                  {hasReveal && (
                    <View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <Text style={{ fontSize: 14 }}>🔒</Text>
                        <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                          textTransform: "uppercase", letterSpacing: 1.5 }}>
                          What's in the Reveal
                        </Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
                        {REVEAL_TYPES.map(rt => (
                          <TouchableOpacity key={rt.id} onPress={() => {
                            if (rt.id === "voice") { Alert.alert("Coming soon", "Voice notes coming next update."); return; }
                            setRevealType(rt.id);
                          }}
                            style={{
                              paddingVertical: 9, paddingHorizontal: 13, borderRadius: 13,
                              borderWidth: 1.5, alignItems: "center", gap: 3,
                              borderColor: revealType === rt.id ? "#EF4444" : bdr,
                              backgroundColor: revealType === rt.id ? "rgba(239,68,68,0.12)" : bg2,
                              opacity: rt.id === "voice" ? 0.5 : 1,
                            }}>
                            <Text style={{ fontSize: 16 }}>{rt.icon}</Text>
                            <Text style={{
                              color: revealType === rt.id ? "#EF4444" : muted,
                              fontWeight: "800", fontSize: 10,
                            }}>{rt.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      {/* Reveal content input */}
                      {revealType === "message" && (
                        <TextInput
                          value={revealText} onChangeText={setRevealText}
                          placeholder="What do they get when they catch it..."
                          placeholderTextColor={dim} multiline
                          style={{
                            backgroundColor: bg2, borderRadius: 14,
                            borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
                            color: txt, padding: 14, fontSize: 15,
                            minHeight: 90, textAlignVertical: "top", lineHeight: 22,
                          }}
                        />
                      )}

                      {revealType === "coupon" && (
                        <TextInput
                          value={couponCode} onChangeText={setCouponCode}
                          placeholder="SAVE20" placeholderTextColor={dim}
                          autoCapitalize="characters"
                          style={{
                            backgroundColor: bg2, borderRadius: 14,
                            borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
                            color: "#EF4444", padding: 16, fontSize: 24,
                            fontWeight: "900", letterSpacing: 4, textAlign: "center",
                          }}
                        />
                      )}

                      {revealType === "gift" && (
                        <View style={{ gap: 12 }}>
                          <View style={{
                            flexDirection: "row", alignItems: "center",
                            backgroundColor: bg2, borderRadius: 14,
                            borderWidth: 1, borderColor: "rgba(244,63,142,0.3)", paddingHorizontal: 14,
                          }}>
                            <Text style={{ color: "#F43F8E", fontWeight: "900", fontSize: 24 }}>$</Text>
                            <TextInput
                              value={giftAmount} onChangeText={setGiftAmount}
                              placeholder="0.00" placeholderTextColor={dim}
                              keyboardType="decimal-pad"
                              style={{ flex: 1, color: txt, fontSize: 28, fontWeight: "900", padding: 14 }}
                            />
                          </View>
                          <TextInput
                            value={revealText} onChangeText={setRevealText}
                            placeholder="Personal message (optional)..."
                            placeholderTextColor={dim} multiline
                            style={{
                              backgroundColor: bg2, borderRadius: 14,
                              borderWidth: 1, borderColor: bdr,
                              color: txt, padding: 14, fontSize: 14,
                              minHeight: 70, textAlignVertical: "top",
                            }}
                          />
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                            {PAYMENT_APPS.map(app => (
                              <TouchableOpacity key={app.id}
                                onPress={() => setGiftApps(prev =>
                                  prev.includes(app.id) ? prev.filter(a => a !== app.id) : [...prev, app.id])}
                                style={{
                                  flexDirection: "row", alignItems: "center", gap: 6,
                                  paddingVertical: 9, paddingHorizontal: 13, borderRadius: 12,
                                  borderWidth: 1.5,
                                  borderColor: giftApps.includes(app.id) ? "#F43F8E" : bdr,
                                  backgroundColor: giftApps.includes(app.id) ? "rgba(244,63,142,0.1)" : bg2,
                                }}>
                                <Text style={{ fontSize: 14 }}>{app.icon}</Text>
                                <Text style={{
                                  color: giftApps.includes(app.id) ? "#F43F8E" : muted,
                                  fontWeight: "800", fontSize: 12,
                                }}>{app.label}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}

                      {revealType === "link" && (
                        <TextInput
                          value={linkUrl} onChangeText={setLinkUrl}
                          placeholder="https://..." placeholderTextColor={dim}
                          autoCapitalize="none" keyboardType="url"
                          style={{
                            backgroundColor: bg2, borderRadius: 14,
                            borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
                            color: txt, padding: 14, fontSize: 14,
                          }}
                        />
                      )}
                    </View>
                  )}

                  {/* Next */}
                  <TouchableOpacity onPress={goNext} style={{
                    backgroundColor: cfg.color, borderRadius: 16,
                    paddingVertical: 16, alignItems: "center",
                    shadowColor: cfg.color, shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4, shadowRadius: 12,
                  }}>
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
                      Next → Set Launch
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ══════════ STEP 3: LAUNCH ══════════ */}
              {step === 3 && (
                <View style={{ gap: 20 }}>

                  {/* Summary card */}
                  <View style={{
                    padding: 14, borderRadius: 16,
                    backgroundColor: `${cfg.color}10`,
                    borderWidth: 1.5, borderColor: `${cfg.color}30`,
                    gap: 8,
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Text style={{ fontSize: 20 }}>{cfg.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: cfg.color, fontWeight: "900", fontSize: 14 }}>
                          {cfg.label} · {currentLayout.label} Frame
                        </Text>
                        <Text style={{ color: dim, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                          {message}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {boxes.map((b, i) => (
                        <View key={i} style={{
                          paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
                          backgroundColor: b.type === "reveal" ? "rgba(239,68,68,0.15)" : bg2,
                          borderWidth: 1,
                          borderColor: b.type === "reveal" ? "#EF4444" : bdr,
                        }}>
                          <Text style={{ fontSize: 10 }}>
                            {b.type === "reveal" ? "🔒" : b.type === "video" ? "🎥" : b.type === "image" ? "📸" : b.type === "text" ? "💬" : b.type === "link" ? "🔗" : "📦"}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Audience */}
                  <View>
                    <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>
                      Who Sees It
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {[
                        { id: "public",  icon: "🌐", label: "Everyone" },
                        { id: "private", icon: "🔒", label: "Specific people" },
                      ].map(opt => (
                        <TouchableOpacity key={opt.id} onPress={() => setMode(opt.id)}
                          style={{
                            flex: 1, flexDirection: "row", alignItems: "center", gap: 6,
                            paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14,
                            borderWidth: 1.5,
                            borderColor: mode === opt.id ? cfg.color : bdr,
                            backgroundColor: mode === opt.id ? `${cfg.color}15` : bg2,
                          }}>
                          <Text style={{ fontSize: 14 }}>{opt.icon}</Text>
                          <Text style={{
                            color: mode === opt.id ? cfg.color : muted,
                            fontWeight: "800", fontSize: 12,
                          }}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {mode === "private" && (
                      <TextInput
                        value={recipients} onChangeText={setRecipients}
                        placeholder="username1, username2..."
                        placeholderTextColor={dim} autoCapitalize="none"
                        style={{
                          backgroundColor: bg2, borderRadius: 14, marginTop: 8,
                          borderWidth: 1, borderColor: `${cfg.color}40`,
                          color: txt, padding: 14, fontSize: 14,
                        }}
                      />
                    )}
                  </View>

                  {/* Expiry */}
                  <View>
                    <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>
                      Expires In
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TextInput
                        value={expiryAmount} onChangeText={setExpiryAmount}
                        keyboardType="number-pad"
                        style={{
                          flex: 1, backgroundColor: bg2, borderRadius: 14,
                          borderWidth: 1, borderColor: bdr,
                          color: txt, padding: 14, fontSize: 20,
                          fontWeight: "900", textAlign: "center",
                        }}
                      />
                      {["m", "h", "d"].map(u => (
                        <TouchableOpacity key={u} onPress={() => setExpiryUnit(u)}
                          style={{
                            paddingHorizontal: 18, borderRadius: 14, borderWidth: 1.5,
                            justifyContent: "center",
                            borderColor: expiryUnit === u ? cfg.color : bdr,
                            backgroundColor: expiryUnit === u ? `${cfg.color}15` : bg2,
                          }}>
                          <Text style={{
                            color: expiryUnit === u ? cfg.color : muted,
                            fontWeight: "900", fontSize: 14,
                          }}>{u === "m" ? "min" : u === "h" ? "hr" : "day"}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* DROP catch limit */}
                  {tailType === "DROP" && (
                    <View>
                      <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                        textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
                        Catch Limit
                      </Text>
                      <TextInput
                        value={catchLimit} onChangeText={setCatchLimit}
                        placeholder="10" placeholderTextColor={dim}
                        keyboardType="number-pad"
                        style={{
                          backgroundColor: bg2, borderRadius: 14,
                          borderWidth: 1, borderColor: `${cfg.color}40`,
                          color: txt, padding: 14, fontSize: 20,
                          fontWeight: "900", textAlign: "center",
                        }}
                      />
                    </View>
                  )}

                  {/* Advanced */}
                  <TouchableOpacity onPress={() => setShowAdvanced(!showAdvanced)}
                    style={{
                      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                      padding: 14, borderRadius: 14, backgroundColor: bg2,
                      borderWidth: 1, borderColor: bdr,
                    }}>
                    <Text style={{ color: muted, fontWeight: "800", fontSize: 13 }}>⚙️ Advanced</Text>
                    <Text style={{ color: dim, fontSize: 12 }}>{showAdvanced ? "▲" : "▼"}</Text>
                  </TouchableOpacity>

                  {showAdvanced && (
                    <View style={{ gap: 16 }}>
                      <View>
                        <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                          textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                          💰 Affiliate Link
                        </Text>
                        <TextInput
                          value={monetizedUrl} onChangeText={setMonetizedUrl}
                          placeholder="Your affiliate URL..."
                          placeholderTextColor={dim} autoCapitalize="none" keyboardType="url"
                          style={{
                            backgroundColor: bg2, borderRadius: 14,
                            borderWidth: 1,
                            borderColor: monetizedUrl ? "#22C55E40" : bdr,
                            color: txt, padding: 14, fontSize: 13,
                          }}
                        />
                        {monetizedUrl && (
                          <Text style={{ color: "#22C55E", fontSize: 11, fontWeight: "800", marginTop: 4 }}>
                            ✓ Earns on every catch
                          </Text>
                        )}
                      </View>
                      <View>
                        <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                          textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                          Categories
                        </Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                          {CATEGORIES.map(cat => (
                            <TouchableOpacity key={cat.id}
                              onPress={() => setCategories(prev =>
                                prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id])}
                              style={{
                                width: 40, height: 40, borderRadius: 12,
                                borderWidth: 1.5, alignItems: "center", justifyContent: "center",
                                borderColor: categories.includes(cat.id) ? cfg.color : bdr,
                                backgroundColor: categories.includes(cat.id) ? `${cfg.color}15` : bg2,
                              }}>
                              <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* SEND */}
                  <TouchableOpacity onPress={handleSend} disabled={isSending}
                    style={{
                      backgroundColor: isSending ? bg2 : cfg.color,
                      borderRadius: 18, paddingVertical: 18, alignItems: "center",
                      shadowColor: cfg.color, shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: isSending ? 0 : 0.55, shadowRadius: 18, marginTop: 4,
                    }}>
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 17 }}>
                      {isSending ? "Sending..." : `${cfg.icon} Send Tail`}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}