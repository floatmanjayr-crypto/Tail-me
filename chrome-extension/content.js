// ====================================
// TAIL ME - CONTENT SCRIPT
// Floating tail that appears on EVERY website
// ====================================

console.log('🦊 Tail Me content script loaded on:', window.location.href);

const SOCKET_SERVER = 'https://probable-carnival-vpg9v5rpxjph7pr-4000.app.github.dev';
let socket = null;
let currentUser = null;
let floatingTail = null;
let coViewPanel = null;
let activeSession = null;

// ====================================
// INITIALIZE
// ====================================
(function init() {
  chrome.storage.local.get(['tailMeUser'], (result) => {
    if (result.tailMeUser) {
      currentUser = result.tailMeUser;
      loadSocketIO();
    }
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'USER_LOGGED_IN') {
      currentUser = message.user;
      loadSocketIO();
    } else if (message.type === 'OPEN_SEND_POPUP') {
      showSendTailPopup();
    }
  });
})();

// ====================================
// LOAD SOCKET.IO AND CONNECT
// ====================================
function loadSocketIO() {
  if (socket) return;

  const script = document.createElement('script');
  script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
  script.onload = () => {
    connectSocket();
    createFloatingTail();
  };
  document.head.appendChild(script);
}

function connectSocket() {
  socket = io(SOCKET_SERVER);

  socket.on('connect', () => {
    console.log('✅ Tail Me connected:', socket.id);
    socket.emit('register', currentUser);
  });

  socket.on('registration-complete', () => {
    console.log('✅ Registered as:', currentUser.username);
  });

  socket.on('tail-received', (tail) => {
    console.log('📬 Tail received from:', tail.from);
    showTailNotification(tail);
  });

  socket.on('session-started', (data) => {
    console.log('🎣 Session started:', data);
    activeSession = data.session;
    openCoViewPanel(data);
  });

  socket.on('new-chat-message', (message) => {
    addChatMessage(message);
  });

  socket.on('session-ended', () => {
    console.log('Session ended');
    closeCoViewPanel();
  });

  socket.on('participant-joined', (data) => {
    showSystemMessage(`${data.username} joined`);
  });
}

// ====================================
// FLOATING TAIL BUTTON
// ====================================
function createFloatingTail() {
  if (floatingTail) return;

  floatingTail = document.createElement('div');
  floatingTail.innerHTML = '🦊';
  floatingTail.style.cssText = `
    position: fixed !important;
    bottom: 30px !important;
    right: 30px !important;
    width: 60px !important;
    height: 60px !important;
    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%) !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 30px !important;
    cursor: pointer !important;
    z-index: 2147483647 !important;
    box-shadow: 0 5px 20px rgba(255, 107, 107, 0.4) !important;
    transition: all 0.3s ease !important;
    user-select: none !important;
    border: none !important;
  `;

  floatingTail.onmouseenter = () => {
    floatingTail.style.transform = 'scale(1.1)';
  };

  floatingTail.onmouseleave = () => {
    floatingTail.style.transform = 'scale(1)';
  };

  floatingTail.onclick = showSendTailPopup;

  document.body.appendChild(floatingTail);
  console.log('🦊 Floating tail created');
}

// ====================================
// SEND TAIL POPUP
// ====================================
function showSendTailPopup() {
  const existing = document.getElementById('tail-send-popup');
  if (existing) existing.remove();

  const pageData = extractPageMetadata();

  const popup = document.createElement('div');
  popup.id = 'tail-send-popup';
  popup.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 2147483646;" id="popup-overlay"></div>
    
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      z-index: 2147483647;
      width: 400px;
      max-width: 90vw;
    ">
      <div style="background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%); padding: 20px; border-radius: 20px 20px 0 0; color: white;">
        <h2 style="margin: 0; font-size: 20px;">🦊 Send Tail</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 12px;">${pageData.title.substring(0, 50)}...</p>
      </div>

      <div style="padding: 20px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Send to:</label>
        <input type="text" id="recipient-input" placeholder="Username" style="
          width: 100%;
          padding: 12px;
          border: 2px solid #E0E0E0;
          border-radius: 10px;
          margin-bottom: 15px;
          box-sizing: border-box;
        " />

        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Message (optional):</label>
        <textarea id="message-input" placeholder="Check this out!" style="
          width: 100%;
          padding: 12px;
          border: 2px solid #E0E0E0;
          border-radius: 10px;
          min-height: 60px;
          box-sizing: border-box;
          margin-bottom: 15px;
        "></textarea>

        <div style="display: flex; gap: 10px;">
          <button id="send-btn" style="
            flex: 1;
            padding: 12px;
            background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
          ">Send 🦊</button>
          <button id="cancel-btn" style="
            flex: 1;
            padding: 12px;
            background: #F0F0F0;
            color: #333;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
          ">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById('send-btn').onclick = () => {
    const recipient = document.getElementById('recipient-input').value.trim();
    const message = document.getElementById('message-input').value.trim();

    if (!recipient) {
      alert('Please enter a username');
      return;
    }

    socket.emit('send-tail', {
      recipients: [recipient],
      url: window.location.href,
      title: pageData.title,
      message: message,
      image: pageData.image,
      price: pageData.price
    });

    showToast('Tail sent! 🦊');
    popup.remove();
  };

  document.getElementById('cancel-btn').onclick = () => popup.remove();
  document.getElementById('popup-overlay').onclick = () => popup.remove();
}

// ====================================
// EXTRACT PAGE METADATA
// ====================================
function extractPageMetadata() {
  const title = document.querySelector('meta[property="og:title"]')?.content ||
                document.title || 'Check this out!';

  const image = document.querySelector('meta[property="og:image"]')?.content ||
                document.querySelector('img')?.src || '';

  let price = null;
  const priceSelectors = ['[itemprop="price"]', '.price', '[class*="price"]'];
  for (const sel of priceSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      price = el.textContent.trim();
      break;
    }
  }

  return { title, image, price };
}

// ====================================
// TAIL NOTIFICATION
// ====================================
function showTailNotification(tail) {
  const notif = document.createElement('div');
  notif.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      width: 350px;
      background: white;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      z-index: 2147483647;
    ">
      <div style="background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); color: white; padding: 15px; border-radius: 15px 15px 0 0; display: flex; justify-content: space-between;">
        <strong>🦊 ${tail.from} sent you a tail!</strong>
        <button id="notif-close" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
      </div>

      <div style="padding: 15px;">
        <p style="margin: 0 0 10px 0; font-weight: 600;">${tail.title}</p>
        ${tail.message ? `<p style="margin: 0; color: #666; font-style: italic;">"${tail.message}"</p>` : ''}
      </div>

      <div style="display: flex; gap: 10px; padding: 15px; border-top: 1px solid #EEE;">
        <button id="catch-btn" style="flex: 1; padding: 12px; background: #28C840; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">Catch 🎣</button>
        <button id="dismiss-btn" style="flex: 1; padding: 12px; background: #F0F0F0; color: #333; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">Later</button>
      </div>
    </div>
  `;

  document.body.appendChild(notif);

  document.getElementById('catch-btn').onclick = () => {
    socket.emit('catch-tail', { tailId: tail.id });
    if (window.location.href !== tail.url) {
      window.location.href = tail.url;
    }
    notif.remove();
  };

  document.getElementById('dismiss-btn').onclick = () => notif.remove();
  document.getElementById('notif-close').onclick = () => notif.remove();

  setTimeout(() => notif.remove(), 30000);
}

// ====================================
// CO-VIEW PANEL
// ====================================
function openCoViewPanel(data) {
  closeCoViewPanel();

  coViewPanel = document.createElement('div');
  coViewPanel.id = 'coview-panel';
  coViewPanel.innerHTML = `
    <div style="
      position: fixed;
      top: 80px;
      right: 20px;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      z-index: 2147483645;
      display: flex;
      flex-direction: column;
    ">
      <div style="background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); color: white; padding: 15px; border-radius: 15px 15px 0 0; display: flex; justify-content: space-between;">
        <div>
          <strong>Tailing with ${data.session.host}</strong><br>
          <small style="opacity: 0.8;">${data.session.participants.length} viewing</small>
        </div>
        <button id="close-coview" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer;">×</button>
      </div>

      <div id="messages" style="flex: 1; overflow-y: auto; padding: 15px; background: #F8F9FA;"></div>

      <div style="display: flex; gap: 10px; padding: 15px; border-top: 1px solid #E0E0E0;">
        <input type="text" id="chat-input" placeholder="Type message..." style="flex: 1; padding: 10px; border: 1px solid #E0E0E0; border-radius: 20px;" />
        <button id="send-msg" style="padding: 10px 20px; background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: 600;">Send</button>
      </div>
    </div>
  `;

  document.body.appendChild(coViewPanel);

  document.getElementById('send-msg').onclick = sendMessage;
  document.getElementById('chat-input').onkeypress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };
  document.getElementById('close-coview').onclick = () => {
    socket.emit('end-tail-session', { tailId: activeSession.id });
    closeCoViewPanel();
  };

  showSystemMessage('Co-viewing session started 🦊');
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || !activeSession) return;

  socket.emit('tail-chat', { tailId: activeSession.id, text });
  input.value = '';
}

function addChatMessage(msg) {
  const container = document.getElementById('messages');
  if (!container) return;

  const isMine = msg.from === currentUser.username;
  const div = document.createElement('div');
  div.style.cssText = `
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 10px;
    max-width: 80%;
    ${isMine ? 'background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); color: white; margin-left: auto;' : 'background: white; border: 1px solid #E0E0E0;'}
  `;
  div.innerHTML = `<div style="font-size: 11px; opacity: 0.8; margin-bottom: 3px;">${msg.from}</div><div>${msg.text}</div>`;
  
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showSystemMessage(text) {
  const container = document.getElementById('messages');
  if (!container) return;

  const div = document.createElement('div');
  div.style.cssText = 'text-align: center; color: #666; font-size: 12px; padding: 10px; background: #E8F4FF; border-radius: 8px; margin-bottom: 10px;';
  div.textContent = text;
  container.appendChild(div);
}

function closeCoViewPanel() {
  if (coViewPanel) {
    coViewPanel.remove();
    coViewPanel = null;
  }
  activeSession = null;
}

// ====================================
// UTILITY
// ====================================
function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 30px;
    background: #28C840;
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    z-index: 2147483647;
    font-weight: 600;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}