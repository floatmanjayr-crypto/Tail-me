// ===============================
// 🦊 Catch Tail Enhancements
// ===============================

// This patch is already wired into catch-tail logic
// You only need to paste the logic inside the existing handler:

/*
socket.on("catch-tail", ({ tailId }) => {
  const tail = tails.get(tailId);
  if (!tail) return;

  const username = socket.username || "unknown";

  // 🦊 Track catch
  if (!tail.caughtBy.includes(username)) {
    tail.caughtBy.push(username);
    tail.catchCount += 1;
  }

  // 🔔 Notify participants
  io.to(tailId).emit("tail-catch-update", {
    tailId,
    user: username,
    catchCount: tail.catchCount,
    caughtBy: tail.caughtBy,
    ts: Date.now(),
  });

  // (existing session logic continues here)
});
*/
