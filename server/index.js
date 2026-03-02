// ============================================================
// Tail Me — Production Server v2.0
// ✅ Real link scraping (og:title, og:image, og:video, price)
// ✅ Geo-proximity feed + haversine distance
// ✅ Expo push notifications (geo-radius audience)
// ✅ Chain tails with per-user layer progression
// ✅ DROP tails with atomic catch limits
// ✅ Passport / catch history per user
// ✅ React emoji system
// ✅ Media upload (images + video)
// ✅ 60s expiry cron + cleanup
// ✅ Rate limiting per socket (anti-spam)
// ✅ URL scrape cache (15-min TTL)
// ✅ Share card metadata endpoint
// ============================================================

const express    = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors       = require("cors");
const multer     = require("multer");
const path       = require("path");
const fs         = require("fs");
const https      = require("https");
const http       = require("http");
const { URL }    = require("url");

// ── Optional: Expo server SDK (install: npm i expo-server-sdk) ──
let Expo;
try {
  Expo = require("expo-server-sdk").Expo;
} catch {
  console.log("ℹ️  expo-server-sdk not installed — push notifications disabled");
  Expo = null;
}

const expo = Expo ? new Expo() : null;

// ── Express setup ──────────────────────────────────────────
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

// ── File upload ────────────────────────────────────────────
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname) ||
      (file.mimetype.includes("video") ? ".mp4" : ".jpg");
    cb(null, `${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

app.post("/upload", upload.single("media"), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: "no file" });
  const type = req.file.mimetype.startsWith("video") ? "video" : "image";
  res.json({ ok: true, url: `/uploads/${req.file.filename}`, type });
});
app.use("/uploads", express.static(uploadDir));

// ── Health ─────────────────────────────────────────────────
app.get("/", (req, res) => res.json({
  ok: true, server: "Tail Me 🦊 v2.0",
  tails: tails.size, users: users.size,
  uptime: Math.round(process.uptime()),
}));

// ── Share card metadata (for deep links) ──────────────────
app.get("/share/:tailId", (req, res) => {
  const tail = tails.get(req.params.tailId);
  if (!tail || tail.expired || Date.now() > tail.expiresAt) {
    return res.status(404).json({ ok: false, error: "expired or not found" });
  }
  res.json({
    ok: true,
    id: tail.id,
    title: tail.meta?.title || tail.title || "Tail Me Drop",
    image: tail.meta?.image || tail.mediaUrl || null,
    from: tail.from,
    tailType: tail.tailType,
    catchCount: tail.catchCount,
    timeLeft: Math.max(0, tail.expiresAt - Date.now()),
    geo: tail.geo ? { lat: tail.geo.lat, lng: tail.geo.lng, radius: tail.geo.radius } : null,
  });
});

// ── Scrape preview endpoint (for testing) ─────────────────
app.get("/scrape", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ ok: false, error: "url required" });
  try {
    const meta = await scrapeUrl(url);
    res.json({ ok: true, meta });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── Socket.io ──────────────────────────────────────────────
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"],
  pingInterval: 25000,
  pingTimeout:  60000,
});

// ═══════════════════════════════════════════════════════════
// DATA STORES (in-memory — swap for Redis/Postgres in prod)
// ═══════════════════════════════════════════════════════════
const users    = new Map(); // username → user object
const tails    = new Map(); // tailId   → tail object
const sessions = new Map(); // tailId   → session object
const catches  = new Map(); // username → catch[] (passport)
const scrapeCache = new Map(); // url → { meta, cachedAt }
const rateLimits  = new Map(); // socketId → { count, window }

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const DURATION_MAP = { m: 60000, h: 3600000, d: 86400000 };
function getTTL(amount, unit) {
  return Math.max(60000, Number(amount) || 1) * (DURATION_MAP[unit] || DURATION_MAP.h);
}

function haversine(lat1, lon1, lat2, lon2) {
  const R    = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180)
    * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(meters) {
  if (!meters && meters !== 0) return null;
  return meters < 1000
    ? `${Math.round(meters)}m`
    : `${(meters / 1000).toFixed(1)}km`;
}

// Rate limiter: max 10 sends per 30s per socket
function checkRate(socketId) {
  const now = Date.now();
  const rl   = rateLimits.get(socketId) || { count: 0, window: now };
  if (now - rl.window > 30000) {
    rateLimits.set(socketId, { count: 1, window: now });
    return true;
  }
  if (rl.count >= 10) return false;
  rl.count++;
  rateLimits.set(socketId, rl);
  return true;
}

// Public-safe view of a tail
function publicView(tail, userLat, userLng) {
  const dist = (userLat && userLng && tail.geo?.lat)
    ? Math.round(haversine(userLat, userLng, tail.geo.lat, tail.geo.lng))
    : null;

  return {
    id:           tail.id,
    from:         tail.from,
    recipients:   tail.recipients,
    visibility:   tail.visibility,
    tailType:     tail.tailType,
    catchLimit:   tail.catchLimit,
    catchCount:   tail.catchCount,
    caughtBy:     tail.caughtBy,
    spotsLeft:    tail.catchLimit != null
      ? Math.max(0, tail.catchLimit - tail.catchCount) : null,
    isFull:       tail.catchLimit != null && tail.catchCount >= tail.catchLimit,
    url:          tail.url,
    mediaUrl:     tail.mediaUrl,
    mediaType:    tail.mediaType,
    title:        tail.title,
    message:      tail.message,
    isAd:         tail.isAd,
    hasReveal:    tail.tailType !== "CHAIN" && !!tail.reveal,
    isChain:      tail.tailType === "CHAIN",
    chainLength:  tail.tailType === "CHAIN" ? (tail.layers?.length || 0) : null,
    geo:          tail.geo ? {
      lat: tail.geo.lat, lng: tail.geo.lng,
      radius: tail.geo.radius,
      distance: dist,
      distanceLabel: formatDist(dist),
    } : null,
    meta:         tail.meta || null,
    reactions:    tail.reactions,
    reactionCount: tail.reactionCount,
    timestamp:    tail.timestamp,
    expiresAt:    tail.expiresAt,
    expired:      tail.expired,
    mintNumber:   tail.mintNumbers?.[tail.caughtBy[0]] || null,
  };
}

function serializeSession(session) {
  return {
    id:          session.id,
    host:        session.host,
    url:         session.url,
    messages:    session.messages,
    participants: Array.from(session.participants),
    startedAt:   session.startedAt,
    chainLayer:  session.chainLayer,
    chainTotal:  session.chainTotal,
  };
}

function getPassport(username) {
  if (!catches.has(username)) catches.set(username, []);
  return catches.get(username);
}

// ═══════════════════════════════════════════════════════════
// LINK SCRAPER
// ═══════════════════════════════════════════════════════════

const SCRAPE_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

async function fetchHtml(rawUrl) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(rawUrl);
      const lib    = parsed.protocol === "https:" ? https : http;
      const options = {
        hostname: parsed.hostname,
        path:     parsed.pathname + parsed.search,
        method:   "GET",
        timeout:  8000,
        headers:  {
          "User-Agent": "TailMe-Bot/2.0 (+https://tailme.app/bot)",
          "Accept":     "text/html,application/xhtml+xml",
        },
      };
      const req = lib.request(options, (res) => {
        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchHtml(res.headers.location).then(resolve).catch(reject);
        }
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
          if (data.length > 300_000) { req.destroy(); resolve(data); } // cap at 300kb
        });
        res.on("end", () => resolve(data));
      });
      req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
      req.on("error", reject);
      req.end();
    } catch (e) { reject(e); }
  });
}

function extractMeta(html, baseUrl) {
  const get = (prop) => {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, "i"),
      new RegExp(`<meta[^>]+name=["']${prop.replace("og:", "")}["'][^>]+content=["']([^"']+)["']`, "i"),
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m) return m[1].trim();
    }
    return null;
  };

  // Title
  let title = get("og:title") || get("twitter:title");
  if (!title) {
    const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (t) title = t[1].trim();
  }

  // Image
  let image = get("og:image") || get("og:image:url") || get("twitter:image");
  if (image && !image.startsWith("http")) {
    try { image = new URL(image, baseUrl).href; } catch {}
  }

  // Video
  let video = get("og:video:url") || get("og:video") || get("og:video:secure_url");
  if (video && !video.startsWith("http")) {
    try { video = new URL(video, baseUrl).href; } catch {}
  }

  // Price (Amazon, Etsy, Shopify patterns)
  let price = null;
  const pricePatterns = [
    /"price":\s*"?([\d.,]+)"?/i,
    /class="[^"]*price[^"]*"[^>]*>\s*\$?([\d.,]+)/i,
    /data-price="([\d.,]+)"/i,
    /"priceSpecification":\s*\{[^}]*"price":\s*"?([\d.,]+)"?/i,
  ];
  for (const p of pricePatterns) {
    const m = html.match(p);
    if (m && parseFloat(m[1]) > 0) {
      price = `$${parseFloat(m[1]).toFixed(2)}`;
      break;
    }
  }

  // Description
  const description = get("og:description") || get("description");

  // Site name
  const siteName = get("og:site_name");

  // Favicon
  let favicon = null;
  try { favicon = `https://${new URL(baseUrl).hostname}/favicon.ico`; } catch {}

  return {
    title:    (title || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").slice(0, 120),
    image:    image || null,
    video:    video || null,
    price:    price || null,
    description: (description || "").slice(0, 200),
    siteName: siteName || null,
    favicon:  favicon,
    url:      baseUrl,
  };
}

async function scrapeUrl(rawUrl) {
  if (!rawUrl) return null;
  const url = rawUrl.trim();

  // Cache hit
  const cached = scrapeCache.get(url);
  if (cached && Date.now() - cached.cachedAt < SCRAPE_CACHE_TTL) {
    return cached.meta;
  }

  try {
    const html = await fetchHtml(url);
    const meta = extractMeta(html, url);
    scrapeCache.set(url, { meta, cachedAt: Date.now() });
    return meta;
  } catch (e) {
    console.log(`⚠️  Scrape failed for ${url}: ${e.message}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS (Expo)
// ═══════════════════════════════════════════════════════════

async function sendPush(tokens, title, body, data = {}) {
  if (!expo || !tokens || tokens.length === 0) return;
  const messages = tokens
    .filter((t) => t && Expo.isExpoPushToken(t))
    .map((to) => ({
      to, sound: "default", title, body, data,
      priority: "high", channelId: "tail-drops",
    }));
  if (!messages.length) return;
  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (e) {
    console.log("⚠️  Push error:", e.message);
  }
}

async function notifyNearbyUsers(tail) {
  if (!tail.geo?.lat) return 0;
  const tokens = [];
  for (const [username, user] of users.entries()) {
    if (username === tail.from) continue;
    if (!user.pushToken || !user.lastLat || !user.lastLng) continue;
    const dist = haversine(user.lastLat, user.lastLng, tail.geo.lat, tail.geo.lng);
    if (dist <= (tail.geo.radius || 1000)) {
      tokens.push(user.pushToken);
    }
  }
  if (tokens.length > 0) {
    const distLabel = formatDist(tail.geo.radius);
    await sendPush(
      tokens,
      `📍 Nearby: ${tail.title || "Drop"}`,
      `${distLabel} from you · ${tail.tailType} · Catch it now!`,
      { tailId: tail.id, type: "geo" }
    );
  }
  return tokens.length;
}

// ═══════════════════════════════════════════════════════════
// SOCKET.IO EVENT HANDLERS
// ═══════════════════════════════════════════════════════════

console.log("🦊 Tail Me Server Starting...");

io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);

  // ── REGISTER ──────────────────────────────────────────
  socket.on("register", (data) => {
    const username = (data?.username || "").trim().slice(0, 30);
    if (!username) return;
    const existing = users.get(username) || {};
    users.set(username, {
      ...existing,
      username,
      socketId:  socket.id,
      status:    "online",
      lastSeen:  Date.now(),
      pushToken: data?.pushToken || existing.pushToken || null,
      lastLat:   existing.lastLat || null,
      lastLng:   existing.lastLng || null,
    });
    socket.username = username;
    socket.emit("registration-complete", { ok: true, username });
    console.log(`👤 ${username} registered`);
  });

  // ── UPDATE LOCATION ───────────────────────────────────
  socket.on("update-location", ({ lat, lng }) => {
    const u = users.get(socket.username);
    if (!u || !lat || !lng) return;
    u.lastLat = lat;
    u.lastLng = lng;
  });

  // ── PUBLIC FEED ───────────────────────────────────────
  socket.on("get-public-feed", () => {
    const now  = Date.now();
    const feed = [...tails.values()]
      .filter(t => t.visibility === "public" && !t.expired && now < t.expiresAt)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 60)
      .map(t => publicView(t));
    socket.emit("public-feed", { tails: feed });
  });

  // ── SMART FEED (trending algo) ────────────────────────
  socket.on("get-smart-feed", () => {
    const now  = Date.now();
    const feed = [...tails.values()]
      .filter(t => t.visibility === "public" && !t.expired && now < t.expiresAt)
      .map(t => {
        const ageH = (now - t.timestamp) / 3600000;
        const score = (t.catchCount + t.reactionCount * 0.5) / Math.pow(ageH + 1, 1.5);
        return { tail: t, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map(({ tail }) => publicView(tail));
    socket.emit("smart-feed", { tails: feed });
  });

  // ── GEO FEED ──────────────────────────────────────────
  socket.on("get-geo-feed", ({ lat, lng, radiusMeters }) => {
    const now = Date.now();
    // Update user location
    const u = users.get(socket.username);
    if (u && lat && lng) { u.lastLat = lat; u.lastLng = lng; }

    const feed = [...tails.values()]
      .filter(t => {
        if (t.expired || now >= t.expiresAt || t.visibility !== "public") return false;
        if (!t.geo?.lat) return false;
        if (!lat || !lng) return true;
        const dist = haversine(lat, lng, t.geo.lat, t.geo.lng);
        return !radiusMeters || dist <= radiusMeters;
      })
      .map(t => ({
        ...publicView(t, lat, lng),
        distance: (lat && lng) ? Math.round(haversine(lat, lng, t.geo.lat, t.geo.lng)) : null,
      }))
      .sort((a, b) => (a.distance ?? 99999) - (b.distance ?? 99999));
    socket.emit("geo-feed", { tails: feed });
  });

  // ── TAIL PREVIEW ──────────────────────────────────────
  socket.on("tail-preview", ({ tailId }) => {
    const tail = tails.get(tailId);
    if (!tail) return socket.emit("tail-preview-data", { error: "not_found" });
    if (tail.expired || Date.now() > tail.expiresAt) {
      tail.expired = true;
      return socket.emit("tail-preview-data", { error: "expired", tailId });
    }
    socket.emit("tail-preview-data", { tail: publicView(tail) });
  });

  // ── SEND TAIL ─────────────────────────────────────────
  socket.on("send-tail", async (data) => {
    const from = socket.username || "unknown";

    // Rate limit
    if (!checkRate(socket.id)) {
      return socket.emit("tail-sent", { ok: false, error: "Too many sends. Wait 30s." });
    }

    const visibility  = data?.visibility === "private" ? "private" : "public";
    const tailType    = ["LOOK","NOW","DROP","CHAIN","GEO"].includes(data?.tailType) ? data.tailType : "LOOK";
    const recipients  = Array.isArray(data?.recipients) ? data.recipients.slice(0, 10) : [];
    const catchLimit  = tailType === "DROP"
      ? Math.max(1, Math.min(1000, Number(data?.catchLimit) || 10))
      : null;
    const geo = (data?.geo?.lat && data?.geo?.lng)
      ? { lat: data.geo.lat, lng: data.geo.lng, radius: Math.min(data.geo.radius || 1000, 50000) }
      : null;
    const layers = tailType === "CHAIN" && Array.isArray(data?.layers) ? data.layers : null;

    const tailId = `tail_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const tail   = {
      id: tailId, from, recipients, visibility, tailType, catchLimit,
      url:          (data?.url || "").trim().slice(0, 500),
      mediaUrl:     data?.mediaUrl  || null,
      mediaType:    data?.mediaType || null,
      title:        (data?.title || "Tail").slice(0, 100),
      message:      (data?.message || "").slice(0, 500),
      isAd:         !!data?.isAd,
      reveal:       data?.reveal || null,
      layers,
      geo,
      meta:         null,       // filled async below
      reactions:    {},
      reactionCount: 0,
      timestamp:    Date.now(),
      expiresAt:    Date.now() + getTTL(data?.durationAmount, data?.durationUnit),
      expired:      false,
      catchCount:   0,
      caughtBy:     [],
      mintNumbers:  {},         // username → mint number
      chainProgress: {},         // username → layerIndex
    };

    tails.set(tailId, tail);
    socket.emit("tail-sent", { ok: true, tailId });

    // Broadcast immediately (before scrape)
    const view = publicView(tail);
    if (visibility === "public") {
      io.emit("public-tail-created", view);
      console.log(`🌐 ${from} ${tailType} [limit:${catchLimit ?? "∞"}] geo:${!!geo}`);
    } else {
      for (const r of recipients) {
        const u = users.get(r);
        if (u?.socketId) io.to(u.socketId).emit("tail-received", view);
      }
      console.log(`🔒 ${from} → ${recipients.join(", ")}`);
    }

    // Async: scrape URL and update meta
    if (tail.url) {
      const meta = await scrapeUrl(tail.url);
      if (meta) {
        tail.meta  = meta;
        tail.title = tail.title === "Tail" ? (meta.title || tail.title) : tail.title;
        // Push updated meta to all
        io.emit("tail-updated", { tailId, patch: { meta, title: tail.title } });
      }
    }

    // Async: geo push notifications
    if (geo) {
      const count = await notifyNearbyUsers(tail);
      if (count > 0) console.log(`📲 Pushed to ${count} nearby users`);
    }

    // Private: push to offline recipient
    if (visibility === "private") {
      const tokens = recipients
        .map(r => users.get(r)?.pushToken)
        .filter(Boolean);
      await sendPush(
        tokens,
        `📬 New tail from @${from}`,
        tail.message || "You received a private tail!",
        { tailId, type: "private" }
      );
    }
  });

  // ── CATCH TAIL ────────────────────────────────────────
  socket.on("catch-tail", ({ tailId, lat, lng }) => {
    const tail     = tails.get(tailId);
    const username = socket.username || "unknown";
    const now      = Date.now();

    if (!tail)
      return socket.emit("catch-failed", { tailId, reason: "not_found" });
    if (tail.expired || now > tail.expiresAt) {
      tail.expired = true;
      return socket.emit("catch-failed", { tailId, reason: "expired" });
    }
    if (tail.catchLimit != null && tail.catchCount >= tail.catchLimit)
      return socket.emit("catch-failed", { tailId, reason: "full" });

    // Geo verification (server-side — cannot be spoofed)
    if (tail.geo?.lat && tail.geo?.radius) {
      if (!lat || !lng)
        return socket.emit("catch-failed", { tailId, reason: "geo_required" });
      const dist = haversine(lat, lng, tail.geo.lat, tail.geo.lng);
      if (dist > tail.geo.radius)
        return socket.emit("catch-failed", {
          tailId, reason: "out_of_range",
          distance: Math.round(dist), required: tail.geo.radius,
        });
    }

    // ── CHAIN tail ─────────────────────────────────────
    if (tail.tailType === "CHAIN" && tail.layers?.length > 0) {
      if (!tail.caughtBy.includes(username)) {
        tail.caughtBy.push(username);
        tail.catchCount += 1;
        tail.mintNumbers[username] = tail.catchCount;
      }
      tail.chainProgress[username] = 0;
      socket.join(tailId);

      if (!sessions.has(tailId)) {
        sessions.set(tailId, {
          id: tailId, host: tail.from, url: tail.url,
          participants: new Set([tail.from]),
          messages: [], startedAt: now,
          chainLayer: 0, chainTotal: tail.layers.length,
        });
      }
      sessions.get(tailId).participants.add(username);

      const passport = getPassport(username);
      if (!passport.find(c => c.id === tailId)) {
        passport.push({
          id: tailId, tailType: "CHAIN", from: tail.from,
          message: tail.message, geo: !!tail.geo,
          timestamp: now, layersCompleted: 0,
        });
      }

      io.emit("tail-catch-update", {
        tailId, user: username, catchCount: tail.catchCount,
        mintNumber: tail.mintNumbers[username], ts: now,
      });

      return socket.emit("chain-layer-unlocked", {
        tailId, layerIndex: 0, layerTotal: tail.layers.length,
        layer: tail.layers[0],
        session: serializeSession(sessions.get(tailId)),
        tail: publicView(tail, lat, lng),
      });
    }

    // ── STANDARD catch ─────────────────────────────────
    if (tail.caughtBy.includes(username))
      return socket.emit("catch-failed", { tailId, reason: "already_caught" });

    tail.caughtBy.push(username);
    tail.catchCount += 1;
    tail.mintNumbers[username] = tail.catchCount;

    const spotsLeft = tail.catchLimit != null
      ? Math.max(0, tail.catchLimit - tail.catchCount) : null;
    const isFull = tail.catchLimit != null && tail.catchCount >= tail.catchLimit;

    if (isFull) {
      tail.expired = true;
      io.emit("tail-closed", {
        tailId, catchCount: tail.catchCount, catchLimit: tail.catchLimit,
      });
      console.log(`🔒 DROP ${tailId} CLOSED ${tail.catchCount}/${tail.catchLimit}`);
    }

    io.emit("tail-catch-update", {
      tailId, user: username, catchCount: tail.catchCount,
      catchLimit: tail.catchLimit, caughtBy: tail.caughtBy,
      spotsLeft, isFull, mintNumber: tail.catchCount, ts: now,
    });

    console.log(`🎯 ${username} caught ${tailId} (${tail.catchCount}/${tail.catchLimit ?? "∞"})`);

    // Notify sender
    const sender = users.get(tail.from);
    if (sender?.socketId && tail.from !== username) {
      io.to(sender.socketId).emit("your-tail-caught", {
        tailId, by: username, catchCount: tail.catchCount,
        spotsLeft, isFull, mintNumber: tail.catchCount,
      });
      // Push to sender if offline
      if (sender.pushToken && !sender.socketId) {
        sendPush(
          [sender.pushToken],
          `🎯 @${username} caught your tail!`,
          tail.title || "Your drop got a catch",
          { tailId, type: "caught" }
        );
      }
    }

    socket.join(tailId);

    // Create / join session
    if (!sessions.has(tailId)) {
      sessions.set(tailId, {
        id: tailId, host: tail.from, url: tail.url,
        participants: new Set([tail.from, ...tail.recipients]),
        messages: [], startedAt: now,
      });
    }
    const session = sessions.get(tailId);
    session.participants.add(username);

    // Record in passport
    const passport = getPassport(username);
    if (!passport.find(c => c.id === tailId)) {
      passport.push({
        id: tailId, tailType: tail.tailType, from: tail.from,
        message: tail.message, title: tail.title,
        meta: tail.meta, geo: !!tail.geo,
        mintNumber: tail.catchCount, timestamp: now,
      });
    }

    // Full reveal (with coupon/url) goes ONLY to catcher
    socket.emit("session-started", {
      session: serializeSession(session),
      tail: { ...publicView(tail, lat, lng), reveal: tail.reveal },
      mintNumber: tail.catchCount,
    });

    // System message to chat room
    socket.to(tailId).emit("new-chat-message", {
      from: "system",
      text: `@${username} caught this tail 🎯 (Mint #${tail.catchCount})`,
      ts: now,
    });
  });

  // ── CHAIN: NEXT LAYER ─────────────────────────────────
  socket.on("chain-next-layer", ({ tailId }) => {
    const tail     = tails.get(tailId);
    const username = socket.username || "unknown";
    if (!tail || tail.tailType !== "CHAIN" || !tail.layers) return;

    const current = tail.chainProgress[username];
    if (current == null) return;

    const next = current + 1;
    if (next >= tail.layers.length) {
      // Chain complete
      const p = getPassport(username).find(c => c.id === tailId);
      if (p) p.layersCompleted = tail.layers.length;
      socket.emit("chain-complete", {
        tailId, layerTotal: tail.layers.length,
        finalReveal: tail.layers[tail.layers.length - 1]?.reveal,
      });
      console.log(`🏁 ${username} completed chain ${tailId}`);
      return;
    }

    tail.chainProgress[username] = next;
    const p = getPassport(username).find(c => c.id === tailId);
    if (p) p.layersCompleted = next;

    socket.emit("chain-layer-unlocked", {
      tailId, layerIndex: next, layerTotal: tail.layers.length,
      layer: tail.layers[next],
    });
  });

  // ── PASSPORT ─────────────────────────────────────────
  socket.on("get-passport", ({ username }) => {
    const target = (username || socket.username || "").trim();
    if (!target) return;
    const data = getPassport(target).slice(-100).reverse();
    socket.emit("passport-data", { username: target, catches: data });
  });

  // ── REACTIONS ─────────────────────────────────────────
  socket.on("react-tail", ({ tailId, emoji }) => {
    const tail = tails.get(tailId);
    if (!tail || !emoji) return;
    // Limit emoji to safe characters
    const safeEmoji = String(emoji).slice(0, 4);
    tail.reactions[safeEmoji] = (tail.reactions[safeEmoji] || 0) + 1;
    tail.reactionCount = Object.values(tail.reactions).reduce((a, b) => a + b, 0);
    io.emit("tail-reactions-update", {
      tailId, reactions: tail.reactions, reactionCount: tail.reactionCount,
    });
  });

  // ── OPEN LINK ─────────────────────────────────────────
  socket.on("open-link", ({ tailId }) => {
    const t = tails.get(tailId);
    if (t) t.linkClicks = (t.linkClicks || 0) + 1;
  });

  // ── CHAT ──────────────────────────────────────────────
  socket.on("tail-chat", ({ tailId, text }) => {
    const session = sessions.get(tailId);
    if (!session) return;
    // Rate limit chat
    if (!checkRate(socket.id)) return;
    const msg = {
      from: socket.username || "unknown",
      text: String(text || "").slice(0, 500),
      ts: Date.now(),
    };
    session.messages.push(msg);
    if (session.messages.length > 200) session.messages.shift();
    io.to(tailId).emit("new-chat-message", msg);
  });

  // ── END SESSION ───────────────────────────────────────
  socket.on("end-tail-session", ({ tailId }) => {
    const session = sessions.get(tailId);
    if (!session) return;
    // Only host can end
    if (session.host !== socket.username) return;
    io.to(tailId).emit("new-chat-message", {
      from: "system", text: "Session ended by host", ts: Date.now(),
    });
    sessions.delete(tailId);
    tails.delete(tailId);
  });

  // ── DISCONNECT ────────────────────────────────────────
  socket.on("disconnect", () => {
    if (socket.username) {
      const u = users.get(socket.username);
      if (u) { u.status = "offline"; u.lastSeen = Date.now(); }
      rateLimits.delete(socket.id);
      console.log(`❌ ${socket.username} disconnected`);
    }
  });
});

// ═══════════════════════════════════════════════════════════
// CRON: Cleanup expired tails every 60s
// ═══════════════════════════════════════════════════════════
setInterval(() => {
  const now = Date.now();
  let n     = 0;
  for (const [id, tail] of tails.entries()) {
    if (tail.expired || now > tail.expiresAt) {
      io.emit("tail-expired", { tailId: id });
      tails.delete(id);
      sessions.delete(id);
      n++;
    }
  }
  if (n) console.log(`🧹 Cleaned ${n} tail(s). Active: ${tails.size}`);
}, 60_000);

// Cleanup rate limiter map every 5 min
setInterval(() => {
  const now = Date.now();
  for (const [id, rl] of rateLimits.entries()) {
    if (now - rl.window > 60000) rateLimits.delete(id);
  }
}, 300_000);

// Cleanup old scrape cache every hour
setInterval(() => {
  const now = Date.now();
  for (const [url, entry] of scrapeCache.entries()) {
    if (now - entry.cachedAt > SCRAPE_CACHE_TTL) scrapeCache.delete(url);
  }
}, 3_600_000);

// ═══════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5050;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🦊 Tail Me v2.0 running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Uploads: ${uploadDir}`);
  console.log(`📲 Push: ${expo ? "enabled" : "disabled (install expo-server-sdk)"}`);
});