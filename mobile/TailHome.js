import React from "react";
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
  onOpenPublic,
  onOpenPrivate,
  onOpenTail,
  colors: C,
  onReact,
}) {
  if (!me) return null;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ color: C.brand, fontSize: 28 }}>🦊</Text>
          <Text style={{ color: C.text, fontSize: 22, fontWeight: "900" }}>Tail Me</Text>
        </View>
        <Text style={{ color: C.muted, fontWeight: "800" }}>@{me.username}</Text>
      </View>

      {/* Stats Row */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <TouchableOpacity
          onPress={onOpenPublic}
          style={{
            flex: 1,
            backgroundColor: C.panel,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: C.border,
            padding: 16,
            alignItems: "center",
            gap: 6,
          }}
        >
          <Text style={{ color: C.brand, fontSize: 22, fontWeight: "900" }}>{publicCount}</Text>
          <Text style={{ color: C.muted, fontWeight: "800" }}>Public</Text>
          <Text style={{ color: C.dim, fontSize: 12 }}>Tap to browse →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenPrivate}
          style={{
            flex: 1,
            backgroundColor: C.panel,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: C.border,
            padding: 16,
            alignItems: "center",
            gap: 6,
          }}
        >
          <Text style={{ color: C.green, fontSize: 22, fontWeight: "900" }}>{inboxCount}</Text>
          <Text style={{ color: C.muted, fontWeight: "800" }}>Inbox</Text>
          <Text style={{ color: C.dim, fontSize: 12 }}>Private tails →</Text>
        </TouchableOpacity>
      </View>

      {/* Trending / Smart Feed */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ color: C.text, fontWeight: "900", fontSize: 16, marginBottom: 12 }}>
          🔥 Trending
        </Text>

        {trending.length === 0 && (
          <View
            style={{
              backgroundColor: C.panel,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: C.border,
              padding: 24,
              alignItems: "center",
            }}
          >
            <Text style={{ color: C.dim, textAlign: "center" }}>
              No tails yet. Be the first to send one!
            </Text>
          </View>
        )}

        {trending.map((tail) => (
          <TouchableOpacity
            key={tail.id}
            onPress={() => onOpenTail(tail)}
            activeOpacity={0.8}
            style={{
              backgroundColor: C.panel,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: C.border,
              padding: 14,
              marginBottom: 10,
              gap: 8,
            }}
          >
            {/* Top row */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: C.muted, fontWeight: "900" }}>@{tail.from || "user"}</Text>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                {tail.isAd && (
                  <View
                    style={{
                      paddingVertical: 3,
                      paddingHorizontal: 8,
                      borderRadius: 999,
                      backgroundColor: C.amber + "30",
                      borderWidth: 1,
                      borderColor: C.amber,
                    }}
                  >
                    <Text style={{ color: C.amber, fontSize: 10, fontWeight: "900" }}>AD</Text>
                  </View>
                )}
                <View
                  style={{
                    paddingVertical: 3,
                    paddingHorizontal: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: C.border,
                    backgroundColor: "rgba(255,255,255,0.04)",
                  }}
                >
                  <Text style={{ color: C.brand, fontSize: 11, fontWeight: "900" }}>
                    {(tail.tailType || "LOOK").toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Image */}
            {!!tail.mediaUrl && tail.mediaType === "image" ? (
              <Image
                source={{ uri: tail.mediaUrl }}
                style={{ width: "100%", height: 140, borderRadius: 14, borderWidth: 1, borderColor: C.border }}
                resizeMode="cover"
              />
            ) : !!tail.meta?.image ? (
              <Image
                source={{ uri: tail.meta.image }}
                style={{ width: "100%", height: 140, borderRadius: 14, borderWidth: 1, borderColor: C.border }}
                resizeMode="cover"
              />
            ) : null}

            {/* Title */}
            {!!(tail.meta?.title || tail.title) && (
              <Text style={{ color: C.text, fontWeight: "900" }} numberOfLines={1}>
                {tail.meta?.title || tail.title}
              </Text>
            )}

            {/* Message */}
            {!!tail.message && (
              <Text style={{ color: C.muted }} numberOfLines={2}>
                {tail.message}
              </Text>
            )}

            {/* Footer */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: C.dim, fontSize: 12 }}>
                🔥 {Number(tail.catchCount || 0)} caught
              </Text>
              {tail.expired ? (
                <Text style={{ color: C.red, fontSize: 12, fontWeight: "800" }}>Expired</Text>
              ) : (
                <Text style={{ color: C.green, fontSize: 12, fontWeight: "800" }}>Live</Text>
              )}
            </View>

            {/* Reactions */}
            {!!tail.reactionCount && tail.reactionCount > 0 && (
              <View style={{ flexDirection: "row", gap: 6 }}>
                {Object.entries(tail.reactions || {}).slice(0, 5).map(([emoji, count]) => (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() => onReact(tail.id, emoji)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: C.border,
                      backgroundColor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <Text>{emoji}</Text>
                    <Text style={{ color: C.muted, fontSize: 11 }}>{count}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}