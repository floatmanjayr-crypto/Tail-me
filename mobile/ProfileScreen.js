import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, Animated, Dimensions, FlatList } from "react-native";
const { width: SW } = Dimensions.get("window");

const LEVELS = [
  { id: "scout",  label: "Scout",  icon: "🔍", min: 0,    color: "#94A3B8", desc: "Just getting started" },
  { id: "hunter", label: "Hunter", icon: "🎯", min: 10,   color: "#22C55E", desc: "Building momentum" },
  { id: "ranger", label: "Ranger", icon: "⚡", min: 100,  color: "#F59E0B", desc: "Serious catcher" },
  { id: "legend", label: "Legend", icon: "👑", min: 1000, color: "#7C3AED", desc: "Hall of fame" },
];

function getLevel(totalCatches) {
  let level = LEVELS[0];
  for (const l of LEVELS) { if (totalCatches >= l.min) level = l; }
  return level;
}

function getNextLevel(totalCatches) {
  for (const l of LEVELS) { if (totalCatches < l.min) return l; }
  return null;
}

const TYPE_COLOR = { NOW: "#F59E0B", DROP: "#EF4444", GEO: "#0EA5E9", CHAIN: "#22C55E", LOOK: "#7C3AED", GIFT: "#F43F8E" };

export default function ProfileScreen({ me, catches = [], myTails = [], following = [], followers = [], onBack, onOpenPassport, colors: C, streak = 0 }) {
  const [tab, setTab] = useState("tails");
  
  const totalCatches = catches.length;
  const totalSent = myTails.length;
  const totalCatchesOnMyTails = myTails.reduce((sum, t) => sum + (t.catchCount || 0), 0);
  const catchRate = totalSent > 0 ? Math.round((totalCatchesOnMyTails / (totalSent * 10)) * 100) : 0;
  const level = getLevel(totalCatchesOnMyTails);
  const nextLevel = getNextLevel(totalCatchesOnMyTails);
  const progress = nextLevel ? Math.min(1, totalCatchesOnMyTails / nextLevel.min) : 1;

  const bg = C?.bg || "#070A0F";
  const txt = C?.text || "#E5E7EB";
  const muted = C?.muted || "#94A3B8";
  const dim = C?.dim || "#64748B";
  const bdr = C?.border || "#1E293B";
  const panel = C?.panel || "#0D1220";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 }}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={{ marginBottom: 16 }}>
            <Text style={{ color: muted, fontWeight: "900" }}>← Back</Text>
          </TouchableOpacity>
        )}
        
        {/* Profile card */}
        <View style={{ backgroundColor: panel, borderRadius: 24, borderWidth: 1, borderColor: bdr, padding: 20, gap: 16 }}>
          
          {/* Avatar + name */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            {me?.photoUri ? (
              <Image source={{ uri: me.photoUri }} style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: level.color }} />
            ) : (
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: level.color + "30", borderWidth: 3, borderColor: level.color, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 30, fontWeight: "900", color: level.color }}>{(me?.username || "?")[0].toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: txt, fontWeight: "900", fontSize: 20 }}>@{me?.username}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: level.color + "20", borderWidth: 1, borderColor: level.color + "50" }}>
                  <Text style={{ color: level.color, fontWeight: "900", fontSize: 11 }}>{level.icon} {level.label}</Text>
                </View>
                {streak > 0 && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: "rgba(245,158,11,0.15)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)" }}>
                    <Text style={{ color: "#F59E0B", fontWeight: "900", fontSize: 11 }}>🔥 {streak}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Level progress */}
          {nextLevel && (
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: dim, fontSize: 11, fontWeight: "800" }}>{level.label}</Text>
                <Text style={{ color: dim, fontSize: 11, fontWeight: "800" }}>{totalCatchesOnMyTails}/{nextLevel.min} → {nextLevel.icon} {nextLevel.label}</Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: bdr }}>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: level.color, width: `${Math.max(2, progress * 100)}%` }} />
              </View>
              <Text style={{ color: dim, fontSize: 11 }}>{nextLevel.min - totalCatchesOnMyTails} more catches on your tails to reach {nextLevel.label}</Text>
            </View>
          )}
          {!nextLevel && (
            <View style={{ alignItems: "center", paddingVertical: 6 }}>
              <Text style={{ color: "#7C3AED", fontWeight: "900", fontSize: 13 }}>👑 Legend Status Achieved</Text>
            </View>
          )}

          {/* Stats row */}
          <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: bdr, paddingTop: 14, gap: 0 }}>
            {[
              { label: "Sent", value: totalSent },
              { label: "Catches", value: totalCatchesOnMyTails },
              { label: "Catch Rate", value: `${Math.min(catchRate, 100)}%` },
              { label: "Following", value: following.length },
              { label: "Followers", value: followers.length },
            ].map((s, i) => (
              <View key={s.label} style={{ flex: 1, alignItems: "center", borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: bdr }}>
                <Text style={{ color: txt, fontWeight: "900", fontSize: 16 }}>{s.value}</Text>
                <Text style={{ color: dim, fontSize: 9, fontWeight: "800", textTransform: "uppercase", marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 16 }}>
        {[
          { key: "tails", label: "🎬 My Tails" },
          { key: "catches", label: "🎯 Catches" },
          { key: "passport", label: "🛂 Passport" },
        ].map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={{ flex: 1, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: tab === t.key ? "#7C3AED" : bdr, backgroundColor: tab === t.key ? "rgba(124,58,237,0.15)" : "transparent", alignItems: "center" }}>
            <Text style={{ color: tab === t.key ? txt : muted, fontWeight: "900", fontSize: 11 }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* My Tails tab */}
      {tab === "tails" && (
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          {myTails.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 40, gap: 10 }}>
              <Text style={{ fontSize: 40 }}>🦊</Text>
              <Text style={{ color: muted, fontSize: 15, fontWeight: "900" }}>No tails sent yet</Text>
              <Text style={{ color: dim, fontSize: 13 }}>Your sent tails will appear here</Text>
            </View>
          ) : (
            myTails.slice(0, 20).map((tail, i) => {
              const color = TYPE_COLOR[tail.tailType] || "#7C3AED";
              const spotsLeft = tail.catchLimit != null ? Math.max(0, tail.catchLimit - (tail.catchCount || 0)) : null;
              return (
                <View key={tail.id || i} style={{ backgroundColor: panel, borderRadius: 16, borderWidth: 1, borderColor: bdr, padding: 14, gap: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: color + "20", borderWidth: 1, borderColor: color + "40" }}>
                        <Text style={{ color, fontWeight: "900", fontSize: 10 }}>{tail.tailType}</Text>
                      </View>
                      <Text style={{ color: dim, fontSize: 11 }}>{tail.expiresAt > Date.now() ? "🟢 Live" : "⚫ Expired"}</Text>
                    </View>
                    <Text style={{ color, fontWeight: "900", fontSize: 14 }}>🎯 {tail.catchCount || 0}</Text>
                  </View>
                  <Text style={{ color: txt, fontWeight: "800", fontSize: 14 }} numberOfLines={2}>{tail.message || "No message"}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: bdr }}>
                      <View style={{ height: 3, borderRadius: 2, backgroundColor: color, width: `${Math.max(2, Math.min(100, ((tail.catchCount || 0) / (tail.catchLimit || 10)) * 100))}%` }} />
                    </View>
                    {spotsLeft !== null && <Text style={{ color: dim, fontSize: 10, fontWeight: "800" }}>{spotsLeft} left</Text>}
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Catches tab */}
      {tab === "catches" && (
        <View style={{ paddingHorizontal: 20, gap: 8 }}>
          {catches.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 40, gap: 10 }}>
              <Text style={{ fontSize: 40 }}>🎯</Text>
              <Text style={{ color: muted, fontSize: 15, fontWeight: "900" }}>No catches yet</Text>
              <Text style={{ color: dim, fontSize: 13 }}>Go catch some tails!</Text>
            </View>
          ) : (
            catches.slice(0, 30).map((c, i) => {
              const color = TYPE_COLOR[c.tailType] || "#7C3AED";
              return (
                <View key={c.id || i} style={{ backgroundColor: panel, borderRadius: 14, borderWidth: 1, borderColor: bdr, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color + "20", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 18 }}>{c.tailType === "NOW" ? "⚡" : c.tailType === "DROP" ? "💧" : c.tailType === "GEO" ? "📍" : c.tailType === "CHAIN" ? "🔗" : "👀"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: txt, fontWeight: "800", fontSize: 13 }} numberOfLines={1}>{c.message || "Tail caught"}</Text>
                    <Text style={{ color: dim, fontSize: 11, marginTop: 2 }}>from @{c.from} · {c.timestamp ? new Date(c.timestamp).toLocaleDateString() : ""}</Text>
                  </View>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: color + "15", borderWidth: 1, borderColor: color + "30" }}>
                    <Text style={{ color, fontWeight: "900", fontSize: 9 }}>{c.tailType}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Passport tab */}
      {tab === "passport" && (
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <View style={{ padding: 16, borderRadius: 16, backgroundColor: panel, borderWidth: 1, borderColor: bdr, gap: 12 }}>
            <Text style={{ color: muted, fontWeight: "900", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Catch Passport</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {[
                { label: "Total Catches", value: catches.length, icon: "🎯" },
                { label: "Streak", value: streak, icon: "🔥" },
              ].map(s => (
                <View key={s.label} style={{ flex: 1, backgroundColor: bdr + "40", borderRadius: 12, padding: 12, alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 24 }}>{s.icon}</Text>
                  <Text style={{ color: txt, fontWeight: "900", fontSize: 20 }}>{s.value}</Text>
                  <Text style={{ color: dim, fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
          <TouchableOpacity onPress={onOpenPassport} style={{ backgroundColor: "rgba(124,58,237,0.1)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(124,58,237,0.3)", padding: 16, alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 28 }}>🛂</Text>
            <Text style={{ color: "#7C3AED", fontWeight: "900", fontSize: 15 }}>View Full Passport</Text>
            <Text style={{ color: dim, fontSize: 12 }}>Regions, stamps, top tails and more</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}
