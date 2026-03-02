// ============================================
// TailHome.js - Premium Visual Design
// ============================================

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  RefreshControl,
  PanResponder,
  ImageBackground,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Time ago helper - Fixed
const timeAgo = (timestamp) => {
  if (!timestamp) return "now";
  const now = Date.now();
  const diff = now - timestamp;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
};

// Time left helper
const timeLeft = (expiresAt) => {
  if (!expiresAt) return null;
  const now = Date.now();
  const diff = expiresAt - now;
  if (diff <= 0) return "Expired";
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs > 24) return `${Math.floor(hrs / 24)}d left`;
  if (hrs > 0) return `${hrs}h ${mins}m left`;
  return `${mins}m left`;
};

// Get gradient colors based on tail type
const getTypeGradient = (tailType) => {
  switch (tailType) {
    case "NOW":
      return ["#F59E0B", "#D97706", "#B45309"];
    case "DROP":
      return ["#8B5CF6", "#7C3AED", "#6D28D9"];
    default:
      return ["#10B981", "#059669", "#047857"];
  }
};

// Get type info
const getTypeInfo = (tailType) => {
  switch (tailType) {
    case "NOW":
      return { icon: "⚡", label: "NOW", color: "#F59E0B" };
    case "DROP":
      return { icon: "💧", label: "DROP", color: "#8B5CF6" };
    default:
      return { icon: "👀", label: "LOOK", color: "#10B981" };
  }
};

// ============================================
// FEATURED CARD - Large Hero Style
// ============================================
const FeaturedCard = ({ tail, onPress, onCatch, colors }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const typeInfo = getTypeInfo(tail?.tailType);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.98, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onPress?.(tail);
  };

  if (!tail) return null;

  const hasImage = tail.mediaUrl || tail.meta?.image;
  const timeLeftText = timeLeft(tail.expiresAt);
  const isUrgent = tail.expiresAt && (tail.expiresAt - Date.now()) < 3600000;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginHorizontal: 16 }}>
      <TouchableOpacity activeOpacity={0.95} onPress={handlePress}>
        <View style={{
          borderRadius: 28,
          overflow: "hidden",
          backgroundColor: colors.panel,
          shadowColor: typeInfo.color,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 15,
        }}>
          {/* Image Section */}
          <View style={{ height: 220, backgroundColor: colors.panel2 }}>
            {hasImage ? (
              <ImageBackground
                source={{ uri: tail.mediaUrl || tail.meta?.image }}
                style={{ flex: 1 }}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.8)"]}
                  style={StyleSheet.absoluteFill}
                />
              </ImageBackground>
            ) : (
              <LinearGradient
                colors={getTypeGradient(tail.tailType)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontSize: 70 }}>{typeInfo.icon}</Text>
              </LinearGradient>
            )}

            {/* Top Badges */}
            <View style={{
              position: "absolute",
              top: 14,
              left: 14,
              right: 14,
              flexDirection: "row",
              justifyContent: "space-between",
            }}>
              {/* Type Badge */}
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(10px)",
              }}>
                <Text style={{ fontSize: 14 }}>{typeInfo.icon}</Text>
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>
                  {typeInfo.label}
                </Text>
              </View>

              {/* Time Badge */}
              {timeLeftText && (
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: isUrgent ? "rgba(239,68,68,0.9)" : "rgba(0,0,0,0.6)",
                }}>
                  <Text style={{ fontSize: 10 }}>{isUrgent ? "🔥" : "⏰"}</Text>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 11 }}>
                    {timeLeftText}
                  </Text>
                </View>
              )}
            </View>

            {/* Bottom Content Overlay */}
            <View style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
            }}>
              <Text style={{
                color: "#fff",
                fontWeight: "900",
                fontSize: 20,
                textShadowColor: "rgba(0,0,0,0.5)",
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }} numberOfLines={2}>
                {tail.meta?.title || tail.message || "Catch to reveal! 🎁"}
              </Text>
            </View>
          </View>

          {/* Info Section */}
          <View style={{ padding: 16 }}>
            {/* User Row */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: typeInfo.color + "30",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: typeInfo.color,
                }}>
                  <Text style={{ fontWeight: "900", color: typeInfo.color }}>
                    {(tail.from || "U")[0].toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: colors.text, fontWeight: "800", fontSize: 14 }}>
                    @{tail.from || "anonymous"}
                  </Text>
                  <Text style={{ color: colors.dim, fontSize: 12 }}>
                    {timeAgo(tail.timestamp)} ago
                  </Text>
                </View>
              </View>

              {/* Stats */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
                    {tail.catchCount || 0}
                  </Text>
                  <Text style={{ color: colors.dim, fontSize: 10 }}>catches</Text>
                </View>
                {tail.hasReveal && (
                  <View style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 10,
                    backgroundColor: colors.green + "20",
                    borderWidth: 1,
                    borderColor: colors.green,
                  }}>
                    <Text style={{ fontSize: 14 }}>🎁</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Catch Button */}
            <TouchableOpacity
              onPress={() => onCatch?.(tail)}
              activeOpacity={0.8}
              style={{ marginTop: 14 }}
            >
              <LinearGradient
                colors={getTypeGradient(tail.tailType)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 14,
                  borderRadius: 16,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 18 }}>🎯</Text>
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
                  Catch This Tail
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================
// TRENDING CARD - Compact Horizontal Style
// ============================================
const TrendingCard = ({ tail, onPress, onCatch, colors, index }) => {
  const typeInfo = getTypeInfo(tail?.tailType);
  const hasImage = tail?.mediaUrl || tail?.meta?.image;
  const isUrgent = tail?.expiresAt && (tail.expiresAt - Date.now()) < 3600000;

  if (!tail) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(tail)}
      style={{
        width: 180,
        marginRight: 14,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      {/* Rank Badge */}
      {index < 3 && (
        <View style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10,
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: "#fff",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }}>
          <Text style={{ fontWeight: "900", fontSize: 12, color: index === 0 ? "#000" : "#fff" }}>
            {index + 1}
          </Text>
        </View>
      )}

      {/* Image */}
      <View style={{ height: 130 }}>
        {hasImage ? (
          <ImageBackground
            source={{ uri: tail.mediaUrl || tail.meta?.image }}
            style={{ flex: 1 }}
            resizeMode="cover"
          >
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={StyleSheet.absoluteFill}
            />
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={getTypeGradient(tail.tailType)}
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 40 }}>{typeInfo.icon}</Text>
          </LinearGradient>
        )}

        {/* Type Badge */}
        <View style={{
          position: "absolute",
          top: 10,
          right: 10,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 10,
          backgroundColor: typeInfo.color,
        }}>
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 9 }}>
            {typeInfo.label}
          </Text>
        </View>

        {/* Time Badge */}
        <View style={{
          position: "absolute",
          bottom: 8,
          left: 8,
          right: 8,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: "rgba(0,0,0,0.6)",
          }}>
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
              {timeAgo(tail.timestamp)}
            </Text>
          </View>
          
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: isUrgent ? "rgba(239,68,68,0.9)" : "rgba(0,0,0,0.6)",
          }}>
            <Text style={{ fontSize: 8 }}>{isUrgent ? "🔥" : "⏰"}</Text>
            <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>
              {timeLeft(tail.expiresAt) || "∞"}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={{ padding: 12 }}>
        <Text style={{ color: colors.text, fontWeight: "800", fontSize: 13 }} numberOfLines={1}>
          @{tail.from || "user"}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
          {tail.meta?.title || tail.message || "Tap to preview"}
        </Text>

        {/* Stats & Button Row */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 10,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ color: colors.green, fontWeight: "900", fontSize: 12 }}>
              🎯 {tail.catchCount || 0}
            </Text>
            {tail.hasReveal && <Text style={{ fontSize: 12 }}>🎁</Text>}
          </View>

          <TouchableOpacity
            onPress={() => onCatch?.(tail)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 10,
              backgroundColor: typeInfo.color,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 10 }}>
              Catch
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// EXPLORE CARD - Modern List Style
// ============================================
const ExploreCard = ({ tail, onPress, onCatch, colors, style }) => {
  const typeInfo = getTypeInfo(tail?.tailType);
  const hasImage = tail?.mediaUrl || tail?.meta?.image;
  const isUrgent = tail?.expiresAt && (tail.expiresAt - Date.now()) < 3600000;
  const timeLeftText = timeLeft(tail?.expiresAt);

  if (!tail) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(tail)}
      style={[{
        backgroundColor: colors.panel,
        borderRadius: 20,
        marginBottom: 14,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }, style]}
    >
      <View style={{ flexDirection: "row" }}>
        {/* Image/Icon Section */}
        <View style={{ width: 110, height: 110 }}>
          {hasImage ? (
            <Image
              source={{ uri: tail.mediaUrl || tail.meta?.image }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={getTypeGradient(tail.tailType)}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 36 }}>{typeInfo.icon}</Text>
            </LinearGradient>
          )}

          {/* Catch Count Badge */}
          <View style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 10,
            backgroundColor: "rgba(0,0,0,0.7)",
          }}>
            <Text style={{ fontSize: 10 }}>🎯</Text>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 11 }}>
              {tail.catchCount || 0}
            </Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={{ flex: 1, padding: 14, justifyContent: "space-between" }}>
          {/* Top Row */}
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}>
                {/* Type Badge */}
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  backgroundColor: typeInfo.color + "20",
                  borderWidth: 1,
                  borderColor: typeInfo.color,
                }}>
                  <Text style={{ fontSize: 10 }}>{typeInfo.icon}</Text>
                  <Text style={{ color: typeInfo.color, fontWeight: "900", fontSize: 9 }}>
                    {typeInfo.label}
                  </Text>
                </View>

                {tail.hasReveal && (
                  <View style={{
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor: colors.amber + "20",
                  }}>
                    <Text style={{ fontSize: 10 }}>🎁</Text>
                  </View>
                )}
              </View>

              {/* Time Posted */}
              <Text style={{ color: colors.dim, fontSize: 11, fontWeight: "600" }}>
                {timeAgo(tail.timestamp)}
              </Text>
            </View>

            {/* Title */}
            <Text style={{
              color: colors.text,
              fontWeight: "800",
              fontSize: 14,
              marginTop: 8,
            }} numberOfLines={2}>
              {tail.meta?.title || tail.message || "Tap to preview this tail"}
            </Text>
          </View>

          {/* Bottom Row */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 8,
          }}>
            {/* User Info */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: typeInfo.color + "30",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Text style={{ fontSize: 10, fontWeight: "900", color: typeInfo.color }}>
                  {(tail.from || "U")[0].toUpperCase()}
                </Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>
                @{tail.from || "user"}
              </Text>
            </View>

            {/* Time Left / Catch Button */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {timeLeftText && (
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  backgroundColor: isUrgent ? colors.red + "20" : colors.panel2,
                }}>
                  <Text style={{ fontSize: 9 }}>{isUrgent ? "🔥" : "⏰"}</Text>
                  <Text style={{
                    color: isUrgent ? colors.red : colors.dim,
                    fontSize: 10,
                    fontWeight: "700",
                  }}>
                    {timeLeftText}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={() => onCatch?.(tail)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: typeInfo.color,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 11 }}>
                  Catch →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// GRID CARD - For 2-column layout
// ============================================
const GridCard = ({ tail, onPress, onCatch, colors }) => {
  const typeInfo = getTypeInfo(tail?.tailType);
  const hasImage = tail?.mediaUrl || tail?.meta?.image;
  const isUrgent = tail?.expiresAt && (tail.expiresAt - Date.now()) < 3600000;

  if (!tail) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(tail)}
      style={{
        flex: 1,
        margin: 6,
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
      }}
    >
      {/* Image */}
      <View style={{ height: 140 }}>
        {hasImage ? (
          <ImageBackground
            source={{ uri: tail.mediaUrl || tail.meta?.image }}
            style={{ flex: 1 }}
            resizeMode="cover"
          >
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.6)"]}
              style={StyleSheet.absoluteFill}
            />
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={getTypeGradient(tail.tailType)}
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 44 }}>{typeInfo.icon}</Text>
          </LinearGradient>
        )}

        {/* Type Badge */}
        <View style={{
          position: "absolute",
          top: 10,
          left: 10,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          backgroundColor: "rgba(0,0,0,0.6)",
        }}>
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 9 }}>
            {typeInfo.icon} {typeInfo.label}
          </Text>
        </View>

        {/* Timer */}
        <View style={{
          position: "absolute",
          top: 10,
          right: 10,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          backgroundColor: isUrgent ? colors.red : "rgba(0,0,0,0.6)",
        }}>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 9 }}>
            {timeLeft(tail.expiresAt) || "∞"}
          </Text>
        </View>

        {/* Bottom Stats */}
        <View style={{
          position: "absolute",
          bottom: 8,
          left: 8,
          right: 8,
          flexDirection: "row",
          justifyContent: "space-between",
        }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 6,
            backgroundColor: "rgba(0,0,0,0.6)",
          }}>
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>
              🎯 {tail.catchCount || 0}
            </Text>
          </View>
          {tail.hasReveal && (
            <View style={{
              paddingHorizontal: 6,
              paddingVertical: 3,
              borderRadius: 6,
              backgroundColor: "rgba(0,0,0,0.6)",
            }}>
              <Text style={{ fontSize: 10 }}>🎁</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700" }}>
            @{tail.from || "user"}
          </Text>
          <Text style={{ color: colors.dim, fontSize: 10 }}>
            {timeAgo(tail.timestamp)}
          </Text>
        </View>
        <Text style={{
          color: colors.text,
          fontWeight: "700",
          fontSize: 12,
          marginTop: 4,
        }} numberOfLines={2}>
          {tail.meta?.title || tail.message || "Catch to reveal!"}
        </Text>

        {/* Quick Catch */}
        <TouchableOpacity
          onPress={() => onCatch?.(tail)}
          style={{
            marginTop: 10,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: typeInfo.color,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 11 }}>
            Catch
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// STATS BAR
// ============================================
const StatsBar = ({ publicCount, inboxCount, streak, earnings, colors, onOpenEarnings, onOpenInbox, isPro }) => (
  <View style={{
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 8,
    gap: 10,
  }}>
    <TouchableOpacity
      onPress={onOpenEarnings}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 14,
        borderRadius: 16,
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: streak > 0 ? colors.amber : colors.border,
      }}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.amber + "20",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Text style={{ fontSize: 20 }}>🔥</Text>
      </View>
      <View>
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 18 }}>{streak}</Text>
        <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "600" }}>Day Streak</Text>
      </View>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={onOpenInbox}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 14,
        borderRadius: 16,
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: inboxCount > 0 ? colors.brand : colors.border,
      }}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.brand + "20",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}>
        <Text style={{ fontSize: 20 }}>📬</Text>
        {inboxCount > 0 && (
          <View style={{
            position: "absolute",
            top: -4,
            right: -4,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: colors.red,
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "900" }}>{inboxCount}</Text>
          </View>
        )}
      </View>
      <View>
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 18 }}>{inboxCount}</Text>
        <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "600" }}>Inbox</Text>
      </View>
    </TouchableOpacity>

    {isPro && (
      <View style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 14,
        borderRadius: 16,
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.green,
      }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colors.green + "20",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Text style={{ fontSize: 20 }}>💰</Text>
        </View>
        <View>
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 18 }}>${earnings}</Text>
          <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "600" }}>Earned</Text>
        </View>
      </View>
    )}
  </View>
);

// ============================================
// SECTION HEADER
// ============================================
const SectionHeader = ({ title, icon, count, onSeeAll, colors }) => (
  <View style={{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 14,
  }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.brand + "20",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View>
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 18 }}>{title}</Text>
        {count !== undefined && (
          <Text style={{ color: colors.dim, fontSize: 11 }}>{count} available</Text>
        )}
      </View>
    </View>
    {onSeeAll && (
      <TouchableOpacity
        onPress={onSeeAll}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 12,
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.brand, fontWeight: "800", fontSize: 12 }}>See All</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ============================================
// EMPTY STATE
// ============================================
const EmptyState = ({ colors, onRefresh }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -20, duration: 800, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{
      alignItems: "center",
      padding: 40,
      marginHorizontal: 16,
      marginTop: 20,
      backgroundColor: colors.panel,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
        <Text style={{ fontSize: 80 }}>🦊</Text>
      </Animated.View>
      <Text style={{ color: colors.text, fontWeight: "900", fontSize: 22, marginTop: 16 }}>
        No Tails Yet!
      </Text>
      <Text style={{ color: colors.muted, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
        Be the first to drop a tail or{"\n"}wait for someone to share one!
      </Text>
      <TouchableOpacity
        onPress={onRefresh}
        style={{
          marginTop: 24,
          paddingVertical: 14,
          paddingHorizontal: 32,
          borderRadius: 16,
          backgroundColor: colors.brand,
          shadowColor: colors.brand,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>🔄 Refresh Feed</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================
// MAIN TAILHOME COMPONENT
// ============================================
export default function TailHome({
  me,
  publicCount,
  inboxCount,
  allTails = [],
  trending = [],
  onOpenPublic,
  onOpenPrivate,
  onOpenTail,
  onCatchTail,
  colors,
  onReact,
  streak = 0,
  earnings = 0,
  isPro,
  onOpenEarnings,
  onOpenPro,
  onRefresh,
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // "list" | "grid"
  const lastTapRef = useRef(0);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    onRefresh?.();
    setTimeout(() => setRefreshing(false), 1000);
  }, [onRefresh]);

  // Debounced handlers
  const handleTap = useCallback((tail) => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < 500) return;
    lastTapRef.current = now;
    onOpenTail?.(tail);
  }, [onOpenTail]);

  const handleCatch = useCallback((tail) => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < 500) return;
    lastTapRef.current = now;
    onCatchTail?.(tail);
  }, [onCatchTail]);

  const featuredTail = allTails[0];
  const restTails = allTails.slice(1);

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.brand}
          colors={[colors.brand]}
        />
      }
    >
      {/* Header */}
      <View style={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 10,
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: colors.muted, fontSize: 14 }}>Welcome back,</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: colors.text, fontWeight: "900", fontSize: 26 }}>
                @{me?.username || "User"}
              </Text>
              {isPro && (
                <View style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  backgroundColor: colors.amber,
                }}>
                  <Text style={{ color: "#000", fontWeight: "900", fontSize: 10 }}>PRO</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={onOpenPro}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: colors.panel,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 24 }}>🦊</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Bar */}
      <StatsBar
        publicCount={publicCount}
        inboxCount={inboxCount}
        streak={streak}
        earnings={earnings}
        colors={colors}
        onOpenEarnings={onOpenEarnings}
        onOpenInbox={onOpenPrivate}
        isPro={isPro}
      />

      {/* Featured Tail */}
      {featuredTail ? (
        <>
          <SectionHeader
            title="Featured"
            icon="✨"
            colors={colors}
          />
          <FeaturedCard
            tail={featuredTail}
            onPress={handleTap}
            onCatch={handleCatch}
            colors={colors}
          />
        </>
      ) : (
        <EmptyState colors={colors} onRefresh={handleRefresh} />
      )}

      {/* Trending Section */}
      {trending.length > 0 && (
        <>
          <SectionHeader
            title="Trending"
            icon="🔥"
            count={trending.length}
            onSeeAll={onOpenPublic}
            colors={colors}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {trending.slice(0, 10).map((tail, index) => (
              <TrendingCard
                key={tail.id}
                tail={tail}
                index={index}
                onPress={handleTap}
                onCatch={handleCatch}
                colors={colors}
              />
            ))}
          </ScrollView>
        </>
      )}

      {/* Explore Section */}
      {restTails.length > 0 && (
        <>
          <SectionHeader
            title="Explore"
            icon="🌐"
            count={publicCount}
            onSeeAll={onOpenPublic}
            colors={colors}
          />

          {/* View Mode Toggle */}
          <View style={{
            flexDirection: "row",
            marginHorizontal: 16,
            marginBottom: 14,
            gap: 8,
          }}>
            <TouchableOpacity
              onPress={() => setViewMode("list")}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: viewMode === "list" ? colors.brand : colors.panel,
                borderWidth: 1,
                borderColor: viewMode === "list" ? colors.brand : colors.border,
                alignItems: "center",
              }}
            >
              <Text style={{
                color: viewMode === "list" ? "#fff" : colors.muted,
                fontWeight: "800",
                fontSize: 12,
              }}>
                ☰ List
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode("grid")}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: viewMode === "grid" ? colors.brand : colors.panel,
                borderWidth: 1,
                borderColor: viewMode === "grid" ? colors.brand : colors.border,
                alignItems: "center",
              }}
            >
              <Text style={{
                color: viewMode === "grid" ? "#fff" : colors.muted,
                fontWeight: "800",
                fontSize: 12,
              }}>
                ▦ Grid
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cards */}
          {viewMode === "list" ? (
            <View style={{ paddingHorizontal: 16 }}>
              {restTails.slice(0, 10).map((tail) => (
                <ExploreCard
                  key={tail.id}
                  tail={tail}
                  onPress={handleTap}
                  onCatch={handleCatch}
                  colors={colors}
                />
              ))}
            </View>
          ) : (
            <View style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: 10,
            }}>
              {restTails.slice(0, 10).map((tail) => (
                <View key={tail.id} style={{ width: "50%" }}>
                  <GridCard
                    tail={tail}
                    onPress={handleTap}
                    onCatch={handleCatch}
                    colors={colors}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Load More Button */}
          {restTails.length > 10 && (
            <TouchableOpacity
              onPress={onOpenPublic}
              style={{
                marginHorizontal: 16,
                marginTop: 10,
                paddingVertical: 16,
                borderRadius: 16,
                backgroundColor: colors.panel,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.brand, fontWeight: "900", fontSize: 14 }}>
                View All {publicCount} Tails →
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Bottom Padding */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}