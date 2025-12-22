// Import socket.io from local file
importScripts('socket.io.min.js');

let socket = null;
let currentUser = null;

console.log('🦊 Background script loaded');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received:', message.type);
  
  if (message.type === 'CONNECT_SOCKET') {
    currentUser = message.user;
    connectSocket();
    sendResponse({ success: true });
  } 
  else if (message.type === 'SEND_TAIL') {
    if (socket && socket.connected) {
      socket.emit('send-tail', message.data);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Not connected' });
    }
  }
  
  return true; // Keep channel open for async response
});

function connectSocket() {
  if (socket) return;
  
  console.log('�� Connecting to server...');
  socket = io('https://maida-unvictualled-raina.ngrok-free.dev');
  
  socket.on('connect', () => {
    console.log('✅ Connected to server!');
    if (currentUser) {
      socket.emit('register', currentUser);
    }
  });
  
  socket.on('registration-complete', () => {
    console.log('✅ Registered as:', currentUser.username);
  });
  
  socket.on('tail-received', (tail) => {
    console.log('📬 Tail received from:', tail.from);
    // Send to all tabs
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
    console.error('❌ Connection error:', err);
  });
}
