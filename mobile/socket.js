import { io } from "socket.io-client";
import { Platform } from "react-native";

/**
 * 🔁 CHANGE THIS ONLY WHEN NGROK CHANGES
 * Paste your current ngrok https URL here
 */
const NGROK_URL = "https://3881dd09d405.ngrok-free.app"; // 👈 EDIT THIS

// Fallback for local dev (emulator / simulator)
const LOCAL_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:5050"
    : "http://localhost:5050";

// 👉 Toggle which one you want to use
export const SOCKET_URL = NGROK_URL || LOCAL_URL;

export const socket = io(SOCKET_URL, {
  transports: ["websocket","polling"],
  autoConnect: false,
});
