import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";

export default function TailHome({
  me,
  publicCount = 0,
  inboxCount = 0,
  trending = [],
  allTails = [],
  onOpenPublic,
  onOpenPrivate,
  onOpenTail,
  colors: C,
  onReact,
  streak = 0,
  earnings = 0,
  isPro = false,
  onOpenEarnings,
  onOpenPro,
}) {
  if (!me) return null;

  // Live = expiring within 1 hour
  const liveTails = useMemo(() => {
    return allTails.filter((t) => {
      if (!t.expiresAt || t.expired) return false;
      const diff = new Date(t.expiresAt).getTime() - Date.now();
      return diff > 0 && diff < 60 * 60 * 1000;
    });
  }, [allTails]);

  const renderTailChip = (tail) => (
    <TouchableOpacity
      key={tail.id}
      onPress={() => onOpenTail(tail)}
      activeOpacity={0.8}
      style={{
        width: 220,
        marginRight: 12,
        backgroundColor: C.panel,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: C.border,
        padding: 12,
        gap: 6,
      }}
    >
      {!!tail.meta?.image || !!tail.mediaUrl ? (
        <Image
          source={{ uri: tail.mediaUrl || tail.meta?.image }}
          style={{ width: "100%", height: 110, borderRadius: 12 }}
          resizeMode="cover"
        />
      ) : null}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: C.muted, fontWeight: "900", fontSize: 11 }}>@{tail.from || "user"}</Text>
        <View style={{
          paddingVertical: 2, paddingHorizontal: 7, borderRadius: 999,
          borderWidth: 1, borderColor: C.border,
        }}>
          <Text style={{ color: C.brand, fontSize: 10, fontWeight: "900" }}>
            {(tail.tailType || "LOOK").toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={{ color: C.text, fontWeight: "900", fontSize: 13 }} numberOfLines={1}>
        {tail.meta?.title || tail.title || "Tail"}
      </Text>
      {!!tail.message && (
        <Text style={{ color: C.muted, fontSize: 12 }} numberOfLines={1}>
          {tail.message}
        </Text>
      )}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: C.dim, fontSize: 11 }}>🔥 {tail.catchCount || 0}</Text>
        <Text style={{ color: C.green, fontSize: 11, fontWeight: "800" }}>● Live</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* ── HEADER ── */}
      <View style={{
        paddingHorizontal: 16, paddingTop: 14,
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      }}>
        <View>
          <Text style={{ color: C.text, fontSize: 22, fontWeight: "900" }}>
            🦊 Tail Radar
          </Text>
          <Text style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>
            {liveTails.length > 0
              ? `${liveTails.length} live drop${liveTails.length > 1 ? "s" : ""} happening now`
              : "Catch moments — don't scroll"}
          </Text>
        </View>
        <TouchableOpacity onPress={onOpenPrivate}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 22 }}>📥</Text>
            {inboxCount > 0 && (
              <View style={{
                position: "absolute", top: -4, right: -6,
                backgroundColor: C.red, borderRadius: 10, paddingHorizontal: 5,
              }}>
                <Text style={{ color: "#fff", fontSize: 10, fontWeight: "900" }}>{inboxCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* ── STREAK + EARNINGS ROW ── */}
      <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 14 }}>
        {/* Streak */}
        <View style={{
          flex: 1, backgroundColor: C.panel, borderRadius: 18,
          borderWidth: 1, borderColor: streak > 0 ? C.amber : C.border,
          padding: 14, alignItems: "center", gap: 4,
        }}>
          <Text style={{ fontSize: 24 }}>{streak > 0 ? "🔥" : "💤"}</Text>
          <Text style={{ color: C.text, fontWeight: "900", fontSize: 18 }}>{streak}</Text>
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: "800" }}>Day Streak</Text>
          {streak > 0 && (
            <Text style={{ color: C.amber, fontSize: 10, fontWeight: "900" }}>Keep it going!</Text>
          )}
        </View>

        {/* Earnings */}
        <TouchableOpacity
          onPress={isPro ? onOpenEarnings : onOpenPro}
          style={{
            flex: 1, backgroundColor: C.panel, borderRadius: 18,
            borderWidth: 1, borderColor: isPro ? C.green : C.border,
            padding: 14, alignItems: "center", gap: 4,
          }}
        >
          <Text style={{ fontSize: 24 }}>{isPro ? "💰" : "🔒"}</Text>
          <Text style={{ color: isPro ? C.green : C.muted, fontWeight: "900", fontSize: 18 }}>
            {isPro ? `$${earnings.toFixed(2)}` : "Pro"}
          </Text>
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: "800" }}>
            {isPro ? "Earnings" : "Unlock affiliate"}
          </Text>
          {!isPro && (
            <Text style={{ color: C.brand, fontSize: 10, fontWeight: "900" }}>Upgrade →</Text>
          )}
        </TouchableOpacity>

        {/* Public count */}
        <TouchableOpacity
          onPress={onOpenPublic}
          style={{
            flex: 1, backgroundColor: C.panel, borderRadius: 18,
            borderWidth: 1, borderColor: C.border,
            padding: 14, alignItems: "center", gap: 4,
          }}
        >
          <Text style={{ fontSize: 24 }}>🌐</Text>
          <Text style={{ color: C.text, fontWeight: "900", fontSize: 18 }}>{publicCount}</Text>
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: "800" }}>Public</Text>
          <Text style={{ color: C.brand, fontSize: 10, fontWeight: "900" }}>Browse →</Text>
        </TouchableOpacity>
      </View>

      {/* ── LIVE NOW ── */}
      {liveTails.length > 0 && (
        <View style={{ marginTop: 22 }}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 10, gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.amber }} />
            <Text style={{ color: C.amber, fontWeight: "900", fontSize: 15 }}>Live Now</Text>
            <Text style={{ color: C.dim, fontSize: 12 }}>expiring within 1hr</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16, paddingRight: 6 }}>
            {liveTails.map(renderTailChip)}
          </ScrollView>
        </View>
      )}

      {/* ── TRENDING ── */}
      {trending.length > 0 && (
        <View style={{ marginTop: 22 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 10 }}>
            <Text style={{ color: C.text, fontWeight: "900", fontSize: 15 }}>🔥 Trending</Text>
            <TouchableOpacity onPress={onOpenPublic}>
              <Text style={{ color: C.brand, fontWeight: "900", fontSize: 12 }}>See all →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16, paddingRight: 6 }}>
            {trending.map(renderTailChip)}
          </ScrollView>
        </View>
      )}

      {/* ── EXPLORE (vertical list) ── */}
      <View style={{ marginTop: 22, paddingHorizontal: 16 }}>
        <Text style={{ color: C.text, fontWeight: "900", fontSize: 15, marginBottom: 10 }}>
          🌍 Explore
        </Text>

        {allTails.length === 0 && (
          <View style={{
            backgroundColor: C.panel, borderRadius: 18,
            borderWidth: 1, borderColor: C.border,
            padding: 28, alignItems: "center",
          }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🦊</Text>
            <Text style={{ color: C.muted, textAlign: "center" }}>
              No drops yet. Be the first to send one.
            </Text>
          </View>
        )}

        {allTails.slice(0, 10).map((tail) => (
          <TouchableOpacity
            key={tail.id}
            onPress={() => onOpenTail(tail)}
            activeOpacity={0.8}
            style={{
              backgroundColor: C.panel, borderRadius: 18,
              borderWidth: 1, borderColor: C.border,
              padding: 14, marginBottom: 10, gap: 8,
              opacity: tail.expired ? 0.5 : 1,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: C.muted, fontWeight: "900" }}>@{tail.from || "user"}</Text>
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                {tail.isAd && (
                  <View style={{
                    paddingVertical: 2, paddingHorizontal: 7, borderRadius: 999,
                    backgroundColor: C.amber + "30", borderWidth: 1, borderColor: C.amber,
                  }}>
                    <Text style={{ color: C.amber, fontSize: 10, fontWeight: "900" }}>AD</Text>
                  </View>
                )}
                <View style={{
                  paddingVertical: 2, paddingHorizontal: 7, borderRadius: 999,
                  borderWidth: 1, borderColor: C.border,
                }}>
                  <Text style={{ color: C.brand, fontSize: 10, fontWeight: "900" }}>
                    {(tail.tailType || "LOOK").toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {!!tail.mediaUrl && tail.mediaType === "image" ? (
              <Image source={{ uri: tail.mediaUrl }} style={{ width: "100%", height: 150, borderRadius: 14 }} resizeMode="cover" />
            ) : !!tail.meta?.image ? (
              <Image source={{ uri: tail.meta.image }} style={{ width: "100%", height: 150, borderRadius: 14 }} resizeMode="cover" />
            ) : null}

            <Text style={{ color: C.text, fontWeight: "900" }} numberOfLines={1}>
              {tail.meta?.title || tail.title || "Tail"}
            </Text>

            {!!tail.message && (
              <Text style={{ color: C.muted, fontSize: 13 }} numberOfLines={2}>"{tail.message}"</Text>
            )}

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: C.dim, fontSize: 12 }}>🔥 {tail.catchCount || 0} caught</Text>
              {tail.expired
                ? <Text style={{ color: C.red, fontSize: 12, fontWeight: "800" }}>Expired</Text>
                : <Text style={{ color: C.green, fontSize: 12, fontWeight: "800" }}>● Live</Text>
              }
            </View>

            {!!tail.reactionCount && tail.reactionCount > 0 && (
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                {Object.entries(tail.reactions || {}).slice(0, 4).map(([emoji, count]) => (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() => onReact?.(tail.id, emoji)}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 4,
                      paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999,
                      borderWidth: 1, borderColor: C.border,
                    }}
                  >
                    <Text style={{ fontSize: 12 }}>{emoji}</Text>
                    <Text style={{ color: C.muted, fontSize: 11 }}>{count}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}

        {allTails.length > 10 && (
          <TouchableOpacity onPress={onOpenPublic} style={{
            paddingVertical: 14, borderRadius: 16,
            borderWidth: 1, borderColor: C.border, alignItems: "center", marginBottom: 10,
          }}>
            <Text style={{ color: C.brand, fontWeight: "900" }}>See all {allTails.length} tails →</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}