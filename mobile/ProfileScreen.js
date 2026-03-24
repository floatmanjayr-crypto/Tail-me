// ============================================
// ProfileScreen.js — User Profile (self + others)
// ============================================
import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { socket } from "./socket";
import TailCard from "./TailCard";
import FollowButton from "./FollowButton";

const LEVELS = [
  { id: "scout",  label: "Scout",  icon: "🔍", min: 0,    color: "#94A3B8" },
  { id: "hunter", label: "Hunter", icon: "🎯", min: 10,   color: "#22C55E" },
  { id: "ranger", label: "Ranger", icon: "⚡", min: 100,  color: "#F59E0B" },
  { id: "legend", label: "Legend", icon: "👑", min: 1000, color: "#7C3AED" },
];

function getLevel(count) {
  let level = LEVELS[0];
  for (const l of LEVELS) { if (count >= l.min) level = l; }
  return level;
}

export default function ProfileScreen({
  username,
  me,
  isFollowing,
  onFollow,
  onUnfollow,
  onOpenTail,
  onBack,
  colors: C,
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const targetUser = username || me?.username;
  const isSelf = targetUser === me?.username;

  const fetchProfile = () => {
    if (!targetUser) return;
    setLoading(true);
    socket.emit("get-user-profile", { username: targetUser });
  };

  useEffect(() => {
    fetchProfile();
    const handler = (data) => {
      if (data.username === targetUser) {
        setProfile(data);
        setLoading(false);
      }
    };
    socket.on("user-profile", handler);
    return () => socket.off("user-profile", handler);
  }, [targetUser]);

  const level = getLevel(profile?.tailCount || 0);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.brand} />
        <Text style={{ color: C.dim, marginTop: 12, fontWeight: "700" }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchProfile} tintColor={C.brand} />
      }
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: C.muted, fontWeight: "900" }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: C.text, fontWeight: "900", fontSize: 18 }}>Profile</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Profile card */}
      <View style={{
        backgroundColor: C.panel, borderRadius: 20, borderWidth: 1,
        borderColor: C.border, padding: 20, alignItems: "center", gap: 14,
      }}>
        {/* Avatar */}
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: level.color + "25",
          alignItems: "center", justifyContent: "center",
          borderWidth: 3, borderColor: level.color,
        }}>
          <Text style={{ fontSize: 34, fontWeight: "900", color: level.color }}>
            {(targetUser || "?")[0].toUpperCase()}
          </Text>
        </View>

        {/* Username */}
        <View style={{ alignItems: "center", gap: 6 }}>
          <Text style={{ color: C.text, fontWeight: "900", fontSize: 22 }}>@{targetUser}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
              backgroundColor: level.color + "20", borderWidth: 1, borderColor: level.color + "50",
            }}>
              <Text style={{ color: level.color, fontWeight: "900", fontSize: 11 }}>
                {level.icon} {level.label}
              </Text>
            </View>
            {profile?.isOnline && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.green }} />
                <Text style={{ color: C.green, fontSize: 11, fontWeight: "700" }}>Online</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 24, marginTop: 4 }}>
          {[
            { label: "Tails", value: profile?.tailCount || 0 },
            { label: "Followers", value: profile?.followerCount || 0 },
            { label: "Following", value: profile?.followingCount || 0 },
          ].map((stat) => (
            <View key={stat.label} style={{ alignItems: "center" }}>
              <Text style={{ color: C.text, fontWeight: "900", fontSize: 22 }}>{stat.value}</Text>
              <Text style={{ color: C.dim, fontWeight: "700", fontSize: 11, textTransform: "uppercase" }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Follow button */}
        {!isSelf && isFollowing && onFollow && onUnfollow && (
          <View style={{ marginTop: 4 }}>
            <FollowButton
              targetUsername={targetUser}
              currentUsername={me?.username}
              isFollowing={isFollowing}
              onFollow={onFollow}
              onUnfollow={onUnfollow}
              colors={C}
              size="normal"
            />
          </View>
        )}
      </View>

      {/* Tails section */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ color: C.muted, fontWeight: "900", fontSize: 14, marginBottom: 10 }}>
          {isSelf ? "Your Active Tails" : `@${targetUser}'s Tails`}
          {profile?.tails?.length > 0 ? ` (${profile.tails.length})` : ""}
        </Text>

        {(!profile?.tails || profile.tails.length === 0) ? (
          <View style={{
            padding: 30, alignItems: "center",
            backgroundColor: C.panel, borderRadius: 16,
            borderWidth: 1, borderColor: C.border,
          }}>
            <Text style={{ fontSize: 30, marginBottom: 8 }}>📭</Text>
            <Text style={{ color: C.dim, fontWeight: "700", textAlign: "center" }}>
              No active tails
            </Text>
          </View>
        ) : (
          profile.tails.map((t, i) => (
            <TailCard
              key={t?.id || `pt-${i}`}
              tail={t}
              onPressTail={onOpenTail}
              colors={C}
            />
          ))
        )}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}
