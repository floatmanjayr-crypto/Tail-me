// ============================================
// useAnalytics.js — Simple Event Tracking
// ============================================
import { useCallback } from "react";
import { socket } from "./socket";

export default function useAnalytics() {
  const track = useCallback((event, data = {}) => {
    if (!socket.connected) return;
    socket.emit("track-event", { event, data });
  }, []);

  return { track };
}

// Usage:
// const { track } = useAnalytics();
// track("tail_created", { tailType: "LOOK" });
// track("tail_caught", { tailId: "abc" });
// track("follow", { target: "username" });
// track("search", { query: "test" });
