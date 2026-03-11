// ============================================
// TailHome.js — Grid Redesign v8
// ============================================
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View, Text, TouchableOpacity, TouchableWithoutFeedback,
  FlatList, ScrollView, Animated, Dimensions,
  RefreshControl, PanResponder, StyleSheet, Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Video, ResizeMode } from "expo-av";
import VideoPreviewCard from "./VideoPreviewCard";
import SplitFeedScreen from "./SplitFeedScreen";
import SplitFrameCard from "./SplitFrameCard";

const { width: SW, height: SH } = Dimensions.get("window");
const CARD_GAP = 3;
const COLS = 3;
const CARD_SIZE = (SW - 16 - CARD_GAP * (COLS + 1)) / COLS;

const timeAgo = (ts) => {
  if (!ts) return "now";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + "s";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h";
  return Math.floor(h / 24) + "d";
};

const timeLeft = (expiresAt) => {
  if (!expiresAt) return null;
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return Math.floor(h / 24) + "d";
  if (h > 0) return h + "h " + m + "m";
  return m + "m";
};

const TYPE_CONFIG = {
  NOW:   { icon: "\u26A1", color: "#F59E0B", glow: "rgba(245,158,11,0.25)", gradient: ["#2a1a00","#1a1000"] },
  DROP:  { icon: "\uD83D\uDCA7", color: "#EF4444", glow: "rgba(239,68,68,0.25)", gradient: ["#2a0a0a","#1a0505"] },
  GEO:   { icon: "\uD83D\uDCCD", color: "#0EA5E9", glow: "rgba(14,165,233,0.25)", gradient: ["#001a2e","#000f1a"] },
  CHAIN: { icon: "\uD83D\uDD17", color: "#22C55E", glow: "rgba(34,197,94,0.25)", gradient: ["#001a0a","#000f05"] },
  LOOK:  { icon: "\uD83D\uDC40", color: "#7C3AED", glow: "rgba(124,58,237,0.25)", gradient: ["#0d0520","#070312"] },
};
const getType = (t) => TYPE_CONFIG[t] || TYPE_CONFIG.LOOK;
