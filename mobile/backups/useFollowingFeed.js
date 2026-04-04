// ============================================
// useFollowingFeed.js — Feed from followed users
// ============================================
import { useState, useEffect, useCallback } from "react";
import { socket } from "./socket";

export default function useFollowingFeed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket.connected) return;

    socket.emit("get-following-feed");

    const handleFeed = (data) => {
      setFeed(data || []);
      setLoading(false);
    };

    socket.on("following-feed", handleFeed);

    return () => {
      socket.off("following-feed", handleFeed);
    };
  }, [socket.connected]);

  const refresh = useCallback(() => {
    setLoading(true);
    socket.emit("get-following-feed");
  }, []);

  return { feed, loading, refresh };
}
