// ============================================
// FollowingScreen.js — Following Feed + List
// ============================================
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import TailCard from "./TailCard";
import FollowButton from "./FollowButton";

export default function FollowingScreen({
  me,
  following,
  followingFeed,
  feedLoading,
  onRefreshFeed,
  isFollowing,
  onFollow,
  onUnfollow,
  onOpenTail,
  onBack,
  colors: C,
}) {
  const [tab, setTab] = useState("feed"); // "feed" | "list"

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: C.muted, fontWeight: "900" }}>← Home</Text>
        </TouchableOpacity>
        <Text style={{ color: C.text, fontWeight: "900", fontSize: 18 }}>
          Following
        </Text>
        <Text style={{ color: C.dim, fontWeight: "800" }}>
          {following.length}
        </Text>
      </View>

      {/* Tab switcher */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginBottom: 12,
        }}
      >
        {["feed", "list"].map((t) => {
          const active = tab === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: active ? C.brand : C.border,
                backgroundColor: active ? `${C.brand}20` : "transparent",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: active ? C.text : C.muted,
                  fontWeight: "900",
                  fontSize: 13,
                }}
              >
                {t === "feed" ? "📬 Feed" : "👥 People"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Feed tab */}
      {tab === "feed" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={feedLoading}
              onRefresh={onRefreshFeed}
              tintColor={C.brand}
            />
          }
        >
          {followingFeed.length === 0 && !feedLoading && (
            <View
              style={{
                marginTop: 40,
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 40 }}>📭</Text>
              <Text
                style={{
                  color: C.muted,
                  fontWeight: "800",
                  textAlign: "center",
                }}
              >
                {following.length === 0
                  ? "You're not following anyone yet.\nFollow users to see their tails here!"
                  : "No recent tails from people you follow."}
              </Text>
            </View>
          )}

          {followingFeed.map((t, i) => (
            <TailCard
              key={t?.id ?? `ff-${i}`}
              tail={t}
              onPressTail={onOpenTail}
              colors={C}
            />
          ))}
        </ScrollView>
      )}

      {/* List tab */}
      {tab === "list" && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {following.length === 0 && (
            <View
              style={{
                marginTop: 40,
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 40 }}>👀</Text>
              <Text
                style={{
                  color: C.muted,
                  fontWeight: "800",
                  textAlign: "center",
                }}
              >
                You're not following anyone yet.
              </Text>
            </View>
          )}

          {following.map((username) => (
            <View
              key={username}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 12,
                paddingHorizontal: 14,
                marginBottom: 8,
                borderRadius: 14,
                backgroundColor: C.panel,
                borderWidth: 1,
                borderColor: C.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: `${C.brand}20`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 16 }}>👤</Text>
                </View>
                <Text style={{ color: C.text, fontWeight: "800", fontSize: 14 }}>
                  @{username}
                </Text>
              </View>

              <FollowButton
                targetUsername={username}
                currentUsername={me?.username}
                isFollowing={isFollowing}
                onFollow={onFollow}
                onUnfollow={onUnfollow}
                colors={C}
                size="small"
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
