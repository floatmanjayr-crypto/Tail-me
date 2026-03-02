import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";

const FEATURES = [
  { icon: "💰", title: "Affiliate Earnings", desc: "Earn commission on every catch", free: false },
  { icon: "🔗", title: "Tracked Links", desc: "See clicks per tail", free: false },
  { icon: "📊", title: "Full Analytics", desc: "Conversion rates, earnings dashboard", free: false },
  { icon: "⚡", title: "Boosted Reach", desc: "Tails shown to more users", free: false },
  { icon: "🎯", title: "Catch & Send Tails", desc: "Full access to the feed", free: true },
  { icon: "🔥", title: "Streak Tracking", desc: "Daily catch streaks", free: true },
  { icon: "🌐", title: "Public & Private Tails", desc: "Send to anyone", free: true },
  { icon: "🎟", title: "Coupon Reveals", desc: "Share codes and links", free: true },
];

export default function ProScreen({ colors: C, onBack, onUpgrade, isPro = false }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: C.muted, fontWeight: "900" }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: C.text, fontWeight: "900", fontSize: 18 }}>Tail Me Pro</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Hero */}
      <View style={{
        backgroundColor: C.brand + "20", borderRadius: 24,
        borderWidth: 1, borderColor: C.brand,
        padding: 24, alignItems: "center", marginBottom: 16,
      }}>
        <Text style={{ fontSize: 48 }}>🦊</Text>
        <Text style={{ color: C.text, fontWeight: "900", fontSize: 24, marginTop: 10 }}>
          {isPro ? "You're on Pro ✨" : "Go Pro"}
        </Text>
        <Text style={{ color: C.muted, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
          {isPro
            ? "Affiliate earnings, tracked links, and boosted reach are all active."
            : "Turn your tails into income. Earn commission every time someone catches your tail and clicks through."}
        </Text>

        {!isPro && (
          <View style={{ marginTop: 16, alignItems: "center" }}>
            <Text style={{ color: C.text, fontWeight: "900", fontSize: 32 }}>$9.99</Text>
            <Text style={{ color: C.dim, fontSize: 13 }}>per month</Text>
          </View>
        )}
      </View>

      {/* Feature list */}
      <Text style={{ color: C.muted, fontWeight: "900", marginBottom: 10, fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>
        What's included
      </Text>
      {FEATURES.map((f) => (
        <View key={f.title} style={{
          flexDirection: "row", alignItems: "center", gap: 14,
          backgroundColor: C.panel, borderRadius: 16,
          borderWidth: 1, borderColor: f.free ? C.border : C.brand + "60",
          padding: 14, marginBottom: 8,
        }}>
          <Text style={{ fontSize: 22 }}>{f.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontWeight: "900" }}>{f.title}</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{f.desc}</Text>
          </View>
          <View style={{
            paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
            backgroundColor: f.free ? C.border : C.brand + "30",
            borderWidth: 1, borderColor: f.free ? C.border : C.brand,
          }}>
            <Text style={{
              color: f.free ? C.dim : C.brand,
              fontWeight: "900", fontSize: 11,
            }}>
              {f.free ? "FREE" : "PRO"}
            </Text>
          </View>
        </View>
      ))}

      {/* CTA */}
      {!isPro && (
        <TouchableOpacity
          onPress={onUpgrade}
          style={{
            marginTop: 16, paddingVertical: 16, borderRadius: 18,
            backgroundColor: C.brand, alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
            Upgrade to Pro — $9.99/mo
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4 }}>
            Cancel anytime
          </Text>
        </TouchableOpacity>
      )}

      {isPro && (
        <View style={{
          marginTop: 16, paddingVertical: 16, borderRadius: 18,
          borderWidth: 1, borderColor: C.green, alignItems: "center",
        }}>
          <Text style={{ color: C.green, fontWeight: "900", fontSize: 16 }}>✅ Pro Active</Text>
          <Text style={{ color: C.dim, fontSize: 12, marginTop: 4 }}>Next billing date: Mar 25, 2026</Text>
        </View>
      )}
    </ScrollView>
  );
}