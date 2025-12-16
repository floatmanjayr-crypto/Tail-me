const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling']
});

// In-memory storage
const users = new Map();
const tailSessions = new Map();
const pendingTails = new Map();
const tailHistory = new Map();

console.log('🦊 Tail Me Server Starting...');

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  // USER REGISTRATION
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

    // Send pending tails
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

  // SEND TAIL
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

    // Create tail session
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

    // Save to history
    addToHistory(socket.username, tail, 'sent');

    // Send to recipients
    tailData.recipients.forEach(recipient => {
      const recipientUser = users.get(recipient);
      
      if (recipientUser && recipientUser.status === 'online') {
        io.to(recipientUser.socketId).emit('tail-received', tail);
        addToHistory(recipient, tail, 'received');
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

  // CATCH TAIL
  socket.on('catch-tail', (data) => {
    const session = tailSessions.get(data.tailId);
    if (!session) {
      socket.emit('error', { message: 'Tail session not found' });
      return;
    }

    console.log(`🎣 ${socket.username} caught tail from ${session.host}`);

    session.participants.push(socket.username);
    socket.join(`tail:${data.tailId}`);
    socket.currentTailSession = data.tailId;

    io.to(`tail:${data.tailId}`).emit('participant-joined', {
      username: socket.username,
      participants: session.participants
    });

    // Send FULL session data including URL
    socket.emit('session-started', {
      session: {
        id: session.id,
        host: session.host,
        url: session.url,
        title: session.title,
        participants: session.participants,
        messages: session.messages,
        createdAt: session.createdAt
      },
      role: 'participant',
      isHost: false
    });

    const host = users.get(session.host);
    if (host) {
      io.to(host.socketId).emit('tail-caught', {
        catcher: socket.username,
        tailId: data.tailId
      });
    }
  });

  // TAIL CHAT
  socket.on('tail-chat', (data) => {
    const session = tailSessions.get(data.tailId);
    if (!session) return;

    const message = {
      id: Date.now(),
      from: socket.username,
      text: data.text,
      timestamp: Date.now()
    };

    session.messages.push(message);
    io.to(`tail:${data.tailId}`).emit('new-chat-message', message);
  });

  // END TAIL SESSION
  socket.on('end-tail-session', (data) => {
    const session = tailSessions.get(data.tailId);
    if (!session) return;

    io.to(`tail:${data.tailId}`).emit('session-ended', {
      summary: {
        duration: Date.now() - session.createdAt,
        messageCount: session.messages.length
      }
    });

    io.in(`tail:${data.tailId}`).socketsLeave(`tail:${data.tailId}`);
    tailSessions.delete(data.tailId);
  });

  // DISCONNECT
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

function addToHistory(username, item, type) {
  if (!tailHistory.has(username)) {
    tailHistory.set(username, []);
  }
  
  tailHistory.get(username).unshift({
    ...item,
    type: type,
    timestamp: Date.now()
  });

  if (tailHistory.get(username).length > 100) {
    tailHistory.set(username, tailHistory.get(username).slice(0, 100));
  }
}

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   🦊 TAIL ME SERVER RUNNING           ║
  ║   Port: ${PORT}                        ║
  ╚═══════════════════════════════════════╝
  `);
});