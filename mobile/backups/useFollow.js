// ============================================
// useFollow.js — Follow System Hook
// ============================================
import { useState, useEffect, useCallback } from "react";
import { socket } from "./socket";

export default function useFollow() {
  const [following, setFollowing] = useState([]);
  const [newFollowerAlert, setNewFollowerAlert] = useState(null);

  useEffect(() => {
    if (!socket.connected) return;

    // Request current following list on mount
    socket.emit("get-following");

    const handleFollowUpdated = (data) => {
      setFollowing(data.following || []);
    };

    const handleNewFollower = (data) => {
      setNewFollowerAlert(data.from);
      // Auto-clear after 4 seconds
      setTimeout(() => setNewFollowerAlert(null), 4000);
    };

    socket.on("follow-updated", handleFollowUpdated);
    socket.on("new-follower", handleNewFollower);

    return () => {
      socket.off("follow-updated", handleFollowUpdated);
      socket.off("new-follower", handleNewFollower);
    };
  }, [socket.connected]);

  const followUser = useCallback((target) => {
    if (!target) return;
    socket.emit("follow-user", { target });
  }, []);

  const unfollowUser = useCallback((target) => {
    if (!target) return;
    socket.emit("unfollow-user", { target });
  }, []);

  const isFollowing = useCallback(
    (username) => following.includes(username),
    [following]
  );

  const refreshFollowing = useCallback(() => {
    socket.emit("get-following");
  }, []);

  return {
    following,
    followUser,
    unfollowUser,
    isFollowing,
    newFollowerAlert,
    clearFollowerAlert: () => setNewFollowerAlert(null),
    refreshFollowing,
    followingCount: following.length,
  };
}
