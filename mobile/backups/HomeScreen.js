import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { socket } from "./socket";
import TailCard from "./TailCard";
import CatchTailModal from "./CatchTailModal";
import DropTailModal from "./DropTailModal";

export default function HomeScreen({ user, onOpenChat }) {
  const [publicTails, setPublicTails] = useState([]);
  const [inboxTails, setInboxTails] = useState([]);

  const [modalTail, setModalTail] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [dropOpen, setDropOpen] = useState(false);

  // 🔥 Live = expiring within 1 hour
  const liveTails = useMemo(() => {
    return publicTails.filter(t => {
      if (!t.expiresAt) return false;
      const diff = new Date(t.expiresAt).getTime() - Date.now();
      return diff > 0 && diff < 60 * 60 * 1000;
    });
  }, [publicTails]);

  const trending = publicTails
    .slice()
    .sort((a, b) => (b.catchCount || 0) - (a.catchCount || 0))
    .slice(0, 5);

  useEffect(() => {
    socket.emit("get-public-feed");

    const onPublicFeed = ({ tails }) =>
      setPublicTails(Array.isArray(tails) ? tails : []);

    const onPublicCreated = (tail) =>
      setPublicTails((prev) => [tail, ...prev].slice(0, 50));

    const onPrivateReceived = (tail) =>
      setInboxTails((prev) => [tail, ...prev]);

    const onExpired = ({ tailId }) => {
      setPublicTails((prev) =>
        prev.map(t => t.id === tailId ? { ...t, expired: true } : t)
      );
      setInboxTails((prev) =>
        prev.map(t => t.id === tailId ? { ...t, expired: true } : t)
      );
    };

    socket.on("public-feed", onPublicFeed);
    socket.on("public-tail-created", onPublicCreated);
    socket.on("tail-received", onPrivateReceived);
    socket.on("tail-expired", onExpired);

    return () => {
      socket.off("public-feed", onPublicFeed);
      socket.off("public-tail-created", onPublicCreated);
      socket.off("tail-received", onPrivateReceived);
      socket.off("tail-expired", onExpired);
    };
  }, []);

  const openTailCard = (tail) => {
    socket.emit("tail-preview", { tailId: tail.id });

    socket.once("tail-preview-data", (res) => {
      if (res?.tail) {
        setModalTail(res.tail);
        setModalOpen(true);
      }
    });
  };

  const catchTail = (tail) => {
    setModalOpen(false);
    socket.emit("catch-tail", { tailId: tail.id });

    socket.once("session-started", (res) => {
      if (res?.session) onOpenChat(res.tail, res.session);
    });
  };

  // 🔥 NEW: Drop Tail Submit
  const handleDropTail = ({ url, recipients, visibility }) => {
    return new Promise((resolve) => {
      socket.emit("send-tail", {
        url,
        title: "Tail",
        message: "",
        visibility,
        recipients,
      });

      resolve();
    });
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 50, backgroundColor: "#0B0F14" }}>

      {/* HEADER */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#fff" }}>
            🦊 Tail Radar
          </Text>
          <Text style={{ color: "#6B7280", fontSize: 12 }}>
            {liveTails.length} live drops happening now
          </Text>
        </View>

        <TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18 }}>📥</Text>
            {inboxTails.length > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -4,
                  right: -6,
                  backgroundColor: "#FF5C5C",
                  borderRadius: 10,
                  paddingHorizontal: 6,
                }}
              >
                <Text style={{ color: "#000", fontSize: 10, fontWeight: "900" }}>
                  {inboxTails.length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* LIVE SECTION */}
        {liveTails.length > 0 && (
          <>
            <Text style={{ color: "#F59E0B", marginTop: 20, fontWeight: "900" }}>
              ⏳ Live Now
            </Text>
            {liveTails.map((t) => (
              <TailCard key={t.id} tail={t} onPressTail={openTailCard} />
            ))}
          </>
        )}

        {/* TRENDING */}
        <Text style={{ color: "#fff", marginTop: 20, fontWeight: "900" }}>
          🔥 Trending
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {trending.map((t) => (
            <View key={t.id} style={{ width: 260, marginRight: 12 }}>
              <TailCard tail={t} onPressTail={openTailCard} />
            </View>
          ))}
        </ScrollView>

        {/* ALL PUBLIC */}
        <Text style={{ color: "#fff", marginTop: 20, fontWeight: "900" }}>
          🌍 Explore
        </Text>

        {publicTails.map((t) => (
          <TailCard key={t.id} tail={t} onPressTail={openTailCard} />
        ))}

        {publicTails.length === 0 && (
          <Text style={{ color: "#6B7280", marginTop: 20, textAlign: "center" }}>
            No drops yet. Be the first to send one.
          </Text>
        )}
      </ScrollView>

      {/* FLOATING DROP BUTTON */}
      <TouchableOpacity
        onPress={() => setDropOpen(true)}
        style={{
          position: "absolute",
          bottom: 30,
          right: 20,
          backgroundColor: "#FF5C5C",
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderRadius: 30,
          shadowColor: "#FF5C5C",
          shadowOpacity: 0.6,
          shadowRadius: 10,
        }}
      >
        <Text style={{ color: "#000", fontWeight: "900" }}>
          + Drop Tail
        </Text>
      </TouchableOpacity>

      {/* DROP MODAL */}
      <DropTailModal
        visible={dropOpen}
        onClose={() => setDropOpen(false)}
        onSubmit={handleDropTail}
      />

      {/* CATCH MODAL */}
      <CatchTailModal
        visible={modalOpen}
        tail={modalTail}
        onClose={() => setModalOpen(false)}
        onCatch={catchTail}
      />
    </View>
  );
}