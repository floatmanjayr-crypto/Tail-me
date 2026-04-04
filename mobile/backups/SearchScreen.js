// ============================================
// SearchScreen.js — Discover & Search Users
// ============================================
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  ActivityIndicator, Keyboard,
} from "react-native";
import { socket } from "./socket";
import FollowButton from "./FollowButton";

export default function SearchScreen({
  me,
  isFollowing,
  onFollow,
  onUnfollow,
  onOpenProfile,
  onBack,
  colors: C,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load suggested users on mount
    socket.emit("search-users", { query: "" });

    const handler = (data) => {
      setResults(data.users || []);
      setLoading(false);
    };
    socket.on("search-results", handler);
    return () => socket.off("search-results", handler);
  }, []);

  const doSearch = useCallback((text) => {
    setQuery(text);
    setLoading(true);
    socket.emit("search-users", { query: text.trim() });
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: C.muted, fontWeight: "900" }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: C.text, fontWeight: "900", fontSize: 18 }}>Discover</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Search bar */}
      <View style={{
        flexDirection: "row", alignItems: "center",
        backgroundColor: C.panel, borderRadius: 14,
        borderWidth: 1, borderColor: C.border,
        paddingHorizontal: 14, marginBottom: 16,
      }}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={doSearch}
          placeholder="Search users..."
          placeholderTextColor={C.dim}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={{
            flex: 1, color: C.text, paddingVertical: 12,
            fontWeight: "600", fontSize: 15,
          }}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(""); doSearch(""); Keyboard.dismiss(); }}>
            <Text style={{ color: C.dim, fontWeight: "900", fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Section label */}
      <Text style={{ color: C.dim, fontWeight: "800", fontSize: 11, textTransform: "uppercase", marginBottom: 10 }}>
        {query.length > 0 ? `Results for "${query}"` : "Suggested Users"}
      </Text>

      {loading ? (
        <ActivityIndicator size="small" color={C.brand} style={{ marginTop: 30 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {results.length === 0 ? (
            <View style={{ padding: 30, alignItems: "center" }}>
              <Text style={{ fontSize: 30, marginBottom: 8 }}>🔍</Text>
              <Text style={{ color: C.dim, fontWeight: "700", textAlign: "center" }}>
                {query ? `No users found for "${query}"` : "No users yet"}
              </Text>
            </View>
          ) : (
            results.map((user) => (
              <TouchableOpacity
                key={user.username}
                onPress={() => onOpenProfile?.(user.username)}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row", alignItems: "center",
                  paddingVertical: 12, paddingHorizontal: 14,
                  marginBottom: 8, borderRadius: 16,
                  backgroundColor: C.panel, borderWidth: 1, borderColor: C.border,
                }}
              >
                {/* Avatar */}
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: C.brand + "18",
                  alignItems: "center", justifyContent: "center",
                  borderWidth: 1.5, borderColor: user.isOnline ? C.green : C.border,
                  marginRight: 12,
                }}>
                  <Text style={{ fontSize: 20 }}>🦊</Text>
                  {user.isOnline && (
                    <View style={{
                      position: "absolute", bottom: -1, right: -1,
                      width: 12, height: 12, borderRadius: 6,
                      backgroundColor: C.green, borderWidth: 2, borderColor: C.panel,
                    }} />
                  )}
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontWeight: "900", fontSize: 15 }}>@{user.username}</Text>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 2 }}>
                    <Text style={{ color: C.dim, fontSize: 11, fontWeight: "700" }}>
                      {user.tailCount} tail{user.tailCount !== 1 ? "s" : ""}
                    </Text>
                    <Text style={{ color: C.dim, fontSize: 11, fontWeight: "700" }}>
                      {user.followerCount} follower{user.followerCount !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>

                {/* Follow button */}
                <FollowButton
                  targetUsername={user.username}
                  currentUsername={me?.username}
                  isFollowing={isFollowing}
                  onFollow={onFollow}
                  onUnfollow={onUnfollow}
                  colors={C}
                  size="small"
                />
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}
