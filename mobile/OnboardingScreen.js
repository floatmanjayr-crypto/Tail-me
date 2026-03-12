// ============================================
// OnboardingScreen.js — 3-Step Onboarding
// ============================================
import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, Dimensions,
  FlatList, Animated,
} from "react-native";

const { width: SW } = Dimensions.get("window");

const STEPS = [
  {
    emoji: "🦊",
    title: "Welcome to Tail Me",
    subtitle: "Drop links, moments & content as \"tails\" — others catch them before they expire",
    color: "#7C3AED",
  },
  {
    emoji: "⚡",
    title: "Create & Catch",
    subtitle: "Send tails with timers, catch limits & reveal layers. Every tail is a micro-event",
    color: "#F59E0B",
  },
  {
    emoji: "👥",
    title: "Follow Creators",
    subtitle: "Follow people to see their tails first. Build your feed. Build your audience",
    color: "#22C55E",
  },
];

export default function OnboardingScreen({ onComplete, colors: C }) {
  const [step, setStep] = useState(0);
  const flatRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    if (step < STEPS.length - 1) {
      const next = step + 1;
      setStep(next);
      flatRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      onComplete?.();
    }
  };

  const goSkip = () => {
    onComplete?.();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Skip */}
      <View style={{ flexDirection: "row", justifyContent: "flex-end", padding: 16, paddingTop: 20 }}>
        <TouchableOpacity onPress={goSkip}>
          <Text style={{ color: C.dim, fontWeight: "800", fontSize: 14 }}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Cards */}
      <FlatList
        ref={flatRef}
        data={STEPS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        keyExtractor={(_, i) => `step-${i}`}
        renderItem={({ item }) => (
          <View style={{
            width: SW, justifyContent: "center", alignItems: "center",
            paddingHorizontal: 40, paddingBottom: 60,
          }}>
            <View style={{
              width: 120, height: 120, borderRadius: 60,
              backgroundColor: item.color + "18",
              alignItems: "center", justifyContent: "center",
              borderWidth: 3, borderColor: item.color + "40",
              marginBottom: 30,
            }}>
              <Text style={{ fontSize: 56 }}>{item.emoji}</Text>
            </View>
            <Text style={{
              color: C.text, fontWeight: "900", fontSize: 26,
              textAlign: "center", marginBottom: 14, letterSpacing: -0.5,
            }}>
              {item.title}
            </Text>
            <Text style={{
              color: C.muted, fontSize: 16, textAlign: "center",
              lineHeight: 24, fontWeight: "500",
            }}>
              {item.subtitle}
            </Text>
          </View>
        )}
      />

      {/* Dots + Button */}
      <View style={{ paddingHorizontal: 30, paddingBottom: 50, gap: 20 }}>
        {/* Dots */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
          {STEPS.map((s, i) => (
            <View key={i} style={{
              width: step === i ? 24 : 8, height: 8,
              borderRadius: 4,
              backgroundColor: step === i ? s.color : C.border,
            }} />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity
          onPress={goNext}
          style={{
            backgroundColor: STEPS[step].color,
            paddingVertical: 16, borderRadius: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 17 }}>
            {step === STEPS.length - 1 ? "Let's Go! 🚀" : "Next →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
