// ============================================
// StorefrontOverlay.js — Cover for sent Tails
// ============================================
import React, { useRef, useState } from "react";
import {
  View, Text, Image, TouchableOpacity,
  Animated, StyleSheet, Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";

const { width: SW, height: SH } = Dimensions.get("window");

export default function StorefrontOverlay({
  coverUrl,
  username = "user",
  color = "#7C3AED",
  animation = "door",
  onCatch,
  children,
}) {
  const [caught, setCaught] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const handleCatch = () => {
    if (caught) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      setCaught(true);
      onCatch?.();
    });
  };

  // Already caught — show content
  if (caught) {
    return <View style={styles.container}>{children}</View>;
  }

  // Cover content
  const Cover = () => (
    coverUrl ? (
      <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
    ) : (
      <View style={styles.defaultCover}>
        <Text style={styles.emoji}>🦊</Text>
        <Text style={[styles.username, { color }]}>@{username}</Text>
        <Text style={styles.hint}>tap to catch</Text>
      </View>
    )
  );

  // Door animation
  if (animation === "door") {
    const leftDoor = {
      transform: [{
        translateX: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -SW / 2],
        }),
      }],
    };
    const rightDoor = {
      transform: [{
        translateX: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, SW / 2],
        }),
      }],
    };

    return (
      <View style={styles.container}>
        {/* Content underneath */}
        <View style={StyleSheet.absoluteFill}>{children}</View>

        {/* Left door */}
        <Animated.View style={[styles.doorHalf, styles.leftDoor, leftDoor]}>
          <View style={styles.doorInner}>
            <Cover />
          </View>
        </Animated.View>

        {/* Right door */}
        <Animated.View style={[styles.doorHalf, styles.rightDoor, rightDoor]}>
          <View style={[styles.doorInner, { alignItems: "flex-end" }]}>
            <Cover />
          </View>
        </Animated.View>

        {/* Catch button */}
        <TouchableOpacity style={styles.catchWrap} onPress={handleCatch} activeOpacity={0.9}>
          <View style={[styles.catchBtn, { backgroundColor: color }]}>
            <Text style={styles.catchText}>🎯 Catch</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Fade animation
  if (animation === "fade") {
    const fadeStyle = {
      opacity: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      }),
    };

    return (
      <View style={styles.container}>
        <View style={StyleSheet.absoluteFill}>{children}</View>
        <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
          <Cover />
        </Animated.View>
        <TouchableOpacity style={styles.catchWrap} onPress={handleCatch} activeOpacity={0.9}>
          <View style={[styles.catchBtn, { backgroundColor: color }]}>
            <Text style={styles.catchText}>🎯 Catch</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Slide up animation
  if (animation === "slide") {
    const slideStyle = {
      transform: [{
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -SH],
        }),
      }],
    };

    return (
      <View style={styles.container}>
        <View style={StyleSheet.absoluteFill}>{children}</View>
        <Animated.View style={[StyleSheet.absoluteFill, slideStyle]}>
          <Cover />
        </Animated.View>
        <TouchableOpacity style={styles.catchWrap} onPress={handleCatch} activeOpacity={0.9}>
          <View style={[styles.catchBtn, { backgroundColor: color }]}>
            <Text style={styles.catchText}>🎯 Catch</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Default — fade
  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>{children}</View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
        <Cover />
      </Animated.View>
      <TouchableOpacity style={styles.catchWrap} onPress={handleCatch} activeOpacity={0.9}>
        <View style={[styles.catchBtn, { backgroundColor: color }]}>
          <Text style={styles.catchText}>🎯 Catch</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  // Default cover
  defaultCover: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  emoji: {
    fontSize: 64,
  },
  username: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  hint: {
    fontSize: 12,
    color: "#444",
    fontWeight: "600",
    marginTop: 8,
  },
  // Door animation
  doorHalf: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SW / 2,
    overflow: "hidden",
  },
  leftDoor: {
    left: 0,
  },
  rightDoor: {
    right: 0,
  },
  doorInner: {
    width: SW,
    height: "100%",
  },
  // Catch button
  catchWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  catchBtn: {
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  catchText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
