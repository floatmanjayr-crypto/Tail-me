// ===============================
// 🦊 Tail Preview Event
// ===============================

io.on("connection", (socket) => {
  socket.on("tail-preview", ({ tailId }) => {
    const tail = tails.get(tailId);
    if (!tail) return;
    socket.emit("tail-preview-data", { tail });
  });
});
