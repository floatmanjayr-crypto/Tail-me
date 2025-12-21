console.log('🦊 Tail Me loaded on:', window.location.href);

let currentUser = null;
let floatingTail = null;
let socket = null;

// Wait for page to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // Inject socket.io into page context (not extension context)
  const script = document.createElement('script');
  script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
  script.onload = () => {
    console.log('✅ Socket.io loaded from CDN');
    setTimeout(startExtension, 200);
  };
  script.onerror = () => console.error('❌ Failed to load socket.io');
  document.head.appendChild(script);
}

function startExtension() {
  if (typeof io === 'undefined') {
    console.error('❌ io still undefined');
    return;
  }
  
  console.log('✅ io is defined');
  
  chrome.storage.local.get(['tailMeUser'], (result) => {
    if (result.tailMeUser) {
      currentUser = result.tailMeUser;
      connectSocket();
      createFloatingTail();
      console.log('✅ User found:', currentUser.username);
    } else {
      console.log('⚠️ No user logged in');
      createFloatingTail();
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'USER_LOGGED_IN') {
      currentUser = message.user;
      connectSocket();
      if (!floatingTail) createFloatingTail();
    }
  });
}

function connectSocket() {
  if (socket || typeof io === 'undefined') return;
  
  console.log('🔌 Connecting to server...');
  socket = io('https://maida-unvictualled-raina.ngrok-free.dev');
  
  socket.on('connect', () => {
    console.log('✅ Connected to server!');
    socket.emit('register', currentUser);
  });
  
  socket.on('registration-complete', () => {
    console.log('✅ Registered as:', currentUser.username);
  });
  
  socket.on('tail-received', (tail) => {
    console.log('📬 Tail received:', tail);
    showNotification(tail);
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Connection error:', err);
  });
}

function createFloatingTail() {
  if (floatingTail) return;

  console.log('🦊 Creating floating tail...');

  floatingTail = document.createElement('div');
  floatingTail.innerHTML = '🦊';
  floatingTail.style.cssText = 'position:fixed!important;bottom:30px!important;right:30px!important;width:60px!important;height:60px!important;background:linear-gradient(135deg,#FF6B6B 0%,#FFD93D 100%)!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:30px!important;cursor:pointer!important;z-index:2147483647!important;box-shadow:0 5px 20px rgba(255,107,107,0.4)!important;animation:tailPulse 2s infinite!important;';
  
  const style = document.createElement('style');
  style.textContent = '@keyframes tailPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}';
  document.head.appendChild(style);

  floatingTail.onclick = () => {
    console.log('🦊 Tail clicked!');
    if (!currentUser) {
      alert('Please login first!');
      return;
    }
    showSendPopup();
  };
  
  document.body.appendChild(floatingTail);
  console.log('✅ Floating tail created!');
}

function showSendPopup() {
  const pageData = extractPageMetadata();
  const popup = document.createElement('div');
  popup.id = 'tail-popup';
  
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:2147483646;display:flex;align-items:center;justify-content:center;';
  overlay.onclick = () => popup.remove();
  
  const modal = document.createElement('div');
  modal.style.cssText = 'background:white;border-radius:20px;padding:25px;width:400px;max-width:90vw;';
  modal.onclick = (e) => e.stopPropagation();
  
  modal.innerHTML = '<h2 style="margin:0 0 15px 0;">🦊 Share This Page</h2><p style="margin:0 0 15px 0;color:#666;font-size:14px;">' + pageData.title + '</p><input type="text" id="tail-recipient" placeholder="Send to..." style="width:100%;padding:12px;border:2px solid #E0E0E0;border-radius:10px;margin-bottom:12px;font-size:16px;box-sizing:border-box;"><textarea id="tail-message" placeholder="Your message..." style="width:100%;padding:12px;border:2px solid #E0E0E0;border-radius:10px;margin-bottom:12px;font-size:16px;min-height:60px;box-sizing:border-box;"></textarea><button id="tail-send-btn" style="width:100%;padding:12px;background:linear-gradient(135deg,#FF6B6B 0%,#FFD93D 100%);color:white;border:none;border-radius:10px;font-weight:600;font-size:16px;cursor:pointer;margin-bottom:8px;">Send Tail 🦊</button><button id="tail-cancel-btn" style="width:100%;padding:12px;background:#E0E0E0;color:#333;border:none;border-radius:10px;font-weight:600;font-size:16px;cursor:pointer;">Cancel</button>';
  
  overlay.appendChild(modal);
  popup.appendChild(overlay);
  document.body.appendChild(popup);

  document.getElementById('tail-send-btn').onclick = () => {
    const recipient = document.getElementById('tail-recipient').value.trim();
    const message = document.getElementById('tail-message').value.trim();
    if (!recipient) { 
      alert('Enter a recipient'); 
      return; 
    }
    
    if (!socket || !socket.connected) {
      alert('Not connected to server. Please refresh.');
      return;
    }

    console.log('📤 Sending tail to:', recipient);
    socket.emit('send-tail', {
      recipients: [recipient],
      url: window.location.href,
      title: pageData.title,
      message: message || 'Check this out!',
      image: pageData.image,
      price: pageData.price
    });

    popup.remove();
    showToast('Tail sent! 🦊');
  };

  document.getElementById('tail-cancel-btn').onclick = () => popup.remove();
}

function extractPageMetadata() {
  const title = document.querySelector('meta[property="og:title"]')?.content || document.title || 'Check this out!';
  const image = document.querySelector('meta[property="og:image"]')?.content || document.querySelector('img')?.src || '';
  let price = null;
  const priceSelectors = ['[itemprop="price"]', '.price', '[class*="price"]', '.a-price-whole'];
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
  console.log('🔔 Showing notification from:', tail.from);
  const notif = document.createElement('div');
  notif.style.cssText = 'position:fixed;top:20px;right:20px;width:350px;background:white;border-radius:15px;box-shadow:0 10px 40px rgba(0,0,0,0.2);z-index:2147483647;padding:20px;';
  
  const heading = document.createElement('h3');
  heading.style.cssText = 'margin:0 0 10px 0;color:#667EEA;';
  heading.textContent = '🦊 ' + tail.from + ' sent you a tail!';
  
  const msg = document.createElement('p');
  msg.style.cssText = 'margin:0 0 15px 0;color:#333;';
  msg.textContent = tail.message;
  
  const catchBtn = document.createElement('button');
  catchBtn.textContent = 'Catch 🎣';
  catchBtn.style.cssText = 'width:100%;padding:12px;background:#28C840;color:white;border:none;border-radius:10px;font-weight:600;cursor:pointer;margin-bottom:8px;';
  catchBtn.onclick = () => window.location.href = tail.url;
  
  const laterBtn = document.createElement('button');
  laterBtn.textContent = 'Later';
  laterBtn.style.cssText = 'width:100%;padding:12px;background:#E0E0E0;color:#333;border:none;border-radius:10px;font-weight:600;cursor:pointer;';
  laterBtn.onclick = () => notif.remove();
  
  notif.appendChild(heading);
  notif.appendChild(msg);
  notif.appendChild(catchBtn);
  notif.appendChild(laterBtn);
  
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 30000);
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:100px;right:30px;background:#28C840;color:white;padding:15px 25px;border-radius:10px;z-index:2147483647;font-weight:600;';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
