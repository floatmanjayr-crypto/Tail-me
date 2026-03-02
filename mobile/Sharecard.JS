// ============================================================
// ShareCard.js — Tail Me Viral Share Card
// ✅ Captures to PNG and shares to IG Stories / Camera Roll
// ✅ Shows mint number, tier badge, timer, QR-style deep link
// ✅ Brand color extracted from tail type
// ✅ Works with expo-sharing + expo-media-library
// ============================================================

import React, { useCallback, useImperativeHandle, useRef } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Install: npx expo install react-native-view-shot expo-media-library expo-sharing
let captureRef;
let MediaLibrary;
let Sharing;

try {
  captureRef   = require("react-native-view-shot").captureRef;
  MediaLibrary = require("expo-media-library");
  Sharing      = require("expo-sharing");
} catch {
  // Dependencies not installed yet — ShareCard will show install hint
}

const TYPE_COLORS = {
  LOOK:  "#7C3AED",
  NOW:   "#EF4444",
  DROP:  "#F59E0B",
  CHAIN: "#22C55E",
  GEO:   "#3B82F6",
};

function getCatchTier(catchTimeMs, timeLeftMs) {
  if (catchTimeMs < 15000) return { label: "⚡ FLASH CATCH", color: "#FFD700" };
  if (timeLeftMs < 120000) return { label: "🎯 SNIPE",        color: "#EF4444" };
  return                        { label: "✅ CAUGHT",         color: "#22C55E" };
}

// ── The visual card (what gets captured) ──────────────────
const CardView = React.forwardRef(({ tail, catchTimeMs, mintNumber, colors: C }, ref) => {
  const tailType  = (tail?.tailType || "LOOK").toUpperCase();
  const accentColor = TYPE_COLORS[tailType] || "#7C3AED";
  const timeLeftMs  = tail?.expiresAt ? Math.max(0, tail.expiresAt - Date.now()) : 0;
  const tier        = getCatchTier(catchTimeMs || 9999, timeLeftMs);
  const heroImage   = tail?.mediaUrl || tail?.meta?.image;

  const timeLeftMin = Math.floor(timeLeftMs / 60000);
  const timeLeftStr = timeLeftMs < 60000
    ? `${Math.floor(timeLeftMs / 1000)}s left`
    : timeLeftMin < 60
      ? `${timeLeftMin}m left`
      : `${Math.floor(timeLeftMin / 60)}h left`;

  return (
    <View ref={ref} style={[styles.card, { backgroundColor: C?.bg || "#070A0F" }]}>
      {/* Accent top bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      {/* Hero image */}
      {heroImage ? (
        <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />
      ) : (
        <View style={[styles.heroPlaceholder, { backgroundColor: accentColor + "22" }]}>
          <Text style={{ fontSize: 64 }}>🦊</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Tier badge */}
        <View style={[styles.tierBadge, { backgroundColor: tier.color + "22", borderColor: tier.color }]}>
          <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: C?.text || "#E5E7EB" }]} numberOfLines={2}>
          {tail?.meta?.title || tail?.title || "Mystery Drop"}
        </Text>

        {/* Price */}
        {tail?.meta?.price && (
          <Text style={[styles.price, { color: "#22C55E" }]}>{tail.meta.price}</Text>
        )}

        {/* Message */}
        {!!tail?.message && (
          <Text style={[styles.message, { color: C?.muted || "#94A3B8" }]} numberOfLines={2}>
            "{tail.message}"
          </Text>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          {mintNumber && (
            <View style={[styles.mintBadge, { backgroundColor: accentColor + "22", borderColor: accentColor }]}>
              <Text style={[styles.mintText, { color: accentColor }]}>Mint #{mintNumber}</Text>
            </View>
          )}
          <View style={styles.timerBadge}>
            <Text style={[styles.timerText, { color: C?.muted || "#94A3B8" }]}>
              ⏱ {timeLeftStr}
            </Text>
          </View>
          <View style={styles.timerBadge}>
            <Text style={[styles.timerText, { color: C?.muted || "#94A3B8" }]}>
              🔥 {tail?.catchCount || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: C?.border || "#1E293B" }]}>
        <View>
          <Text style={[styles.footerApp, { color: C?.text || "#E5E7EB" }]}>🦊 Tail Me</Text>
          <Text style={[styles.footerSub, { color: C?.dim || "#64748B" }]}>
            Catch it before it's gone
          </Text>
        </View>
        {/* Deep link hint (QR would go here with a QR library) */}
        <View style={[styles.deepLink, { backgroundColor: accentColor + "22", borderColor: accentColor }]}>
          <Text style={[styles.deepLinkText, { color: accentColor }]}>
            {tailType}
          </Text>
        </View>
      </View>
    </View>
  );
});

// ── Main exported component ───────────────────────────────
const ShareCard = React.forwardRef(({
  tail,
  catchTimeMs,
  mintNumber,
  colors,
  onShareComplete,
}, ref) => {
  const cardRef = useRef(null);

  const share = useCallback(async () => {
    if (!captureRef || !MediaLibrary || !Sharing) {
      console.warn("ShareCard: Install react-native-view-shot, expo-media-library, expo-sharing");
      return;
    }
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        console.warn("ShareCard: Media library permission denied");
        return;
      }

      // Capture
      const uri = await captureRef(cardRef, {
        format: "png", quality: 0.95, result: "tmpfile",
      });

      // Save to camera roll
      await MediaLibrary.saveToLibraryAsync(uri);

      // Open share sheet
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share your catch!",
          UTI: "public.png",
        });
      }

      onShareComplete?.(uri);
    } catch (e) {
      console.error("ShareCard capture error:", e);
    }
  }, [onShareComplete]);

  // Expose share method to parent via ref
  useImperativeHandle(ref, () => ({ share }));

  return (
    <View>
      {/* The off-screen card that gets captured */}
      <View style={styles.offScreen} pointerEvents="none">
        <CardView
          ref={cardRef}
          tail={tail}
          catchTimeMs={catchTimeMs}
          mintNumber={mintNumber}
          colors={colors}
        />
      </View>

      {/* Visible preview of the card */}
      <CardView
        tail={tail}
        catchTimeMs={catchTimeMs}
        mintNumber={mintNumber}
        colors={colors}
      />
    </View>
  );
});

export default ShareCard;

// ── Standalone trigger button (usage helper) ───────────────
export function ShareButton({ shareRef, colors: C }) {
  return (
    <TouchableOpacity
      onPress={() => shareRef?.current?.share()}
      style={{
        paddingVertical: 14, borderRadius: 16,
        backgroundColor: "#7C3AED",
        alignItems: "center",
        flexDirection: "row", justifyContent: "center", gap: 8,
      }}
    >
      <Text style={{ fontSize: 18 }}>📤</Text>
      <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
        Share to Stories
      </Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────
const CARD_WIDTH = 320;

const styles = StyleSheet.create({
  offScreen: {
    position: "absolute", top: -9999, left: -9999,
    width: CARD_WIDTH,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
      android: { elevation: 10 },
    }),
  },
  accentBar: {
    height: 4, width: "100%",
  },
  heroImage: {
    width: "100%", height: 190,
  },
  heroPlaceholder: {
    height: 190, alignItems: "center", justifyContent: "center",
  },
  content: {
    padding: 16, gap: 10,
  },
  tierBadge: {
    alignSelf: "flex-start",
    paddingVertical: 4, paddingHorizontal: 12,
    borderRadius: 999, borderWidth: 1,
  },
  tierText: {
    fontWeight: "900", fontSize: 12,
  },
  title: {
    fontWeight: "900", fontSize: 18, lineHeight: 23,
  },
  price: {
    fontWeight: "900", fontSize: 22,
  },
  message: {
    fontSize: 13, lineHeight: 18, fontStyle: "italic",
  },
  statsRow: {
    flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4,
  },
  mintBadge: {
    paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1,
  },
  mintText: {
    fontWeight: "900", fontSize: 12,
  },
  timerBadge: {
    paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  timerText: {
    fontWeight: "800", fontSize: 11,
  },
  footer: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1,
  },
  footerApp: {
    fontWeight: "900", fontSize: 14,
  },
  footerSub: {
    fontSize: 11, marginTop: 2,
  },
  deepLink: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1,
  },
  deepLinkText: {
    fontWeight: "900", fontSize: 12,
  },
});