// mobile/App.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  SafeAreaView,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";

const SOCKET_SERVER = "https://maida-unvictualled-raina.ngrok-free.dev"; // CHANGE TO YOUR IP or HTTPS tunnel URL

export default function App() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);

  const [showRegistration, setShowRegistration] = useState(false);
  const [tempUsername, setTempUsername] = useState("");

  const [showTailPopup, setShowTailPopup] = useState(false);
  const [tailUrl, setTailUrl] = useState("");
  const [tailMsg, setTailMsg] = useState("");
  const [recipient, setRecipient] = useState("demo-user-2");

  /**
   * activeSession shape (we control it)
   * {
   *   session: {
   *     id: "sess_tail_...",
   *     tailId: "tail_...",
   *     host: "alice",
   *     url: "https://...",
   *     title: "...",
   *     participants: [...],
   *     messages: [...]
   *   }
   * }
   */
  const [activeSession, setActiveSession] = useState(null);
  const [chatDraft, setChatDraft] = useState("");

  const flatListRef = useRef(null);

  useEffect(() => {
    checkUser();
    return () => {
      try {
        if (socket) socket.disconnect();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // auto-scroll chat when messages change
    if (activeSession?.session?.messages?.length) {
      setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: true }), 50);
    }
  }, [activeSession?.session?.messages?.length]);

  const checkUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("catchMyTailUser");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        connectSocket(parsedUser);
      } else {
        setShowRegistration(true);
      }
    } catch {
      setShowRegistration(true);
    }
  };

  const connectSocket = (userData) => {
    const SOCKET = io(SOCKET_SERVER, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 800,
    });

    SOCKET.on("connect", () => {
      console.log("✅ Connected");
      SOCKET.emit("register", userData);
    });

    SOCKET.on("connect_error", (err) => {
      console.log("❌ connect_error:", err?.message);
    });

    SOCKET.on("registration-complete", () => {
      console.log("✅ Registered");
    });

    // When a tail arrives
    SOCKET.on("tail-received", (tail) => {
      const body = tail.message ? `${tail.message}\n\n${tail.url}` : tail.url;

      Alert.alert(`🦊 ${tail.from} sent a tail`, body, [
        {
          text: "Open",
          onPress: () =>
            Linking.openURL(tail.url).catch(() => Alert.alert("Failed to open link")),
        },
        {
          text: "Chat",
          onPress: () => SOCKET.emit("catch-tail", { tailId: tail.id }),
        },
        { text: "Later", style: "cancel" },
      ]);
    });

    // Session started (chat thread)
    // Server sends: { session: { id, host, url, title, participants, messages } }
    // We add tailId by reading it from session.id format: sess_<tailId>
    SOCKET.on("session-started", (payload) => {
      const sess = payload?.session;
      if (!sess?.id) return;

      // sessionId is "sess_<tailId>" → derive tailId
      const derivedTailId = String(sess.id).startsWith("sess_") ? String(sess.id).slice(5) : null;

      setActiveSession({
        session: {
          ...sess,
          tailId: derivedTailId || sess.tailId || null,
          messages: Array.isArray(sess.messages) ? sess.messages : [],
        },
      });
    });

    // Session metadata updates (participants, etc.)
    SOCKET.on("session-updated", (payload) => {
      const sess = payload?.session;
      if (!sess?.id) return;

      setActiveSession((prev) => {
        if (!prev?.session || prev.session.id !== sess.id) return prev;
        return {
          ...prev,
          session: {
            ...prev.session,
            ...sess,
          },
        };
      });
    });

    // Incoming chat message in session
    SOCKET.on("new-chat-message", (message) => {
      setActiveSession((prev) => {
        if (!prev?.session) return prev;
        return {
          ...prev,
          session: {
            ...prev.session,
            messages: [...(prev.session.messages || []), message],
          },
        };
      });
    });

    SOCKET.on("session-ended", ({ endedBy }) => {
      Alert.alert("Session ended", endedBy ? `Ended by ${endedBy}` : "Session ended");
      setActiveSession(null);
      setChatDraft("");
    });

    setSocket(SOCKET);
  };

  const validUrl = (url) => {
    const u = (url || "").trim();
    return u.startsWith("https://") || u.startsWith("http://");
  };

  const sendTail = () => {
    if (!socket) {
      Alert.alert("Not connected", "Socket not ready. Check your server IP.");
      return;
    }

    const url = tailUrl.trim();
    const to = recipient.trim().toLowerCase();

    if (!to) {
      Alert.alert("Missing recipient", "Enter a username to send to.");
      return;
    }
    if (!validUrl(url)) {
      Alert.alert("Invalid link", "Link must start with https:// or http://");
      return;
    }

    // ✅ match server: recipients: []
    socket.emit("send-tail", {
      recipients: [to],
      url,
      title: "Tail",
      message: tailMsg.trim(),
    });

    setShowTailPopup(false);
    setTailUrl("");
    setTailMsg("");
    Alert.alert("✅ Tail sent!", `Sent to ${to}`);
  };

  const openCurrentSessionLink = async () => {
    const url = activeSession?.session?.url;
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Failed to open link");
    }
  };

  const sendChat = () => {
    const text = chatDraft.trim();
    if (!text) return;

    if (!socket || !activeSession?.session?.tailId) return;

    // ✅ match server: tail-chat expects tailId (tail_...)
    socket.emit("tail-chat", {
      tailId: activeSession.session.tailId,
      text,
    });

    // ✅ remove optimistic add to avoid duplicates
    setChatDraft("");
  };

  // REGISTRATION MODAL
  if (showRegistration) {
    return (
      <SafeAreaView style={styles.centeredView}>
        <View style={styles.registrationCard}>
          <Text style={styles.logo}>🦊</Text>
          <Text style={styles.title}>Tail Me</Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            value={tempUsername}
            onChangeText={setTempUsername}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={async () => {
              const name = tempUsername.trim().toLowerCase();
              if (!name) {
                Alert.alert("Enter a username");
                return;
              }
              const userData = { username: name };
              await AsyncStorage.setItem("catchMyTailUser", JSON.stringify(userData));
              setUser(userData);
              setShowRegistration(false);
              connectSocket(userData);
            }}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>
            Tip: Use two phones (or two emulators) with different usernames.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // MAIN APP
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centeredView}>
        <Text style={styles.statusText}>🦊 Tail Me Active</Text>
        <Text style={styles.username}>Logged in as {user?.username}</Text>

        <TouchableOpacity style={styles.floatingTail} onPress={() => setShowTailPopup(true)}>
          <Text style={styles.tailEmoji}>🦊</Text>
        </TouchableOpacity>
      </View>

      {/* SEND TAIL POPUP */}
      <Modal visible={showTailPopup} transparent animationType="fade">
        <TouchableOpacity
          style={styles.popupOverlay}
          activeOpacity={1}
          onPress={() => setShowTailPopup(false)}
        >
          <View style={styles.popupCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.popupTitle}>🦊 Send Tail</Text>

            <TextInput
              style={styles.input}
              placeholder="Paste link (https://amazon.com/...)"
              value={tailUrl}
              onChangeText={setTailUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Message (optional)"
              value={tailMsg}
              onChangeText={setTailMsg}
            />

            <TextInput
              style={styles.input}
              placeholder="Recipient username (demo-user-2)"
              value={recipient}
              onChangeText={setRecipient}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={sendTail}>
              <Text style={styles.buttonText}>Send Tail</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 10 }]}
              onPress={() => setShowTailPopup(false)}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.smallNote}>
              (No in-app browser yet) Tails open in the real Chrome/Safari.
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ACTIVE SESSION (CHAT + TAIL CARD) */}
      {activeSession && (
        <Modal visible animationType="slide">
          <SafeAreaView style={styles.container}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTitle}>
                Tail Session • {activeSession.session.host}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (socket && activeSession?.session?.tailId) {
                    socket.emit("end-tail-session", { tailId: activeSession.session.tailId });
                  }
                  setActiveSession(null);
                  setChatDraft("");
                }}
              >
                <Text style={styles.endText}>End</Text>
              </TouchableOpacity>
            </View>

            {/* Tail Card */}
            <View style={styles.tailCard}>
              <Text style={styles.tailCardLabel}>Current Tail Link</Text>
              <Text style={styles.tailCardUrl} numberOfLines={2}>
                {activeSession.session.url}
              </Text>

              <TouchableOpacity style={styles.primaryButton} onPress={openCurrentSessionLink}>
                <Text style={styles.buttonText}>Open in Browser</Text>
              </TouchableOpacity>
            </View>

            {/* Chat */}
            <View style={styles.chatArea}>
              <FlatList
                ref={flatListRef}
                data={activeSession.session.messages || []}
                keyExtractor={(item, idx) => `${item.id || item.ts || "m"}-${idx}`}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.chatMessage,
                      item.from === user.username ? styles.myMessage : styles.theirMessage,
                    ]}
                  >
                    <Text style={item.from === user.username ? styles.myText : styles.theirText}>
                      <Text style={{ fontWeight: "800" }}>{item.from}: </Text>
                      {item.text}
                    </Text>
                  </View>
                )}
              />

              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
              >
                <View style={styles.chatInputRow}>
                  <TextInput
                    style={styles.chatTextInput}
                    placeholder="Type message..."
                    value={chatDraft}
                    onChangeText={setChatDraft}
                    onSubmitEditing={sendChat}
                    returnKeyType="send"
                  />
                  <TouchableOpacity style={styles.sendBtn} onPress={sendChat}>
                    <Text style={styles.sendBtnText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  centeredView: { flex: 1, justifyContent: "center", alignItems: "center" },

  registrationCard: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },

  logo: { fontSize: 60, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: "bold", color: "#333", marginBottom: 20 },

  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "white",
  },

  primaryButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },

  secondaryButton: {
    width: "100%",
    height: 46,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },

  secondaryButtonText: { color: "#333", fontSize: 16, fontWeight: "600" },

  buttonText: { color: "white", fontSize: 16, fontWeight: "700" },
  helperText: { marginTop: 14, color: "#666", textAlign: "center" },

  statusText: { fontSize: 24, marginBottom: 10 },
  username: { fontSize: 16, color: "#666" },

  floatingTail: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 70,
    height: 70,
    backgroundColor: "#FF6B6B",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },

  tailEmoji: { fontSize: 35 },

  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  popupCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
  },

  popupTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },

  smallNote: { marginTop: 10, color: "#666", fontSize: 12 },

  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
  },

  sessionTitle: { color: "white", fontSize: 16, fontWeight: "800" },
  endText: { color: "white", fontWeight: "800" },

  tailCard: {
    backgroundColor: "white",
    margin: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },

  tailCardLabel: { fontWeight: "900", color: "#111" },
  tailCardUrl: { marginTop: 6, color: "#333" },

  chatArea: { flex: 1, marginHorizontal: 12, marginBottom: 12 },
  chatMessage: { padding: 10, marginVertical: 6, borderRadius: 12 },

  myMessage: { alignSelf: "flex-end", backgroundColor: "#FF6B6B", maxWidth: "85%" },
  theirMessage: { alignSelf: "flex-start", backgroundColor: "#F0F0F0", maxWidth: "85%" },

  myText: { color: "white" },
  theirText: { color: "#111" },

  chatInputRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 10,
    alignItems: "center",
  },

  chatTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "white",
  },

  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "#FF6B6B",
  },

  sendBtnText: { color: "white", fontWeight: "800" },
});
