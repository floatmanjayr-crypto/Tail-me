import { useEffect, useState } from "react";
import { socket } from "./socket";

export function useTailChat(tailId) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on("new-chat-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("new-chat-message");
  }, []);

  function sendMessage(text) {
    socket.emit("tail-chat", { tailId, text });
  }

  return { messages, sendMessage };
}
