import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";

export default function EarningsScreen({ me, colors: C, streak = 0, earnings = 0, tailStats = [], onBack, onOpenPro, isPro = false }) {
  const totalClicks = tailStats.reduce((s, t) => s + (t.clicks || 0), 0);
  const totalCatches = tailStats.reduce((s, t) => s + (t.catchCount || 0), 0);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: C.muted, fontWeight: "900" }}>← Home</Text>
        </TouchableOpacity>
        <Text style={{ color: C.text, fontWeight: "900", fontSize: 18 }}>Earnings</Text>
        <Text style={{ color: C.dim, fontWeight: "800" }}>@{me?.username}</Text>
      </View>

      {/* Streak card */}
      <View style={{
        backgroundColor: streak > 0 ? C.amber + "18" : C.panel,
        borderRadius: 20, borderWidth: 1,
        borderColor: streak > 0 ? C.amber : C.border,
        padding: 20, alignItems: "center", marginBottom: 12,
      }}>
        <Text style={{ fontSize: 40 }}>{streak > 0 ? "🔥" : "💤"}</Text>
        <Text style={{ color: C.text, fontWeight: "900", fontSize: 36, marginTop: 4 }}>{streak}</Text>
        <Text style={{ color: streak > 0 ? C.amber : C.muted, fontWeight: "900", fontSize: 16 }}>
          Day Catch Streak
        </Text>
        <Text style={{ color: C.dim, fontSize: 12, marginTop: 6, textAlign: "center" }}>
          {streak === 0
            ? "Catch a tail today to start your streak"
            : streak < 7
            ? `${7 - streak} more days to unlock bonus commission`
            : "🎉 Streak bonus active — +10% commission"}
        </Text>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
        {[
          { label: "Total Catches", value: totalCatches, icon: "🎯" },
          { label: "Link Clicks", value: totalClicks, icon: "👆" },
          { label: "Tails Sent", value: tailStats.length, icon: "🦊" },
        ].map((s) => (
          <View key={s.label} style={{
            flex: 1, backgroundColor: C.panel, borderRadius: 16,
            borderWidth: 1, borderColor: C.border, padding: 12, alignItems: "center", gap: 4,
          }}>
            <Text style={{ fontSize: 20 }}>{s.icon}</Text>
            <Text style={{ color: C.text, fontWeight: "900", fontSize: 18 }}>{s.value}</Text>
            <Text style={{ color: C.muted, fontSize: 10, fontWeight: "800", textAlign: "center" }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Earnings card */}
      {isPro ? (
        <View style={{
          backgroundColor: C.green + "18", borderRadius: 20,
          borderWidth: 1, borderColor: C.green, padding: 20,
          alignItems: "center", marginBottom: 12,
        }}>
          <Text style={{ color: C.muted, fontWeight: "900", marginBottom: 4 }}>Total Earned</Text>
          <Text style={{ color: C.green, fontWeight: "900", fontSize: 42 }}>${earnings.toFixed(2)}</Text>
          <Text style={{ color: C.dim, fontSize: 12, marginTop: 6 }}>Payouts every Monday · Min $10</Text>
          <TouchableOpacity style={{
            marginTop: 14, paddingVertical: 10, paddingHorizontal: 24,
            borderRadius: 14, borderWidth: 1, borderColor: C.green,
          }}>
            <Text style={{ color: C.green, fontWeight: "900" }}>Request Payout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={onOpenPro} style={{
          backgroundColor: C.brand + "18", borderRadius: 20,
          borderWidth: 1, borderColor: C.brand, padding: 20,
          alignItems: "center", marginBottom: 12,
        }}>
          <Text style={{ fontSize: 36 }}>💰</Text>
          <Text style={{ color: C.text, fontWeight: "900", fontSize: 18, marginTop: 8 }}>
            Unlock Affiliate Earnings
          </Text>
          <Text style={{ color: C.muted, fontSize: 13, textAlign: "center", marginTop: 6 }}>
            Pro users earn commission on every catch. Your {totalCatches} catches could be generating real money.
          </Text>
          <View style={{
            marginTop: 14, paddingVertical: 12, paddingHorizontal: 28,
            borderRadius: 14, backgroundColor: C.brand,
          }}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>Upgrade to Pro →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Per-tail breakdown */}
      {tailStats.length > 0 && (
        <View>
          <Text style={{ color: C.text, fontWeight: "900", fontSize: 15, marginBottom: 10 }}>
            Tail Performance
          </Text>
          {tailStats.map((t, i) => (
            <View key={i} style={{
              backgroundColor: C.panel, borderRadius: 16,
              borderWidth: 1, borderColor: C.border,
              padding: 14, marginBottom: 8,
              flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontWeight: "900" }} numberOfLines={1}>
                  {t.title || "Tail"}
                </Text>
                <Text style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>
                  {(t.tailType || "LOOK")} · {t.catchCount || 0} catches · {t.clicks || 0} clicks
                </Text>
              </View>
              {isPro && (
                <Text style={{ color: C.green, fontWeight: "900", fontSize: 16 }}>
                  ${((t.earnings) || 0).toFixed(2)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}