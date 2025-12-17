const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling']
});

const users = new Map();
const tailSessions = new Map();
const pendingTails = new Map();
const tailHistory = new Map();

console.log('🦊 Tail Me Server Starting...');

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('register', (userData) => {
    const user = {
      ...userData,
      socketId: socket.id,
      status: 'online',
      lastSeen: Date.now(),
      currentUrl: null
    };

    users.set(userData.username, user);
    socket.username = userData.username;
    socket.join(`user:${userData.username}`);

    console.log(`👤 ${userData.username} registered`);

    const pending = pendingTails.get(userData.username) || [];
    if (pending.length > 0) {
      socket.emit('pending-tails', pending);
      pendingTails.delete(userData.username);
    }

    socket.emit('registration-complete', {
      user: user,
      pendingTails: pending
    });
  });

  socket.on('send-tail', async (tailData) => {
    console.log(`🦊 ${socket.username} sending tail to:`, tailData.recipients);

    const tailId = `tail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const tail = {
      id: tailId,
      from: socket.username,
      recipients: tailData.recipients,
      url: tailData.url,
      title: tailData.title,
      message: tailData.message,
      timestamp: Date.now()
    };

    const session = {
      id: tailId,
      host: socket.username,
      url: tailData.url,
      title: tailData.title,
      participants: [socket.username],
      messages: [],
      createdAt: Date.now()
    };

    tailSessions.set(tailId, session);

    tailData.recipients.forEach(recipient => {
      const recipientUser = users.get(recipient);
      
      if (recipientUser && recipientUser.status === 'online') {
        io.to(recipientUser.socketId).emit('tail-received', tail);
      } else {
        if (!pendingTails.has(recipient)) {
          pendingTails.set(recipient, []);
        }
        pendingTails.get(recipient).push(tail);
      }
    });

    socket.emit('tail-sent', {
      tailId: tailId,
      deliveredTo: tailData.recipients.filter(r => users.get(r)?.status === 'online'),
      queuedFor: tailData.recipients.filter(r => users.get(r)?.status !== 'online')
    });
  });

  socket.on('disconnect', () => {
    if (!socket.username) return;
    const user = users.get(socket.username);
    if (user) {
      user.status = 'offline';
      user.lastSeen = Date.now();
    }
    console.log(`❌ ${socket.username} disconnected`);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🦊 TAIL ME SERVER RUNNING           ║
║   Port: ${PORT}                        ║
╚═══════════════════════════════════════╝
  `);
});
