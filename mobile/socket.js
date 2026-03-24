import { io } from "socket.io-client";
import { Platform } from "react-native";

const USE_AWS_STAGING = true;

const AWS_STAGING_URL = "http://54.161.4.72:5050";

const LOCAL_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:5050"
    : "http://localhost:5050";

const PROD_URL = "https://api.tailme.app";

export const SOCKET_URL = __DEV__
  ? (USE_AWS_STAGING ? AWS_STAGING_URL : LOCAL_URL)
  : PROD_URL;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

socket.on("connect", () => {
  console.log("✅ socket connected:", socket.id, SOCKET_URL);
});

socket.on("connect_error", (err) => {
  console.log("❌ socket connect_error:", err?.message, err);
});

socket.on("disconnect", (reason) => {
  console.log("⚠️ socket disconnected:", reason);
});

socket.io.on("error", (err) => {
  console.log("❌ manager error:", err);
});