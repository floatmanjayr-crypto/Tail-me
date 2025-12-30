// mobile/App.js
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";

import CatchTailModal from "./CatchTailModal";
import TailHome from "./TailHome";
import TailCard from "./TailCard";
import { socket, SOCKET_URL } from "./socket";

export default function App() {
  const [screen, setScreen] = useState("login"); // login | hub | public | private | chat
  const [username, setUsername] = useState("");
  const [me, setMe] = useState(null);

  const [publicTails, setPublicTails] = useState([]);
  const [inboxTails, setInboxTails] = useState([]);

  // Private send
  const [composeUrl, setComposeUrl] = useState("");
  const [composeTo, setComposeTo] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTail, setModalTail] = useState(null);

  // Chat
  const [activeTail, setActiveTail] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [chatText, setChatText] = useState("");
  const [chatMsgs, setChatMsgs] = useState([]);

  useEffect(() => {
    return () => {
      try {
        socket.disconnect();
      } catch {}
    };
  }, []);

  // ---------- Login ----------
  const doLogin = () => {
    const u = username.trim();
    if (!u) return;

    if (!socket.connected) socket.connect();

    socket.emit("register", { username: u });

    socket.once("registration-complete", (res) => {
      if (res?.ok) {
        setMe({ username: u });
        setScreen("hub");
        socket.emit("get-public-feed");
      }
    });
  };

  // ---------- Socket listeners ----------
  useEffect(() => {
    const onPublicFeed = ({ tails }) => setPublicTails(Array.isArray(tails) ? tails : []);
    const onPublicCreated = (tail) =>
      setPublicTails((prev) => [tail, ...prev].slice(0, 50));
    const onPrivateReceived = (tail) => setInboxTails((prev) => [tail, ...prev]);

    const onExpired = ({ tailId }) => {
      setPublicTails((prev) => prev.map((t) => (t.id === tailId ? { ...t, expired: true } : t)));
      setInboxTails((prev) => prev.map((t) => (t.id === tailId ? { ...t, expired: true } : t)));
      if (activeTail?.id === tailId) setActiveTail((t) => (t ? { ...t, expired: true } : t));
    };

    const onCatchUpdate = (u) => {
      const patch = (prev) =>
        prev.map((t) =>
          t.id === u.tailId ? { ...t, catchCount: u.catchCount, caughtBy: u.caughtBy } : t
        );
      setPublicTails(patch);
      setInboxTails(patch);
    };

    const onChatMsg = (m) => setChatMsgs((prev) => [...prev, m]);

    socket.on("public-feed", onPublicFeed);
    socket.on("public-tail-created", onPublicCreated);
    socket.on("tail-received", onPrivateReceived);
    socket.on("tail-expired", onExpired);
    socket.on("tail-catch-update", onCatchUpdate);
    socket.on("new-chat-message", onChatMsg);

    return () => {
      socket.off("public-feed", onPublicFeed);
      socket.off("public-tail-created", onPublicCreated);
      socket.off("tail-received", onPrivateReceived);
      socket.off("tail-expired", onExpired);
      socket.off("tail-catch-update", onCatchUpdate);
      socket.off("new-chat-message", onChatMsg);
    };
  }, [activeTail?.id]);

  // ---------- Open Tail ----------
  const openTailCard = (tail) => {
    socket.emit("tail-preview", { tailId: tail.id });

    socket.once("tail-preview-data", (res) => {
      if (res?.tail) {
        setModalTail(res.tail);
        setModalOpen(true);
      } else {
        // if server replies expired/not_found, close modal
        setModalOpen(false);
      }
    });
  };

  // ---------- Catch ----------
  const catchTail = (tail) => {
    setModalOpen(false);
    socket.emit("catch-tail", { tailId: tail.id });

    socket.once("session-started", (res) => {
      if (res?.session) {
        setActiveTail(res.tail || tail);
        setActiveSession(res.session);
        setChatMsgs(res.session.messages || []);
        setScreen("chat");
      }
    });
  };

  // ---------- Send (PRIVATE screen) ----------
  const sendTail = () => {
    const url = composeUrl.trim();
    if (!url) return;

    const to = composeTo.trim().replace(/^@/, "");
    if (!to) return; // private requires a username

    socket.emit("send-tail", {
      url,
      title: "Tail",
      message: "",
      visibility: "private",
      recipients: [to],
    });

    setComposeUrl("");
    setComposeTo("");
  };

  // ---------- Chat send ----------
  const sendChat = () => {
    const t = chatText.trim();
    if (!t || !activeSession) return;
    socket.emit("tail-chat", { tailId: activeSession.id, text: t });
    setChatText("");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0B0F14" }}>
      <StatusBar barStyle="light-content" />

      {/* LOGIN */}
      {screen === "login" && (
        <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
          <Text style={{ color: "#E5E7EB", fontSize: 30, fontWeight: "900" }}>Tail</Text>
          <Text style={{ color: "#9CA3AF", marginTop: 6 }}>
            Capture & share without streaming.
          </Text>

          <Text style={{ color: "#6B7280", marginTop: 10, fontSize: 12 }}>
            Connecting to: {SOCKET_URL}
          </Text>

          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
            placeholderTextColor="#6B7280"
            autoCapitalize="none"
            style={{
              marginTop: 18,
              backgroundColor: "#121826",
              color: "#E5E7EB",
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#1E293B",
            }}
          />

          <TouchableOpacity
            onPress={doLogin}
            style={{
              marginTop: 14,
              backgroundColor: "#22C55E",
              padding: 14,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#052E16", fontWeight: "900" }}>Enter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* HUB */}
      {screen === "hub" && me && (
        <TailHome
          me={me}
          onGoPublic={() => {
            setScreen("public");
            socket.emit("get-public-feed");
          }}
          onGoPrivate={() => setScreen("private")}
        />
      )}

      {/* PUBLIC */}
      {screen === "public" && me && (
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <TouchableOpacity onPress={() => setScreen("hub")}>
              <Text style={{ color: "#94A3B8", fontWeight: "900" }}>← Back</Text>
            </TouchableOpacity>

            <Text style={{ color: "#E5E7EB", fontSize: 18, fontWeight: "900" }}>🔥 Public</Text>

            <Text style={{ color: "#64748B" }}>@{me.username}</Text>
          </View>

          <TouchableOpacity
            onPress={() => socket.emit("get-public-feed")}
            style={{
              marginTop: 12,
              borderWidth: 1,
              borderColor: "#1E293B",
              padding: 12,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#CBD5E1", fontWeight: "900" }}>Refresh</Text>
          </TouchableOpacity>

          <ScrollView style={{ marginTop: 14 }} showsVerticalScrollIndicator={false}>
            {publicTails.map((t) => (
              <TailCard key={t.id} tail={t} onPressTail={openTailCard} />
            ))}
            {publicTails.length === 0 && (
              <Text style={{ color: "#6B7280", marginTop: 16, textAlign: "center" }}>
                No public tails yet.
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
      )}

      {/* PRIVATE */}
      {screen === "private" && me && (
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <TouchableOpacity onPress={() => setScreen("hub")}>
              <Text style={{ color: "#94A3B8", fontWeight: "900" }}>← Back</Text>
            </TouchableOpacity>

            <Text style={{ color: "#E5E7EB", fontSize: 18, fontWeight: "900" }}>💬 Private</Text>

            <Text style={{ color: "#64748B" }}>@{me.username}</Text>
          </View>

          {/* Composer */}
          <View
            style={{
              marginTop: 14,
              backgroundColor: "#121826",
              borderRadius: 16,
              padding: 12,
              borderWidth: 1,
              borderColor: "#1E293B",
            }}
          >
            <Text style={{ color: "#CBD5E1", fontWeight: "900" }}>Send a Tail</Text>

            <TextInput
              value={composeUrl}
              onChangeText={setComposeUrl}
              placeholder="Paste link (Amazon, TikTok, etc)"
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              style={{
                marginTop: 8,
                color: "#E5E7EB",
                backgroundColor: "#0B0F14",
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#1E293B",
              }}
            />

            <TextInput
              value={composeTo}
              onChangeText={setComposeTo}
              placeholder="@username"
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              style={{
                marginTop: 10,
                color: "#E5E7EB",
                backgroundColor: "#0B0F14",
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#1E293B",
              }}
            />

            <TouchableOpacity
              onPress={sendTail}
              style={{
                marginTop: 10,
                padding: 14,
                borderRadius: 12,
                backgroundColor: "#22C55E",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#052E16", fontWeight: "900" }}>Send</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: "#94A3B8", marginTop: 14, fontWeight: "900" }}>Inbox</Text>

          <ScrollView style={{ marginTop: 10 }} showsVerticalScrollIndicator={false}>
            {inboxTails.map((t) => (
              <TailCard key={t.id} tail={t} onPressTail={openTailCard} />
            ))}
            {inboxTails.length === 0 && (
              <Text style={{ color: "#6B7280", marginTop: 16, textAlign: "center" }}>
                Your inbox is empty.
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
      )}

      {/* CHAT */}
      {screen === "chat" && activeSession && (
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <TouchableOpacity onPress={() => setScreen("hub")}>
              <Text style={{ color: "#CBD5E1", fontWeight: "900" }}>← Back</Text>
            </TouchableOpacity>
            <Text style={{ color: "#9CA3AF" }}>Tail Chat</Text>
            <Text style={{ color: "#0B0F14" }}>.</Text>
          </View>

          <Text style={{ color: "#E5E7EB", marginTop: 10, fontWeight: "900" }}>
            {activeTail?.url || ""}
          </Text>

          <ScrollView style={{ marginTop: 12 }} showsVerticalScrollIndicator={false}>
            {chatMsgs.map((m, idx) => (
              <View key={idx} style={{ paddingVertical: 8 }}>
                <Text style={{ color: m.from === "system" ? "#6B7280" : "#E5E7EB" }}>
                  <Text style={{ color: "#9CA3AF", fontWeight: "800" }}>{m.from}: </Text>
                  {m.text}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <TextInput
              value={chatText}
              onChangeText={setChatText}
              placeholder="Type message…"
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              style={{
                flex: 1,
                color: "#E5E7EB",
                backgroundColor: "#121826",
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#1E293B",
              }}
            />
            <TouchableOpacity
              onPress={sendChat}
              style={{
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: "#22C55E",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#052E16", fontWeight: "900" }}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
