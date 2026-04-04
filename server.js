
  // ── STOREFRONT SETTINGS ────────────────────────────────
  socket.on("update-storefront", async ({ coverUrl, animation, color }) => {
    const username = socket.username;
    if (!username) return;

    try {
      await db.run(
        `UPDATE users SET 
         storefrontCover = ?, 
         storefrontAnimation = ?, 
         storefrontColor = ? 
         WHERE username = ?`,
        [coverUrl || null, animation || "door", color || "#7C3AED", username]
      );

      console.log(`✅ [${username}] Updated storefront settings`);
      
      // Send confirmation back
      socket.emit("storefront-updated", { 
        coverUrl, 
        animation, 
        color,
        success: true 
      });
    } catch (err) {
      console.error("❌ Error updating storefront:", err);
      socket.emit("storefront-updated", { success: false, error: err.message });
    }
  });

// Add storefront columns to users table (run once on startup)
db.run(`
  ALTER TABLE users ADD COLUMN storefrontCover TEXT;
`).catch(() => {});
db.run(`
  ALTER TABLE users ADD COLUMN storefrontAnimation TEXT DEFAULT 'door';
`).catch(() => {});
db.run(`
  ALTER TABLE users ADD COLUMN storefrontColor TEXT DEFAULT '#7C3AED';
`).catch(() => {});
