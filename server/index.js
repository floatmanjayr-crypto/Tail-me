const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files with correct MIME types
app.use(express.static('public', {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Content-Disposition', 'attachment; filename="' + path.basename(filepath) + '"');
    } else if (filepath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="' + path.basename(filepath) + '"');
    } else if (filepath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', 'attachment; filename="' + path.basename(filepath) + '"');
    }
  }
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling']
});

const users = new Map();
const tailSessions = new Map();
const pendingTails = new Map();

console.log('🦊 Tail Me Server Starting...');

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('register', (userData) => {
    const user = {
      ...userData,
      socketId: socket.id,
      status: 'online',
      lastSeen: Date.now()
    };
    users.set(userData.username, user);
    socket.username = userData.username;
    console.log(`👤 ${userData.username} registered`);
    socket.emit('registration-complete', { user });
  });

  socket.on('send-tail', (tailData) => {
    console.log(`🦊 ${socket.username} sending tail to:`, tailData.recipients);
    const tailId = `tail_${Date.now()}`;
    const tail = {
      id: tailId,
      from: socket.username,
      recipients: tailData.recipients,
      url: tailData.url,
      title: tailData.title,
      message: tailData.message,
      timestamp: Date.now()
    };
    
    tailData.recipients.forEach(recipient => {
      const recipientUser = users.get(recipient);
      if (recipientUser && recipientUser.status === 'online') {
        io.to(recipientUser.socketId).emit('tail-received', tail);
        console.log(`📬 Sent to ${recipient}`);
      }
    });
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      const user = users.get(socket.username);
      if (user) user.status = 'offline';
      console.log(`❌ ${socket.username} disconnected`);
    }
  });
});

const PORT = 4000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🦊 TAIL ME SERVER RUNNING           ║
║   Port: ${PORT}                        ║
╚═══════════════════════════════════════╝
  `);
});
