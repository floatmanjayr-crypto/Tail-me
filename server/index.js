const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"],
});

const users = new Map();        // username -> { socketId, status, lastSeen }
const tails = new Map();        // tailId -> tail object
const sessions = new Map();     // tailId -> session object

console.log("🦊 Tail Me Server Starting...");

io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("register", (userData) => {
    const username = (userData?.username || "").trim();
    if (!username) return;

    users.set(username, {
      username,
      socketId: socket.id,
      status: "online",
      lastSeen: Date.now(),
    });

    socket.username = username;
    socket.emit("registration-complete", { ok: true, username });
    console.log(`👤 ${username} registered`);
  });

  // Send a tail (supports BOTH shapes: {to} or {recipients:[]})
  socket.on("send-tail", (tailData) => {
    const from = socket.username || tailData?.from || "unknown";
    const url = (tailData?.url || "").trim();

    const recipients = Array.isArray(tailData?.recipients)
      ? tailData.recipients
      : tailData?.to
        ? [tailData.to]
        : [];

    const tailId = `tail_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const tail = {
      id: tailId,
      from,
      recipients,
      url,
      title: tailData?.title || "Tail",
      message: tailData?.message || "",
      timestamp: Date.now(),
    };

    tails.set(tailId, tail);

    recipients.forEach((recipient) => {
      const u = users.get(recipient);
      if (u?.socketId) io.to(u.socketId).emit("tail-received", tail);
    });

    console.log(`🦊 ${from} sent tail ${tailId} ->`, recipients);
  });

  // Recipient clicks "Chat"
  socket.on("catch-tail", ({ tailId }) => {
    const tail = tails.get(tailId);
    if (!tail) return;

    // create session if missing
    if (!sessions.has(tailId)) {
      sessions.set(tailId, {
        id: tailId,
        host: tail.from,
        url: tail.url,
        participants: new Set([tail.from, ...tail.recipients]),
        messages: [],
        startedAt: Date.now(),
      });
    }

    const session = sessions.get(tailId);
    session.participants.add(socket.username);

    // join room
    socket.join(tailId);

    // send session to this user
    socket.emit("session-started", { session: serializeSession(session) });

    // notify others (optional)
    socket.to(tailId).emit("new-chat-message", {
      from: "system",
      text: `${socket.username} joined`,
      ts: Date.now(),
    });
  });

  // Chat inside a session
  socket.on("tail-chat", ({ tailId, text }) => {
    const session = sessions.get(tailId);
    if (!session) return;

    const msg = { from: socket.username, text: String(text || ""), ts: Date.now() };
    session.messages.push(msg);

    io.to(tailId).emit("new-chat-message", msg);
  });

  // End session
  socket.on("end-tail-session", ({ tailId }) => {
    const session = sessions.get(tailId);
    if (!session) return;

    io.to(tailId).emit("new-chat-message", {
      from: "system",
      text: `Session ended`,
      ts: Date.now(),
    });

    sessions.delete(tailId);
    tails.delete(tailId);
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      const u = users.get(socket.username);
      if (u) {
        u.status = "offline";
        u.lastSeen = Date.now();
      }
      console.log(`❌ ${socket.username} disconnected`);
    }
  });
});

function serializeSession(session) {
  return {
    id: session.id,
    host: session.host,
    url: session.url,
    messages: session.messages,
    participants: Array.from(session.participants),
    startedAt: session.startedAt,
  };
}

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🦊 Server running on http://0.0.0.0:${PORT}`);
});
