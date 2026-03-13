// ============================================================
// SplitFeedScreen.js — Vertical scroll feed
// ============================================================
import React, { useCallback, useRef, useState } from "react";
import { View, FlatList, Dimensions, StyleSheet, Text } from "react-native";
import SplitFrameCard from "./SplitFrameCard";

const { width: SW } = Dimensions.get("window");

const DEMO_SPLIT_TAILS = [
  { id: "sf_1", from: "sneaker.plug.atl", tailType: "DROP", message: "SCORED THESE FOR $40 RESELLING $120+ 👟 2 LEFT", frameLayout: "A", previewUrl: "https://videos.pexels.com/video-files/3163534/3163534-sd_640_360_30fps.mp4", box2Url: "https://videos.pexels.com/video-files/3209828/3209828-sd_640_360_25fps.mp4", box3Url: null, revealBox: 1, catchLimit: 2, catchCount: 0, timestamp: Date.now() - 240000 },
  { id: "sf_2", from: "maya.eats.nyc", tailType: "LOOK", message: "THIS SPOT HAS NO BUSINESS BEING THIS GOOD 🌮", frameLayout: "B", previewUrl: "https://videos.pexels.com/video-files/4793504/4793504-sd_640_360_25fps.mp4", box2Url: "https://videos.pexels.com/video-files/3045163/3045163-sd_640_360_25fps.mp4", revealBox: null, catchLimit: null, catchCount: 0, timestamp: Date.now() - 600000 },
  { id: "sf_3", from: "rooftop.social", tailType: "GEO", message: "ROOFTOP TONIGHT 🎉 LOCATION LOCKED CATCH FOR ADDRESS", frameLayout: "B", previewUrl: "https://videos.pexels.com/video-files/3571264/3571264-sd_640_360_30fps.mp4", box2Url: "https://videos.pexels.com/video-files/2795405/2795405-sd_640_360_30fps.mp4", revealBox: 1, catchLimit: 50, catchCount: 31, timestamp: Date.now() - 3600000 },
  { id: "sf_4", from: "dre.williams", tailType: "NOW", message: "3 ANGLES. ONE REVEAL. GUESS WHAT THIS IS 👁", frameLayout: "D", previewUrl: "https://videos.pexels.com/video-files/3926589/3926589-sd_640_360_30fps.mp4", box2Url: "https://videos.pexels.com/video-files/4325579/4325579-sd_640_360_30fps.mp4", box3Url: "https://videos.pexels.com/video-files/3298529/3298529-sd_640_360_25fps.mp4", revealBox: 2, catchLimit: null, catchCount: 0, timestamp: Date.now() - 900000 },
  { id: "sf_5", from: "chef.leon.atl", tailType: "LOOK", message: "BEFORE & AFTER. SAME INGREDIENTS DIFFERENT ENERGY 🔥", frameLayout: "E", previewUrl: "https://videos.pexels.com/video-files/3163534/3163534-sd_640_360_30fps.mp4", box2Url: "https://videos.pexels.com/video-files/3209828/3209828-sd_640_360_25fps.mp4", box3Url: "https://videos.pexels.com/video-files/4793504/4793504-sd_640_360_25fps.mp4", revealBox: null, catchLimit: null, catchCount: 0, timestamp: Date.now() - 7200000 },
  { id: "sf_6", from: "zara.archive__", tailType: "DROP", message: "NEW DROP 🖤 FIRST 10 GET THE CODE", frameLayout: "C", previewUrl: "https://videos.pexels.com/video-files/3045163/3045163-sd_640_360_25fps.mp4", box2Url: null, revealBox: 0, catchLimit: 10, catchCount: 3, timestamp: Date.now() - 1800000 },
];

export default function SplitFeedScreen({ tails = [], onCatch, colors: C }) {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const feedTails = [...DEMO_SPLIT_TAILS, ...tails.filter(t => t.frameLayout)];

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) setVisibleIndex(viewableItems[0].index);
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const renderItem = useCallback(({ item, index }) => (
    <SplitFrameCard tail={item} onCatch={onCatch} isVisible={index === visibleIndex} />
  ), [visibleIndex, onCatch]);

  if (feedTails.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: C?.bg || "#000" }]}>
        <Text style={styles.emptyIcon}>🎬</Text>
        <Text style={styles.emptyTitle}>No frame tails yet</Text>
        <Text style={styles.emptySub}>Send a tail with a split frame layout</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C?.bg || "#000" }]}>
      <FlatList
        data={feedTails}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40, backgroundColor: "#000" },
  emptyIcon: { fontSize: 48, opacity: 0.4 },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  emptySub: { color: "#444", fontSize: 13, textAlign: "center", lineHeight: 20 },
});
