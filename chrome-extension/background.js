console.log('🦊 Background script starting...');
console.log('📍 Attempting to import socket.io...');

try {
  importScripts('socket.io.min.js');
  console.log('✅ Socket.io imported successfully');
  console.log('🔍 io type:', typeof io);
  console.log('🔍 io defined?', typeof io !== 'undefined');
} catch (err) {
  console.error('❌ Failed to import socket.io:', err);
}

let socket = null;
let currentUser = null;

console.log('🦊 Background script loaded and ready');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 MESSAGE RECEIVED:', message.type, message);
  
  if (message.type === 'CONNECT_SOCKET') {
    console.log('👤 Connecting socket for user:', message.user.username);
    currentUser = message.user;
    connectSocket();
    sendResponse({ success: true, message: 'Connecting...' });
  } 
  else if (message.type === 'SEND_TAIL') {
    console.log('📤 Send tail request received');
    if (socket && socket.connected) {
      console.log('✅ Socket connected, emitting...');
      socket.emit('send-tail', message.data);
      sendResponse({ success: true });
    } else {
      console.log('❌ Socket not connected');
      sendResponse({ success: false, error: 'Not connected to server' });
    }
  }
  
  return true;
});

function connectSocket() {
  console.log('🔌 connectSocket called');
  console.log('🔍 io available?', typeof io !== 'undefined');
  
  if (socket) {
    console.log('⚠️ Socket already exists');
    return;
  }
  
  if (typeof io === 'undefined') {
    console.error('❌ io is undefined! Cannot connect.');
    return;
  }
  
  console.log('🔌 Creating new socket connection...');
  socket = io('https://maida-unvictualled-raina.ngrok-free.dev');
  
  socket.on('connect', () => {
    console.log('✅ CONNECTED to server!');
    if (currentUser) {
      console.log('📤 Emitting register for:', currentUser.username);
      socket.emit('register', currentUser);
    }
  });
  
  socket.on('registration-complete', () => {
    console.log('✅ REGISTERED as:', currentUser.username);
  });
  
  socket.on('tail-received', (tail) => {
    console.log('📬 TAIL RECEIVED from:', tail.from);
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'TAIL_RECEIVED',
          tail: tail
        }).catch(() => {});
      });
    });
  });
  
  socket.on('connect_error', (err) => {
    console.error('❌ CONNECTION ERROR:', err.message);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('🔌 DISCONNECTED:', reason);
  });
}

console.log('🎯 Background script initialization complete');
