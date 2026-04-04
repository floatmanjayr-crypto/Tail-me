// ============================================
// FollowButton.js — Follow/Unfollow Button
// ============================================
import React from "react";
import { TouchableOpacity, Text } from "react-native";

export default function FollowButton({
  targetUsername,
  currentUsername,
  isFollowing,
  onFollow,
  onUnfollow,
  colors: C,
  size = "normal",
}) {
  if (!targetUsername || targetUsername === currentUsername) return null;

  const amFollowing = isFollowing ? isFollowing(targetUsername) : false;

  const handlePress = () => {
    if (amFollowing) {
      onUnfollow?.(targetUsername);
    } else {
      onFollow?.(targetUsername);
    }
  };

  const sizes = {
    normal: { px: 14, py: 8, fontSize: 12, minWidth: 90 },
    small:  { px: 10, py: 6, fontSize: 11, minWidth: 70 },
    mini:   { px: 8,  py: 4, fontSize: 10, minWidth: 55 },
  };
  const s = sizes[size] || sizes.normal;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={{
        paddingHorizontal: s.px,
        paddingVertical: s.py,
        borderRadius: 20,
        borderWidth: 1.5,
        minWidth: s.minWidth,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: amFollowing ? "transparent" : (C?.brand || "#7C3AED"),
        borderColor: amFollowing ? (C?.green || "#22C55E") : (C?.brand || "#7C3AED"),
      }}
    >
      <Text
        style={{
          fontWeight: "900",
          fontSize: s.fontSize,
          color: amFollowing ? (C?.green || "#22C55E") : "#fff",
        }}
      >
        {amFollowing ? "Following ✓" : "Follow"}
      </Text>
    </TouchableOpacity>
  );
}
