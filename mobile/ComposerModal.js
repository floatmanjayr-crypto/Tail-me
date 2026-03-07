// ============================================================
// ComposerModal.js — Fast Send Flow v7
// Step 1: Pick type + content + reveal
// Step 2: Audience + expiry + send
// Advanced: affiliate, categories
// ============================================================
import React, { useState, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  View, Text, Modal, TouchableOpacity, TextInput,
  ScrollView, Animated, Pressable,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";

const TYPE_OPTIONS = [
  { id: "LOOK",  icon: "👀", label: "LOOK",  desc: "Standard tail",         color: "#7C3AED" },
  { id: "NOW",   icon: "⚡", label: "NOW",   desc: "Expires fast",          color: "#F59E0B" },
  { id: "DROP",  icon: "💧", label: "DROP",  desc: "Limited spots",         color: "#EF4444" },
  { id: "GEO",   icon: "📍", label: "GEO",   desc: "Location-based",        color: "#0EA5E9" },
  { id: "CHAIN", icon: "🔗", label: "CHAIN", desc: "Pass it on",            color: "#22C55E" },
  { id: "GIFT",  icon: "💰", label: "GIFT",  desc: "Send money or a treat", color: "#F43F8E" },
];

const REVEAL_OPTIONS = [
  { id: "message", icon: "💬", label: "Message",   desc: "Personal text"     },
  { id: "voice",   icon: "🗣", label: "Voice",     desc: "Record your voice" },
  { id: "url",     icon: "🔗", label: "Link",      desc: "Any URL"           },
  { id: "coupon",  icon: "🎟", label: "Coupon",    desc: "Discount code"     },
  { id: "emoji",   icon: "😮", label: "Reaction",  desc: "Emoji pop"         },
  { id: "photo",   icon: "📸", label: "Photo",     desc: "Image reveal"      },
  { id: "gift",    icon: "💰", label: "Gift",      desc: "Money or treat"    },
];

const PAYMENT_APPS = [
  { id: "cashapp",  icon: "💵", label: "Cash App"  },
  { id: "venmo",    icon: "🔵", label: "Venmo"     },
  { id: "paypal",   icon: "🅿️", label: "PayPal"    },
  { id: "applepay", icon: "🍎", label: "Apple Pay" },
];

const CATEGORIES = [
  { id: "business", icon: "💼" }, { id: "travel",  icon: "✈️" },
  { id: "food",     icon: "🍕" }, { id: "shopping",icon: "🛍️" },
  { id: "parties",  icon: "🎉" }, { id: "fitness", icon: "💪" },
  { id: "music",    icon: "🎵" }, { id: "sports",  icon: "⚽" },
  { id: "gaming",   icon: "🎮" }, { id: "tech",    icon: "💻" },
  { id: "fashion",  icon: "👗" }, { id: "deals",   icon: "🏷️" },
];

const EMOJIS = ["🎉","❤️","🔥","💯","😱","🎁","👑","💎","🚀","⚡","🌟","🎯"];

export default function ComposerModal({
  visible, onClose, onSend, colors: C,
  isSending, me, isPro,
}) {
  const [step, setStep] = useState(1);
  const [tailType, setTailType] = useState("LOOK");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [revealKind, setRevealKind] = useState("message");
  const [revealValue, setRevealValue] = useState("");
  const [catchLimit, setCatchLimit] = useState("");
  const [expiryAmount, setExpiryAmount] = useState("24");
  const [expiryUnit, setExpiryUnit] = useState("h");
  const [monetizedUrl, setMonetizedUrl] = useState("");
  const [categories, setCategories] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [giftAmount, setGiftAmount] = useState("");
  const [giftPaymentApps, setGiftPaymentApps] = useState(["cashapp", "venmo"]);
  const [recipients, setRecipients] = useState("");
  const [previewType, setPreviewType] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  const [videoThumb, setVideoThumb] = useState(null);
  const [mode, setMode] = useState("public");
  const slideAnim = useRef(new Animated.Value(0)).current;

  const cfg = TYPE_OPTIONS.find(t => t.id === tailType) || TYPE_OPTIONS[0];
  const isGift = tailType === "GIFT";

  const reset = () => {
    setStep(1); setTailType("LOOK"); setUrl(""); setMessage("");
    setRevealKind("message"); setRevealValue(""); setCatchLimit("");
    setExpiryAmount("24"); setExpiryUnit("h"); setMonetizedUrl("");
    setCategories([]); setShowAdvanced(false); setGiftAmount("");
    setGiftPaymentApps(["cashapp","venmo"]); setRecipients("");
    setPreviewType(null); setMode("public");
    setVideoUri(null); setVideoThumb(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setVideoUri(asset.uri);
      setPreviewType("video");
    }
  };

  const goStep2 = () => {
    Animated.timing(slideAnim, { toValue: -400, duration: 220, useNativeDriver: true }).start(() => {
      setStep(2);
      slideAnim.setValue(400);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
    });
  };

  const goStep1 = () => {
    Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }).start(() => {
      setStep(1);
      slideAnim.setValue(-400);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
    });
  };

  const handleSend = () => {
    if (revealKind === "url" && !url && !isGift) {
      Alert.alert("Missing link", "Add a link or choose a different reveal type."); return;
    }
    if (["message","coupon"].includes(revealKind) && !revealValue && !isGift) {
      Alert.alert("Missing reveal", "Add your reveal content."); return;
    }
    if (revealKind === "emoji" && !revealValue && !isGift) {
      Alert.alert("Pick an emoji", "Select the emoji that pops on catch."); return;
    }
    if (isGift && !giftAmount) {
      Alert.alert("Missing amount", "Enter the gift amount."); return;
    }

    const buildReveal = () => {
      if (isGift) return { kind: "gift", amount: parseFloat(giftAmount), paymentApps: giftPaymentApps, message };
      switch(revealKind) {
        case "coupon":  return { kind: "coupon",  code: revealValue };
        case "message": return { kind: "message", text: revealValue };
        case "emoji":   return { kind: "emoji",   emoji: revealValue };
        case "url":     return { kind: "url",     url };
        case "photo":   return { kind: "photo",   url };
        case "voice":   return { kind: "voice" };
        default:        return { kind: revealKind };
      }
    };

    onSend({
      tailType: isGift ? "LOOK" : tailType,
      url: url || null,
      message,
      visibility: mode,
      recipients: recipients ? recipients.split(",").map(r => r.trim()).filter(Boolean) : [],
      catchLimit: catchLimit ? parseInt(catchLimit) : null,
      categories,
      reveal: buildReveal(),
      previewType,
      videoUri: videoUri || null,
      thumbUri: videoThumb || null,
      monetization: monetizedUrl ? { type: "affiliate", monetizedUrl, contentUrl: url } : null,
      expiryAmount: parseInt(expiryAmount) || 24,
      expiryUnit,
    });
    reset();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide"
      onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} onPress={handleClose} />

        <View style={{
          backgroundColor: C?.panel || "#0D1220",
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          borderWidth: 1, borderColor: C?.border || "#1E293B",
          maxHeight: "92%",
        }}>
          {/* Handle bar */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: `${cfg.color}50` }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center",
            justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 10,
            borderBottomWidth: 1, borderBottomColor: C?.border || "#1E293B" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {step === 2 && (
                <TouchableOpacity onPress={goStep1} hitSlop={10}>
                  <Text style={{ color: C?.muted || "#64748B", fontWeight: "900", fontSize: 18 }}>←</Text>
                </TouchableOpacity>
              )}
              <Text style={{ color: C?.text || "#E5E7EB", fontWeight: "900", fontSize: 17 }}>
                {step === 1 ? "🦊 Send a Tail" : "Finish & Send"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {[1,2].map(s => (
                  <View key={s} style={{ width: s === step ? 16 : 6, height: 6,
                    borderRadius: 3, backgroundColor: s === step ? cfg.color : C?.border || "#1E293B" }} />
                ))}
              </View>
              <TouchableOpacity onPress={handleClose} hitSlop={10}>
                <Text style={{ color: C?.dim || "#334155", fontWeight: "900", fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
            <ScrollView showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>

              {/* ══════════════ STEP 1 ══════════════ */}
              {step === 1 && (
                <View style={{ gap: 20 }}>

                  {/* Tail type */}
                  <View>
                    <Text style={{ color: C?.muted || "#64748B", fontWeight: "900", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8 }}>
                      {TYPE_OPTIONS.map(opt => (
                        <TouchableOpacity key={opt.id} onPress={() => setTailType(opt.id)}
                          style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14,
                            borderWidth: 1.5, alignItems: "center", gap: 4, minWidth: 68,
                            borderColor: tailType === opt.id ? opt.color : C?.border || "#1E293B",
                            backgroundColor: tailType === opt.id ? `${opt.color}15` : C?.panel2 || "#111827" }}>
                          <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                          <Text style={{ color: tailType === opt.id ? opt.color : C?.muted || "#64748B",
                            fontWeight: "900", fontSize: 10 }}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Text style={{ color: C?.dim || "#334155", fontSize: 11, marginTop: 5 }}>{cfg.desc}</Text>
                  </View>

                  {/* Gift amount */}
                  {isGift && (
                    <View style={{ gap: 10 }}>
                      <Text style={{ color: C?.muted || "#64748B", fontWeight: "900", fontSize: 11,
                        textTransform: "uppercase", letterSpacing: 1 }}>Gift Amount</Text>
                      <View style={{ flexDirection: "row", alignItems: "center",
                        backgroundColor: C?.panel2 || "#111827", borderRadius: 14,
                        borderWidth: 1, borderColor: "#F43F8E40", paddingHorizontal: 14 }}>
                        <Text style={{ color: "#F43F8E", fontWeight: "900", fontSize: 20 }}>$</Text>
                        <TextInput value={giftAmount} onChangeText={setGiftAmount}
                          placeholder="0.00" placeholderTextColor={C?.dim || "#334155"}
                          keyboardType="decimal-pad"
                          style={{ flex: 1, color: C?.text || "#E5E7EB", fontSize: 24,
                            fontWeight: "900", padding: 14 }} />
                      </View>
                      <Text style={{ color: C?.muted || "#64748B", fontWeight: "900", fontSize: 11,
                        textTransform: "uppercase", letterSpacing: 1 }}>Accept via</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {PAYMENT_APPS.map(app => (
                          <TouchableOpacity key={app.id}
                            onPress={() => setGiftPaymentApps(prev =>
                              prev.includes(app.id) ? prev.filter(a => a !== app.id) : [...prev, app.id])}
                            style={{ flexDirection: "row", alignItems: "center", gap: 6,
                              paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12,
                              borderWidth: 1.5,
                              borderColor: giftPaymentApps.includes(app.id) ? "#F43F8E" : C?.border || "#1E293B",
                              backgroundColor: giftPaymentApps.includes(app.id)
                                ? "rgba(244,63,142,0.1)" : C?.panel2 || "#111827" }}>
                            <Text style={{ fontSize: 14 }}>{app.icon}</Text>
                            <Text style={{ color: giftPaymentApps.includes(app.id) ? "#F43F8E" : C?.muted || "#64748B",
                              fontWeight: "800", fontSize: 12 }}>{app.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Preview clip selector */}
                  <View style={{ gap: 8 }}>
                    <Text style={{ color: C?.muted || "#64748B", fontWeight: "900", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 1 }}>Preview in grid</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity onPress={pickVideo}
                        style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1.5,
                          alignItems: "center", gap: 4,
                          borderColor: previewType === "video" ? cfg.color : C?.border || "#1E293B",
                          backgroundColor: previewType === "video" ? `${cfg.color}15` : C?.panel2 || "#111827" }}>
                        <Text style={{ fontSize: 24 }}>🎥</Text>
                        <Text style={{ color: previewType === "video" ? cfg.color : C?.muted || "#64748B",
                          fontWeight: "900", fontSize: 11 }}>Video</Text>
                        <Text style={{ color: C?.dim || "#334155", fontSize: 9, textAlign: "center" }}>
                          grid shows first 3s
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={async () => {
                          const r = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
                          if (!r.canceled) { setVideoThumb(r.assets[0].uri); setPreviewType("image"); }
                        }}
                        style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1.5,
                          alignItems: "center", gap: 4,
                          borderColor: previewType === "image" ? cfg.color : C?.border || "#1E293B",
                          backgroundColor: previewType === "image" ? `${cfg.color}15` : C?.panel2 || "#111827" }}>
                        <Text style={{ fontSize: 24 }}>📸</Text>
                        <Text style={{ color: previewType === "image" ? cfg.color : C?.muted || "#64748B",
                          fontWeight: "900", fontSize: 11 }}>Photo</Text>
                        <Text style={{ color: C?.dim || "#334155", fontSize: 9, textAlign: "center" }}>
                          static in grid
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setPreviewType(null); setVideoUri(null); }}
                        style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1.5,
                          alignItems: "center", gap: 4,
                          borderColor: !previewType ? cfg.color : C?.border || "#1E293B",
                          backgroundColor: !previewType ? `${cfg.color}15` : C?.panel2 || "#111827" }}>
                        <Text style={{ fontSize: 24 }}>✍️</Text>
                        <Text style={{ color: !previewType ? cfg.color : C?.muted || "#64748B",
                          fontWeight: "900", fontSize: 11 }}>Text</Text>
                        <Text style={{ color: C?.dim || "#334155", fontSize: 9, textAlign: "center" }}>
                          no media
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {videoUri ? (
                      <View style={{ borderRadius: 12, overflow: "hidden",
                        borderWidth: 1.5, borderColor: cfg.color }}>
                        <View style={{ padding: 12, backgroundColor: `${cfg.color}10`,
                          flexDirection: "row", alignItems: "center", gap: 10 }}>
                          <Text style={{ fontSize: 24 }}>🎥</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: cfg.color, fontWeight: "900", fontSize: 12 }}>
                              Video ready
                            </Text>
                            <Text style={{ color: C?.dim || "#334155", fontSize: 10, marginTop: 2 }}>
                              First 3 seconds plays in grid. Full video reveals on catch.
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => { setVideoUri(null); setPreviewType(null); }}>
                            <Text style={{ color: C?.dim || "#334155", fontSize: 16 }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}
                  </View>

                  {/* Hook / message */}
                  <View>
                    <Text style={{ color: C?.muted || "#64748B", fontWeight: "900", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                      {isGift ? "Personal note" : "Hook (shown before catching)"}
                    </Text>
                    <TextInput value={message} onChangeText={setMessage}
                      placeholder={isGift ? "Lunch is on me 🎁" : "Make them want to catch it..."}
                      placeholderTextColor={C?.dim || "#334155"} multiline
                      style={{ backgroundColor: C?.panel2 || "#111827", borderRadius: 14,
                        borderWidth: 1, borderColor: message ? `${cfg.color}50` : C?.border || "#1E293B",
                        color: C?.text || "#E5E7EB", padding: 14, fontSize: 14,
                        minHeight: 70, textAlignVertical: "top" }} />
                  </View>

                  {/* Reveal type */}
                  {!isGift && (
                    <View style={{ gap: 10 }}>
                      <Text style={{ color: C?.muted || "#64748B", fontWeight: "900", fontSize: 11,
                        textTransform: "uppercase", letterSpacing: 1 }}>
                        What's inside when they catch it
                      </Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {REVEAL_OPTIONS.filter(r => r.id !== "gift").map(opt => (
                          <TouchableOpacity key={opt.id} onPress={() => setRevealKind(opt.id)}
                            style={{ flexDirection: "row", alignItems: "center", gap: 6,
                              paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12,
                              borderWidth: 1.5,
                              borderColor: revealKind === opt.id ? cfg.color : C?.border || "#1E293B",
                              backgroundColor: revealKind === opt.id ? `${cfg.color}15` : C?.panel2 || "#111827" }}>
                            <Text style={{ fontSize: 14 }}>{opt.icon}</Text>
                            <Text style={{ color: revealKind === opt.id ? cfg.color : C?.muted || "#64748B",
                              fontWeight: "800", fontSize: 12 }}>{opt.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {revealKind === "message" && (
                        <TextInput value={revealValue} onChangeText={setRevealValue}
                          placeholder="Write something personal..."
                          placeholderTextColor={C?.dim || "#334155"} multiline
                          style={{ backgroundColor: C?.panel2 || "#111827", borderRadius: 14,
                            borderWidth: 1, borderColor: `${cfg.color}40`,
                            color: C?.text || "#E5E7EB", padding: 14, fontSize: 14,
                            minHeight: 80, textAlignVertical: "top" }} />
                      )}
                      {revealKind === "coupon" && (
                        <TextInput value={revealValue} onChangeText={setRevealValue}
                          placeholder="SAVE20" placeholderTextColor={C?.dim || "#334155"}
                          autoCapitalize="characters"
                          style={{ backgroundColor: C?.panel2 || "#111827", borderRadius: 14,
                            borderWidth: 1, borderColor: `${cfg.color}40`,
                            color: cfg.color, padding: 14, fontSize: 20,
                            fontWeight: "900", letterSpacing: 3, textAlign: "center" }} />
                      )}
                      {revealKind === "url" && (
                        <TextInput value={url} onChangeText={setUrl}
                          placeholder="https://..." placeholderTextColor={C?.dim || "#334155"}
                          autoCapitalize="none" keyboardType="url"
                          style={{ backgroundColor: C?.panel2 || "#111827", borderRadius: 14,
                            borderWidth: 1, borderColor: url ? `${cfg.color}50` : C?.border || "#1E293B",
                            color: C?.text || "#E5E7EB", padding: 14, fontSize: 14 }} />
                      )}
                      {revealKind === "emoji" && (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                          {EMOJIS.map(e => (
                            <TouchableOpacity key={e} onPress={() => setRevealValue(e)}
                              style={{ width: 44, height: 44, borderRadius: 12,
                                alignItems: "center", justifyContent: "center",
                                backgroundColor: revealValue === e ? `${cfg.color}20` : C?.panel2 || "#111827",
                                borderWidth: 1.5,
                                borderColor: revealValue === e ? cfg.color : C?.border || "#1E293B" }}>
                              <Text style={{ fontSize: 22 }}>{e}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      {revealKind === "voice" && (
                        <View style={{ padding: 16, borderRadius: 14,
                          backgroundColor: C?.panel2 || "#111827", borderWidth: 1,
                          borderColor: `${cfg.color}40`, alignItems: "center", gap: 8 }}>
                          <Text style={{ fontSize: 32 }}>🎙</Text>
                          <Text style={{ color: C?.muted || "#64748B", fontSize: 13, textAlign: "center" }}>
                            Voice note coming soon.{"\n"}Use Message for now.
                          </Text>
                        </View>
                      )}
                      {revealKind === "photo" && (
                        <View style={{ padding: 16, borderRadius: 14,
                          backgroundColor: C?.panel2 || "#111827", borderWidth: 1,
                          borderColor: `${cfg.color}40`, alignItems: "center", gap: 8 }}>
                          <Text style={{ fontSize: 32 }}>📸</Text>
                          <Text style={{ color: C?.muted || "#64748B", fontSize: 13, textAlign: "center" }}>
                            Full photo revealed after catch.
                          </Text>
                        </View>
                      )}

                      {/* Reveal preview chip */}
                      {revealValue && !["voice","photo"].includes(revealKind) && (
                        <View style={{ padding: 10, borderRadius: 12,
                          backgroundColor: `${cfg.color}10`, borderWidth: 1,
                          borderColor: `${cfg.color}30`, flexDirection: "row",
                          alignItems: "center", gap: 8 }}>
                          <Text style={{ fontSize: 14 }}>
                            {REVEAL_OPTIONS.find(r => r.id === revealKind)?.icon}
                          </Text>
                          <Text style={{ color: cfg.color, fontWeight: "800", fontSize: 12, flex: 1 }}
                            numberOfLines={1}>{revealValue}</Text>
                          <Text style={{ color: C?.dim || "#334155", fontSize: 10 }}>preview</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Next */}
                  <TouchableOpacity onPress={goStep2}
                    style={{ backgroundColor: cfg.color, borderRadius: 16,
                      paddingVertical: 16, alignItems: "center",
                      shadowColor: cfg.color, shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.4, shadowRadius: 12 }}>
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Next →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ══════════════ STEP 2 ══════════════ */}
              {step === 2 && (
                <View style={{ gap: 20 }}>

                  {/* Summary */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8,
                    padding: 12, borderRadius: 14, backgroundColor: `${cfg.color}15`,
                    borderWidth: 1, borderColor: `${cfg.color}40` }}>
                    <Text style={{ fontSize: 20 }}>{cfg.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: cfg.color, fontWeight: "900", fontSize: 13 }}>
                        {cfg.label} Tail
                      </Text>
                      <Text style={{ color: C?.dim || "#334155", fontSize: 11 }} numberOfLines={1}>
                        {isGift ? `💰 $${giftAmount} gift` : message || url || "No content"}
                      </Text>
                    </View>
                  </View>

                  {/* Audience */}
                  <View>
                    <Text style={{ color: C?.muted || "#64748B", fontWeight: "900", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                      Who sees it
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {[
                        { id: "public",  icon: "🌐", label: "Everyone"       },
                        { id: "private", icon: "🔒", label: "Specific people" },
                      ].map(opt => (
                        <TouchableOpacity key={opt.id} onPress={() => setMode(opt.id)}
                          style={{ flex: 1, flexDirection: "row", alignItems: "center",
                            gap: 6, paddingVertical: 12, paddingHorizontal: 14,
                            borderRadius: 14, borderWidth: 1.5,
                            borderColor: mode === opt.id ? cfg.color : C?.border || "#1E293B",
                            backgroundColor: mode === opt.id ? `${cfg.color}15` : C?.panel2 || "#111827" }}>
                          <Text style={{ fontSize: 14 }}>{opt.icon}</Text>
                          <Text style={{ color: mode === opt.id ? cfg.color : C?.muted || "#64748B",
                            fontWeight: "800", fontSize: 12 }}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {mode === "private" && (
                      <TextInput value={recipients} onChangeText={setRecipients}
                        placeholder="username1, username2..."
                        placeholderTextColor={C?.dim || "#334155"}
                        autoCapitalize="none"
                        style={{ backgroundColor: C?.panel2 || "#111827", borderRadius: 14,
                          borderWidth: 1, borderColor: `${cfg.color}40`,
                          color: C?.text || "#E5E7EB", padding: 14, fontSize: 14, marginTop: 8 }} />
                    )}
                  </View>

                  {/* Expiry */}
                  <View>
                    <Text style={{ color: C?.muted || "#64748B", fontWeight: "900", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                      Expires in
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TextInput value={expiryAmount} onChangeText={setExpiryAmount}
                        keyboardType="number-pad"
                        style={{ flex: 1, backgroundColor: C?.panel2 || "#111827", borderRadius: 14,
                          borderWidth: 1, borderColor: C?.border || "#1E293B",
                          color: C?.text || "#E5E7EB", padding: 14, fontSize: 18,
                          fontWeight: "900", textAlign: "center" }} />
                      {["m","h","d"].map(u => (
                        <TouchableOpacity key={u} onPress={() => setExpiryUnit(u)}
                          style={{ paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5,
                            justifyContent: "center",
                            borderColor: expiryUnit === u ? cfg.color : C?.border || "#1E293B",
                            backgroundColor: expiryUnit === u ? `${cfg.color}15` : C?.panel2 || "#111827" }}>
                          <Text style={{ color: expiryUnit === u ? cfg.color : C?.muted || "#64748B",
                            fontWeight: "900", fontSize: 14 }}>
                            {u === "m" ? "min" : u === "h" ? "hr" : "day"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* DROP limit */}
                  {tailType === "DROP" && (
                    <View>
                      <Text style={{ color: C?.muted || "#64748B", fontWeight: "900", fontSize: 11,
                        textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                        Catch limit
                      </Text>
                      <TextInput value={catchLimit} onChangeText={setCatchLimit}
                        placeholder="10" placeholderTextColor={C?.dim || "#334155"}
                        keyboardType="number-pad"
                        style={{ backgroundColor: C?.panel2 || "#111827", borderRadius: 14,
                          borderWidth: 1, borderColor: `${cfg.color}40`,
                          color: C?.text || "#E5E7EB", padding: 14, fontSize: 18,
                          fontWeight: "900", textAlign: "center" }} />
                    </View>
                  )}

                  {/* Advanced toggle */}
                  <TouchableOpacity onPress={() => setShowAdvanced(!showAdvanced)}
                    style={{ flexDirection: "row", alignItems: "center",
                      justifyContent: "space-between", padding: 14,
                      borderRadius: 14, backgroundColor: C?.panel2 || "#111827",
                      borderWidth: 1, borderColor: C?.border || "#1E293B" }}>
                    <Text style={{ color: C?.muted || "#64748B", fontWeight: "800", fontSize: 13 }}>
                      ⚙️ Advanced options
                    </Text>
                    <Text style={{ color: C?.dim || "#334155", fontSize: 12 }}>
                      {showAdvanced ? "▲" : "▼"}
                    </Text>
                  </TouchableOpacity>

                  {showAdvanced && (
                    <View style={{ gap: 16 }}>
                      <View>
                        <Text style={{ color: C?.muted || "#64748B", fontWeight: "900", fontSize: 11,
                          textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                          💰 Affiliate link
                        </Text>
                        <TextInput value={monetizedUrl} onChangeText={setMonetizedUrl}
                          placeholder="Your affiliate URL..."
                          placeholderTextColor={C?.dim || "#334155"}
                          autoCapitalize="none" keyboardType="url"
                          style={{ backgroundColor: C?.panel2 || "#111827", borderRadius: 14,
                            borderWidth: 1,
                            borderColor: monetizedUrl ? "#22C55E40" : C?.border || "#1E293B",
                            color: C?.text || "#E5E7EB", padding: 14, fontSize: 13 }} />
                        {monetizedUrl ? (
                          <Text style={{ color: "#22C55E", fontSize: 11, fontWeight: "800", marginTop: 4 }}>
                            ✓ Earns on every catch
                          </Text>
                        ) : null}
                      </View>
                      <View>
                        <Text style={{ color: C?.muted || "#64748B", fontWeight: "900", fontSize: 11,
                          textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                          Categories
                        </Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                          {CATEGORIES.map(cat => (
                            <TouchableOpacity key={cat.id}
                              onPress={() => setCategories(prev =>
                                prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id])}
                              style={{ width: 40, height: 40, borderRadius: 12,
                                borderWidth: 1.5, alignItems: "center", justifyContent: "center",
                                borderColor: categories.includes(cat.id) ? cfg.color : C?.border || "#1E293B",
                                backgroundColor: categories.includes(cat.id)
                                  ? `${cfg.color}15` : C?.panel2 || "#111827" }}>
                              <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Send */}
                  <TouchableOpacity onPress={handleSend} disabled={isSending}
                    style={{ backgroundColor: isSending ? C?.panel2 || "#111827" : cfg.color,
                      borderRadius: 16, paddingVertical: 18, alignItems: "center",
                      shadowColor: cfg.color, shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: isSending ? 0 : 0.5, shadowRadius: 16, marginTop: 4 }}>
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
