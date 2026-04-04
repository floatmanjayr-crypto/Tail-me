// ============================================================
// tokens.js — Tail Me Design System
// Single source of truth for ALL visual decisions
// ============================================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const FONT_SIZE = {
  hero: 42,
  h1: 28,
  h2: 22,
  h3: 18,
  body: 15,
  caption: 13,
  tiny: 11,
  micro: 9,
};

export const FONT_WEIGHT = {
  black: "900",
  bold: "800",
  semi: "700",
  medium: "600",
  regular: "400",
};

export const LINE_HEIGHT = {
  hero: 48,
  h1: 34,
  h2: 28,
  h3: 24,
  body: 22,
  caption: 18,
  tiny: 14,
};

export const SHADOWS = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  }),
};

export const DARK = {
  bg:       "#050810",
  surface:  "#0B1021",
  panel:    "#111827",
  panel2:   "#1A2236",
  elevated: "#1F2B45",
  border:   "#1E293B",
  border2:  "#2D3A52",

  text:     "#F1F5F9",
  muted:    "#94A3B8",
  dim:      "#64748B",
  faint:    "#475569",

  brand:    "#8B5CF6",
  brandDim: "#6D28D9",
  accent:   "#EC4899",

  green:    "#10B981",
  greenDim: "#059669",
  greenInk: "#ECFDF5",

  red:      "#EF4444",
  redDim:   "#DC2626",

  amber:    "#F59E0B",
  blue:     "#3B82F6",
  cyan:     "#06B6D4",

  gradient: {
    brand:  ["#8B5CF6", "#EC4899"],
    sunset: ["#F97316", "#EF4444"],
    ocean:  ["#06B6D4", "#3B82F6"],
    nature: ["#10B981", "#059669"],
    gold:   ["#F59E0B", "#D97706"],
  },
};

export const LIGHT = {
  bg:       "#FFFFFF",
  surface:  "#F8FAFC",
  panel:    "#F1F5F9",
  panel2:   "#E2E8F0",
  elevated: "#FFFFFF",
  border:   "#E2E8F0",
  border2:  "#CBD5E1",

  text:     "#0F172A",
  muted:    "#475569",
  dim:      "#94A3B8",
  faint:    "#CBD5E1",

  brand:    "#7C3AED",
  brandDim: "#6D28D9",
  accent:   "#EC4899",

  green:    "#10B981",
  greenDim: "#059669",
  greenInk: "#065F46",

  red:      "#EF4444",
  redDim:   "#DC2626",

  amber:    "#F59E0B",
  blue:     "#3B82F6",
  cyan:     "#06B6D4",

  gradient: {
    brand:  ["#7C3AED", "#EC4899"],
    sunset: ["#F97316", "#EF4444"],
    ocean:  ["#06B6D4", "#3B82F6"],
    nature: ["#10B981", "#059669"],
    gold:   ["#F59E0B", "#D97706"],
  },
};

export const TAIL_TYPE_THEME = {
  LOOK:  { color: "#8B5CF6", icon: "👀", bg: "#8B5CF620" },
  NOW:   { color: "#EF4444", icon: "⚡", bg: "#EF444420" },
  DROP:  { color: "#F59E0B", icon: "💧", bg: "#F59E0B20" },
  CHAIN: { color: "#10B981", icon: "🔗", bg: "#10B98120" },
  GEO:   { color: "#3B82F6", icon: "📍", bg: "#3B82F620" },
};

export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { tension: 68, friction: 10 },
  springBouncy: { tension: 40, friction: 5 },
  springSmooth: { tension: 80, friction: 14 },
};\n