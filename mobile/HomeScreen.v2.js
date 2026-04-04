// ============================================================
// HomeScreen.v2.js — Redesigned Home Feed
// ✅ Glass morphism UI
// ✅ Smooth animations
// ✅ Professional layout
// ✅ Better UX flow
// ============================================================

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  Animated,
  Easing,
  Platform,
  StatusBar,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  Badge,
  Row,
  Stack,
  Pill,
  SectionHeader,
  EmptyState,
  FadeIn,
  Skeleton,
} from "./components/UI";
import { DARK, SPACING as S, RADIUS as R } from "./design/tokens";
import TailCardV2 from "./TailCard.v2";
import * as Haptics from "expo-haptics";

const FILTER_TABS = [
  { id: "foryou", label: "For You", icon: "✨" },
  { id: "trending", label: "Trending", icon: "🔥" },
  { id: "nearby", label: "Nearby", icon: "📍" },
  { id: "following", label: "Following", icon: "👥" },
];

export default function HomeScreenV2({
  tails = [],
  userInterests = [],
  onRefresh,
  onTailPress,
  onCatch,
  onProfile,
  onCompose,
  isLoading = false,
  colors: C = DARK,
}) {
  const [selectedFilter, setSelectedFilter] = useState("foryou");
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onRefresh?.();
    setRefreshing(false);
  };

  // Header animation based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0.94],
    extrapolate: "clamp",
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [120, 80],
    extrapolate: "clamp",
  });

  const filteredTails = tails; // Add filter logic here

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: C.bg,
      }}
      edges={["top"]}
    >
      <StatusBar barStyle="light-content" />

      {/* ═══ ANIMATED HEADER ═══ */}
      <Animated.View
        style={{
          backgroundColor: C.surface,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          opacity: headerOpacity,
        }}
      >
        <Animated.View
          style={{
            paddingHorizontal: S.lg,
            paddingTop: S.md,
            paddingBottom: S.md,
            height: headerHeight,
            justifyContent: "space-between",
          }}
        >
          {/* Top row */}
          <Row justify="space-between" align="center">
            <Row spacing={S.sm} align="center">
              <Text variant="hero" style={{ fontSize: 32 }}>
                🦊
              </Text>
              <Stack spacing={2}>
                <Text variant="h2" color={C.text}>
                  Tail Me
                </Text>
                <Row spacing={S.xs}>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: C.green,
                    }}
                  />
                  <Text variant="tiny" color={C.dim}>
                    {tails.length} active
                  </Text>
                </Row>
              </Stack>
            </Row>

            {/* Action buttons */}
            <Row spacing={S.sm}>
              <Pressable
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: R.md,
                  backgroundColor: C.panel,
                  borderWidth: 1,
                  borderColor: C.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 18 }}>🔔</Text>
              </Pressable>
              <Pressable
                onPress={onCompose}
                style={{
                  paddingHorizontal: S.md,
                  height: 40,
                  borderRadius: R.md,
                  backgroundColor: C.brand,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 16 }}>+</Text>
                <Text variant="caption" color="#FFF" style={{ fontWeight: "900" }}>
                  Send
                </Text>
              </Pressable>
            </Row>
          </Row>

          {/* Filter tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: S.sm }}
          >
            {FILTER_TABS.map((tab) => (
              <Pill
                key={tab.id}
                label={tab.label}
                icon={tab.icon}
                selected={selectedFilter === tab.id}
                onPress={() => {
                  setSelectedFilter(tab.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                colors={C}
              />
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>

      {/* ═══ FEED ═══ */}
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.brand}
            colors={[C.brand]}
          />
        }
        contentContainerStyle={{
          paddingTop: S.md,
          paddingBottom: 100,
        }}
      >
        {/* Loading state */}
        {isLoading && (
          <Stack spacing={S.md} style={{ paddingHorizontal: S.md }}>
            {[1, 2, 3].map((i) => (
              <Card key={i} colors={C} variant="glass" padding={0}>
                <Skeleton width="100%" height={180} radius={0} colors={C} />
                <View style={{ padding: S.lg, gap: S.sm }}>
                  <Skeleton width={120} height={12} colors={C} />
                  <Skeleton width="100%" height={18} colors={C} />
                  <Skeleton width="60%" height={16} colors={C} />
                </View>
              </Card>
            ))}
          </Stack>
        )}

        {/* Empty state */}
        {!isLoading && filteredTails.length === 0 && (
          <FadeIn delay={100}>
            <EmptyState
              icon="🦊"
              title="No Tails Yet"
              subtitle={
                selectedFilter === "foryou"
                  ? "Be the first to send a tail!"
                  : `No ${selectedFilter} tails right now`
              }
              action="Send Your First Tail"
              onAction={onCompose}
              colors={C}
            />
          </FadeIn>
        )}

        {/* Tail cards */}
        {!isLoading &&
          filteredTails.map((tail, index) => (
            <FadeIn key={tail.id} delay={index * 50}>
              <TailCardV2
                tail={tail}
                onPress={() => onTailPress?.(tail)}
                onProfile={onProfile}
                colors={C}
                index={index}
              />
            </FadeIn>
          ))}

        {/* Load more indicator */}
        {!isLoading && filteredTails.length > 0 && (
          <View style={{ alignItems: "center", marginTop: S.xl }}>
            <Text variant="caption" color={C.dim}>
              ✨ All caught up
            </Text>
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
