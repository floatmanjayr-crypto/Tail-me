import { io } from "socket.io-client";
import { Platform } from "react-native";

const USE_TUNNEL = true; // 👈 flip this ON/OFF when needed

const NGROK_URL = "https://ab01-51-8-152-67.ngrok-free.app";

const LOCAL_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:5050"
    : "http://localhost:5050";

const PROD_URL = "https://api.tailme.app";

export const SOCKET_URL = __DEV__
  ? (USE_TUNNEL ? NGROK_URL : LOCAL_URL)
  : PROD_URL;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["polling"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 20,
  timeout: 10000,
});