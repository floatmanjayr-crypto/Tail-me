const SOCKET_SERVER = 'https://probable-carnival-vpg9v5rpxjph7pr-4000.app.github.dev';

document.addEventListener('DOMContentLoaded', () => {
  checkUserStatus();

  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('quick-tail-btn').addEventListener('click', quickTail);
});

function checkUserStatus() {
  chrome.storage.local.get(['tailMeUser'], (result) => {
    if (result.tailMeUser) {
      showDashboard(result.tailMeUser);
    } else {
      showLogin();
    }
  });
}

function showLogin() {
  document.getElementById('login-view').style.display = 'block';
  document.getElementById('dashboard-view').style.display = 'none';
}

function showDashboard(user) {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('dashboard-view').style.display = 'block';
  document.getElementById('username-display').textContent = user.username;
}

function handleLogin() {
  const username = document.getElementById('username-input').value.trim();
  
  if (!username) {
    alert('Please enter a username');
    return;
  }

  const userData = {
    username: username,
    contacts: []
  };

  chrome.storage.local.set({ tailMeUser: userData }, () => {
    // Notify all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'USER_LOGGED_IN',
          user: userData
        }).catch(() => {});
      });
    });

    showDashboard(userData);
  });
}

function handleLogout() {
  chrome.storage.local.remove('tailMeUser', () => {
    showLogin();
  });
}

function quickTail() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'OPEN_SEND_POPUP'
      });
      window.close();
    }
  });
}