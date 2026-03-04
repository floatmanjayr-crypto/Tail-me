// ============================================
// GeoScreen.js — Tail Me
// ✅ Live map with tail markers
// ✅ Near me feed sorted by distance
// ✅ Radius filter (500m / 2km / 10km / Any)
// ✅ User location dot
// ✅ Tail type color coding on map
// ✅ Distance badges on cards
// ============================================

import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import * as Location from "expo-location";

const { width: SW } = Dimensions.get("window");

const RADII = [
  { label: "500m", meters: 500 },
  { label: "2km",  meters: 2000 },
  { label: "10km", meters: 10000 },
  { label: "Any",  meters: null },
];

const TYPE_COLORS = {
  LOOK: "#7C3AED",
  NOW:  "#EF4444",
  DROP: "#F59E0B",
  CHAIN:"#22C55E",
  GEO:  "#3B82F6",
};

// Haversine distance in meters
function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(m) {
  if (m == null) return "";
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

function PulseDot({ color = "#22C55E" }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: color, opacity: anim,
    }} />
  );
}

export default function GeoScreen({ tails = [], onOpenTail, onBack, colors: C }) {
  const [location, setLocation]     = useState(null);
  const [permError, setPermError]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const [radiusIdx, setRadiusIdx]   = useState(1); // default 2km
  const [selected, setSelected]     = useState(null);
  const mapRef = useRef(null);

  const radius = RADII[radiusIdx].meters;

  // Request location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { setPermError(true); setLoading(false); return; }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch (e) {
        setPermError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Geo tails = tails that have lat/lng
  const geoTails = tails.filter(t => t.geo?.lat != null && t.geo?.lng != null && !t.expired);

  // Tails with distance from user
  const withDist = geoTails.map(t => ({
    ...t,
    distance: location
      ? distanceMeters(location.lat, location.lng, t.geo.lat, t.geo.lng)
      : null,
  }));

  // Apply radius filter
  const filtered = withDist
    .filter(t => radius == null || t.distance == null || t.distance <= radius)
    .sort((a, b) => (a.distance ?? 99999) - (b.distance ?? 99999));

  const canCatch = (t) => {
    if (!t.geo?.radius) return true; // no geo lock
    if (!location) return false;
    return (t.distance ?? 0) <= t.geo.radius;
  };

  const focusOnTail = (t) => {
    setSelected(t);
    if (mapRef.current && t.geo) {
      mapRef.current.animateToRegion({
        latitude:  t.geo.lat,
        longitude: t.geo.lng,
        latitudeDelta:  0.01,
        longitudeDelta: 0.01,
      }, 600);
    }
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C?.bg || "#070A0F", alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={C?.brand || "#7C3AED"} size="large" />
      <Text style={{ color: C?.muted || "#94A3B8", marginTop: 12, fontWeight: "900" }}>Getting your location…</Text>
    </View>
  );

  if (permError) return (
    <View style={{ flex: 1, backgroundColor: C?.bg || "#070A0F", padding: 24, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>📍</Text>
      <Text style={{ color: C?.text || "#E5E7EB", fontWeight: "900", fontSize: 20, textAlign: "center" }}>Location needed</Text>
      <Text style={{ color: C?.muted || "#94A3B8", textAlign: "center", marginTop: 8 }}>
        Enable location to see tails near you and catch geo-locked drops.
      </Text>
      <TouchableOpacity onPress={onBack} style={{
        marginTop: 24, paddingVertical: 12, paddingHorizontal: 28,
        borderRadius: 14, borderWidth: 1, borderColor: C?.border || "#1E293B",
      }}>
        <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "900" }}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C?.bg || "#070A0F" }}>

      {/* ── HEADER ── */}
      <View style={{
        paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        borderBottomWidth: 1, borderBottomColor: C?.border || "#1E293B",
        backgroundColor: C?.panel || "#0D1220",
      }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "900" }}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <PulseDot color="#22C55E" />
          <Text style={{ color: C?.text || "#E5E7EB", fontWeight: "900", fontSize: 16 }}>
            Tail Map
          </Text>
        </View>
        <Text style={{ color: C?.dim || "#64748B", fontWeight: "800", fontSize: 12 }}>
          {filtered.length} near
        </Text>
      </View>

      {/* ── MAP ── */}
      {location && (
        <MapView
          ref={mapRef}
          style={{ width: "100%", height: 300 }}
          initialRegion={{
            latitude:        location.lat,
            longitude:       location.lng,
            latitudeDelta:   radius ? (radius / 111000) * 3 : 0.1,
            longitudeDelta:  radius ? (radius / 111000) * 3 : 0.1,
          }}
          mapType="mutedStandard"
          showsUserLocation
          showsMyLocationButton={false}
        >
          {/* User radius circle */}
          {radius && (
            <Circle
              center={{ latitude: location.lat, longitude: location.lng }}
              radius={radius}
              fillColor="rgba(124,58,237,0.06)"
              strokeColor="rgba(124,58,237,0.3)"
              strokeWidth={1}
            />
          )}

          {/* Tail markers */}
          {filtered.map(t => {
            const tc    = TYPE_COLORS[t.tailType] || TYPE_COLORS.LOOK;
            const isLocked = t.geo?.radius && !canCatch(t);
            const isSel = selected?.id === t.id;
            return (
              <Marker
                key={t.id}
                coordinate={{ latitude: t.geo.lat, longitude: t.geo.lng }}
                onPress={() => focusOnTail(t)}
              >
                <View style={{
                  width:  isSel ? 44 : 36,
                  height: isSel ? 44 : 36,
                  borderRadius: isSel ? 22 : 18,
                  backgroundColor: isLocked ? "#1E293B" : tc,
                  borderWidth: 2,
                  borderColor: isSel ? "#fff" : "rgba(255,255,255,0.3)",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: tc,
                  shadowOpacity: 0.6,
                  shadowRadius: 6,
                }}>
                  <Text style={{ fontSize: isSel ? 18 : 14 }}>
                    {isLocked ? "🔒"
                      : t.tailType === "LOOK"  ? "👀"
                      : t.tailType === "NOW"   ? "⚡"
                      : t.tailType === "DROP"  ? "💧"
                      : t.tailType === "CHAIN" ? "🔗"
                      : "📍"}
                  </Text>
                </View>
              </Marker>
            );
          })}
        </MapView>
      )}

      {/* No location fallback */}
      {!location && (
        <View style={{ height: 200, backgroundColor: C?.panel || "#0D1220", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: C?.dim || "#64748B" }}>Map unavailable</Text>
        </View>
      )}

      {/* ── RADIUS FILTER ── */}
      <View style={{
        flexDirection: "row", gap: 8, padding: 12,
        borderBottomWidth: 1, borderBottomColor: C?.border || "#1E293B",
        backgroundColor: C?.panel || "#0D1220",
      }}>
        {RADII.map((r, i) => {
          const active = radiusIdx === i;
          return (
            <TouchableOpacity
              key={r.label}
              onPress={() => setRadiusIdx(i)}
              style={{
                flex: 1, paddingVertical: 8, borderRadius: 12,
                borderWidth: 1,
                borderColor: active ? (C?.brand || "#7C3AED") : (C?.border || "#1E293B"),
                backgroundColor: active ? "rgba(124,58,237,0.18)" : "transparent",
                alignItems: "center",
              }}
            >
              <Text style={{ color: active ? (C?.text || "#E5E7EB") : (C?.muted || "#94A3B8"), fontWeight: "900", fontSize: 12 }}>
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── NEAR ME FEED ── */}
      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📍</Text>
            <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "900", fontSize: 16 }}>
              No tails near you
            </Text>
            <Text style={{ color: C?.dim || "#64748B", marginTop: 6, textAlign: "center" }}>
              Expand your radius or check back later
            </Text>
          </View>
        )}
        renderItem={({ item: t }) => {
          const tc     = TYPE_COLORS[t.tailType] || TYPE_COLORS.LOOK;
          const locked = t.geo?.radius && !canCatch(t);
          const isFull = t.catchLimit != null && t.catchCount >= t.catchLimit;
          return (
            <TouchableOpacity
              onPress={() => { focusOnTail(t); if (!locked && !isFull) onOpenTail?.(t); }}
              activeOpacity={0.85}
              style={{
                backgroundColor: C?.panel || "#0D1220",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: locked || isFull ? (C?.border || "#1E293B") : tc + "55",
                padding: 14,
                opacity: locked || isFull ? 0.6 : 1,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1, gap: 4 }}>
                  {/* Type + lock row */}
                  <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <View style={{
                      paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999,
                      backgroundColor: tc + "25",
                      borderWidth: 1, borderColor: tc + "50",
                    }}>
                      <Text style={{ color: tc, fontWeight: "900", fontSize: 10 }}>
                        {t.tailType === "LOOK" ? "👀" : t.tailType === "NOW" ? "⚡" : t.tailType === "DROP" ? "💧" : t.tailType === "CHAIN" ? "🔗" : "📍"} {t.tailType}
                      </Text>
                    </View>
                    {locked && (
                      <View style={{ paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999, backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" }}>
                        <Text style={{ color: "#EF4444", fontWeight: "900", fontSize: 10 }}>🔒 Get closer</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: C?.muted || "#94A3B8", fontWeight: "700", fontSize: 12 }}>@{t.from}</Text>
                  {!!t.message && (
                    <Text style={{ color: C?.text || "#E5E7EB", fontWeight: "800", fontSize: 14 }} numberOfLines={1}>
                      "{t.message}"
                    </Text>
                  )}
                </View>

                {/* Distance badge */}
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  {t.distance != null && (
                    <View style={{
                      paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
                      backgroundColor: "rgba(34,197,94,0.1)",
                      borderWidth: 1, borderColor: "rgba(34,197,94,0.3)",
                    }}>
                      <Text style={{ color: "#22C55E", fontWeight: "900", fontSize: 12 }}>
                        📍 {formatDist(t.distance)}
                      </Text>
                    </View>
                  )}
                  {t.geo?.radius && (
                    <Text style={{ color: C?.dim || "#64748B", fontSize: 10, fontWeight: "700" }}>
                      radius {formatDist(t.geo.radius)}
                    </Text>
                  )}
                </View>
              </View>

              {/* DROP bar */}
              {t.tailType === "DROP" && t.catchLimit != null && (
                <View style={{ marginTop: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ color: "#F59E0B", fontWeight: "900", fontSize: 11 }}>
                      {isFull ? "CLOSED" : `${Math.max(0, t.catchLimit - (t.catchCount || 0))} spots left`}
                    </Text>
                    <Text style={{ color: C?.dim || "#64748B", fontSize: 11 }}>
                      {t.catchCount || 0}/{t.catchLimit}
                    </Text>
                  </View>
                  <View style={{ height: 4, borderRadius: 999, backgroundColor: C?.border || "#1E293B" }}>
                    <View style={{
                      height: 4, borderRadius: 999,
                      width: `${Math.min(100, Math.round(((t.catchCount || 0) / t.catchLimit) * 100))}%`,
                      backgroundColor: isFull ? "#64748B" : "#F59E0B",
                    }} />
                  </View>
                </View>
              )}

              {/* Catch button */}
              {!locked && !isFull && !t.expired && (
                <View style={{
                  marginTop: 10, paddingVertical: 10, borderRadius: 12,
                  backgroundColor: tc,
                  alignItems: "center",
                }}>
                  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 13 }}>
                    🎯 Catch this Tail
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}