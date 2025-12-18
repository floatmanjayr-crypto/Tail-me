const SOCKET_SERVER = 'https://maida-unvictualled-raina.ngrok-free.dev';

console.log('🦊 Tail Me loaded on:', window.location.href);

let socket = null;
let currentUser = null;
let floatingTail = null;

(function init() {
  chrome.storage.local.get(['tailMeUser'], (result) => {
    if (result.tailMeUser) {
      currentUser = result.tailMeUser;
      loadSocketIO();
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'USER_LOGGED_IN') {
      currentUser = message.user;
      loadSocketIO();
    }
  });
})();

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
    console.log('✅ Connected');
    socket.emit('register', currentUser);
  });

  socket.on('tail-received', (tail) => {
    showNotification(tail);
  });
}

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
    animation: tailPulse 2s infinite !important;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes tailPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  `;
  document.head.appendChild(style);

  floatingTail.onclick = showSendPopup;
  document.body.appendChild(floatingTail);
  console.log('🦊 Floating tail added!');
}

function showSendPopup() {
  const pageData = extractPageMetadata();
  
  const popup = document.createElement('div');
  popup.id = 'tail-popup';
  popup.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 2147483646; display: flex; align-items: center; justify-content: center;" onclick="this.parentElement.remove()">
      <div style="background: white; border-radius: 20px; padding: 25px; width: 400px; max-width: 90vw;" onclick="event.stopPropagation()">
        <h2 style="margin: 0 0 15px 0;">🦊 Share This Page</h2>
        <p style="margin: 0 0 15px 0; color: #666; font-size: 14px; max-height: 40px; overflow: hidden;">${pageData.title}</p>
        <input type="text" id="tail-recipient" placeholder="Send to..." style="width: 100%; padding: 12px; border: 2px solid #E0E0E0; border-radius: 10px; margin-bottom: 12px; font-size: 16px; box-sizing: border-box;">
        <textarea id="tail-message" placeholder="Your message..." style="width: 100%; padding: 12px; border: 2px solid #E0E0E0; border-radius: 10px; margin-bottom: 12px; font-size: 16px; min-height: 60px; box-sizing: border-box;"></textarea>
        <button id="tail-send-btn" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%); color: white; border: none; border-radius: 10px; font-weight: 600; font-size: 16px; cursor: pointer; margin-bottom: 8px;">Send Tail 🦊</button>
        <button id="tail-cancel-btn" style="width: 100%; padding: 12px; background: #E0E0E0; color: #333; border: none; border-radius: 10px; font-weight: 600; font-size: 16px; cursor: pointer;">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById('tail-send-btn').onclick = () => {
    const recipient = document.getElementById('tail-recipient').value.trim();
    const message = document.getElementById('tail-message').value.trim();

    if (!recipient) {
      alert('Enter a recipient');
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

    popup.remove();
    showToast('Tail sent! 🦊');
  };

  document.getElementById('tail-cancel-btn').onclick = () => {
    popup.remove();
  };
}

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

function showNotification(tail) {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 350px;
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    z-index: 2147483647;
    padding: 20px;
  `;
  notif.innerHTML = `
    <h3 style="margin: 0 0 10px 0; color: #667EEA;">🦊 ${tail.from} sent you a tail!</h3>
    <p style="margin: 0 0 15px 0; color: #333;">${tail.message}</p>
    <button onclick="window.location.href='${tail.url}'" style="width: 100%; padding: 12px; background: #28C840; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; margin-bottom: 8px;">Catch 🎣</button>
    <button onclick="this.parentElement.remove()" style="width: 100%; padding: 12px; background: #E0E0E0; color: #333; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">Later</button>
  `;

  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 30000);
}

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
