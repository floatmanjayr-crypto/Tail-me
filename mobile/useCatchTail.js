import { useEffect } from "react";
import { socket } from "./socket";

export function useCatchTail(navigation) {
  useEffect(() => {
    socket.on("session-started", ({ session }) => {
      console.log("🦊 Session started:", session);
      navigation.navigate("TailChat", {
        sessionId: session.id,
        session,
      });
    });

    return () => socket.off("session-started");
  }, []);

  function catchTail(tailId) {
    socket.emit("catch-tail", { tailId });
  }

  return { catchTail };
}
