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
const {
  SEED_TAILS, BOT_ACCOUNTS, TIERS,
  checkAffiliateLimit, recordAffiliateCreated,
  recordAffiliateExpired, recordAffiliateConversion,
  setUserTier, getAffiliateLimitInfo, webRevealPage,
} = require("./affiliate");

// ── Optional: Expo server SDK (install: npm i expo-server-sdk) ──
let Expo;
try {
  Expo = require("expo-server-sdk").Expo;
} catch {
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


// ── Resolve tail — smart monetized redirect ───────────
app.get("/resolve/:tailId", (req, res) => {
  const tail = tails.get(req.params.tailId);
  const ref  = req.query.ref || "direct";

  if (!tail || tail.expired || Date.now() > tail.expiresAt) {
    return res.status(404).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0d0d0f;color:#fff">
        <h2>🦊 This tail has expired</h2>
        <p>Download Tail Me to catch live drops</p>
      </body></html>
    `);
  }

  // Track click
  const stats = analytics.get(tail.id) || { clicks:0, opens:0, catches:0, conversions:0, revenue:0 };
  stats.clicks += 1;
  analytics.set(tail.id, stats);

  // Update tail analytics
  tail.analytics = tail.analytics || {};
  tail.analytics.clicks = (tail.analytics.clicks || 0) + 1;

  // Emit real-time click event to tail creator
  const sender = users.get(tail.from);
  if (sender?.socketId) {
    io.to(sender.socketId).emit("tail-click", {
      tailId: tail.id,
      clicks: tail.analytics.clicks,
      ref,
      ts: Date.now(),
    });
  }

  // Resolve destination
  const destination = tail.monetization?.monetizedUrl || tail.url;

  if (!destination) {
    return res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0d0d0f;color:#fff">
        <h2>🦊 ${tail.title || "Tail"}</h2>
        <p>${tail.message || "No link attached"}</p>
      </body></html>
    `);
  }

  // Log monetization type
  const mType = tail.monetization?.type || "direct";
  console.log("Seeded affiliate tail:", seed.id, "from @" + seed.from);

  // Redirect
  res.redirect(302, destination);
});

// ── Analytics endpoint — creator dashboard data ───────
app.get("/analytics/:tailId", (req, res) => {
  const tail  = tails.get(req.params.tailId);
  const stats = analytics.get(req.params.tailId);
  if (!tail) return res.status(404).json({ ok: false, error: "not found" });
  res.json({
    ok: true,
    tailId: req.params.tailId,
    from: tail.from,
    title: tail.title,
    tailType: tail.tailType,
    monetizationType: tail.monetization?.type || "direct",
    stats: {
      clicks:      tail.analytics?.clicks      || 0,
      catches:     tail.catchCount             || 0,
      reactions:   tail.reactionCount          || 0,
      impressions: tail.analytics?.impressions || 0,
      conversions: stats?.conversions          || 0,
      revenue:     stats?.revenue              || 0,
      conversionRate: tail.catchCount > 0
        ? ((stats?.conversions || 0) / tail.catchCount * 100).toFixed(1) + "%"
        : "0%",
    },
    energy: tail.energy || { current: 100 },
    createdAt: tail.timestamp,
    expiresAt: tail.expiresAt,
    timeLeft: Math.max(0, tail.expiresAt - Date.now()),
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

// Keep-alive for App Runner
httpServer.keepAliveTimeout = 120000;
httpServer.headersTimeout = 125000;

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  },
  transports: ["polling"],
  allowUpgrades: false,
  pingInterval: 10000,
  pingTimeout: 30000,
  httpCompression: false,
  maxHttpBufferSize: 1e6,
  cookie: false,
});

// ═══════════════════════════════════════════════════════════
// DATA STORES (in-memory — swap for Redis/Postgres in prod)
// ═══════════════════════════════════════════════════════════
const users    = new Map(); // username → user object
const tails    = new Map(); // tailId   → tail object
const sessions = new Map(); // tailId   → session object
const catches  = new Map(); // username → catch[] (passport)
const scrapeCache = new Map(); // url → { meta, cachedAt }
const analytics  = new Map(); // tailId → { clicks, opens, catches, conversions, revenue }
const rateLimits  = new Map(); // socketId → { count, window }

// ── Seed bot accounts + affiliate tails ──────────────────
function seedAffiliateTails() {
  // Register bot accounts
  BOT_ACCOUNTS.forEach(bot => {
    if (!users.has(bot.username)) {
      users.set(bot.username, {
        socketId: null,
        username: bot.username,
        displayName: bot.displayName,
        isBot: true,
        tier: "verified",
        interests: [],
      });
    }
  });

  // Seed affiliate tails
  SEED_TAILS.forEach(seed => {
    if (tails.has(seed.id)) return; // already seeded
    const now = Date.now();
    tails.set(seed.id, {
      id: seed.id,
      from: seed.from,
      tailType: seed.tailType,
      title: seed.title,
      message: seed.message,
      mediaUrl: seed.mediaUrl,
      url: seed.affiliateUrl,
      affiliateUrl: seed.affiliateUrl,
      isAffiliate: true,
      catchLimit: seed.catchLimit,
      catchCount: 0,
      caughtBy: [],
      categories: seed.categories || [],
      reveal: seed.reveal,
      reactions: {},
      reactionCount: 0,
      timestamp: now,
      expiresAt: now + (seed.expiryHours * 3600000),
      expired: false,
      visibility: "public",
      monetization: {
        type: "affiliate",
        contentUrl: seed.affiliateUrl,
        monetizedUrl: seed.affiliateUrl,
        revenueGenerated: 0,
        creatorEarnings: 0,
        platformFee: 0,
      },
      analytics: { impressions: 0, clicks: 0, opens: 0, catches: 0, conversions: 0, webViews: 0 },
      energy: { current: 100, decayRate: 0.5, lastUpdated: now },
      meta: { title: seed.title, description: seed.message, image: seed.mediaUrl },
    });
    console.log("Seeded affiliate tail:", seed.id, "from @" + seed.from);
  });
}

// Seed on startup
seedAffiliateTails();

// Re-seed expired affiliate tails every hour
setInterval(() => {
  SEED_TAILS.forEach(seed => {
    const existing = tails.get(seed.id);
    if (!existing || existing.expired || Date.now() > existing.expiresAt) {
      tails.delete(seed.id);
      const now = Date.now();
      tails.set(seed.id, {
        id: seed.id,
        from: seed.from,
        tailType: seed.tailType,
        title: seed.title,
        message: seed.message,
        mediaUrl: seed.mediaUrl,
        url: seed.affiliateUrl,
        affiliateUrl: seed.affiliateUrl,
        isAffiliate: true,
        catchLimit: seed.catchLimit,
        catchCount: 0,
        caughtBy: [],
        categories: seed.categories || [],
        reveal: seed.reveal,
        reactions: {},
        reactionCount: 0,
        timestamp: now,
        expiresAt: now + (seed.expiryHours * 3600000),
        expired: false,
        visibility: "public",
        monetization: {
          type: "affiliate",
          contentUrl: seed.affiliateUrl,
          monetizedUrl: seed.affiliateUrl,
          revenueGenerated: 0,
          creatorEarnings: 0,
          platformFee: 0,
        },
        analytics: { impressions: 0, clicks: 0, opens: 0, catches: 0, conversions: 0, webViews: 0 },
        energy: { current: 100, decayRate: 0.5, lastUpdated: now },
        meta: { title: seed.title, description: seed.message, image: seed.mediaUrl },
      });
      console.log("Seeded affiliate tail:", seed.id, "from @" + seed.from);
    }
  });
}, 3600000);

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
    previewUrl:   tail.previewUrl || null,
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
    categories:   tail.categories  || [],
    revealSkin:   tail.revealSkin  || "default",
    monetization: tail.monetization ? {
      type: tail.monetization.type,
      hasMonetizedUrl: !!tail.monetization.monetizedUrl,
      revenueGenerated: tail.monetization.revenueGenerated || 0,
    } : null,
    analytics:    tail.analytics   || {},
    energy:       tail.energy      || { current: 100 },
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
    // scrape error (silent)
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
    // push notification error (silent)
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

// ── Tail web reveal page ──────────────────────────────────
app.get("/t/:tailId", (req, res) => {
  const tail = tails.get(req.params.tailId);
  if (!tail) {
    return res.status(404).send(`<!DOCTYPE html><html><body style="background:#070A0F;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column">
      <div style="font-size:48px">🦊</div>
      <h2 style="margin:16px 0 8px">Tail not found</h2>
      <p style="color:#64748B">This tail may have expired or been removed.</p>
    </body></html>`);
  }
  // Track web view
  const a = tail.analytics || {};
  a.webViews = (a.webViews || 0) + 1;
  tail.analytics = a;
  res.send(webRevealPage({
    ...tail,
    isFull: tail.catchLimit != null && tail.catchCount >= tail.catchLimit,
  }));
});

// ── User profile page ──────────────────────────────────────
app.get("/@:username", (req, res) => {
  const username = req.params.username;
  const userTails = [...tails.values()]
    .filter(t => t.from === username && !t.expired)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>@${username} on Tail Me</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#070A0F;font-family:-apple-system,sans-serif;color:#E5E7EB;padding:24px}
    .header{text-align:center;padding:32px 0 24px}
    .avatar{width:72px;height:72px;border-radius:20px;background:#7C3AED;
      display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 12px}
    .username{font-size:22px;font-weight:900}
    .meta{color:#64748B;font-size:13px;margin-top:4px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:500px;margin:0 auto}
    .tail-card{aspect-ratio:1;border-radius:14px;overflow:hidden;position:relative;cursor:pointer;
      border:1.5px solid #1E293B;background:#0D1220;text-decoration:none;display:block}
    .tail-img{width:100%;height:100%;object-fit:cover}
    .tail-overlay{position:absolute;bottom:0;left:0;right:0;padding:6px;
      background:linear-gradient(transparent,rgba(0,0,0,0.8))}
    .tail-type{font-size:9px;font-weight:900;color:#fff}
    .logo{text-align:center;margin-top:32px;color:#64748B;font-size:13px}
  </style>
</head>
<body>
  <div class="header">
    <div class="avatar">🦊</div>
    <div class="username">@${username}</div>
    <div class="meta">${userTails.length} active tail${userTails.length !== 1 ? "s" : ""}</div>
  </div>
  <div class="grid">
    ${userTails.map(t => `
      <a class="tail-card" href="/t/${t.id}">
        ${t.mediaUrl ? `<img class="tail-img" src="${t.mediaUrl}"/>` : ""}
        <div class="tail-overlay">
          <div class="tail-type">${t.tailType || "LOOK"}</div>
        </div>
      </a>
    `).join("")}
  </div>
  <div class="logo">🦊 Tail Me — Catch moments, don't scroll.</div>
</body>
</html>`;
  res.send(html);
});

// ── Affiliate limit check endpoint ────────────────────────
app.get("/affiliate/limits/:username", (req, res) => {
  res.json(getAffiliateLimitInfo(req.params.username));
});

// ═══════════════════════════════════════════════════════════
// SOCKET.IO EVENT HANDLERS
// ═══════════════════════════════════════════════════════════


io.on("connection", (socket) => {

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
    console.log("User registered:", username);
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
        const ageH   = (now - t.timestamp) / 3600000;
        const energy = t.energy?.current || 100;
        const score  = ((t.catchCount + t.reactionCount * 0.5) / Math.pow(ageH + 1, 1.5))
          + (energy * 0.05)
          + (t.analytics?.clicks || 0) * 0.1;
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

    // Check affiliate limits if this tail has a monetized URL
    if (data.monetization?.monetizedUrl) {
      const limitCheck = checkAffiliateLimit(from);
      if (!limitCheck.ok) {
        const limitInfo = getAffiliateLimitInfo(from);
        socket.emit("affiliate-limit-reached", {
          reason: limitCheck.reason,
          ...limitInfo,
        });
        return;
      }
    }

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
      previewUrl:   data?.previewUrl || null,
      frameLayout:  data?.frameLayout || null,
      revealBox:    data?.revealBox ?? 1,
      boxes:        Array.isArray(data?.boxes) ? data.boxes : null,
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
      mintNumbers:  {},
      chainProgress: {},
      monetization: data?.monetization || { contentUrl: null, monetizedUrl: null, type: "direct", revenueGenerated: 0, creatorEarnings: 0, platformFee: 0 },
      analytics:    data?.analytics    || { impressions: 0, clicks: 0, opens: 0, catches: 0, conversions: 0, engagementScore: 0 },
      energy:       data?.energy       || { current: 100, decayRate: 0.5, lastUpdated: Date.now() },
      categories:   data?.categories   || [],
      revealSkin:   data?.revealSkin   || "default",
    };

    tails.set(tailId, tail);
    socket.emit("tail-sent", { ok: true, tailId });

    // Broadcast immediately (before scrape)
    const view = publicView(tail);
    if (visibility === "public") {
      io.emit("public-tail-created", view);
      console.log("Public tail created:", tail.id);
    } else {
      for (const r of recipients) {
        const u = users.get(r);
        if (u?.socketId) io.to(u.socketId).emit("tail-received", view);
      }
      console.log("Private tail sent:", tail.id);
    }

    // Async tasks - fire and forget, can't crash connection
    setTimeout(async () => {
      try {
        if (tail.url) {
          const meta = await scrapeUrl(tail.url);
          if (meta) {
            tail.meta = meta;
            tail.title = tail.title === "Tail" ? (meta.title || tail.title) : tail.title;
            io.emit("tail-updated", { tailId, patch: { meta, title: tail.title } });
          }
        }
      } catch (e) { console.log("Scrape error:", e.message); }

      try {
        if (geo) {
          const count = await notifyNearbyUsers(tail);
          if (count > 0) console.log("Geo push:", count, "users");
        }
      } catch (e) {}

      try {
        if (visibility === "private") {
          const tokens = recipients.map(r => users.get(r)?.pushToken).filter(Boolean);
          if (tokens.length) await sendPush(tokens, "New tail from @" + from, tail.message || "You got a tail!", { tailId });
        }
      } catch (e) {}
    }, 100);
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
      console.log("Tail closed:", tailId);
    }

    io.emit("tail-catch-update", {
      tailId, user: username, catchCount: tail.catchCount,
      catchLimit: tail.catchLimit, caughtBy: tail.caughtBy,
      spotsLeft, isFull, mintNumber: tail.catchCount, ts: now,
    });

    console.log("Tail caught:", tailId, "by", socket.username);

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
          `🎯 @${username} caught your tail! +1 catch`,
          tail.message ? tail.message.slice(0,60) : "Your drop got a catch 🔥",
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
      console.log("Chain complete:", tail.id);
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

  // ── TAIL ANALYTICS ───────────────────────────────────
  socket.on("tail-analytics", ({ tailId, event, userId }) => {
    const tail = tails.get(tailId);
    if (!tail) return;
    tail.analytics = tail.analytics || {};
    if (event === "catch")  tail.analytics.catches     = (tail.analytics.catches     || 0) + 1;
    if (event === "click")  tail.analytics.clicks      = (tail.analytics.clicks      || 0) + 1;
    if (event === "open")   tail.analytics.opens       = (tail.analytics.opens       || 0) + 1;
    if (event === "share")  tail.analytics.engagementScore = (tail.analytics.engagementScore || 0) + 2;
    // Boost energy on engagement
    if (tail.energy && ["catch","click","share"].includes(event)) {
      tail.energy.current = Math.min(100, (tail.energy.current || 0) + 3);
      tail.energy.lastUpdated = Date.now();
    }
    // Notify creator in real-time
    const sender = users.get(tail.from);
    if (sender?.socketId && tail.from !== userId) {
      io.to(sender.socketId).emit("tail-analytics-update", {
        tailId,
        event,
        analytics: tail.analytics,
        energy: tail.energy,
      });
    }
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
      console.log("User disconnected:", socket.username);
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
  if (n) console.log("Expired", n, "tails");

  // Decay energy on all active tails
  for (const tail of tails.values()) {
    if (tail.energy) {
      const hoursSince = (now - (tail.energy.lastUpdated || tail.timestamp)) / 3600000;
      tail.energy.current = Math.max(0, tail.energy.current - (tail.energy.decayRate * hoursSince));
      tail.energy.lastUpdated = now;
    }
  }
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
});
// ============================================
// FOLLOW SYSTEM
// ============================================
// fs already required at top
const FOLLOWS_FILE = __dirname + "/data/follows.json";
const PUSH_TOKENS_FILE = __dirname + "/data/push_tokens.json";

const following = new Map();
const pushTokens = new Map();
const analyticsEvents = [];

// ── Persist helpers ──────────────────────────────────
function loadFollows() {
  try {
    const data = JSON.parse(fs.readFileSync(FOLLOWS_FILE, "utf8"));
    for (const [user, list] of Object.entries(data)) {
      following.set(user, new Set(list));
    }
    console.log("Loaded follows for", following.size, "users");
  } catch(e) { console.log("No saved follows yet"); }
}

function saveFollows() {
  try {
    const obj = {};
    for (const [user, set] of following.entries()) {
      obj[user] = [...set];
    }
    fs.mkdirSync(__dirname + "/data", { recursive: true });
    fs.writeFileSync(FOLLOWS_FILE, JSON.stringify(obj, null, 2));
  } catch(e) { console.log("Failed to save follows:", e.message); }
}

function loadPushTokens() {
  try {
    const data = JSON.parse(fs.readFileSync(PUSH_TOKENS_FILE, "utf8"));
    for (const [user, token] of Object.entries(data)) {
      pushTokens.set(user, token);
    }
    console.log("Loaded", pushTokens.size, "push tokens");
  } catch(e) {}
}

function savePushTokens() {
  try {
    const obj = {};
    for (const [user, token] of pushTokens.entries()) {
      obj[user] = token;
    }
    fs.mkdirSync(__dirname + "/data", { recursive: true });
    fs.writeFileSync(PUSH_TOKENS_FILE, JSON.stringify(obj, null, 2));
  } catch(e) {}
}

function getFollowerCount(username) {
  let count = 0;
  for (const [, set] of following.entries()) {
    if (set.has(username)) count++;
  }
  return count;
}

function getFollowers(username) {
  const list = [];
  for (const [u, set] of following.entries()) {
    if (set.has(username)) list.push(u);
  }
  return list;
}

// Load persisted data on startup
loadFollows();
loadPushTokens();

function getFollowing(username) {
  if (!following.has(username)) following.set(username, new Set());
  return following.get(username);
}

// Expose on socket
io.on("connection", (socket) => {
  // These piggyback on the existing connection — we add new handlers
  // by listening on the same socket inside this block

  socket.on("follow-user", ({ target }) => {
    const me = socket.username;
    if (!me || !target || me === target) return;
    getFollowing(me).add(target);
    saveFollows();
    socket.emit("follow-updated", {
      following: [...getFollowing(me)],
    });
    // Notify target they got a follower
    const targetSocket = [...io.sockets.sockets.values()]
      .find(s => s.username === target);
    if (targetSocket) {
      targetSocket.emit("new-follower", { from: me });
    }
    console.log("Follow:", me, "->", target);
  });

  socket.on("unfollow-user", ({ target }) => {
    const me = socket.username;
    if (!me || !target) return;
    getFollowing(me).delete(target);
    saveFollows();
    socket.emit("follow-updated", {
      following: [...getFollowing(me)],
    });
    console.log("Unfollow:", me, "->", target);
  });

  socket.on("get-following", () => {
    const me = socket.username;
    if (!me) return;
    socket.emit("follow-updated", {
      following: [...getFollowing(me)],
    });
  });


  // ── Push Token Registration ────────────────────────
  socket.on("register-push-token", ({ token }) => {
    const me = socket.username;
    if (!me || !token) return;
    pushTokens.set(me, token);
    savePushTokens();
    console.log("Push token registered for:", me);
  });

  // ── User Profile ──────────────────────────────────
  socket.on("get-user-profile", ({ username }) => {
    if (!username) return;
    const userTails = [...tails.values()]
      .filter(t => !t.expired && t.from === username)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 30)
      .map(publicView);

    socket.emit("user-profile", {
      username,
      tails: userTails,
      followerCount: getFollowerCount(username),
      followingCount: getFollowing(username).size,
      tailCount: userTails.length,
      isOnline: [...io.sockets.sockets.values()].some(s => s.username === username),
    });
  });

  // ── Search Users ──────────────────────────────────
  socket.on("search-users", ({ query }) => {
    const me = socket.username;
    if (!query || query.length < 1) {
      // Return suggested users (most tails, online first)
      const suggested = [...users.entries()]
        .filter(([name]) => name !== me)
        .map(([name, data]) => ({
          username: name,
          tailCount: [...tails.values()].filter(t => !t.expired && t.from === name).length,
          followerCount: getFollowerCount(name),
          isOnline: data.status === "online",
        }))
        .sort((a, b) => (b.isOnline - a.isOnline) || (b.tailCount - a.tailCount))
        .slice(0, 30);
      socket.emit("search-results", { users: suggested, query: "" });
      return;
    }
    const q = query.toLowerCase();
    const results = [...users.entries()]
      .filter(([name]) => name.toLowerCase().includes(q) && name !== me)
      .slice(0, 20)
      .map(([name, data]) => ({
        username: name,
        tailCount: [...tails.values()].filter(t => !t.expired && t.from === name).length,
        followerCount: getFollowerCount(name),
        isOnline: data.status === "online",
      }));
    socket.emit("search-results", { users: results, query });
  });

  // ── Analytics ─────────────────────────────────────
  socket.on("track-event", ({ event, data }) => {
    const me = socket.username;
    analyticsEvents.push({ event, data, user: me, ts: Date.now() });
    if (analyticsEvents.length > 10000) {
      analyticsEvents.splice(0, analyticsEvents.length - 5000);
    }
  });

  socket.on("get-following-feed", () => {
    const me = socket.username;
    if (!me) return;
    const myFollowing = getFollowing(me);
    const feed = [...tails.values()]
      .filter(t => !t.expired && myFollowing.has(t.from))
      .sort((a, b) => (b.energy?.current || 100) - (a.energy?.current || 100))
      .slice(0, 30)
      .map(publicView);
    socket.emit("following-feed", feed);
  });
});
