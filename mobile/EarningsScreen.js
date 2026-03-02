import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";

export default function EarningsScreen({ me, colors: C, streak = 0, earnings = 0, tailStats = [], onBack, onOpenPro, isPro = false }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: C.muted, fontWeight: "900" }}>← Home</Text>
        </TouchableOpacity>
        <Text style={{ color: C.text, fontWeight: "900", fontSize: 18 }}>Earnings</Text>
        <Text style={{ color: C.dim, fontWeight: "800" }}>@{me?.username}</Text>
      </View>
      <View style={{ backgroundColor: C.panel, borderRadius: 20, padding: 20, alignItems: "center" }}>
        <Text style={{ fontSize: 40 }}>💰</Text>
        <Text style={{ color: C.text, fontWeight: "900", fontSize: 24, marginTop: 8 }}>Coming Soon</Text>
        <Text style={{ color: C.muted, marginTop: 4 }}>Track your earnings here</Text>
      </View>
    </ScrollView>
  );
}
