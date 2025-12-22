console.log('🦊 Tail Me content script loaded');

let currentUser = null;
let floatingTail = null;

// Get user and connect
chrome.storage.local.get(['tailMeUser'], (result) => {
  if (result.tailMeUser) {
    currentUser = result.tailMeUser;
    console.log('✅ User found:', currentUser.username);
    
    // Tell background to connect
    chrome.runtime.sendMessage({
      type: 'CONNECT_SOCKET',
      user: currentUser
    }, (response) => {
      console.log('Background response:', response);
    });
    
    createFloatingTail();
  } else {
    console.log('⚠️ No user logged in');
    createFloatingTail();
  }
});

// Listen for messages from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'USER_LOGGED_IN') {
    currentUser = message.user;
    chrome.runtime.sendMessage({
      type: 'CONNECT_SOCKET',
      user: currentUser
    });
    if (!floatingTail) createFloatingTail();
  } 
  else if (message.type === 'TAIL_RECEIVED') {
    showNotification(message.tail);
  }
});

function createFloatingTail() {
  if (floatingTail) return;
  console.log('🦊 Creating floating tail');

  floatingTail = document.createElement('div');
  floatingTail.innerHTML = '🦊';
  floatingTail.style.cssText = 'position:fixed!important;bottom:30px!important;right:30px!important;width:60px!important;height:60px!important;background:linear-gradient(135deg,#FF6B6B 0%,#FFD93D 100%)!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:30px!important;cursor:pointer!important;z-index:2147483647!important;box-shadow:0 5px 20px rgba(255,107,107,0.4)!important;';
  
  floatingTail.onclick = () => {
    console.log('🦊 Tail clicked');
    
    if (!currentUser) {
      alert('Please login first!');
      return;
    }
    
    const recipient = prompt('Send to username:');
    if (!recipient) return;
    
    const message = prompt('Your message (optional):') || 'Check this out!';
    
    // Send via background script
    chrome.runtime.sendMessage({
      type: 'SEND_TAIL',
      data: {
        recipients: [recipient],
        url: window.location.href,
        title: document.title,
        message: message
      }
    }, (response) => {
      if (response && response.success) {
        alert('✅ Tail sent to ' + recipient + '!');
      } else {
        alert('❌ Failed to send: ' + (response?.error || 'Unknown error'));
      }
    });
  };
  
  document.body.appendChild(floatingTail);
  console.log('✅ Floating tail created');
}

function showNotification(tail) {
  console.log('🔔 Showing notification');
  const notif = document.createElement('div');
  notif.style.cssText = 'position:fixed;top:20px;right:20px;width:350px;background:white;border-radius:15px;box-shadow:0 10px 40px rgba(0,0,0,0.2);z-index:2147483647;padding:20px;';
  
  notif.innerHTML = `
    <h3 style="margin:0 0 10px 0;color:#667EEA;">🦊 ${tail.from} sent you a tail!</h3>
    <p style="margin:0 0 15px 0;color:#333;">${tail.message}</p>
  `;
  
  const catchBtn = document.createElement('button');
  catchBtn.textContent = 'Catch 🎣';
  catchBtn.style.cssText = 'width:100%;padding:12px;background:#28C840;color:white;border:none;border-radius:10px;font-weight:600;cursor:pointer;margin-bottom:8px;';
  catchBtn.onclick = () => window.location.href = tail.url;
  
  const laterBtn = document.createElement('button');
  laterBtn.textContent = 'Later';
  laterBtn.style.cssText = 'width:100%;padding:12px;background:#E0E0E0;color:#333;border:none;border-radius:10px;font-weight:600;cursor:pointer;';
  laterBtn.onclick = () => notif.remove();
  
  notif.appendChild(catchBtn);
  notif.appendChild(laterBtn);
  
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 30000);
}
