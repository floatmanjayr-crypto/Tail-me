// ============================================
// CatchPassport.js — Tail Me
// ✅ Visual catch history grid
// ✅ Hunter stats (total, streak, rare catches)
// ✅ Achievement badges
// ✅ Type breakdown
// ✅ Top droppers caught from
// ✅ Shareable passport card
// ============================================

import React, { useMemo } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BADGES = [
  { id: "first_catch",   icon: "🎯", label: "First Catch",    desc: "Caught your first tail",         req: (s) => s.total >= 1 },
  { id: "streak_3",      icon: "🔥", label: "On Fire",        desc: "3 catch streak",                 req: (s) => s.streak >= 3 },
  { id: "streak_7",      icon: "💥", label: "7 Day Streak",   desc: "7 catch streak",                 req: (s) => s.streak >= 7 },
  { id: "streak_30",     icon: "⚡", label: "Unstoppable",    desc: "30 catch streak",                req: (s) => s.streak >= 30 },
  { id: "catcher_10",    icon: "🏅", label: "Catcher",        desc: "Caught 10 tails",                req: (s) => s.total >= 10 },
  { id: "catcher_50",    icon: "🏆", label: "Pro Catcher",    desc: "Caught 50 tails",                req: (s) => s.total >= 50 },
  { id: "catcher_100",   icon: "👑", label: "Legendary",      desc: "Caught 100 tails",               req: (s) => s.total >= 100 },
  { id: "drop_hunter",   icon: "💧", label: "Drop Hunter",    desc: "Caught 5 DROP tails",            req: (s) => s.byType?.DROP >= 5 },
  { id: "now_chaser",    icon: "⚡", label: "Speed Demon",    desc: "Caught 5 NOW tails",             req: (s) => s.byType?.NOW >= 5 },
  { id: "chain_master",  icon: "🔗", label: "Chain Master",   desc: "Completed a chain tail",         req: (s) => s.chains >= 1 },
  { id: "geo_explorer",  icon: "🗺️", label: "Explorer",       desc: "Caught a geo-locked tail",       req: (s) => s.geo >= 1 },
  { id: "early_bird",    icon: "🌅", label: "Early Bird",     desc: "Caught a tail in first 10 catches", req: (s) => s.earlyBird },
];

const TYPE_ICONS = { LOOK: "👀", NOW: "⚡", DROP: "💧", CHAIN: "🔗", GEO: "📍" };
const TYPE_COLORS = { LOOK: "#7C3AED", NOW: "#EF4444", DROP: "#F59E0B", CHAIN: "#22C55E", GEO: "#3B82F6" };

function StatBox({ value, label, color, C }) {
  return (
    <View style={{
      flex: 1, backgroundColor: C?.panel2 || "#0A1020",
      borderRadius: 14, borderWidth: 1, borderColor: C?.border || "#1E293B",
      padding: 14, alignItems: "center", gap: 4,
    }}>
      <Text style={{ color: color || C?.brand || "#7C3AED", fontWeight: "900", fontSize: 24 }}>
        {value}
      </Text>
      <Text style={{ color: C?.dim || "#64748B", fontWeight: "700", fontSize: 11, textAlign: "center" }}>
        {label}
      </Text>
    </View>
  );
}

function BadgeItem({ badge, earned, C }) {
  return (
    <View style={{
      alignItems: "center", width: 80, opacity: earned ? 1 : 0.3,
    }}>
      <View style={{
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: earned ? "rgba(124,58,237,0.15)" : (C?.border || "#1E293B"),
        borderWidth: 2,
        borderColor: earned ? (C?.brand || "#7C3AED") : (C?.border || "#1E293B"),
        alignItems: "center", justifyContent: "center",
        marginBottom: 6,
      }}>
        <Text style={{ fontSize: 24 }}>{badge.icon}</Text>
      </View>
      <Text style={{
        color: earned ? (C?.text || "#E5E7EB") : (C?.dim || "#64748B"),
        fontWeight: "900", fontSize: 10, textAlign: "center", lineHeight: 13,
      }}>
        {badge.label}
      </Text>
    </View>
  );
}

function CatchStamp({ catch: c, index, C }) {
  const tc = TYPE_COLORS[c.tailType] || "#7C3AED";
  const ti = TYPE_ICONS[c.tailType]  || "🎯";
  return (
    <View style={{
      width: "30%",
      aspectRatio: 1,
      borderRadius: 14,
      backgroundColor: tc + "15",
      borderWidth: 1,
      borderColor: tc + "40",
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      padding: 6,
    }}>
      <Text style={{ fontSize: 20 }}>{ti}</Text>
      <Text style={{ color: tc, fontWeight: "900", fontSize: 9, textAlign: "center" }} numberOfLines={1}>
        @{c.from || "?"}
      </Text>
      <Text style={{ color: "#64748B", fontSize: 8 }}>
        {c.tailType}
      </Text>
    </View>
  );
}

export default function CatchPassport({
  me,
  catches = [],   // array of caught tail objects
  streak  = 0,
  earnings = 0,
  isPro   = false,
  onBack,
  colors: C,
}) {
  // Compute stats
  const stats = useMemo(() => {
    const byType = catches.reduce((acc, c) => {
      const t = c.tailType || "LOOK";
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

    const chains  = catches.filter(c => c.tailType === "CHAIN").length;
    const geo     = catches.filter(c => c.tailType === "GEO" || c.geo).length;
    const earlyBird = catches.some((c, i) => i < 10);

    return {
      total: catches.length,
      streak,
      byType,
      chains,
      geo,
      earlyBird,
    };
  }, [catches, streak]);

  const earnedBadges = BADGES.filter(b => b.req(stats));

  // Top droppers
  const dropperCounts = catches.reduce((acc, c) => {
    if (c.from) acc[c.from] = (acc[c.from] || 0) + 1;
    return acc;
  }, {});
  const topDroppers = Object.entries(dropperCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const hunterRank =
    stats.total >= 100 ? "👑 Legendary"
    : stats.total >= 50  ? "🏆 Pro"
    : stats.total >= 10  ? "🏅 Catcher"
    : stats.total >= 1   ? "🎯 Rookie"
    : "👤 New Hunter";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C?.bg || "#070A0F" }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HEADER ── */}
      <View style={{
        paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        borderBottomWidth: 1, borderBottomColor: C?.border || "#1E293B",
        backgroundColor: C?.panel || "#0D1220",
      }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "900" }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: C?.text || "#E5E7EB", fontWeight: "900", fontSize: 16 }}>
          Catch Passport
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={{ padding: 16, gap: 20 }}>

        {/* ── PASSPORT CARD ── */}
        <View style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "rgba(124,58,237,0.4)",
          backgroundColor: C?.panel || "#0D1220",
          padding: 20,
          overflow: "hidden",
        }}>
          {/* Background accent */}
          <View style={{
            position: "absolute", top: -30, right: -30,
            width: 140, height: 140, borderRadius: 70,
            backgroundColor: "rgba(124,58,237,0.06)",
          }} />

          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            {/* Avatar */}
            <View style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: "rgba(124,58,237,0.2)",
              borderWidth: 2, borderColor: C?.brand || "#7C3AED",
              alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ fontSize: 28 }}>🦊</Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ color: C?.text || "#E5E7EB", fontWeight: "900", fontSize: 18 }}>
                  @{me?.username || "hunter"}
                </Text>
                {isPro && (
                  <View style={{
                    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999,
                    backgroundColor: "rgba(124,58,237,0.2)",
                    borderWidth: 1, borderColor: C?.brand || "#7C3AED",
                  }}>
                    <Text style={{ color: C?.brand || "#7C3AED", fontWeight: "900", fontSize: 10 }}>PRO</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: C?.brand || "#7C3AED", fontWeight: "900", fontSize: 13, marginTop: 2 }}>
                {hunterRank}
              </Text>
              {streak > 0 && (
                <Text style={{ color: "#F59E0B", fontWeight: "700", fontSize: 12, marginTop: 2 }}>
                  🔥 {streak} catch streak
                </Text>
              )}
            </View>
          </View>

          {/* Mini stats */}
          <View style={{
            flexDirection: "row", gap: 10, marginTop: 16,
            paddingTop: 16, borderTopWidth: 1, borderTopColor: C?.border || "#1E293B",
          }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: C?.text || "#E5E7EB", fontWeight: "900", fontSize: 22 }}>{stats.total}</Text>
              <Text style={{ color: C?.dim || "#64748B", fontSize: 10, fontWeight: "700" }}>CATCHES</Text>
            </View>
            <View style={{ width: 1, backgroundColor: C?.border || "#1E293B" }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: "#22C55E", fontWeight: "900", fontSize: 22 }}>{streak}</Text>
              <Text style={{ color: C?.dim || "#64748B", fontSize: 10, fontWeight: "700" }}>STREAK</Text>
            </View>
            <View style={{ width: 1, backgroundColor: C?.border || "#1E293B" }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: "#F59E0B", fontWeight: "900", fontSize: 22 }}>{earnedBadges.length}</Text>
              <Text style={{ color: C?.dim || "#64748B", fontSize: 10, fontWeight: "700" }}>BADGES</Text>
            </View>
            {isPro && (
              <>
                <View style={{ width: 1, backgroundColor: C?.border || "#1E293B" }} />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ color: "#7C3AED", fontWeight: "900", fontSize: 22 }}>${earnings.toFixed(0)}</Text>
                  <Text style={{ color: C?.dim || "#64748B", fontSize: 10, fontWeight: "700" }}>EARNED</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ── TYPE BREAKDOWN ── */}
        <View>
          <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "900", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
            Tail Types Caught
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {Object.entries(TYPE_ICONS).map(([type, icon]) => {
              const count = stats.byType?.[type] || 0;
              const tc = TYPE_COLORS[type];
              return (
                <View key={type} style={{
                  flex: 1, backgroundColor: C?.panel || "#0D1220",
                  borderRadius: 12, borderWidth: 1,
                  borderColor: count > 0 ? tc + "40" : (C?.border || "#1E293B"),
                  padding: 10, alignItems: "center", gap: 4,
                  opacity: count > 0 ? 1 : 0.4,
                }}>
                  <Text style={{ fontSize: 18 }}>{icon}</Text>
                  <Text style={{ color: count > 0 ? tc : (C?.dim || "#64748B"), fontWeight: "900", fontSize: 14 }}>
                    {count}
                  </Text>
                  <Text style={{ color: C?.dim || "#64748B", fontSize: 9, fontWeight: "700" }}>{type}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── BADGES ── */}
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "900", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
              Badges
            </Text>
            <Text style={{ color: C?.dim || "#64748B", fontSize: 12 }}>
              {earnedBadges.length}/{BADGES.length} earned
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {BADGES.map(b => (
              <BadgeItem key={b.id} badge={b} earned={earnedBadges.some(e => e.id === b.id)} C={C} />
            ))}
          </View>
        </View>

        {/* ── CATCH GRID ── */}
        {catches.length > 0 && (
          <View>
            <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "900", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
              Recent Catches
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {catches.slice(0, 18).map((c, i) => (
                <CatchStamp key={c.id || i} catch={c} index={i} C={C} />
              ))}
              {catches.length > 18 && (
                <View style={{
                  width: "30%", aspectRatio: 1, borderRadius: 14,
                  backgroundColor: C?.panel2 || "#0A1020",
                  borderWidth: 1, borderColor: C?.border || "#1E293B",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ color: C?.dim || "#64748B", fontWeight: "900", fontSize: 13 }}>
                    +{catches.length - 18}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {catches.length === 0 && (
          <View style={{
            padding: 32, alignItems: "center",
            backgroundColor: C?.panel || "#0D1220",
            borderRadius: 16, borderWidth: 1, borderColor: C?.border || "#1E293B",
          }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🎯</Text>
            <Text style={{ color: C?.text || "#E5E7EB", fontWeight: "900", fontSize: 16, textAlign: "center" }}>
              No catches yet
            </Text>
            <Text style={{ color: C?.muted || "#94A3B8", textAlign: "center", marginTop: 6, fontSize: 13 }}>
              Start catching tails to fill your passport
            </Text>
          </View>
        )}

        {/* ── TOP DROPPERS ── */}
        {topDroppers.length > 0 && (
          <View>
            <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "900", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
              Favourite Droppers
            </Text>
            <View style={{ gap: 8 }}>
              {topDroppers.map(([dropper, count], i) => (
                <View key={dropper} style={{
                  flexDirection: "row", alignItems: "center",
                  backgroundColor: C?.panel || "#0D1220",
                  borderRadius: 12, borderWidth: 1, borderColor: C?.border || "#1E293B",
                  padding: 12, gap: 10,
                }}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: "rgba(124,58,237,0.15)",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Text style={{ color: C?.brand || "#7C3AED", fontWeight: "900", fontSize: 12 }}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={{ color: C?.text || "#E5E7EB", fontWeight: "900", flex: 1 }}>
                    @{dropper}
                  </Text>
                  <View style={{
                    paddingVertical: 3, paddingHorizontal: 10,
                    borderRadius: 999, backgroundColor: "rgba(124,58,237,0.1)",
                    borderWidth: 1, borderColor: "rgba(124,58,237,0.3)",
                  }}>
                    <Text style={{ color: C?.brand || "#7C3AED", fontWeight: "900", fontSize: 11 }}>
                      {count} caught
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </View>
    </ScrollView>
  );
}