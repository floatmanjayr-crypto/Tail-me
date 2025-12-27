import { useEffect, useState } from "react";
import { socket } from "./socket";

export function useTailInbox() {
  const [tails, setTails] = useState([]);

  useEffect(() => {
    socket.on("tail-received", (tail) => {
      console.log("🦊 Tail received:", tail);
      setTails((prev) => [tail, ...prev]);
    });

    socket.on("tail-catch-update", ({ tailId, catchCount }) => {
      setTails((prev) =>
        prev.map((t) =>
          t.id === tailId ? { ...t, catchCount } : t
        )
      );
    });

    return () => {
      socket.off("tail-received");
      socket.off("tail-catch-update");
    };
  }, []);

  return { tails, setTails };
}
