// ============================================================
// TailCard.v2.js — Redesigned Tail Card
// ✅ Glass morphism design
// ✅ Proper typography hierarchy
// ✅ Animated interactions
// ✅ Smart layout system
// ============================================================

import React, { useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  View,
  Text as RNText,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Text, Badge, Row, Avatar, Card } from "./components/UI";
import { SPACING as S, RADIUS as R, SHADOWS, FONT_SIZE as FS, FONT_WEIGHT as FW, ANIMATION as A } from "./design/tokens";

const { width: SW } = Dimensions.get("window");

const TAIL_TYPES = {
  LOOK:  { color: "#8B5CF6", icon: "👀", label: "LOOK"  },
  NOW:   { color: "#EF4444", icon: "⚡", label: "NOW"   },
  DROP:  { color: "#F59E0B", icon: "💧", label: "DROP"  },
  CHAIN: { color: "#10B981", icon: "🔗", label: "CHAIN" },
  GEO:   { color: "#3B82F6", icon: "📍", label: "GEO"   },
};

export default function TailCardV2({
  tail,
  onPress,
  onCatch,
  onProfile,
  colors: C,
  index = 0,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const t = tail || {};
  const type = TAIL_TYPES[(t.tailType || "LOOK").toUpperCase()] || TAIL_TYPES.LOOK;
  const heroImage = t.mediaUrl || t.meta?.image;
  const hasExpiry = !!t.expiresAt;
  const catchCount = t.catchCount || 0;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97, ...A.spring, useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1, ...A.spring, useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        marginHorizontal: S.md,
        marginBottom: S.md,
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: C?.panel || "#111827",
            borderColor: C?.border || "#1E293B",
          },
          SHADOWS.md,
        ]}
      >
        {/* ── HERO IMAGE ── */}
        {heroImage && (
          <View style={styles.heroWrap}>
            <Image
              source={{ uri: heroImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {/* Gradient overlay */}
            <View style={styles.heroGradient} />

            {/* Type badge */}
            <Badge
              icon={type.icon}
              label={type.label}
              color={type.color}
              size="sm"
              style={styles.typeBadge}
            />

            {/* Catch count */}
            <View style={styles.catchBadge}>
              <RNText style={styles.catchBadgeText}>
                🎯 {catchCount}
              </RNText>
            </View>
          </View>
        )}

        {/* ── NO IMAGE HEADER ── */}
        {!heroImage && (
          <View style={[styles.noImageHeader, { backgroundColor: type.color + "12" }]}>
            <Row spacing={S.sm} justify="space-between" style={{ width: "100%" }}>
              <Badge icon={type.icon} label={type.label} color={type.color} size="sm" />
              <View style={styles.catchBadgeSmall}>
                <RNText style={styles.catchBadgeText}>🎯 {catchCount}</RNText>
              </View>
            </Row>
            <RNText style={{ fontSize: 36, marginTop: S.sm }}>{type.icon}</RNText>
          </View>
        )}

        {/* ── CONTENT ── */}
        <View style={styles.content}>
          {/* Sender row */}
          <Pressable onPress={() => onProfile?.(t.from)} style={styles.senderRow}>
            <Avatar name={t.from} size={28} />
            <RNText style={[styles.senderName, { color: C?.muted || "#94A3B8" }]}>
              @{t.from || "user"}
            </RNText>
            {t.isVerified && <RNText style={{ fontSize: 12 }}>✓</RNText>}
          </Pressable>

          {/* Title */}
          <RNText
            style={[styles.title, { color: C?.text || "#F1F5F9" }]}
            numberOfLines={2}
          >
            {t.meta?.title || t.title || "Mystery Drop"}
          </RNText>

          {/* Price */}
          {t.meta?.price && (
            <Row spacing={S.sm} align="baseline">
              <RNText style={styles.price}>{t.meta.price}</RNText>
              {t.meta?.siteName && (
                <RNText style={[styles.siteName, { color: C?.dim || "#64748B" }]}>
                  {t.meta.siteName}
                </RNText>
              )}
            </Row>
          )}

          {/* Message preview */}
          {t.message && (
            <View style={[styles.messagePreview, { borderColor: type.color + "30" }]}>
              <RNText
                style={[styles.messageText, { color: C?.text || "#F1F5F9" }]}
                numberOfLines={2}
              >
                \"{t.message}\"
              </RNText>
            </View>
          )}

          {/* Footer */}
          <Row spacing={S.sm} justify="space-between" style={styles.footer}>
            {/* Reactions */}
            <Row spacing={S.xs}>
              {Object.entries(t.reactions || {})
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([emoji, count]) => (
                  <View key={emoji} style={styles.reactionPill}>
                    <RNText style={{ fontSize: 12 }}>{emoji}</RNText>
                    <RNText style={[styles.reactionCount, { color: C?.dim || "#64748B" }]}>
                      {count}
                    </RNText>
                  </View>
                ))}
            </Row>

            {/* Expiry */}
            {hasExpiry && (
              <Badge label="⏱" color={C?.amber || "#F59E0B"} variant="subtle" size="xs" />
            )}
          </Row>
        </View>

        {/* ── STOREFRONT INDICATOR ── */}
        {t.storefront && (
          <View style={[styles.storefrontBar, { backgroundColor: type.color + "10" }]}>
            <RNText style={{ fontSize: 10 }}>
              {t.storefront.emoji || "🎁"}
            </RNText>
            <RNText style={[styles.storefrontText, { color: type.color }]}>
              {t.storefront.brandName || "Custom Storefront"}
            </RNText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: R.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  heroWrap: {
    position: "relative",
    height: 180,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  typeBadge: {
    position: "absolute",
    top: S.sm,
    left: S.sm,
  },
  catchBadge: {
    position: "absolute",
    top: S.sm,
    right: S.sm,
    backgroundColor: "rgba(5,8,16,0.8)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: R.full,
  },
  catchBadgeSmall: {
    backgroundColor: "rgba(5,8,16,0.6)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: R.full,
  },
  catchBadgeText: {
    color: "#F1F5F9",
    fontSize: FS.tiny,
    fontWeight: FW.black,
  },
  noImageHeader: {
    padding: S.lg,
    alignItems: "center",
    paddingBottom: S.md,
  },
  content: {
    padding: S.lg,
    gap: S.sm,
  },
  senderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
  },
  senderName: {
    fontSize: FS.caption,
    fontWeight: FW.black,
  },
  title: {
    fontSize: FS.h3,
    fontWeight: FW.black,
    lineHeight: 24,
  },
  price: {
    color: "#10B981",
    fontSize: FS.h2,
    fontWeight: FW.black,
  },
  siteName: {
    fontSize: FS.caption,
  },
  messagePreview: {
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    borderRadius: R.md,
    borderLeftWidth: 3,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  messageText: {
    fontSize: FS.caption,
    fontStyle: "italic",
    lineHeight: 18,
  },
  footer: {
    marginTop: S.xs,
    paddingTop: S.sm,
  },
  reactionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: R.full,
  },
  reactionCount: {
    fontSize: 10,
    fontWeight: FW.bold,
  },
  storefrontBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: S.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  storefrontText: {
    fontSize: FS.tiny,
    fontWeight: FW.black,
    letterSpacing: 0.5,
  },
});\n