// ============================================
// OnboardingScreen.js — v3 Beautiful
// ============================================
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, Dimensions,
  TextInput, Animated, Image, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const { width: SW, height: SH } = Dimensions.get("window");

const SLIDES = [
  {
    emoji: "🦊",
    title: "Catch Moments",
    subtitle: "Tails are time-limited drops — video, photos, codes, gifts. Catch them before they're gone.",
    color: "#7C3AED",
    accent: "#9F7AEA",
    bg1: "#0d0520",
    bg2: "#070312",
  },
  {
    emoji: "🎬",
    title: "Build Your Frame",
    subtitle: "Split your content across boxes. Lock one. Make people catch it to see what's inside.",
    color: "#F59E0B",
    accent: "#FCD34D",
    bg1: "#1a1000",
    bg2: "#0d0800",
  },
  {
    emoji: "⚡",
    title: "Drop & Expire",
    subtitle: "Limited spots. Real-time energy. First come, first catch. Every tail is a live event.",
    color: "#EF4444",
    accent: "#FCA5A5",
    bg1: "#1a0505",
    bg2: "#0d0303",
  },
  {
    emoji: "👥",
    title: "Build Your Audience",
    subtitle: "Follow creators. Get notified on drops. Build your following with every tail you send.",
    color: "#22C55E",
    accent: "#86EFAC",
    bg1: "#041a0a",
    bg2: "#020d05",
  },
];

function FloatingOrb({ color, size, delay, x, y }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 3000 + delay, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 3000 + delay, useNativeDriver: true }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.12, 0.28, 0.12] });
  return (
    <Animated.View style={{
      position: "absolute", left: x, top: y,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color,
      transform: [{ translateY }], opacity,
    }} />
  );
}

export default function OnboardingScreen({ onComplete, colors: C }) {
  const [phase, setPhase] = useState("slides");
  const [slideIndex, setSlideIndex] = useState(0);
  const [profileStep, setProfileStep] = useState(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [photoUri, setPhotoUri] = useState(null);
  const [usernameError, setUsernameError] = useState("");

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const slide = SLIDES[slideIndex];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 140 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    Animated.timing(progressAnim, {
      toValue: (slideIndex + 1) / SLIDES.length,
      duration: 400, useNativeDriver: false,
    }).start();
  }, [slideIndex]);

  const animateOut = (cb) => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 180, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      cb();
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 140 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  };

  const nextSlide = () => {
    if (slideIndex < SLIDES.length - 1) {
      animateOut(() => setSlideIndex(i => i + 1));
    } else {
      animateOut(() => setPhase("profile"));
    }
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!r.canceled && r.assets?.[0]) setPhotoUri(r.assets[0].uri);
  };

  const takeSelfie = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!r.canceled && r.assets?.[0]) setPhotoUri(r.assets[0].uri);
  };

  const handleUsernameNext = () => {
    const u = username.trim();
    if (!u) { setUsernameError("Username is required"); return; }
    if (u.length < 3) { setUsernameError("At least 3 characters"); return; }
    if (!/^[a-zA-Z0-9_.]+$/.test(u)) { setUsernameError("Letters, numbers, . and _ only"); return; }
    setUsernameError("");
    setProfileStep(2);
  };

  const handleComplete = () => {
    const emailTrimmed = email.trim();
    if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    onComplete?.({ username: username.trim().toLowerCase(), photoUri, email: emailTrimmed || null });
  };

  // ── SLIDES ──
  if (phase === "slides") {
    return (
      <View style={{ flex: 1, backgroundColor: slide.bg2, overflow: "hidden" }}>
        <FloatingOrb color={slide.color} size={220} delay={0} x={-50} y={-50} />
        <FloatingOrb color={slide.accent} size={150} delay={800} x={SW - 110} y={SH * 0.25} />
        <FloatingOrb color={slide.color} size={100} delay={400} x={SW * 0.2} y={SH * 0.65} />

        {/* Progress bar */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: "rgba(255,255,255,0.06)" }}>
          <Animated.View style={{
            height: 3, backgroundColor: slide.color,
            width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          }} />
        </View>

        {/* Skip */}
        <View style={{ paddingTop: 54, paddingHorizontal: 24, alignItems: "flex-end" }}>
          <TouchableOpacity onPress={() => animateOut(() => setPhase("profile"))}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.07)" }}>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontWeight: "800", fontSize: 13 }}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Animated.View style={{
          flex: 1, alignItems: "center", justifyContent: "center",
          paddingHorizontal: 36,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }}>
          <View style={{
            width: 150, height: 150, borderRadius: 75,
            backgroundColor: slide.color + "18",
            borderWidth: 2, borderColor: slide.color + "40",
            alignItems: "center", justifyContent: "center",
            marginBottom: 40,
            shadowColor: slide.color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6, shadowRadius: 40, elevation: 12,
          }}>
            <View style={{ position: "absolute", width: 110, height: 110, borderRadius: 55, backgroundColor: slide.color + "12" }} />
            <Text style={{ fontSize: 74 }}>{slide.emoji}</Text>
          </View>

          <View style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
            backgroundColor: slide.color + "20", marginBottom: 16,
          }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: slide.color }} />
            <Text style={{ color: slide.color, fontSize: 11, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase" }}>
              {slideIndex + 1} of {SLIDES.length}
            </Text>
          </View>

          <Text style={{
            color: "#fff", fontSize: 32, fontWeight: "900",
            textAlign: "center", marginBottom: 16, lineHeight: 38,
            letterSpacing: -0.5,
          }}>{slide.title}</Text>

          <Text style={{
            color: "rgba(255,255,255,0.5)", fontSize: 16,
            textAlign: "center", lineHeight: 26, maxWidth: 300,
          }}>{slide.subtitle}</Text>
        </Animated.View>

        {/* Bottom */}
        <View style={{ paddingHorizontal: 28, paddingBottom: 54, gap: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
            {SLIDES.map((s, i) => (
              <TouchableOpacity key={i} onPress={() => animateOut(() => setSlideIndex(i))}>
                <View style={{
                  height: 6, borderRadius: 3,
                  width: i === slideIndex ? 24 : 6,
                  backgroundColor: i === slideIndex ? slide.color : "rgba(255,255,255,0.12)",
                }} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={nextSlide} style={{
            backgroundColor: slide.color,
            borderRadius: 18, paddingVertical: 18, alignItems: "center",
            shadowColor: slide.color,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.55, shadowRadius: 22, elevation: 10,
          }}>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 17, letterSpacing: 0.3 }}>
              {slideIndex < SLIDES.length - 1 ? "Continue →" : "Let's Go 🦊"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── PROFILE SETUP ──
  const bg = C?.bg || "#070A0F";
  const txt = C?.text || "#E5E7EB";
  const muted = C?.muted || "#94A3B8";
  const dim = C?.dim || "#64748B";
  const bdr = C?.border || "#1E293B";
  const panel = C?.panel || "#0D1220";

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={{ paddingTop: 60, paddingHorizontal: 28, paddingBottom: 32, alignItems: "center" }}>
          <Text style={{ fontSize: 36 }}>🦊</Text>
          <Text style={{ color: txt, fontSize: 26, fontWeight: "900", marginTop: 14, textAlign: "center" }}>
            {profileStep === 1 ? "Pick your username" : profileStep === 2 ? "Add a profile photo" : "Add your email"}
          </Text>
          <Text style={{ color: muted, fontSize: 14, marginTop: 6, textAlign: "center", lineHeight: 20 }}>
            {profileStep === 1 ? "This is how people find and follow you"
              : profileStep === 2 ? "Put a face to your tails"
              : "Optional — for account recovery only"}
          </Text>
          {/* Step dots */}
          <View style={{ flexDirection: "row", gap: 6, marginTop: 20 }}>
            {[1, 2, 3].map(s => (
              <View key={s} style={{
                height: 5, borderRadius: 3,
                width: s === profileStep ? 22 : 5,
                backgroundColor: s <= profileStep ? "#7C3AED" : bdr,
              }} />
            ))}
          </View>
        </View>

        {/* ── Step 1: Username ── */}
        {profileStep === 1 && (
          <View style={{ paddingHorizontal: 28, gap: 14 }}>
            <View style={{
              flexDirection: "row", alignItems: "center",
              backgroundColor: panel, borderRadius: 16, borderWidth: 1.5,
              borderColor: usernameError ? "#EF4444" : username ? "#7C3AED" : bdr,
              paddingHorizontal: 16, height: 62,
            }}>
              <Text style={{ color: dim, fontSize: 22, fontWeight: "700", marginRight: 2 }}>@</Text>
              <TextInput
                value={username}
                onChangeText={t => { setUsername(t.toLowerCase().replace(/[^a-z0-9_.]/g, "")); setUsernameError(""); }}
                placeholder="yourname"
                placeholderTextColor={dim}
                autoCapitalize="none" autoCorrect={false} autoFocus
                style={{ flex: 1, color: txt, fontSize: 20, fontWeight: "700" }}
              />
              {username.length >= 3 && !usernameError && <Text style={{ fontSize: 18 }}>✅</Text>}
            </View>

            {usernameError ? (
              <Text style={{ color: "#EF4444", fontSize: 12, fontWeight: "700" }}>{usernameError}</Text>
            ) : username.length > 0 && username.length < 3 ? (
              <Text style={{ color: dim, fontSize: 12 }}>{3 - username.length} more characters needed</Text>
            ) : username.length >= 3 ? (
              <Text style={{ color: "#22C55E", fontSize: 13, fontWeight: "700" }}>@{username} looks great!</Text>
            ) : null}

            <Text style={{ color: dim, fontSize: 12, lineHeight: 18 }}>
              Letters, numbers, periods and underscores only. You can change this later.
            </Text>

            <TouchableOpacity onPress={handleUsernameNext} style={{
              backgroundColor: username.length >= 3 && !usernameError ? "#7C3AED" : bdr,
              borderRadius: 16, paddingVertical: 17, alignItems: "center", marginTop: 8,
              shadowColor: "#7C3AED",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: username.length >= 3 ? 0.4 : 0,
              shadowRadius: 14,
            }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Continue →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: Photo ── */}
        {profileStep === 2 && (
          <View style={{ paddingHorizontal: 28, gap: 16, alignItems: "center" }}>
            <TouchableOpacity onPress={pickPhoto} style={{
              width: 130, height: 130, borderRadius: 65,
              backgroundColor: panel,
              borderWidth: 3, borderColor: photoUri ? "#7C3AED" : bdr,
              alignItems: "center", justifyContent: "center",
              overflow: "hidden",
              shadowColor: "#7C3AED",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: photoUri ? 0.5 : 0,
              shadowRadius: 24,
            }}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={{ width: 130, height: 130 }} resizeMode="cover" />
              ) : (
                <View style={{ alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 40 }}>🤳</Text>
                  <Text style={{ color: dim, fontSize: 10, fontWeight: "800", letterSpacing: 1 }}>TAP TO ADD</Text>
                </View>
              )}
            </TouchableOpacity>

            {photoUri && <Text style={{ color: "#22C55E", fontSize: 14, fontWeight: "800" }}>Looking good! ✨</Text>}

            <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
              <TouchableOpacity onPress={pickPhoto} style={{
                flex: 1, padding: 16, borderRadius: 14,
                backgroundColor: panel, borderWidth: 1, borderColor: bdr,
                alignItems: "center", gap: 6,
              }}>
                <Text style={{ fontSize: 26 }}>🖼</Text>
                <Text style={{ color: muted, fontSize: 12, fontWeight: "800" }}>Library</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={takeSelfie} style={{
                flex: 1, padding: 16, borderRadius: 14,
                backgroundColor: panel, borderWidth: 1, borderColor: bdr,
                alignItems: "center", gap: 6,
              }}>
                <Text style={{ fontSize: 26 }}>📸</Text>
                <Text style={{ color: muted, fontSize: 12, fontWeight: "800" }}>Camera</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setProfileStep(3)} style={{
              backgroundColor: "#7C3AED", borderRadius: 16, paddingVertical: 17,
              alignItems: "center", width: "100%", marginTop: 8,
              shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4, shadowRadius: 14,
            }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
                {photoUri ? "Continue →" : "Skip for now →"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 3: Email ── */}
        {profileStep === 3 && (
          <View style={{ paddingHorizontal: 28, gap: 14 }}>
            <View style={{
              backgroundColor: panel, borderRadius: 16, borderWidth: 1.5,
              borderColor: email ? "#7C3AED" : bdr,
              paddingHorizontal: 16, height: 62, justifyContent: "center",
            }}>
              <TextInput
                value={email} onChangeText={setEmail}
                placeholder="your@email.com" placeholderTextColor={dim}
                autoCapitalize="none" autoCorrect={false}
                keyboardType="email-address" autoFocus
                style={{ color: txt, fontSize: 16 }}
              />
            </View>

            <Text style={{ color: dim, fontSize: 12, lineHeight: 18 }}>
              Optional — used for account recovery only. We never spam or share your email.
            </Text>

            {/* Summary */}
            <View style={{
              padding: 16, borderRadius: 16,
              backgroundColor: "rgba(124,58,237,0.08)",
              borderWidth: 1, borderColor: "rgba(124,58,237,0.2)",
              gap: 12, marginTop: 4,
            }}>
              <Text style={{ color: muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" }}>Your Profile</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: "#7C3AED" }} />
                ) : (
                  <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 20 }}>{username[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <View>
                  <Text style={{ color: txt, fontWeight: "900", fontSize: 17 }}>@{username}</Text>
                  <Text style={{ color: dim, fontSize: 12, marginTop: 2 }}>Ready to catch tails 🦊</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={handleComplete} style={{
              backgroundColor: "#7C3AED", borderRadius: 16, paddingVertical: 18,
              alignItems: "center", marginTop: 4,
              shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
            }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 17 }}>🦊 Enter Tail Me</Text>
            </TouchableOpacity>

            {!email && (
              <TouchableOpacity onPress={handleComplete} style={{ alignItems: "center", paddingVertical: 8 }}>
                <Text style={{ color: dim, fontSize: 13 }}>Skip email for now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}