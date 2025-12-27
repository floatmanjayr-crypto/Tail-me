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

// ===============================
// 🕒 Tail Expiration Config
// ===============================
const TAIL_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const ONE_CATCH_ONLY = true;            // true = expires after first catch

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

  // 🦊 Tail preview (optional, safe)
  socket.on("tail-preview", ({ tailId }) => {
    const tail = tails.get(tailId);

    if (!tail) {
      socket.emit("tail-preview-data", { error: "not_found" });
      return;
    }

    if (tail.expired || Date.now() > tail.expiresAt) {
      tail.expired = true;
      socket.emit("tail-preview-data", { error: "expired", tailId });
      return;
    }

    socket.emit("tail-preview-data", {
      tail: {
        id: tail.id,
        from: tail.from,
        title: tail.title,
        url: tail.url,
        message: tail.message,
        timestamp: tail.timestamp,
        expiresAt: tail.expiresAt,
        catchCount: tail.catchCount,
        caughtBy: tail.caughtBy,
        recipients: tail.recipients,
      },
    });
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

      // 🦊 Catch tracking
      catchCount: 0,
      caughtBy: [],

      // 🕒 Expiration
      expiresAt: Date.now() + TAIL_TTL_MS,
      expired: false,
    };

    tails.set(tailId, tail);

    recipients.forEach((recipient) => {
      const u = users.get(recipient);
      if (u?.socketId) io.to(u.socketId).emit("tail-received", tail);
    });

    console.log(`🦊 ${from} sent tail ${tailId} ->`, recipients);
    console.log("🕒 Tail expires at:", new Date(tail.expiresAt).toISOString());
  });

  // Recipient clicks "Chat" (Catch)
  socket.on("catch-tail", ({ tailId }) => {
    const tail = tails.get(tailId);
    if (!tail) return;

    // 🕒 Expired?
    if (tail.expired || Date.now() > tail.expiresAt) {
      tail.expired = true;
      socket.emit("tail-expired", { tailId });
      return;
    }

    const username = socket.username || "unknown";

    // 🦊 Track catch
    if (!tail.caughtBy.includes(username)) {
      tail.caughtBy.push(username);
      tail.catchCount += 1;
    }

    // 🕒 One-catch-only logic (scarcity)
    if (ONE_CATCH_ONLY && tail.catchCount >= 1) {
      tail.expired = true;
    }

    // If it expired after this catch, notify the catcher (and stop session start)
    if (tail.expired) {
      socket.emit("tail-expired", { tailId });

      // Optional: tell sender/recipients too (so UI updates everywhere)
      tail.recipients.forEach((recipient) => {
        const u = users.get(recipient);
        if (u?.socketId) io.to(u.socketId).emit("tail-expired", { tailId });
      });
      const hostUser = users.get(tail.from);
      if (hostUser?.socketId) io.to(hostUser.socketId).emit("tail-expired", { tailId });

      return;
    }

    // join room
    socket.join(tailId);

    // 🔔 Broadcast catch update to people in room (and future listeners)
    io.to(tailId).emit("tail-catch-update", {
      tailId,
      user: username,
      catchCount: tail.catchCount,
      caughtBy: tail.caughtBy,
      ts: Date.now(),
    });

    console.log("🎯 Tail caught:", { tailId, by: username, count: tail.catchCount });

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
    session.participants.add(username);

    // send session to this user
    socket.emit("session-started", { session: serializeSession(session) });

    // notify others (optional)
    socket.to(tailId).emit("new-chat-message", {
      from: "system",
      text: `${username} joined`,
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

// ===============================
// 🧹 Expired Tail Cleanup
// ===============================
setInterval(() => {
  const now = Date.now();
  for (const [tailId, tail] of tails.entries()) {
    if (tail.expired || now > tail.expiresAt) {
      tails.delete(tailId);
      sessions.delete(tailId);
      console.log("🧹 Tail expired & removed:", tailId);
    }
  }
}, 60 * 1000); // every 1 minute

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

const PORT = process.env.PORT || 5050; // change to 5050 if you want
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🦊 Server running on http://0.0.0.0:${PORT}`);
});
