// ============================================================
// OnboardingScreen.js — Tail Me v7
// Screen 1: What is a Tail (auto-advance)
// Screen 2: Catch a demo tail (interactive)
// Screen 3: Pick interests (required, min 2)
// Screen 4: Send first tail / skip
// ============================================================
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, Animated,
  Dimensions, ScrollView, StyleSheet, Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width: SW, height: SH } = Dimensions.get("window");

const CATEGORIES = [
  { id: "business",  label: "Business",  icon: "💼" },
  { id: "travel",    label: "Travel",    icon: "✈️" },
  { id: "food",      label: "Food",      icon: "🍕" },
  { id: "shopping",  label: "Shopping",  icon: "🛍️" },
  { id: "parties",   label: "Parties",   icon: "🎉" },
  { id: "fitness",   label: "Fitness",   icon: "💪" },
  { id: "music",     label: "Music",     icon: "🎵" },
  { id: "sports",    label: "Sports",    icon: "⚽" },
  { id: "gaming",    label: "Gaming",    icon: "🎮" },
  { id: "tech",      label: "Tech",      icon: "💻" },
  { id: "fashion",   label: "Fashion",   icon: "👗" },
  { id: "deals",     label: "Deals",     icon: "🏷️" },
];

const TYPE_CONFIG = {
  NOW:   { color: "#F59E0B", icon: "⚡", gradient: ["#2a1a00","#1a1000"] },
  DROP:  { color: "#EF4444", icon: "💧", gradient: ["#2a0a0a","#1a0505"] },
  LOOK:  { color: "#7C3AED", icon: "👀", gradient: ["#0d0520","#070312"] },
};

// ── Demo tail card for screen 2 ──────────────────────────────
const DemoTailCard = ({ tail, onCatch, caught }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const cfg = TYPE_CONFIG[tail.type] || TYPE_CONFIG.LOOK;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true, speed: 30 }),
      Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true, speed: 20 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
    onCatch(tail);
  };

  const borderOpacity = glowAnim.interpolate({ inputRange: [0,1], outputRange: [0.3, 1] });

  return (
    <TouchableOpacity onPress={handlePress} disabled={caught} activeOpacity={0.9}>
      <Animated.View style={{
        transform: [{ scale: scaleAnim }],
        width: (SW - 80) / 3,
        height: (SW - 80) / 3,
        borderRadius: 14,
        backgroundColor: cfg.gradient[0],
        borderWidth: 1.5,
        borderColor: caught ? "#22C55E" : cfg.color,
        padding: 8,
        justifyContent: "space-between",
        overflow: "hidden",
        opacity: caught ? 0.5 : 1,
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5,
            backgroundColor: `${cfg.color}25` }}>
            <Text style={{ fontSize: 8, fontWeight: "900", color: cfg.color }}>
              {tail.type}
            </Text>
          </View>
          <Text style={{ fontSize: 16 }}>{caught ? "✓" : cfg.icon}</Text>
        </View>
        <Text style={{ fontSize: 9, fontWeight: "800", color: "#94A3B8" }}>
          @{tail.from}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ── Reveal popup for caught demo tail ────────────────────────
const DemoReveal = ({ tail, onDismiss }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const cfg = TYPE_CONFIG[tail?.type] || TYPE_CONFIG.LOOK;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1, useNativeDriver: true,
      damping: 15, stiffness: 200,
    }).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)",
        alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Animated.View style={{
          transform: [{ scale: scaleAnim }],
          backgroundColor: "#0D1220",
          borderRadius: 24, padding: 24, width: "100%",
          borderWidth: 1.5, borderColor: `${cfg.color}60`,
          alignItems: "center", gap: 12,
        }}>
          <Text style={{ fontSize: 48 }}>🎉</Text>
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 20 }}>
            You caught it!
          </Text>
          <View style={{ paddingHorizontal: 16, paddingVertical: 10,
            borderRadius: 12, backgroundColor: `${cfg.color}15`,
            borderWidth: 1, borderColor: `${cfg.color}30`, alignItems: "center" }}>
            {tail.reveal.kind === "coupon" ? (
              <>
                <Text style={{ color: "#94A3B8", fontSize: 11, marginBottom: 4 }}>COUPON CODE</Text>
                <Text style={{ color: cfg.color, fontSize: 22, fontWeight: "900", letterSpacing: 3 }}>
                  {tail.reveal.code}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ color: "#94A3B8", fontSize: 11, marginBottom: 4 }}>EXCLUSIVE LINK</Text>
                <Text style={{ color: cfg.color, fontSize: 14, fontWeight: "800" }}>
                  🔗 Deal unlocked!
                </Text>
              </>
            )}
          </View>
          <Text style={{ color: "#64748B", fontSize: 12, textAlign: "center" }}>
            This is what catching a tail feels like.{"\n"}Now you know.
          </Text>
          <TouchableOpacity onPress={onDismiss} style={{
            backgroundColor: cfg.color, borderRadius: 14,
            paddingVertical: 12, paddingHorizontal: 24, marginTop: 4,
          }}>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}>
              Got it! →
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

// ── Main Onboarding ──────────────────────────────────────────
export default function OnboardingScreen({ onComplete, onOpenComposer, colors: C }) {
  const [step, setStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [caughtTails, setCaughtTails] = useState([]);
  const [revealTail, setRevealTail] = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const DEMO_TAILS = [
    { id: "d1", type: "DROP", from: "nike_drops",
      reveal: { kind: "coupon", code: "NIKE40" } },
    { id: "d2", type: "NOW",  from: "sara_eats",
      reveal: { kind: "url" } },
    { id: "d3", type: "LOOK", from: "techdeals_",
      reveal: { kind: "coupon", code: "TECH20" } },
  ];

  // Screen 1 auto-advances after 3s
  useEffect(() => {
    if (step === 0) {
      const t = setTimeout(() => goToStep(1), 3000);
      return () => clearTimeout(t);
    }
  }, [step]);

  const goToStep = (next) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setStep(next), 150);
  };

  const handleCatchDemo = (tail) => {
    if (caughtTails.includes(tail.id)) return;
    setCaughtTails(prev => [...prev, tail.id]);
    setRevealTail(tail);
  };

  const toggleInterest = (id) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    onComplete(selectedInterests);
  };

  // Progress dots
  const ProgressDots = () => (
    <View style={{ flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 32 }}>
      {[0,1,2,3].map(i => (
        <View key={i} style={{
          width: i === step ? 20 : 6, height: 6, borderRadius: 3,
          backgroundColor: i === step ? "#7C3AED" : "#1E293B",
          transition: "width 0.3s",
        }} />
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#070A0F" }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>

        {/* ── Screen 0: What is a Tail ── */}
        {step === 0 && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
            <Animated.Text style={{ fontSize: 80, marginBottom: 24 }}>
              🦊
            </Animated.Text>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 32,
              textAlign: "center", marginBottom: 16, letterSpacing: -1 }}>
              Catch moments.{"\n"}Don't scroll.
            </Text>
            <Text style={{ color: "#64748B", fontSize: 16, textAlign: "center", lineHeight: 24 }}>
              Tails are deals, gifts, and secrets{"\n"}
              hidden inside. Catch them before{"\n"}
              they're gone.
            </Text>
            <View style={{ position: "absolute", bottom: 60,
              flexDirection: "row", gap: 6 }}>
              {[0,1,2,3].map(i => (
                <View key={i} style={{
                  width: i === 0 ? 20 : 6, height: 6, borderRadius: 3,
                  backgroundColor: i === 0 ? "#7C3AED" : "#1E293B",
                }} />
              ))}
            </View>
            <TouchableOpacity
              onPress={() => goToStep(1)}
              style={{ position: "absolute", bottom: 48, right: 32 }}>
              <Text style={{ color: "#64748B", fontSize: 13 }}>Skip →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Screen 1: Catch a demo tail ── */}
        {step === 1 && (
          <View style={{ flex: 1, padding: 24 }}>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={{ color: "#64748B", fontSize: 13, fontWeight: "800",
                textTransform: "uppercase", letterSpacing: 2, marginBottom: 8,
                textAlign: "center" }}>
                Step 1
              </Text>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 28,
                textAlign: "center", marginBottom: 8, letterSpacing: -0.5 }}>
                Tails just landed 👇
              </Text>
              <Text style={{ color: "#64748B", fontSize: 15, textAlign: "center",
                marginBottom: 40, lineHeight: 22 }}>
                Tap any tail to catch it.{"\n"}
                Something is hidden inside each one.
              </Text>

              {/* Demo grid */}
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 40 }}>
                {DEMO_TAILS.map(tail => (
                  <DemoTailCard
                    key={tail.id}
                    tail={tail}
                    onCatch={handleCatchDemo}
                    caught={caughtTails.includes(tail.id)}
                  />
                ))}
              </View>

              {caughtTails.length > 0 && (
                <TouchableOpacity
                  onPress={() => goToStep(2)}
                  style={{
                    backgroundColor: "#7C3AED", borderRadius: 16,
                    paddingVertical: 16, alignItems: "center",
                    shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4, shadowRadius: 12,
                  }}>
                  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
                    Next — Pick your interests →
                  </Text>
                </TouchableOpacity>
              )}

              {caughtTails.length === 0 && (
                <Text style={{ color: "#1E293B", textAlign: "center", fontSize: 13 }}>
                  Catch at least one tail to continue
                </Text>
              )}
            </View>

            <ProgressDots />
          </View>
        )}

        {/* ── Screen 2: Pick interests ── */}
        {step === 2 && (
          <View style={{ flex: 1 }}>
            <View style={{ padding: 24, paddingBottom: 0 }}>
              <Text style={{ color: "#64748B", fontSize: 13, fontWeight: "800",
                textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
                Step 2
              </Text>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 28,
                marginBottom: 6, letterSpacing: -0.5 }}>
                What are you into?
              </Text>
              <Text style={{ color: "#64748B", fontSize: 15, marginBottom: 20, lineHeight: 22 }}>
                Pick at least 2. We'll fill your feed{"\n"}
                with tails you actually want.
              </Text>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {CATEGORIES.map(cat => {
                  const selected = selectedInterests.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => toggleInterest(cat.id)}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 8,
                        paddingVertical: 10, paddingHorizontal: 14,
                        borderRadius: 14, borderWidth: 1.5,
                        borderColor: selected ? "#7C3AED" : "#1E293B",
                        backgroundColor: selected ? "rgba(124,58,237,0.15)" : "#0D1220",
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                      <Text style={{ color: selected ? "#fff" : "#64748B",
                        fontWeight: "800", fontSize: 13 }}>
                        {cat.label}
                      </Text>
                      {selected && (
                        <View style={{ width: 16, height: 16, borderRadius: 8,
                          backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ color: "#fff", fontSize: 9, fontWeight: "900" }}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Fixed bottom button */}
            <View style={{ position: "absolute", bottom: 0, left: 0, right: 0,
              padding: 24, backgroundColor: "#070A0F",
              borderTopWidth: 1, borderTopColor: "#1E293B" }}>
              <ProgressDots />
              <TouchableOpacity
                onPress={() => goToStep(3)}
                disabled={selectedInterests.length < 2}
                style={{
                  backgroundColor: selectedInterests.length >= 2 ? "#7C3AED" : "#1E293B",
                  borderRadius: 16, paddingVertical: 16, alignItems: "center",
                  shadowColor: "#7C3AED",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: selectedInterests.length >= 2 ? 0.4 : 0,
                  shadowRadius: 12,
                }}>
                <Text style={{ color: selectedInterests.length >= 2 ? "#fff" : "#64748B",
                  fontWeight: "900", fontSize: 16 }}>
                  {selectedInterests.length < 2
                    ? `Pick ${2 - selectedInterests.length} more`
                    : `Let's go — ${selectedInterests.length} selected ✓`
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Screen 3: Send first tail ── */}
        {step === 3 && (
          <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
            <Text style={{ color: "#64748B", fontSize: 13, fontWeight: "800",
              textTransform: "uppercase", letterSpacing: 2, marginBottom: 8,
              textAlign: "center" }}>
              You're ready
            </Text>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 28,
              textAlign: "center", marginBottom: 8, letterSpacing: -0.5 }}>
              Now your turn 🎯
            </Text>
            <Text style={{ color: "#64748B", fontSize: 15, textAlign: "center",
              marginBottom: 48, lineHeight: 22 }}>
              Send a tail to someone.{"\n"}
              They won't know what's inside{"\n"}
              until they catch it.
            </Text>

            {/* What you can hide */}
            <View style={{ gap: 10, marginBottom: 40 }}>
              {[
                { icon: "🔗", label: "A link",       desc: "Article, product, anything" },
                { icon: "💰", label: "A gift",        desc: "Money, gift card, treat" },
                { icon: "🎟", label: "A coupon code", desc: "Exclusive discount" },
                { icon: "🗣", label: "A voice note",  desc: "Personal message" },
              ].map(item => (
                <View key={item.icon} style={{
                  flexDirection: "row", alignItems: "center", gap: 12,
                  padding: 14, borderRadius: 14, backgroundColor: "#0D1220",
                  borderWidth: 1, borderColor: "#1E293B",
                }}>
                  <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                  <View>
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>{item.label}</Text>
                    <Text style={{ color: "#64748B", fontSize: 12 }}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => { handleComplete(); onOpenComposer?.(); }}
              style={{
                backgroundColor: "#7C3AED", borderRadius: 16,
                paddingVertical: 16, alignItems: "center", marginBottom: 12,
                shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4, shadowRadius: 12,
              }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
                🦊 Send my first Tail
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleComplete} style={{ alignItems: "center", padding: 12 }}>
              <Text style={{ color: "#64748B", fontSize: 14 }}>Skip for now</Text>
            </TouchableOpacity>

            <ProgressDots />
          </View>
        )}

      </Animated.View>

      {/* Demo reveal popup */}
      {revealTail && (
        <DemoReveal
          tail={revealTail}
          onDismiss={() => setRevealTail(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({});
