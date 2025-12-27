import React, { useEffect, useRef, useState } from "react";
import { Modal, View, Text, Pressable, Animated, Linking } from "react-native";
import { socket } from "./socket";

export default function CatchTailModal({ visible, tail, onClose, navigation }) {
  const [phase, setPhase] = useState("tease"); // tease | ready | caught | actions
  const glow = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (!visible) return;

    setPhase("tease");

    const t = setTimeout(() => setPhase("ready"), 800);

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();

    return () => clearTimeout(t);
  }, [visible]);

  if (!tail) return null;

  const catchIt = () => {
    setPhase("caught");

    Animated.sequence([
      Animated.spring(scale, { toValue: 1.05, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    socket.emit("catch-tail", { tailId: tail.id });

    setTimeout(() => setPhase("actions"), 500);
  };

  const continueBrowsing = () => {
    if (tail.url) Linking.openURL(tail.url);
  };

  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", padding: 20 }}>
        <Animated.View
          style={{
            backgroundColor: "#0b1220",
            borderRadius: 22,
            padding: 20,
            transform: [{ scale }],
          }}
        >
          <Pressable onPress={onClose} style={{ alignSelf: "flex-end" }}>
            <Text style={{ color: "#94a3b8", fontSize: 18 }}>✕</Text>
          </Pressable>

          <Animated.View
            style={{
              marginVertical: 30,
              alignItems: "center",
              opacity: glowOpacity,
            }}
          >
            {phase === "tease" && (
              <Text style={{ color: "#cbd5e1", fontSize: 18 }}>
                A tail is passing by…
              </Text>
            )}

            {phase === "ready" && (
              <Pressable onPress={catchIt}>
                <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>
                  🦊 Tap to Catch
                </Text>
              </Pressable>
            )}

            {phase === "caught" && (
              <Text style={{ color: "#86efac", fontSize: 24, fontWeight: "900" }}>
                You caught it!
              </Text>
            )}
          </Animated.View>

          {phase === "actions" && (
            <View style={{ alignItems: "center" }}>
              <Text
                numberOfLines={2}
                style={{ color: "white", fontSize: 16, fontWeight: "700", textAlign: "center" }}
              >
                {tail.title || tail.url}
              </Text>

              <Pressable
                onPress={continueBrowsing}
                style={{
                  marginTop: 18,
                  backgroundColor: "#22c55e",
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 999,
                }}
              >
                <Text style={{ color: "#052e16", fontWeight: "900" }}>
                  Continue Browsing
                </Text>
              </Pressable>

              <Pressable onPress={onClose} style={{ marginTop: 12 }}>
                <Text style={{ color: "#cbd5e1" }}>Back to chat</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
