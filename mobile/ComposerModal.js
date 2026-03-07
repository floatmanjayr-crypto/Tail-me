// ============================================================
// ComposerModal.js — Clean v8
// Step 1: Hook + content upload + type (optional extras)
// Step 2: Audience + expiry + send
// ============================================================
import React, { useState, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  View, Text, Modal, TouchableOpacity, TextInput,
  ScrollView, Animated, Pressable,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";

const TYPE_OPTIONS = [
  { id: "LOOK",  icon: "👀", label: "LOOK",  desc: "Standard tail",    color: "#7C3AED" },
  { id: "NOW",   icon: "⚡", label: "NOW",   desc: "Expires fast",     color: "#F59E0B" },
  { id: "DROP",  icon: "💧", label: "DROP",  desc: "Limited catches",  color: "#EF4444" },
  { id: "GEO",   icon: "📍", label: "GEO",   desc: "Location-based",   color: "#0EA5E9" },
  { id: "CHAIN", icon: "🔗", label: "CHAIN", desc: "Pass it on",       color: "#22C55E" },
];

const CONTENT_TYPES = [
  { id: "video",   icon: "🎥", label: "Video",   sub: "first 3s in grid" },
  { id: "photo",   icon: "📸", label: "Photo",   sub: "image reveal"     },
  { id: "voice",   icon: "🎙", label: "Voice",   sub: "coming soon"      },
  { id: "coupon",  icon: "🎟", label: "Coupon",  sub: "discount code"    },
  { id: "gift",    icon: "💰", label: "Gift",    sub: "send money"       },
  { id: "link",    icon: "🔗", label: "Link",    sub: "any URL"          },
  { id: "message", icon: "💬", label: "Message", sub: "text only"        },
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

export default function ComposerModal({
  visible, onClose, onSend, colors: C,
  isSending, me, isPro,
}) {
  const [step, setStep] = useState(1);
  const [tailType, setTailType] = useState("LOOK");
  const [message, setMessage] = useState("");
  const [contentType, setContentType] = useState(null);

  // content values
  const [videoUri, setVideoUri]     = useState(null);
  const [photoUri, setPhotoUri]     = useState(null);
  const [linkUrl, setLinkUrl]       = useState("");
  const [revealText, setRevealText] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [giftAmount, setGiftAmount] = useState("");
  const [giftApps, setGiftApps]     = useState(["cashapp", "venmo"]);
  const [monetizedUrl, setMonetizedUrl] = useState("");

  // step 2
  const [mode, setMode]             = useState("public");
  const [recipients, setRecipients] = useState("");
  const [expiryAmount, setExpiryAmount] = useState("24");
  const [expiryUnit, setExpiryUnit] = useState("h");
  const [catchLimit, setCatchLimit] = useState("");
  const [categories, setCategories] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const cfg = TYPE_OPTIONS.find(t => t.id === tailType) || TYPE_OPTIONS[0];

  const reset = () => {
    setStep(1); setTailType("LOOK"); setMessage(""); setContentType(null);
    setVideoUri(null); setPhotoUri(null); setLinkUrl(""); setRevealText("");
    setCouponCode(""); setGiftAmount(""); setGiftApps(["cashapp","venmo"]);
    setMonetizedUrl(""); setMode("public"); setRecipients("");
    setExpiryAmount("24"); setExpiryUnit("h"); setCatchLimit("");
    setCategories([]); setShowAdvanced(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const goStep2 = () => {
    if (!message.trim()) { Alert.alert("Add a hook", "Write something to draw people in."); return; }
    Animated.timing(slideAnim, { toValue: -400, duration: 200, useNativeDriver: true }).start(() => {
      setStep(2); slideAnim.setValue(400);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
    });
  };

  const goStep1 = () => {
    Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }).start(() => {
      setStep(1); slideAnim.setValue(-400);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
    });
  };

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7, videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets?.[0]) {
      setVideoUri(result.assets[0].uri);
      setContentType("video");
    }
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
      setContentType("photo");
    }
  };

  const handleSend = () => {
    const buildReveal = () => {
      switch (contentType) {
        case "video":   return { kind: "video",   url: videoUri };
        case "photo":   return { kind: "photo",   url: photoUri };
        case "voice":   return { kind: "voice" };
        case "coupon":  return { kind: "coupon",  code: couponCode };
        case "gift":    return { kind: "gift",    amount: parseFloat(giftAmount), paymentApps: giftApps };
        case "link":    return { kind: "url",     url: linkUrl };
        case "message": return { kind: "message", text: revealText };
        default:        return null;
      }
    };

    onSend({
      tailType,
      message,
      visibility: mode,
      recipients: recipients ? recipients.split(",").map(r => r.trim()).filter(Boolean) : [],
      catchLimit: catchLimit ? parseInt(catchLimit) : null,
      categories,
      reveal: buildReveal(),
      videoUri: videoUri || null,
      photoUri: photoUri || null,
      monetization: monetizedUrl ? { type: "affiliate", monetizedUrl } : null,
      expiryAmount: parseInt(expiryAmount) || 24,
      expiryUnit,
    });
    reset();
  };

  const bg   = C?.panel    || "#0D1220";
  const bg2  = C?.panel2   || "#111827";
  const bdr  = C?.border   || "#1E293B";
  const txt  = C?.text     || "#E5E7EB";
  const muted = C?.muted   || "#64748B";
  const dim  = C?.dim      || "#334155";

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide"
      onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} onPress={handleClose} />

        <View style={{
          backgroundColor: bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
          borderWidth: 1, borderColor: bdr, maxHeight: "92%",
        }}>
          {/* Handle */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: `${cfg.color}50` }} />
          </View>

          {/* Header */}
          <View style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingHorizontal: 20, paddingVertical: 10,
            borderBottomWidth: 1, borderBottomColor: bdr,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {step === 2 && (
                <TouchableOpacity onPress={goStep1} hitSlop={10}>
                  <Text style={{ color: muted, fontWeight: "900", fontSize: 18 }}>←</Text>
                </TouchableOpacity>
              )}
              <Text style={{ color: txt, fontWeight: "900", fontSize: 17 }}>
                {step === 1 ? "🦊 New Tail" : "Who & When"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {[1, 2].map(s => (
                  <View key={s} style={{
                    width: s === step ? 16 : 6, height: 6, borderRadius: 3,
                    backgroundColor: s === step ? cfg.color : bdr,
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
              contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>

              {/* ══════ STEP 1 ══════ */}
              {step === 1 && (
                <View style={{ gap: 20 }}>

                  {/* Tail type */}
                  <View>
                    <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Type</Text>
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
                      textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                      Hook
                    </Text>
                    <TextInput
                      value={message} onChangeText={setMessage}
                      placeholder="Make them want to catch it..."
                      placeholderTextColor={dim} multiline
                      style={{
                        backgroundColor: bg2, borderRadius: 16,
                        borderWidth: 1, borderColor: message ? `${cfg.color}50` : bdr,
                        color: txt, padding: 14, fontSize: 15,
                        minHeight: 90, textAlignVertical: "top", lineHeight: 22,
                      }}
                    />
                  </View>

                  {/* Content type */}
                  <View>
                    <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                      What's inside
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {CONTENT_TYPES.map(ct => (
                        <TouchableOpacity key={ct.id}
                          onPress={() => {
                            if (ct.id === "video") { pickVideo(); return; }
                            if (ct.id === "photo") { pickPhoto(); return; }
                            if (ct.id === "voice") { Alert.alert("Coming soon", "Voice notes coming in next update."); return; }
                            setContentType(ct.id);
                          }}
                          style={{
                            flexDirection: "row", alignItems: "center", gap: 7,
                            paddingVertical: 10, paddingHorizontal: 13, borderRadius: 13,
                            borderWidth: 1.5,
                            borderColor: contentType === ct.id ? cfg.color : bdr,
                            backgroundColor: contentType === ct.id ? `${cfg.color}15` : bg2,
                          }}>
                          <Text style={{ fontSize: 16 }}>{ct.icon}</Text>
                          <View>
                            <Text style={{
                              color: contentType === ct.id ? cfg.color : txt,
                              fontWeight: "800", fontSize: 12,
                            }}>{ct.label}</Text>
                            <Text style={{ color: dim, fontSize: 9 }}>{ct.sub}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Content-specific inputs */}

                  {/* Video selected */}
                  {contentType === "video" && videoUri && (
                    <View style={{
                      padding: 14, borderRadius: 14, backgroundColor: `${cfg.color}10`,
                      borderWidth: 1.5, borderColor: `${cfg.color}40`,
                      flexDirection: "row", alignItems: "center", gap: 10,
                    }}>
                      <Text style={{ fontSize: 28 }}>🎥</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: cfg.color, fontWeight: "900", fontSize: 13 }}>Video ready</Text>
                        <Text style={{ color: dim, fontSize: 11, marginTop: 2 }}>
                          First 3 seconds plays in grid. Full video on catch.
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => { setVideoUri(null); setContentType(null); }}>
                        <Text style={{ color: dim, fontSize: 16 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Photo selected */}
                  {contentType === "photo" && photoUri && (
                    <View style={{
                      padding: 14, borderRadius: 14, backgroundColor: `${cfg.color}10`,
                      borderWidth: 1.5, borderColor: `${cfg.color}40`,
                      flexDirection: "row", alignItems: "center", gap: 10,
                    }}>
                      <Text style={{ fontSize: 28 }}>📸</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: cfg.color, fontWeight: "900", fontSize: 13 }}>Photo ready</Text>
                        <Text style={{ color: dim, fontSize: 11, marginTop: 2 }}>Shows in grid and on catch.</Text>
                      </View>
                      <TouchableOpacity onPress={() => { setPhotoUri(null); setContentType(null); }}>
                        <Text style={{ color: dim, fontSize: 16 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Coupon */}
                  {contentType === "coupon" && (
                    <View style={{ gap: 8 }}>
                      <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                        textTransform: "uppercase", letterSpacing: 1 }}>Coupon Code</Text>
                      <TextInput
                        value={couponCode} onChangeText={setCouponCode}
                        placeholder="SAVE20" placeholderTextColor={dim}
                        autoCapitalize="characters"
                        style={{
                          backgroundColor: bg2, borderRadius: 14,
                          borderWidth: 1, borderColor: `${cfg.color}40`,
                          color: cfg.color, padding: 16, fontSize: 24,
                          fontWeight: "900", letterSpacing: 4, textAlign: "center",
                        }}
                      />
                      <Text style={{ color: dim, fontSize: 11, textAlign: "center" }}>
                        Code reveals after catch
                      </Text>
                    </View>
                  )}

                  {/* Gift */}
                  {contentType === "gift" && (
                    <View style={{ gap: 12 }}>
                      <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                        textTransform: "uppercase", letterSpacing: 1 }}>Gift Amount</Text>
                      <View style={{
                        flexDirection: "row", alignItems: "center",
                        backgroundColor: bg2, borderRadius: 14,
                        borderWidth: 1, borderColor: "#F43F8E40", paddingHorizontal: 14,
                      }}>
                        <Text style={{ color: "#F43F8E", fontWeight: "900", fontSize: 24 }}>$</Text>
                        <TextInput
                          value={giftAmount} onChangeText={setGiftAmount}
                          placeholder="0.00" placeholderTextColor={dim}
                          keyboardType="decimal-pad"
                          style={{ flex: 1, color: txt, fontSize: 28, fontWeight: "900", padding: 14 }}
                        />
                      </View>
                      <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                        textTransform: "uppercase", letterSpacing: 1 }}>Accept via</Text>
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

                  {/* Link */}
                  {contentType === "link" && (
                    <View style={{ gap: 8 }}>
                      <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                        textTransform: "uppercase", letterSpacing: 1 }}>URL</Text>
                      <TextInput
                        value={linkUrl} onChangeText={setLinkUrl}
                        placeholder="https://..." placeholderTextColor={dim}
                        autoCapitalize="none" keyboardType="url"
                        style={{
                          backgroundColor: bg2, borderRadius: 14,
                          borderWidth: 1, borderColor: linkUrl ? `${cfg.color}50` : bdr,
                          color: txt, padding: 14, fontSize: 14,
                        }}
                      />
                    </View>
                  )}

                  {/* Message */}
                  {contentType === "message" && (
                    <View style={{ gap: 8 }}>
                      <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                        textTransform: "uppercase", letterSpacing: 1 }}>Message</Text>
                      <TextInput
                        value={revealText} onChangeText={setRevealText}
                        placeholder="Write something personal..."
                        placeholderTextColor={dim} multiline
                        style={{
                          backgroundColor: bg2, borderRadius: 14,
                          borderWidth: 1, borderColor: `${cfg.color}40`,
                          color: txt, padding: 14, fontSize: 15,
                          minHeight: 100, textAlignVertical: "top", lineHeight: 22,
                        }}
                      />
                    </View>
                  )}

                  {/* Next */}
                  <TouchableOpacity onPress={goStep2} style={{
                    backgroundColor: cfg.color, borderRadius: 16,
                    paddingVertical: 16, alignItems: "center",
                    shadowColor: cfg.color, shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4, shadowRadius: 12,
                  }}>
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Next →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ══════ STEP 2 ══════ */}
              {step === 2 && (
                <View style={{ gap: 20 }}>

                  {/* Summary */}
                  <View style={{
                    flexDirection: "row", alignItems: "center", gap: 10,
                    padding: 14, borderRadius: 14,
                    backgroundColor: `${cfg.color}15`, borderWidth: 1, borderColor: `${cfg.color}40`,
                  }}>
                    <Text style={{ fontSize: 20 }}>{cfg.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: cfg.color, fontWeight: "900", fontSize: 13 }}>
                        {cfg.label} · {contentType ? CONTENT_TYPES.find(c=>c.id===contentType)?.label : "No content"}
                      </Text>
                      <Text style={{ color: dim, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                        {message}
                      </Text>
                    </View>
                  </View>

                  {/* Audience */}
                  <View>
                    <Text style={{ color: muted, fontWeight: "900", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                      Who sees it
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {[
                        { id: "public",  icon: "🌐", label: "Everyone"        },
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
                      textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                      Expires in
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
                      {["m","h","d"].map(u => (
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
                        textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                        Catch limit
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
                          💰 Affiliate link
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
                        {monetizedUrl ? (
                          <Text style={{ color: "#22C55E", fontSize: 11, fontWeight: "800", marginTop: 4 }}>
                            ✓ Earns on every catch
                          </Text>
                        ) : null}
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

                  {/* Send */}
                  <TouchableOpacity onPress={handleSend} disabled={isSending}
                    style={{
                      backgroundColor: isSending ? bg2 : cfg.color,
                      borderRadius: 18, paddingVertical: 18, alignItems: "center",
                      shadowColor: cfg.color, shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: isSending ? 0 : 0.5, shadowRadius: 16, marginTop: 4,
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
