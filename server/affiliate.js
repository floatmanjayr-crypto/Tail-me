// ============================================================
// Tail Me — Affiliate System v1.0
// ✅ Bot accounts (auto-seeded curated tails)
// ✅ Affiliate link wrapping (invisible to users)
// ✅ Per-tier limits (free/pro/verified)
// ✅ Click + conversion tracking
// ✅ Auto-rotate expired affiliate tails
// ✅ Web reveal page
// ✅ Universal tail link: tailme.app/t/:tailId
// ============================================================

// ── Tier limits ─────────────────────────────────────────────
const TIERS = {
  free:     { maxActive: 3,  maxPerDay: 1,  maxEarnings: 500  },
  pro:      { maxActive: 20, maxPerDay: 5,  maxEarnings: null },
  verified: { maxActive: 999,maxPerDay: 999,maxEarnings: null },
};

// ── Bot accounts (your curated affiliate accounts) ───────────
const BOT_ACCOUNTS = [
  { username: "tailme_drops",   displayName: "Daily Drops",    category: "all"      },
  { username: "techdrops_",     displayName: "Tech Deals",     category: "tech"     },
  { username: "fashiondrops_",  displayName: "Fashion Drops",  category: "fashion"  },
  { username: "fooddeals_",     displayName: "Food Deals",     category: "food"     },
  { username: "fitdrops_",      displayName: "Fit Drops",      category: "fitness"  },
  { username: "traveldrops_",   displayName: "Travel Deals",   category: "travel"   },
];

// ── Seed affiliate tails ─────────────────────────────────────
// These are your pre-built affiliate tails
// Replace affiliateUrl with your real affiliate links
const SEED_TAILS = [
  {
    id: "aff_001",
    from: "tailme_drops",
    tailType: "DROP",
    title: "40% off Nike Air Max",
    message: "Exclusive drop — only 10 pairs 👟",
    mediaUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
    affiliateUrl: "https://nike.com", // ← replace with real affiliate URL
    catchLimit: 10,
    categories: ["shopping", "fashion"],
    reveal: { kind: "url", teaser: "🔗 Exclusive link inside" },
    expiryHours: 24,
  },
  {
    id: "aff_002",
    from: "techdrops_",
    tailType: "DROP",
    title: "AirPods Pro — best price ever",
    message: "Lowest price we've seen 🎧",
    mediaUrl: "https://images.unsplash.com/photo-1588423771073-b8903fead85b?w=600",
    affiliateUrl: "https://amazon.com", // ← replace
    catchLimit: 25,
    categories: ["tech"],
    reveal: { kind: "url", teaser: "🔗 Price drop link inside" },
    expiryHours: 12,
  },
  {
    id: "aff_003",
    from: "fooddeals_",
    tailType: "NOW",
    title: "Free delivery — DoorDash",
    message: "Free delivery next 2 hours only 🍕",
    mediaUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
    affiliateUrl: "https://doordash.com", // ← replace
    catchLimit: 50,
    categories: ["food"],
    reveal: { kind: "coupon", code: "TAILDASH", teaser: "🎟 Promo code inside" },
    expiryHours: 2,
  },
  {
    id: "aff_004",
    from: "fashiondrops_",
    tailType: "LOOK",
    title: "SHEIN — secret 60% off code",
    message: "This code isn't public 👗",
    mediaUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
    affiliateUrl: "https://shein.com", // ← replace
    catchLimit: null,
    categories: ["fashion", "shopping"],
    reveal: { kind: "coupon", code: "TAIL60", teaser: "🎟 Secret code inside" },
    expiryHours: 48,
  },
  {
    id: "aff_005",
    from: "fitdrops_",
    tailType: "DROP",
    title: "Nike Training — 3 months free",
    message: "Catch for free premium access 💪",
    mediaUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600",
    affiliateUrl: "https://nike.com/ntc", // ← replace
    catchLimit: 15,
    categories: ["fitness"],
    reveal: { kind: "url", teaser: "🔗 Free access link inside" },
    expiryHours: 6,
  },
  {
    id: "aff_006",
    from: "traveldrops_",
    tailType: "LOOK",
    title: "Airbnb — $50 off first stay",
    message: "Referral credit inside ✈️",
    mediaUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600",
    affiliateUrl: "https://airbnb.com", // ← replace
    catchLimit: 30,
    categories: ["travel"],
    reveal: { kind: "url", teaser: "🔗 $50 credit link inside" },
    expiryHours: 72,
  },
  {
    id: "aff_007",
    from: "techdrops_",
    tailType: "NOW",
    title: "Spotify Premium — 3 months $0.99",
    message: "This deal expires in 1 hour 🎵",
    mediaUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600",
    affiliateUrl: "https://spotify.com", // ← replace
    catchLimit: 100,
    categories: ["music", "tech"],
    reveal: { kind: "url", teaser: "🔗 Grab the deal" },
    expiryHours: 1,
  },
  {
    id: "aff_008",
    from: "tailme_drops",
    tailType: "DROP",
    title: "Amazon — mystery gift card",
    message: "Catch to reveal the amount 🎁",
    mediaUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600",
    affiliateUrl: "https://amazon.com", // ← replace
    catchLimit: 5,
    categories: ["shopping"],
    reveal: { kind: "coupon", code: "AMAZONGIFT25", teaser: "🎁 Gift card code inside" },
    expiryHours: 24,
  },
];

// ── Affiliate user tracker ───────────────────────────────────
// username → { tier, activeCount, dailyCount, dailyWindow, earnings }
const affiliateUsers = new Map();

function getAffiliateUser(username) {
  if (!affiliateUsers.has(username)) {
    affiliateUsers.set(username, {
      tier: "free",
      activeCount: 0,
      dailyCount: 0,
      dailyWindow: Date.now(),
      earnings: 0,
    });
  }
  return affiliateUsers.get(username);
}

function checkAffiliateLimit(username) {
  const au = getAffiliateUser(username);
  const tier = TIERS[au.tier] || TIERS.free;

  // Reset daily count if window expired
  if (Date.now() - au.dailyWindow > 86400000) {
    au.dailyCount = 0;
    au.dailyWindow = Date.now();
  }

  if (au.activeCount >= tier.maxActive) {
    return { ok: false, reason: `Max ${tier.maxActive} active affiliate tails on ${au.tier} plan` };
  }
  if (au.dailyCount >= tier.maxPerDay) {
    return { ok: false, reason: `Max ${tier.maxPerDay} affiliate tails per day on ${au.tier} plan` };
  }
  if (tier.maxEarnings && au.earnings >= tier.maxEarnings) {
    return { ok: false, reason: `$${tier.maxEarnings} monthly earnings limit reached` };
  }
  return { ok: true };
}

function recordAffiliateCreated(username) {
  const au = getAffiliateUser(username);
  au.activeCount++;
  au.dailyCount++;
  affiliateUsers.set(username, au);
}

function recordAffiliateExpired(username) {
  const au = getAffiliateUser(username);
  if (au.activeCount > 0) au.activeCount--;
  affiliateUsers.set(username, au);
}

function recordAffiliateConversion(username, amount = 0) {
  const au = getAffiliateUser(username);
  au.earnings += amount;
  affiliateUsers.set(username, au);
}

function setUserTier(username, tier) {
  const au = getAffiliateUser(username);
  au.tier = tier;
  affiliateUsers.set(username, au);
}

function getAffiliateLimitInfo(username) {
  const au = getAffiliateUser(username);
  const tier = TIERS[au.tier] || TIERS.free;
  if (Date.now() - au.dailyWindow > 86400000) {
    au.dailyCount = 0;
    au.dailyWindow = Date.now();
  }
  return {
    tier: au.tier,
    activeCount: au.activeCount,
    maxActive: tier.maxActive,
    dailyCount: au.dailyCount,
    maxPerDay: tier.maxPerDay,
    earnings: au.earnings,
    maxEarnings: tier.maxEarnings,
  };
}

// ── Web reveal page HTML ─────────────────────────────────────
function webRevealPage(tail) {
  const cfg = {
    NOW:   { color: "#F59E0B", icon: "⚡", label: "NOW"   },
    DROP:  { color: "#EF4444", icon: "💧", label: "DROP"  },
    GEO:   { color: "#0EA5E9", icon: "📍", label: "GEO"   },
    CHAIN: { color: "#22C55E", icon: "🔗", label: "CHAIN" },
    LOOK:  { color: "#7C3AED", icon: "👀", label: "LOOK"  },
  }[tail?.tailType] || { color: "#7C3AED", icon: "👀", label: "LOOK" };

  const spotsLeft = tail.catchLimit != null
    ? Math.max(0, tail.catchLimit - (tail.catchCount || 0))
    : null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta property="og:title" content="${tail.title || "Someone sent you a Tail"}"/>
  <meta property="og:description" content="${tail.message || "Catch it to reveal what's inside"}"/>
  ${tail.mediaUrl ? `<meta property="og:image" content="${tail.mediaUrl}"/>` : ""}
  <title>Tail Me — Catch it</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#070A0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      color:#E5E7EB;min-height:100vh;display:flex;flex-direction:column;align-items:center;
      justify-content:center;padding:24px}
    .card{width:100%;max-width:400px;background:#0D1220;border-radius:24px;
      border:1.5px solid ${cfg.color}40;overflow:hidden;
      box-shadow:0 20px 60px rgba(0,0,0,0.5),0 0 0 1px #1E293B}
    .img{width:100%;height:220px;object-fit:cover}
    .img-placeholder{width:100%;height:200px;background:linear-gradient(135deg,${cfg.color}20,#0D1220);
      display:flex;align-items:center;justify-content:center;font-size:64px}
    .body{padding:20px}
    .badge{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;
      background:${cfg.color}20;border:1px solid ${cfg.color}40;
      color:${cfg.color};font-size:11px;font-weight:900;margin-bottom:12px}
    .title{font-size:20px;font-weight:900;margin-bottom:6px;line-height:1.3}
    .msg{color:#94A3B8;font-size:14px;margin-bottom:16px;line-height:1.5}
    .from{color:#64748B;font-size:12px;margin-bottom:20px}
    .spots{background:${cfg.color}15;border:1px solid ${cfg.color}30;border-radius:10px;
      padding:8px 14px;font-size:12px;font-weight:900;color:${cfg.color};
      margin-bottom:16px;text-align:center}
    .btn{display:block;width:100%;padding:16px;border-radius:16px;
      background:${cfg.color};color:#fff;font-size:16px;font-weight:900;
      text-align:center;text-decoration:none;margin-bottom:10px;
      box-shadow:0 4px 20px ${cfg.color}40}
    .btn-secondary{display:block;width:100%;padding:14px;border-radius:16px;
      background:transparent;color:#94A3B8;font-size:14px;font-weight:700;
      text-align:center;text-decoration:none;border:1px solid #1E293B}
    .logo{margin-bottom:24px;text-align:center}
    .logo-text{font-size:28px;font-weight:900;color:#E5E7EB}
    .logo-sub{color:#64748B;font-size:13px;margin-top:4px}
    .expired{text-align:center;padding:20px;color:#EF4444;font-weight:900}
  </style>
</head>
<body>
  <div class="logo">
    <div class="logo-text">🦊 Tail Me</div>
    <div class="logo-sub">Catch moments — don't scroll.</div>
  </div>

  <div class="card">
    ${tail.mediaUrl
      ? `<img class="img" src="${tail.mediaUrl}" alt="tail"/>`
      : `<div class="img-placeholder">${cfg.icon}</div>`
    }
    <div class="body">
      <div class="badge">${cfg.icon} ${cfg.label}</div>
      <div class="title">${tail.title || "Someone sent you something"}</div>
      <div class="msg">${tail.message || "Catch it to reveal what's inside 🎁"}</div>
      <div class="from">From @${tail.from}</div>

      ${tail.expired || tail.isFull
        ? `<div class="expired">❌ This tail has expired</div>`
        : `
        ${spotsLeft !== null
          ? `<div class="spots">⚡ Only ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left</div>`
          : ""
        }
        <a class="btn" href="tailme://catch/${tail.id}">
          🎯 Catch this Tail
        </a>
        <a class="btn-secondary" href="https://apps.apple.com/app/tailme">
          Download Tail Me to catch it
        </a>
        `
      }
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  SEED_TAILS,
  BOT_ACCOUNTS,
  TIERS,
  checkAffiliateLimit,
  recordAffiliateCreated,
  recordAffiliateExpired,
  recordAffiliateConversion,
  setUserTier,
  getAffiliateLimitInfo,
  webRevealPage,
  affiliateUsers,
};
