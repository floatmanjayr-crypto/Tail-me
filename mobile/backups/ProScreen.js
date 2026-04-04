import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";

export default function ProScreen({ me, colors: C, onBack, onUpgrade, isPro = false }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: C.muted, fontWeight: "900" }}>← Home</Text>
        </TouchableOpacity>
        <Text style={{ color: C.text, fontWeight: "900", fontSize: 18 }}>Tail Me Pro</Text>
        <Text style={{ color: C.dim, fontWeight: "800" }}>@{me?.username}</Text>
      </View>
      <View style={{ backgroundColor: C.brand + "18", borderRadius: 20, padding: 24, alignItems: "center" }}>
        <Text style={{ fontSize: 48 }}>⭐</Text>
        <Text style={{ color: C.text, fontWeight: "900", fontSize: 24, marginTop: 8 }}>Upgrade to Pro</Text>
        <Text style={{ color: C.muted, marginTop: 4 }}>Coming Soon</Text>
      </View>
    </ScrollView>
  );
}
