import { io } from "socket.io-client";

export const socket = io("https://6a243f40c631.ngrok-free.app", {
  transports: ["websocket"],
  autoConnect: false,
});
