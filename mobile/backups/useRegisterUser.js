import { useEffect } from "react";
import { socket } from "./socket";

export function useRegisterUser(username) {
  useEffect(() => {
    if (!username) return;

    socket.connect();
    socket.emit("register", { username });

    socket.on("registration-complete", (res) => {
      console.log("🦊 Registered:", res.username);
    });

    return () => {
      socket.off("registration-complete");
    };
  }, [username]);
}
