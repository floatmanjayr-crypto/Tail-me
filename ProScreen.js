import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";

export default function ProScreen({ me, colors: C, onBack, onUpgrade, isPro = false }) {
  const features = [
    { icon: "💰", title: "Affiliate Earnings", desc: "Earn commission on every catch" },
    { icon: "📊", title: "Advanced Analytics", desc: "Track clicks, catches, and revenue per tail" },
    { icon: "🚀", title: "Boosted Tails", desc: "Promote your tails to trending" },
    { icon: "🎨", title: "Custom Themes", desc: "Unlock exclusive color schemes" },
    { icon: "🔥", title: "Streak Bonuses", desc: "+10% commission with 7-day streaks" },
    { icon: "⚡", title: "Unlimited Tails", desc: "Send as many tails as you want" },
    { icon: "🎁", title: "Early Access", desc: "Try new features before anyone else" },
    { icon: "🏆", title: "Pro Badge", desc: "Show off your creator status" },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: C.muted, fontWeight: "900" }}>← Home</Text>
        </TouchableOpacity>
        <Text style={{ color: C.text, fontWeight: "900", fontSize: 18 }}>Tail Me Pro</Text>
        <Text style={{ color: C.dim, fontWeight: "800" }}>@{me?.username}</Text>
      </View>

      {isPro ? (
        <View style={{
          backgroundColor: C.green + "18",
          borderRadius: 20, borderWidth: 1, borderColor: C.green,
          padding: 24, alignItems: "center", marginBottom: 20,
        }}>
          <Text style={{ fontSize: 48 }}>🎉</Text>
          <Text style={{ color: C.text, fontWeight: "900", fontSize: 24, marginTop: 12 }}>
            You're Pro!
          </Text>
          <Text style={{ color: C.muted, textAlign: "center", marginTop: 6 }}>
            You have access to all premium features.
          </Text>
        </View>
      ) : (
        <View style={{
          backgroundColor: C.brand + "18",
          borderRadius: 20, borderWidth: 1, borderColor: C.brand,
          padding: 24, alignItems: "center", marginBottom: 20,
        }}>
          <Text style={{ fontSize: 48 }}>⭐</Text>
          <Text style={{ color: C.text, fontWeight: "900", fontSize: 28, marginTop: 12 }}>
            Upgrade to Pro
          </Text>
          <Text style={{ color: C.muted, textAlign: "center", marginTop: 6, fontSize: 15 }}>
            Turn your tails into income
          </Text>
          
          <View style={{
            flexDirection: "row", alignItems: "baseline", marginTop: 16,
          }}>
            <Text style={{ color: C.text, fontWeight: "900", fontSize: 42 }}>$4.99</Text>
            <Text style={{ color: C.muted, fontWeight: "800", fontSize: 16, marginLeft: 6 }}>/month</Text>
          </View>

          <TouchableOpacity onPress={onUpgrade} style={{
            marginTop: 20, paddingVertical: 14, paddingHorizontal: 40,
            borderRadius: 16, backgroundColor: C.brand,
          }}>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Start Free Trial →</Text>
          </TouchableOpacity>
          
          <Text style={{ color: C.dim, fontSize: 12, marginTop: 10 }}>
            7 days free · Cancel anytime
          </Text>
        </View>
      )}

      <Text style={{ color: C.text, fontWeight: "900", fontSize: 18, marginBottom: 12 }}>
        What's Included
      </Text>
      
      {features.map((f, i) => (
        <View key={i} style={{
          backgroundColor: C.panel,
          borderRadius: 16, borderWidth: 1, borderColor: C.border,
          padding: 16, marginBottom: 10,
          flexDirection: "row", alignItems: "center", gap: 14,
        }}>
          <Text style={{ fontSize: 32 }}>{f.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontWeight: "900", fontSize: 15 }}>{f.title}</Text>
            <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{f.desc}</Text>
          </View>
          {isPro && (
            <Text style={{ color: C.green, fontSize: 18 }}>✓</Text>
          )}
        </View>
      ))}

      <View style={{ marginTop: 20 }}>
        <Text style={{ color: C.text, fontWeight: "900", fontSize: 18, marginBottom: 12 }}>
          FAQ
        </Text>
        
        {[
          { q: "How do I earn money?", a: "You earn a commission when people catch your tails and click your affiliate links." },
          { q: "When do I get paid?", a: "Payouts happen every Monday via PayPal. Minimum payout is $10." },
          { q: "Can I cancel anytime?", a: "Yes! Cancel from Settings. You'll keep Pro until the end of your billing period." },
        ].map((faq, i) => (
          <View key={i} style={{
            backgroundColor: C.panel,
            borderRadius: 14, borderWidth: 1, borderColor: C.border,
            padding: 14, marginBottom: 8,
          }}>
            <Text style={{ color: C.text, fontWeight: "900", marginBottom: 4 }}>{faq.q}</Text>
            <Text style={{ color: C.muted, fontSize: 13 }}>{faq.a}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
