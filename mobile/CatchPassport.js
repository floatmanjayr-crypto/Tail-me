// ============================================
// CatchPassport.js — Region Passport + Top Tails
// ✅ Regions with stamps (bronze/silver/gold/diamond)
// ✅ Pro-exclusive regions (Arctic, Antarctic)
// ✅ Top Tails leaderboard by type + sender
// ✅ Recent catches timeline
// ✅ Visual passport card with stats
// ============================================

import React, { useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ── Regions ─────────────────────────────────────────────
const REGIONS = [
  {
    id: "na",
    name: "North America",
    emoji: "🗽",
    color: "#3B82F6",
    lat: [15, 72],
    lng: [-170, -50],
    pro: false,
  },
  {
    id: "sa",
    name: "South America",
    emoji: "🌴",
    color: "#22C55E",
    lat: [-60, 15],
    lng: [-90, -30],
    pro: false,
  },
  {
    id: "eu",
    name: "Europe",
    emoji: "🏰",
    color: "#A855F7",
    lat: [35, 72],
    lng: [-10, 40],
    pro: false,
  },
  {
    id: "af",
    name: "Africa",
    emoji: "🌍",
    color: "#F59E0B",
    lat: [-40, 37],
    lng: [-20, 55],
    pro: false,
  },
  {
    id: "asia",
    name: "Asia",
    emoji: "🏯",
    color: "#EF4444",
    lat: [0, 72],
    lng: [40, 180],
    pro: false,
  },
  {
    id: "oc",
    name: "Oceania",
    emoji: "🏝️",
    color: "#06B6D4",
    lat: [-50, 0],
    lng: [100, 180],
    pro: false,
  },
  {
    id: "arctic",
    name: "Arctic Zone",
    emoji: "❄️",
    color: "#93C5FD",
    lat: [66, 90],
    lng: [-180, 180],
    pro: true,
  },
  {
    id: "antarctic",
    name: "Antarctic Zone",
    emoji: "🧊",
    color: "#CBD5E1",
    lat: [-90, -60],
    lng: [-180, 180],
    pro: true,
  },
];

// ── Stamp tiers ─────────────────────────────────────────
const STAMP_TIERS = [
  { min: 1, label: "Bronze", color: "#CD7F32", icon: "🥉" },
  { min: 5, label: "Silver", color: "#C0C0C0", icon: "🥈" },
  { min: 15, label: "Gold", color: "#FFD700", icon: "🥇" },
  { min: 50, label: "Diamond", color: "#B9F2FF", icon: "💎" },
];

// ── Helpers ─────────────────────────────────────────────
function getRegionForCoords(lat, lng) {
  if (lat == null || lng == null) return null;
  for (const r of REGIONS) {
    if (
      lat >= r.lat[0] &&
      lat <= r.lat[1] &&
      lng >= r.lng[0] &&
      lng <= r.lng[1]
    ) {
      return r.id;
    }
  }
  return null;
}

function getStampTier(count) {
  let tier = null;
  for (const t of STAMP_TIERS) {
    if (count >= t.min) tier = t;
  }
  return tier;
}

function getNextTier(count) {
  for (const t of STAMP_TIERS) {
    if (count < t.min) return t;
  }
  return null;
}

function typeIcon(t) {
  switch (t) {
    case "LOOK":
      return "👀";
    case "NOW":
      return "⚡";
    case "DROP":
      return "💧";
    case "CHAIN":
      return "🔗";
    case "GEO":
      return "📍";
    default:
      return "📦";
  }
}

// ═════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════
export default function CatchPassport({
  me,
  catches = [],
  streak = 0,
  earnings = 0,
  isPro = false,
  onBack,
  onOpenPro,
  colors: C,
}) {
  const [tab, setTab] = useState("regions"); // "regions" | "top" | "recent"

  // ── Compute region stats ──────────────────────────────
  const regionStats = useMemo(() => {
    const stats = {};
    REGIONS.forEach((r) => {
      stats[r.id] = { count: 0, catches: [] };
    });

    catches.forEach((c) => {
      const regionId = getRegionForCoords(c.lat, c.lng);
      if (regionId && stats[regionId]) {
        stats[regionId].count++;
        stats[regionId].catches.push(c);
      }
    });

    return stats;
  }, [catches]);

  const totalRegions = REGIONS.filter(
    (r) => (!r.pro || isPro) && regionStats[r.id]?.count > 0
  ).length;

  const totalStamps = REGIONS.reduce((sum, r) => {
    const tier = getStampTier(regionStats[r.id]?.count || 0);
    return sum + (tier ? 1 : 0);
  }, 0);

  // ── Top tails (most caught tail types) ────────────────
  const topTails = useMemo(() => {
    const typeCount = {};
    catches.forEach((c) => {
      const t = c.tailType || "LOOK";
      typeCount[t] = (typeCount[t] || 0) + 1;
    });
    return Object.entries(typeCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [catches]);

  // ── Top senders ───────────────────────────────────────
  const topSenders = useMemo(() => {
    const senderCount = {};
    catches.forEach((c) => {
      const from = c.from || "unknown";
      senderCount[from] = (senderCount[from] || 0) + 1;
    });
    return Object.entries(senderCount)
      .map(([sender, count]) => ({ sender, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [catches]);

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: C.muted, fontWeight: "900" }}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text
          style={{ color: C.text, fontWeight: "900", fontSize: 18 }}
        >
          🛂 Passport
        </Text>
        <Text style={{ color: C.dim, fontWeight: "800" }}>
          @{me?.username}
        </Text>
      </View>

      {/* ── Passport Card ── */}
      <View
        style={{
          backgroundColor: C.panel,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: C.border,
          padding: 20,
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: isPro ? C.brand : C.green,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text
              style={{
                color: C.dim,
                fontWeight: "900",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              TAIL PASSPORT
            </Text>
            <Text
              style={{
                color: C.text,
                fontWeight: "900",
                fontSize: 22,
                marginTop: 4,
              }}
            >
              @{me?.username}
            </Text>
          </View>
          {isPro ? (
            <View
              style={{
                paddingVertical: 6,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: C.brand + "30",
                borderWidth: 1,
                borderColor: C.brand,
              }}
            >
              <Text
                style={{
                  color: C.brand,
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                ✨ PRO
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onOpenPro}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: C.brand + "15",
                borderWidth: 1,
                borderColor: C.brand,
              }}
            >
              <Text
                style={{
                  color: C.brand,
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                Upgrade →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats row */}
        <View
          style={{
            flexDirection: "row",
            marginTop: 16,
            gap: 12,
          }}
        >
          {[
            { label: "Catches", value: catches.length, emoji: "🎯" },
            {
              label: "Regions",
              value: `${totalRegions}/${REGIONS.filter((r) => !r.pro || isPro).length}`,
              emoji: "🌍",
            },
            { label: "Stamps", value: totalStamps, emoji: "📌" },
            { label: "Streak", value: streak, emoji: "🔥" },
          ].map((s) => (
            <View key={s.label} style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 16 }}>{s.emoji}</Text>
              <Text
                style={{
                  color: C.text,
                  fontWeight: "900",
                  fontSize: 16,
                  marginTop: 2,
                }}
              >
                {s.value}
              </Text>
              <Text
                style={{
                  color: C.dim,
                  fontWeight: "800",
                  fontSize: 9,
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Tab Selector ── */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {[
          { key: "regions", label: "🌍 Regions" },
          { key: "top", label: "🏆 Top Tails" },
          { key: "recent", label: "📋 Recent" },
        ].map(({ key, label }) => {
          const active = tab === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setTab(key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: active ? C.brand : C.border,
                backgroundColor: active
                  ? "rgba(124,58,237,0.18)"
                  : "transparent",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: active ? C.text : C.muted,
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ═══════════════════════════════════════════════
          REGIONS TAB
      ═══════════════════════════════════════════════ */}
      {tab === "regions" && (
        <View style={{ gap: 10 }}>
          <Text
            style={{
              color: C.muted,
              fontWeight: "900",
              fontSize: 13,
              marginBottom: 4,
            }}
          >
            Catch tails across the world to collect stamps
          </Text>

          {REGIONS.map((region) => {
            const stat = regionStats[region.id] || { count: 0 };
            const isLocked = region.pro && !isPro;
            const tier = getStampTier(stat.count);
            const nextTier = getNextTier(stat.count);
            const progress = nextTier
              ? Math.min(1, stat.count / nextTier.min)
              : 1;

            return (
              <View
                key={region.id}
                style={{
                  backgroundColor: isLocked ? C.panel2 : C.panel,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: tier ? tier.color + "60" : C.border,
                  padding: 16,
                  opacity: isLocked ? 0.6 : 1,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Text style={{ fontSize: 28 }}>
                      {isLocked ? "🔒" : region.emoji}
                    </Text>
                    <View>
                      <Text
                        style={{
                          color: isLocked ? C.dim : C.text,
                          fontWeight: "900",
                          fontSize: 15,
                        }}
                      >
                        {region.name}
                      </Text>
                      <Text
                        style={{
                          color: C.dim,
                          fontWeight: "800",
                          fontSize: 11,
                        }}
                      >
                        {isLocked
                          ? "Pro exclusive region"
                          : stat.count === 0
                          ? "No catches yet"
                          : `${stat.count} catch${stat.count !== 1 ? "es" : ""}`}
                      </Text>
                    </View>
                  </View>

                  {/* Stamp badge */}
                  {tier && !isLocked && (
                    <View style={{ alignItems: "center", gap: 2 }}>
                      <Text style={{ fontSize: 20 }}>{tier.icon}</Text>
                      <Text
                        style={{
                          color: tier.color,
                          fontWeight: "900",
                          fontSize: 9,
                          textTransform: "uppercase",
                        }}
                      >
                        {tier.label}
                      </Text>
                    </View>
                  )}

                  {/* Unlock button for locked regions */}
                  {isLocked && (
                    <TouchableOpacity
                      onPress={onOpenPro}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 10,
                        backgroundColor: C.brand + "20",
                        borderWidth: 1,
                        borderColor: C.brand,
                      }}
                    >
                      <Text
                        style={{
                          color: C.brand,
                          fontWeight: "900",
                          fontSize: 11,
                        }}
                      >
                        Unlock
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Progress bar to next tier */}
                {!isLocked && nextTier && (
                  <View style={{ marginTop: 10 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: C.dim,
                          fontSize: 10,
                          fontWeight: "800",
                        }}
                      >
                        {tier ? tier.label : "No stamp"}
                      </Text>
                      <Text
                        style={{
                          color: C.dim,
                          fontSize: 10,
                          fontWeight: "800",
                        }}
                      >
                        {stat.count}/{nextTier.min} → {nextTier.icon}{" "}
                        {nextTier.label}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: C.border,
                      }}
                    >
                      <View
                        style={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: region.color,
                          width: `${Math.max(2, progress * 100)}%`,
                        }}
                      />
                    </View>
                  </View>
                )}

                {/* Max tier reached */}
                {!isLocked && !nextTier && stat.count > 0 && (
                  <View
                    style={{
                      marginTop: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text style={{ fontSize: 12 }}>💎</Text>
                    <Text
                      style={{
                        color: "#B9F2FF",
                        fontWeight: "900",
                        fontSize: 11,
                      }}
                    >
                      MAX TIER — Diamond Passport Holder
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Pro upsell */}
          {!isPro && (
            <TouchableOpacity
              onPress={onOpenPro}
              style={{
                backgroundColor: C.brand + "12",
                borderRadius: 18,
                borderWidth: 1,
                borderColor: C.brand + "40",
                padding: 16,
                alignItems: "center",
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 24 }}>✨</Text>
              <Text
                style={{
                  color: C.brand,
                  fontWeight: "900",
                  fontSize: 14,
                }}
              >
                Upgrade to Pro
              </Text>
              <Text
                style={{
                  color: C.muted,
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                Unlock Arctic & Antarctic regions, golden stamps,
                region leaderboards, and exclusive geo drops.
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ═══════════════════════════════════════════════
          TOP TAILS TAB
      ═══════════════════════════════════════════════ */}
      {tab === "top" && (
        <View style={{ gap: 12 }}>
          {/* By type */}
          <Text
            style={{
              color: C.muted,
              fontWeight: "900",
              fontSize: 13,
            }}
          >
            Catches by Type
          </Text>

          {topTails.length === 0 ? (
            <Text
              style={{
                color: C.dim,
                textAlign: "center",
                marginTop: 20,
              }}
            >
              No catches yet. Start catching tails!
            </Text>
          ) : (
            topTails.map(({ type, count }) => {
              const maxCount = topTails[0]?.count || 1;
              const pct = Math.max(5, (count / maxCount) * 100);
              return (
                <View
                  key={type}
                  style={{
                    backgroundColor: C.panel,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: C.border,
                    padding: 14,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>
                        {typeIcon(type)}
                      </Text>
                      <Text
                        style={{
                          color: C.text,
                          fontWeight: "900",
                          fontSize: 14,
                        }}
                      >
                        {type}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: C.brand,
                        fontWeight: "900",
                        fontSize: 16,
                      }}
                    >
                      {count}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: C.border,
                    }}
                  >
                    <View
                      style={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: C.brand,
                        width: `${pct}%`,
                      }}
                    />
                  </View>
                </View>
              );
            })
          )}

          {/* Top senders */}
          {topSenders.length > 0 && (
            <>
              <Text
                style={{
                  color: C.muted,
                  fontWeight: "900",
                  fontSize: 13,
                  marginTop: 8,
                }}
              >
                Top Senders
              </Text>
              {topSenders.slice(0, 5).map(({ sender, count }, i) => (
                <View
                  key={sender}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: C.panel,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: C.border,
                    padding: 14,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          i === 0
                            ? "#FFD700"
                            : i === 1
                            ? "#C0C0C0"
                            : i === 2
                            ? "#CD7F32"
                            : C.dim,
                        fontWeight: "900",
                        fontSize: 16,
                        width: 24,
                      }}
                    >
                      {i < 3
                        ? ["🥇", "🥈", "🥉"][i]
                        : `${i + 1}.`}
                    </Text>
                    <Text
                      style={{ color: C.text, fontWeight: "900" }}
                    >
                      @{sender}
                    </Text>
                  </View>
                  <Text
                    style={{ color: C.muted, fontWeight: "900" }}
                  >
                    {count} catch{count !== 1 ? "es" : ""}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}

      {/* ═══════════════════════════════════════════════
          RECENT TAB
      ═══════════════════════════════════════════════ */}
      {tab === "recent" && (
        <View style={{ gap: 8 }}>
          {catches.length === 0 ? (
            <Text
              style={{
                color: C.dim,
                textAlign: "center",
                marginTop: 20,
              }}
            >
              No catches yet. Go catch some tails!
            </Text>
          ) : (
            catches.slice(0, 50).map((c, i) => {
              const region = getRegionForCoords(c.lat, c.lng);
              const regionData = REGIONS.find((r) => r.id === region);
              const time = c.timestamp
                ? new Date(c.timestamp).toLocaleDateString()
                : "—";

              return (
                <View
                  key={c.id || `catch-${i}`}
                  style={{
                    backgroundColor: C.panel,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: C.border,
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>
                    {typeIcon(c.tailType)}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: C.text,
                          fontWeight: "900",
                          fontSize: 13,
                        }}
                      >
                        @{c.from || "unknown"}
                      </Text>
                      <View
                        style={{
                          paddingVertical: 2,
                          paddingHorizontal: 8,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: C.border,
                          backgroundColor: "rgba(255,255,255,0.04)",
                        }}
                      >
                        <Text
                          style={{
                            color: C.brand,
                            fontWeight: "900",
                            fontSize: 9,
                          }}
                        >
                          {c.tailType || "LOOK"}
                        </Text>
                      </View>
                    </View>
                    {!!c.message && (
                      <Text
                        style={{
                          color: C.muted,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        "{c.message}"
                      </Text>
                    )}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 4,
                      }}
                    >
                      <Text
                        style={{ color: C.dim, fontSize: 10 }}
                      >
                        {time}
                      </Text>
                      {regionData && (
                        <Text
                          style={{ color: C.dim, fontSize: 10 }}
                        >
                          {regionData.emoji} {regionData.name}
                        </Text>
                      )}
                      {c.geo && (
                        <Text
                          style={{ color: C.dim, fontSize: 10 }}
                        >
                          📍
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Bottom spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}