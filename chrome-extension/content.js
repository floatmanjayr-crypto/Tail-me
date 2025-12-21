console.log('🦊 Tail Me loading...');

(function() {
  'use strict';
  
  let currentUser = null;
  let floatingTail = null;
  let socket = null;

  // Inject socket.io script into page context
  function injectSocketIO() {
    return new Promise((resolve, reject) => {
      const scriptTag = document.createElement('script');
      scriptTag.src = chrome.runtime.getURL('socket.io.min.js');
      scriptTag.onload = () => {
        console.log('✅ Socket.io script injected');
        // Check multiple times for io to be defined
        let attempts = 0;
        const checkIO = setInterval(() => {
          if (window.io) {
            clearInterval(checkIO);
            console.log('✅ io is available');
            resolve();
          } else if (++attempts > 20) {
            clearInterval(checkIO);
            reject(new Error('io never became available'));
          }
        }, 100);
      };
      scriptTag.onerror = reject;
      (document.head || document.documentElement).appendChild(scriptTag);
    });
  }

  // Initialize everything
  async function init() {
    try {
      await injectSocketIO();
      
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
    } catch (err) {
      console.error('❌ Failed to initialize:', err);
    }
  }

  function connectSocket() {
    if (socket || !window.io) return;
    
    console.log('🔌 Connecting...');
    socket = window.io('https://maida-unvictualled-raina.ngrok-free.dev');
    
    socket.on('connect', () => {
      console.log('✅ Connected!');
      if (currentUser) socket.emit('register', currentUser);
    });
    
    socket.on('registration-complete', () => {
      console.log('✅ Registered:', currentUser.username);
    });
    
    socket.on('tail-received', (tail) => {
      console.log('📬 Tail received');
      showNotification(tail);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Connection error:', err);
    });
  }

  function createFloatingTail() {
    if (floatingTail) return;
    console.log('🦊 Creating tail...');

    floatingTail = document.createElement('div');
    floatingTail.innerHTML = '🦊';
    floatingTail.style.cssText = 'position:fixed!important;bottom:30px!important;right:30px!important;width:60px!important;height:60px!important;background:linear-gradient(135deg,#FF6B6B 0%,#FFD93D 100%)!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:30px!important;cursor:pointer!important;z-index:2147483647!important;box-shadow:0 5px 20px rgba(255,107,107,0.4)!important;';
    
    floatingTail.onclick = () => {
      console.log('🦊 Clicked');
      if (!currentUser) {
        alert('Please login first!');
        return;
      }
      const recipient = prompt('Send to:');
      if (!recipient) return;
      if (!socket || !socket.connected) {
        alert('Not connected!');
        return;
      }
      socket.emit('send-tail', {
        recipients: [recipient],
        url: location.href,
        title: document.title,
        message: 'Check this out!'
      });
      alert('✅ Sent!');
    };
    
    document.body.appendChild(floatingTail);
    console.log('✅ Tail created');
  }

  function showNotification(tail) {
    alert('🦊 ' + tail.from + ': ' + tail.message + '\n\n' + tail.url);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
