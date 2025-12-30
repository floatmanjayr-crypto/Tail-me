import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { socket } from "./socket";
import TailCard from "./TailCard";
import CatchTailModal from "./CatchTailModal";

export default function HomeScreen({ user, onOpenChat }) {
  const [tab, setTab] = useState("public"); // public | inbox
  const [publicTails, setPublicTails] = useState([]);
  const [inboxTails, setInboxTails] = useState([]);

  const [composeUrl, setComposeUrl] = useState("");
  const [composeTo, setComposeTo] = useState("");
  const [composeVisibility, setComposeVisibility] = useState("public");

  const [modalTail, setModalTail] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    socket.emit("get-public-feed");

    const onPublicFeed = ({ tails }) => setPublicTails(Array.isArray(tails) ? tails : []);
    const onPublicCreated = (tail) => setPublicTails((prev) => [tail, ...prev].slice(0, 50));
    const onPrivateReceived = (tail) => setInboxTails((prev) => [tail, ...prev]);

    const onExpired = ({ tailId }) => {
      setPublicTails((prev) => prev.map(t => t.id === tailId ? { ...t, expired: true } : t));
      setInboxTails((prev) => prev.map(t => t.id === tailId ? { ...t, expired: true } : t));
    };

    const onCatchUpdate = (u) => {
      const patch = (prev) =>
        prev.map(t => t.id === u.tailId ? { ...t, catchCount: u.catchCount, caughtBy: u.caughtBy } : t);
      setPublicTails(patch);
      setInboxTails(patch);
    };

    socket.on("public-feed", onPublicFeed);
    socket.on("public-tail-created", onPublicCreated);
    socket.on("tail-received", onPrivateReceived);
    socket.on("tail-expired", onExpired);
    socket.on("tail-catch-update", onCatchUpdate);

    return () => {
      socket.off("public-feed", onPublicFeed);
      socket.off("public-tail-created", onPublicCreated);
      socket.off("tail-received", onPrivateReceived);
      socket.off("tail-expired", onExpired);
      socket.off("tail-catch-update", onCatchUpdate);
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

  const sendTail = () => {
    const url = composeUrl.trim();
    if (!url) return;

    const to = composeTo.trim();
    const visibility = to ? "private" : composeVisibility;

    socket.emit("send-tail", {
      url,
      title: "Tail",
      message: "",
      visibility,
      recipients: to ? [to] : []
    });

    setComposeUrl("");
    setComposeTo("");
    setComposeVisibility("public");
  };

  const list = tab === "public" ? publicTails : inboxTails;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: "#E5E7EB", fontSize: 18, fontWeight: "900" }}>Tail</Text>
        <Text style={{ color: "#9CA3AF" }}>@{user.username}</Text>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <TouchableOpacity
          onPress={() => setTab("public")}
          style={{
            flex: 1, padding: 12, borderRadius: 14,
            backgroundColor: tab === "public" ? "#FF5C5C" : "#121826",
            borderWidth: 1, borderColor: "#1E293B", alignItems: "center",
          }}
        >
          <Text style={{ color: tab === "public" ? "#0B0F14" : "#CBD5E1", fontWeight: "900" }}>Public</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab("inbox")}
          style={{
            flex: 1, padding: 12, borderRadius: 14,
            backgroundColor: tab === "inbox" ? "#FF5C5C" : "#121826",
            borderWidth: 1, borderColor: "#1E293B", alignItems: "center",
          }}
        >
          <Text style={{ color: tab === "inbox" ? "#0B0F14" : "#CBD5E1", fontWeight: "900" }}>Inbox</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 14, backgroundColor: "#121826", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "#1E293B" }}>
        <TextInput
          value={composeUrl}
          onChangeText={setComposeUrl}
          placeholder="Paste link or note (URL)"
          placeholderTextColor="#6B7280"
          style={{ color: "#E5E7EB", paddingVertical: 8 }}
        />

        <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
          <TextInput
            value={composeTo}
            onChangeText={setComposeTo}
            placeholder="Send to @username (optional)"
            placeholderTextColor="#6B7280"
            style={{
              flex: 1, color: "#E5E7EB",
              backgroundColor: "#0B0F14",
              padding: 10, borderRadius: 12,
              borderWidth: 1, borderColor: "#1E293B",
            }}
          />
          <TouchableOpacity
            onPress={sendTail}
            style={{
              paddingHorizontal: 16, borderRadius: 12,
              backgroundColor: "#FF5C5C",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Text style={{ color: "#0B0F14", fontWeight: "900" }}>Send</Text>
          </TouchableOpacity>
        </View>

        {!composeTo.trim() && (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => setComposeVisibility("public")}
              style={{
                flex: 1, padding: 10, borderRadius: 12,
                borderWidth: 1, borderColor: "#1E293B",
                backgroundColor: composeVisibility === "public" ? "#0B0F14" : "transparent",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#CBD5E1", fontWeight: "800" }}>Public</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setComposeVisibility("private")}
              style={{
                flex: 1, padding: 10, borderRadius: 12,
                borderWidth: 1, borderColor: "#1E293B",
                backgroundColor: composeVisibility === "private" ? "#0B0F14" : "transparent",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#CBD5E1", fontWeight: "800" }}>Private</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={{ marginTop: 14 }} showsVerticalScrollIndicator={false}>
        {list.map((t) => (
          <TailCard key={t.id} tail={t} onPressTail={openTailCard} />
        ))}
        {list.length === 0 && (
          <Text style={{ color: "#6B7280", marginTop: 16, textAlign: "center" }}>
            {tab === "public" ? "No public tails yet." : "Your inbox is empty."}
          </Text>
        )}
      </ScrollView>

      <CatchTailModal
        visible={modalOpen}
        tail={modalTail}
        onClose={() => setModalOpen(false)}
        onCatch={catchTail}
      />
    </View>
  );
}
