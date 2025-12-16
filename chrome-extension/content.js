console.log('🦊 Catch My Tail content script loaded');

const SERVER_URL = 'http://localhost:4000';
let socket = null;
let currentUser = null;
let floatingTail = null;
let tailPopup = null;
let activeSession = null;

// Load Socket.io
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
script.onload = () => {
  console.log('✅ Socket.io loaded');
  initTailMe();
};
document.head.appendChild(script);

function initTailMe() {
  chrome.storage.local.get(['tailMeUser'], (result) => {
    if (result.tailMeUser) {
      currentUser = result.tailMeUser;
      connectToServer();
    }
  });

  createFloatingTail();
  trackPageActivity();
}

// CREATE FLOATING TAIL
function createFloatingTail() {
  floatingTail = document.createElement('div');
  floatingTail.id = 'tail-me-floating';
  floatingTail.innerHTML = `
    <div class="tail-button">
      <span class="tail-emoji">🦊</span>
      <div class="tail-pulse"></div>
      <div class="tail-badge" style="display:none;">0</div>
    </div>
  `;

  document.body.appendChild(floatingTail);
  makeDraggable(floatingTail);

  floatingTail.addEventListener('click', (e) => {
    if (!e.target.closest('.tail-button').classList.contains('dragging')) {
      showTailPopup();
    }
  });
}

// MAKE DRAGGABLE
function makeDraggable(element) {
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  const button = element.querySelector('.tail-button');

  button.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    isDragging = true;
    button.classList.add('dragging');
  }

  function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    xOffset = currentX;
    yOffset = currentY;
    element.style.transform = `translate(${currentX}px, ${currentY}px)`;
  }

  function dragEnd(e) {
    isDragging = false;
    button.classList.remove('dragging');
  }
}

// SHOW TAIL POPUP
function showTailPopup() {
  if (!currentUser) {
    promptLogin();
    return;
  }

  if (tailPopup) tailPopup.remove();

  tailPopup = document.createElement('div');
  tailPopup.id = 'tail-popup';
  tailPopup.innerHTML = `
    <div class="popup-container">
      <div class="popup-header">
        <h3>🦊 Send Tail</h3>
        <button class="close-btn" onclick="this.closest('#tail-popup').remove()">✕</button>
      </div>
      
      <div class="popup-body">
        <div class="page-info">
          <strong>Tailing:</strong>
          <p>${document.title}</p>
          <small>${window.location.href}</small>
        </div>
        
        <div class="contacts-section">
          <label>Send to:</label>
          <div id="contacts-list"></div>
        </div>
        
        <textarea 
          id="tail-message" 
          placeholder="Add a message... (optional)"
          rows="2"
        ></textarea>
        
        <div class="popup-actions">
          <button class="btn-primary" id="send-tail-btn">
            Send Tail
          </button>
          <button class="btn-secondary" id="send-all-btn">
            Tail Everyone
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(tailPopup);
  loadContacts();

  document.getElementById('send-tail-btn').onclick = sendTail;
  document.getElementById('send-all-btn').onclick = sendTailToEveryone;
}

// CONNECT TO SERVER
function connectToServer() {
  if (typeof io === 'undefined') {
    setTimeout(connectToServer, 500);
    return;
  }

  socket = io(SERVER_URL);

  socket.on('connect', () => {
    console.log('✅ Connected to Tail Me server');
    socket.emit('register', currentUser);
  });

  socket.on('registration-complete', (data) => {
    console.log('✅ Registration complete', data);
  });

  socket.on('tail-received', (tail) => {
    showTailNotification(tail);
    updateBadge(1);
  });

  socket.on('session-started', (data) => {
    activeSession = data;
    
    const targetUrl = data.session.url;
    const currentUrl = window.location.href;
    
    if (targetUrl !== currentUrl) {
      showNavigationNotice(data.session.host, targetUrl);
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 1000);
    } else {
      startCoViewSession(data);
    }
  });

  socket.on('new-chat-message', (message) => {
    displayChatMessage(message);
  });
}

// SHOW NAVIGATION NOTICE
function showNavigationNotice(host, url) {
  const notice = document.createElement('div');
  notice.id = 'tail-navigation-notice';
  notice.innerHTML = `
    <div class="navigation-notice">
      <div class="notice-content">
        <span class="notice-icon">🦊</span>
        <div class="notice-text">
          <strong>Catching ${host}'s tail...</strong>
          <p>Taking you to the same page</p>
        </div>
      </div>
      <div class="notice-loader"></div>
    </div>
  `;
  
  document.body.appendChild(notice);
}

// SHOW TAIL NOTIFICATION
function showTailNotification(tail) {
  const notification = document.createElement('div');
  notification.className = 'tail-notification';
  notification.innerHTML = `
    <div class="notif-header">
      <strong>${tail.from} sent you a tail!</strong>
      <button onclick="this.closest('.tail-notification').remove()">✕</button>
    </div>
    <div class="notif-body">
      <p>${tail.title}</p>
      ${tail.message ? `<p class="notif-message">"${tail.message}"</p>` : ''}
    </div>
    <div class="notif-actions">
      <button onclick="catchTail('${tail.id}')">Catch Tail</button>
      <button onclick="this.closest('.tail-notification').remove()">Later</button>
    </div>
  `;

  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 10000);
}

// CATCH TAIL
window.catchTail = function(tailId) {
  if (!socket) return;
  socket.emit('catch-tail', { tailId });
  document.querySelector('.tail-notification')?.remove();
};

// START CO-VIEW SESSION
function startCoViewSession(data) {
  activeSession = data;
  showNotification(`🦊 You're now tailing with ${data.session.host}!`);
  createCoViewPanel(data);
}

// CREATE CO-VIEW PANEL
function createCoViewPanel(sessionData) {
  const existing = document.getElementById('tail-coview-panel');
  if (existing) existing.remove();
  
  const panel = document.createElement('div');
  panel.id = 'tail-coview-panel';
  panel.innerHTML = `
    <div class="coview-panel">
      <div class="coview-header">
        <div class="coview-info">
          <span class="coview-icon">🦊</span>
          <div class="coview-details">
            <strong>Tailing with ${sessionData.session.host}</strong>
            <small>${sessionData.session.participants.length} viewing</small>
          </div>
        </div>
        <div class="coview-controls">
          <button class="coview-btn" id="minimize-panel">_</button>
          <button class="coview-btn" id="close-panel">✕</button>
        </div>
      </div>
      
      <div class="coview-body">
        <div class="coview-messages" id="coview-messages">
          <div class="system-message">
            🦊 You're both viewing the same page. Chat below!
          </div>
        </div>
        
        <div class="coview-input-area">
          <input 
            type="text" 
            id="coview-chat-input" 
            placeholder="Type a message..."
            autocomplete="off"
          />
          <button id="coview-send-btn">Send</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  setupCoViewHandlers(sessionData);
}

function setupCoViewHandlers(sessionData) {
  const input = document.getElementById('coview-chat-input');
  const sendBtn = document.getElementById('coview-send-btn');
  
  const sendMessage = () => {
    const text = input.value.trim();
    if (!text) return;
    
    socket.emit('tail-chat', {
      tailId: sessionData.session.id,
      text: text
    });
    
    displayChatMessage({
      from: currentUser.username,
      text: text,
      fromMe: true
    });
    
    input.value = '';
  };
  
  sendBtn.onclick = sendMessage;
  input.onkeypress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };
  
  document.getElementById('minimize-panel').onclick = () => {
    document.querySelector('.coview-panel').classList.toggle('minimized');
  };
  
  document.getElementById('close-panel').onclick = () => {
    if (confirm('End tail session?')) {
      socket.emit('end-tail-session', { tailId: sessionData.session.id });
      document.getElementById('tail-coview-panel').remove();
      activeSession = null;
    }
  };
}

function displayChatMessage(message) {
  const messagesDiv = document.getElementById('coview-messages');
  if (!messagesDiv) return;
  
  const msgEl = document.createElement('div');
  msgEl.className = `chat-message ${message.fromMe ? 'mine' : 'theirs'}`;
  msgEl.innerHTML = `
    ${!message.fromMe ? `<div class="message-sender">${message.from}</div>` : ''}
    <div class="message-text">${message.text}</div>
  `;
  
  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendTail() {
  const selected = Array.from(document.querySelectorAll('.contact-chip.selected'))
    .map(el => el.dataset.username);
  
  if (selected.length === 0) {
    alert('Select at least one contact');
    return;
  }

  const message = document.getElementById('tail-message').value;

  socket.emit('send-tail', {
    recipients: selected,
    url: window.location.href,
    title: document.title,
    message: message
  });

  tailPopup.remove();
  showNotification('✅ Tail sent!');
}

function sendTailToEveryone() {
  const message = document.getElementById('tail-message').value;
  
  socket.emit('send-tail', {
    recipients: currentUser.contacts || [],
    url: window.location.href,
    title: document.title,
    message: message
  });

  tailPopup.remove();
  showNotification('✅ Tail sent to everyone!');
}

function loadContacts() {
  const contacts = currentUser.contacts || ['demo-user-2', 'demo-user-3'];
  const list = document.getElementById('contacts-list');
  
  list.innerHTML = contacts.map(contact => `
    <div class="contact-chip" data-username="${contact}" onclick="this.classList.toggle('selected')">
      ${contact}
    </div>
  `).join('');
}

function updateBadge(count) {
  const badge = document.querySelector('.tail-badge');
  const current = parseInt(badge.textContent) || 0;
  badge.textContent = current + count;
  badge.style.display = 'flex';
}

function showNotification(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 120px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 15px 30px;
    border-radius: 30px;
    z-index: 2147483647;
    animation: fadeInOut 3s ease;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function promptLogin() {
  const username = prompt('Enter your Tail Me username:');
  if (username) {
    currentUser = { username, contacts: [] };
    chrome.storage.local.set({ tailMeUser: currentUser });
    connectToServer();
  }
}

function trackPageActivity() {
  setInterval(() => {
    if (socket && socket.connected) {
      socket.emit('update-presence', {
        url: window.location.href,
        title: document.title
      });
    }
  }, 10000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'open-tail-popup') {
    showTailPopup();
  }
});