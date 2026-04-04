import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { useEffect, useRef } from "react";

export function useTailFeedback() {
  const soundRef = useRef(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  async function playCatchFeedback() {
    try {
      // 📳 Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // 🔔 Sound feedback
      const { sound } = await Audio.Sound.createAsync(
        require("./assets/tail-catch.mp3"),
        { volume: 0.8 }
      );

      soundRef.current = sound;
      await sound.playAsync();
    } catch (err) {
      console.log("Tail feedback error:", err);
    }
  }

  return { playCatchFeedback };
}
