// ============================================
// ProfileScreen.js — User Profile
// ============================================
import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { socket } from "./socket";
import TailCard from "./TailCard";
import FollowButton from "./FollowButton";

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

  const fetchProfile = () => {
    setLoading(true);
    socket.emit("get-user-profile", { username });
  };

  useEffect(() => {
    fetchProfile();
    const handler = (data) => {
      if (data.username === username) {
        setProfile(data);
        setLoading(false);
      }
    };
    socket.on("user-profile", handler);
    return () => socket.off("user-profile", handler);
  }, [username]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={C.brand} />
      </View>
    );
  }

  const isSelf = me?.username === username;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
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
          borderColor: C.border, padding: 20, alignItems: "center", gap: 12,
        }}>
          {/* Avatar */}
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: C.brand + "20", alignItems: "center",
            justifyContent: "center", borderWidth: 2, borderColor: C.brand,
          }}>
            <Text style={{ fontSize: 32 }}>🦊</Text>
          </View>

          {/* Username + online */}
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={{ color: C.text, fontWeight: "900", fontSize: 22 }}>@{username}</Text>
            {profile?.isOnline && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.green }} />
                <Text style={{ color: C.green, fontSize: 11, fontWeight: "700" }}>Online</Text>
              </View>
            )}
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: "row", gap: 20, marginTop: 4 }}>
            {[
              { label: "Tails", value: profile?.tailCount || 0 },
              { label: "Followers", value: profile?.followerCount || 0 },
              { label: "Following", value: profile?.followingCount || 0 },
            ].map((stat) => (
              <View key={stat.label} style={{ alignItems: "center" }}>
                <Text style={{ color: C.text, fontWeight: "900", fontSize: 20 }}>{stat.value}</Text>
                <Text style={{ color: C.dim, fontWeight: "700", fontSize: 11, textTransform: "uppercase" }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Follow button */}
          {!isSelf && (
            <View style={{ marginTop: 4 }}>
              <FollowButton
                targetUsername={username}
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
            {isSelf ? "Your Tails" : `@${username}'s Tails`}
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

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}
