// ============================================================
// feedTokens.js — Design Tokens for Feed (Sharp Edition)
// ============================================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  none: 0,      // Sharp edges
  xs: 2,        // Subtle
  sm: 4,        // Minimal
  md: 8,        // Only where needed (buttons, badges)
  pill: 999,    // Pills only
};

export const FONT = {
  hero: { size: 28, weight: "900", lineHeight: 32 },
  h1: { size: 22, weight: "900", lineHeight: 28 },
  h2: { size: 18, weight: "800", lineHeight: 24 },
  h3: { size: 16, weight: "800", lineHeight: 22 },
  body: { size: 14, weight: "600", lineHeight: 20 },
  caption: { size: 12, weight: "700", lineHeight: 16 },
  tiny: { size: 10, weight: "700", lineHeight: 14 },
};

export const DARK = {
  bg: "#000000",
  surface: "#0A0A0A",
  panel: "#111111",
  panel2: "#1A1A1A",
  elevated: "#222222",
  border: "#2A2A2A",
  
  text: "#FFFFFF",
  textSecondary: "#E0E0E0",
  muted: "#9CA3AF",
  dim: "#6B7280",
  faint: "#4B5563",
  
  brand: "#7C3AED",
  accent: "#F59E0B",
  
  // Type colors
  look: "#7C3AED",
  now: "#F59E0B",
  drop: "#EF4444",
  geo: "#0EA5E9",
  chain: "#22C55E",
  gift: "#F43F8E",
};

export const LIGHT = {
  bg: "#FFFFFF",
  surface: "#FAFAFA",
  panel: "#F5F5F5",
  panel2: "#EEEEEE",
  elevated: "#FFFFFF",
  border: "#E5E5E5",
  
  text: "#000000",
  textSecondary: "#1A1A1A",
  muted: "#6B7280",
  dim: "#9CA3AF",
  faint: "#D1D5DB",
  
  brand: "#7C3AED",
  accent: "#F59E0B",
  
  // Type colors (same in both themes)
  look: "#7C3AED",
  now: "#F59E0B",
  drop: "#EF4444",
  geo: "#0EA5E9",
  chain: "#22C55E",
  gift: "#F43F8E",
};

export const SHADOWS = {
  none: {},
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Type badge styles
export const TYPE_STYLES = {
  NOW: { 
    bg: "rgba(245,158,11,0.15)", 
    border: "rgba(245,158,11,0.4)", 
    color: "#F59E0B",
    icon: "⚡"
  },
  DROP: { 
    bg: "rgba(239,68,68,0.15)", 
    border: "rgba(239,68,68,0.4)", 
    color: "#EF4444",
    icon: "💧"
  },
  GEO: { 
    bg: "rgba(14,165,233,0.15)", 
    border: "rgba(14,165,233,0.4)", 
    color: "#0EA5E9",
    icon: "📍"
  },
  CHAIN: { 
    bg: "rgba(34,197,94,0.15)", 
    border: "rgba(34,197,94,0.4)", 
    color: "#22C55E",
    icon: "🔗"
  },
  LOOK: { 
    bg: "rgba(124,58,237,0.15)", 
    border: "rgba(124,58,237,0.4)", 
    color: "#7C3AED",
    icon: "👀"
  },
  GIFT: { 
    bg: "rgba(244,63,142,0.15)", 
    border: "rgba(244,63,142,0.4)", 
    color: "#F43F8E",
    icon: "🎁"
  },
};
