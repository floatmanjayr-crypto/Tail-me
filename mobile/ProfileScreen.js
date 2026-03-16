// ============================================
// ProfileSetupScreen.js — New User Setup
// Step 1: Username
// Step 2: Profile Photo
// Step 3: Email
// ============================================
import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, Dimensions,
  TextInput, Animated, Image, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const { width: SW, height: SH } = Dimensions.get("window");

export default function ProfileSetupScreen({ onComplete, colors: C }) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [photoUri, setPhotoUri] = useState(null);
  const [usernameError, setUsernameError] = useState("");

  const slideAnim = useRef(new Animated.Value(0)).current;

  const bg = C?.bg || "#070A0F";
  const txt = C?.text || "#E5E7EB";
  const muted = C?.muted || "#94A3B8";
  const dim = C?.dim || "#64748B";
  const bdr = C?.border || "#1E293B";
  const panel = C?.panel || "#0D1220";

  const animateNext = (cb) => {
    Animated.timing(slideAnim, { toValue: -SW, duration: 220, useNativeDriver: true }).start(() => {
      cb();
      slideAnim.setValue(SW);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
    });
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!r.canceled && r.assets?.[0]) setPhotoUri(r.assets[0].uri);
  };

  const takeSelfie = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!r.canceled && r.assets?.[0]) setPhotoUri(r.assets[0].uri);
  };

  const handleUsernameNext = () => {
    const u = username.trim();
    if (!u) { setUsernameError("Username is required"); return; }
    if (u.length < 3) { setUsernameError("At least 3 characters"); return; }
    if (!/^[a-zA-Z0-9_.]+$/.test(u)) { setUsernameError("Letters, numbers, . and _ only"); return; }
    setUsernameError("");
    animateNext(() => setStep(2));
  };

  const handleComplete = () => {
    const emailTrimmed = email.trim();
    if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    onComplete?.({
      username: username.trim().toLowerCase(),
      photoUri,
      email: emailTrimmed || null,
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>

      {/* Background glow */}
      <View style={{
        position: "absolute", top: -100, left: -100,
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: "rgba(124,58,237,0.06)",
      }} />
      <View style={{
        position: "absolute", bottom: -80, right: -80,
        width: 250, height: 250, borderRadius: 125,
        backgroundColor: "rgba(245,158,11,0.05)",
      }} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingTop: 64, paddingHorizontal: 28, paddingBottom: 36, alignItems: "center" }}>
          {/* App logo */}
          <View style={{
            width: 64, height: 64, borderRadius: 20,
            backgroundColor: "rgba(124,58,237,0.15)",
            borderWidth: 1.5, borderColor: "rgba(124,58,237,0.3)",
            alignItems: "center", justifyContent: "center",
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 34 }}>🦊</Text>
          </View>

          <Text style={{ color: txt, fontSize: 26, fontWeight: "900", textAlign: "center", letterSpacing: -0.5 }}>
            {step === 1 ? "Create your profile" : step === 2 ? "Add a photo" : "Last step"}
          </Text>
          <Text style={{ color: muted, fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 22 }}>
            {step === 1 ? "Pick a username — this is how people find you"
              : step === 2 ? "Put a face to your tails"
              : "Add your email for account recovery"}
          </Text>

          {/* Step indicator */}
          <View style={{ flexDirection: "row", gap: 6, marginTop: 24 }}>
            {[1, 2, 3].map(s => (
              <View key={s} style={{
                height: 5, borderRadius: 3,
                width: s === step ? 24 : 5,
                backgroundColor: s < step ? "#7C3AED" : s === step ? "#7C3AED" : bdr,
                opacity: s < step ? 0.4 : 1,
              }} />
            ))}
          </View>
        </View>

        {/* ── Step content ── */}
        <Animated.View style={{
          paddingHorizontal: 28,
          transform: [{ translateX: slideAnim }],
        }}>

          {/* ── STEP 1: Username ── */}
          {step === 1 && (
            <View style={{ gap: 14 }}>
              {/* Input */}
              <View style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: panel, borderRadius: 16, borderWidth: 1.5,
                borderColor: usernameError ? "#EF4444" : username.length >= 3 ? "#7C3AED" : bdr,
                paddingHorizontal: 16, height: 64,
              }}>
                <Text style={{ color: dim, fontSize: 24, fontWeight: "700", marginRight: 2 }}>@</Text>
                <TextInput
                  value={username}
                  onChangeText={t => {
                    setUsername(t.toLowerCase().replace(/[^a-z0-9_.]/g, ""));
                    setUsernameError("");
                  }}
                  placeholder="yourname"
                  placeholderTextColor={dim}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  style={{ flex: 1, color: txt, fontSize: 22, fontWeight: "700" }}
                />
                {username.length >= 3 && !usernameError && (
                  <Text style={{ fontSize: 20 }}>✅</Text>
                )}
              </View>

              {/* Feedback */}
              {usernameError ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 14 }}>⚠️</Text>
                  <Text style={{ color: "#EF4444", fontSize: 13, fontWeight: "700" }}>{usernameError}</Text>
                </View>
              ) : username.length > 0 && username.length < 3 ? (
                <Text style={{ color: dim, fontSize: 13 }}>{3 - username.length} more characters needed</Text>
              ) : username.length >= 3 ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 14 }}>✨</Text>
                  <Text style={{ color: "#22C55E", fontSize: 13, fontWeight: "800" }}>@{username} is available!</Text>
                </View>
              ) : null}

              <Text style={{ color: dim, fontSize: 12, lineHeight: 18 }}>
                Letters, numbers, periods and underscores only. You can change this later in settings.
              </Text>

              {/* Continue button */}
              <TouchableOpacity
                onPress={handleUsernameNext}
                style={{
                  backgroundColor: username.length >= 3 && !usernameError ? "#7C3AED" : bdr,
                  borderRadius: 16, paddingVertical: 18, alignItems: "center", marginTop: 8,
                  shadowColor: "#7C3AED",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: username.length >= 3 ? 0.45 : 0,
                  shadowRadius: 16,
                }}>
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Continue →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2: Photo ── */}
          {step === 2 && (
            <View style={{ gap: 16, alignItems: "center" }}>
              {/* Avatar */}
              <TouchableOpacity onPress={pickPhoto} style={{
                width: 140, height: 140, borderRadius: 70,
                backgroundColor: panel,
                borderWidth: 3,
                borderColor: photoUri ? "#7C3AED" : bdr,
                borderStyle: photoUri ? "solid" : "dashed",
                alignItems: "center", justifyContent: "center",
                overflow: "hidden",
                shadowColor: "#7C3AED",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: photoUri ? 0.6 : 0,
                shadowRadius: 28,
              }}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={{ width: 140, height: 140 }} resizeMode="cover" />
                ) : (
                  <View style={{ alignItems: "center", gap: 8 }}>
                    <Text style={{ fontSize: 44 }}>🤳</Text>
                    <Text style={{ color: dim, fontSize: 10, fontWeight: "900", letterSpacing: 1 }}>TAP TO ADD</Text>
                  </View>
                )}
              </TouchableOpacity>

              {photoUri ? (
                <View style={{ alignItems: "center", gap: 4 }}>
                  <Text style={{ color: "#22C55E", fontSize: 15, fontWeight: "900" }}>Looking good! ✨</Text>
                  <TouchableOpacity onPress={() => setPhotoUri(null)}>
                    <Text style={{ color: dim, fontSize: 12 }}>Remove photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={{ color: dim, fontSize: 13, textAlign: "center" }}>
                  Your profile photo helps people recognize you
                </Text>
              )}

              {/* Options */}
              <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
                <TouchableOpacity onPress={pickPhoto} style={{
                  flex: 1, padding: 18, borderRadius: 16,
                  backgroundColor: panel, borderWidth: 1, borderColor: bdr,
                  alignItems: "center", gap: 8,
                }}>
                  <Text style={{ fontSize: 28 }}>🖼</Text>
                  <Text style={{ color: muted, fontSize: 13, fontWeight: "800" }}>Library</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={takeSelfie} style={{
                  flex: 1, padding: 18, borderRadius: 16,
                  backgroundColor: panel, borderWidth: 1, borderColor: bdr,
                  alignItems: "center", gap: 8,
                }}>
                  <Text style={{ fontSize: 28 }}>📸</Text>
                  <Text style={{ color: muted, fontSize: 13, fontWeight: "800" }}>Camera</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => animateNext(() => setStep(3))}
                style={{
                  backgroundColor: "#7C3AED",
                  borderRadius: 16, paddingVertical: 18,
                  alignItems: "center", width: "100%",
                  shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.45, shadowRadius: 16,
                }}>
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
                  {photoUri ? "Continue →" : "Skip for now →"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 3: Email ── */}
          {step === 3 && (
            <View style={{ gap: 14 }}>
              {/* Input */}
              <View style={{
                backgroundColor: panel, borderRadius: 16, borderWidth: 1.5,
                borderColor: email ? "#7C3AED" : bdr,
                paddingHorizontal: 16, height: 64, justifyContent: "center",
              }}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={dim}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoFocus
                  style={{ color: txt, fontSize: 16 }}
                />
              </View>

              <Text style={{ color: dim, fontSize: 12, lineHeight: 18 }}>
                Optional — used for account recovery only. We never spam or share your email.
              </Text>

              {/* Profile summary card */}
              <View style={{
                padding: 18, borderRadius: 18,
                backgroundColor: "rgba(124,58,237,0.07)",
                borderWidth: 1.5, borderColor: "rgba(124,58,237,0.2)",
                gap: 14, marginTop: 6,
              }}>
                <Text style={{ color: muted, fontSize: 10, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase" }}>
                  Your Profile
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={{
                      width: 52, height: 52, borderRadius: 26,
                      borderWidth: 2, borderColor: "#7C3AED",
                    }} />
                  ) : (
                    <View style={{
                      width: 52, height: 52, borderRadius: 26,
                      backgroundColor: "#7C3AED",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <Text style={{ color: "#fff", fontWeight: "900", fontSize: 22 }}>
                        {username[0]?.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: txt, fontWeight: "900", fontSize: 18 }}>@{username}</Text>
                    <Text style={{ color: dim, fontSize: 13, marginTop: 3 }}>Ready to catch tails 🦊</Text>
                  </View>
                  <View style={{
                    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
                    backgroundColor: "rgba(34,197,94,0.12)",
                    borderWidth: 1, borderColor: "rgba(34,197,94,0.3)",
                  }}>
                    <Text style={{ color: "#22C55E", fontSize: 10, fontWeight: "900" }}>✓ READY</Text>
                  </View>
                </View>
              </View>

              {/* Enter button */}
              <TouchableOpacity
                onPress={handleComplete}
                style={{
                  backgroundColor: "#7C3AED",
                  borderRadius: 18, paddingVertical: 20,
                  alignItems: "center", marginTop: 4,
                  shadowColor: "#7C3AED",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.55, shadowRadius: 20,
                  elevation: 10,
                }}>
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
                  🦊 Enter Tail Me
                </Text>
              </TouchableOpacity>

              {!email && (
                <TouchableOpacity onPress={handleComplete} style={{ alignItems: "center", paddingVertical: 8 }}>
                  <Text style={{ color: dim, fontSize: 14 }}>Skip email for now</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}