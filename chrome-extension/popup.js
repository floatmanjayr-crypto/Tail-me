document.addEventListener('DOMContentLoaded', () => {
  checkUser();

  document.getElementById('login-btn').addEventListener('click', login);
  document.getElementById('logout-btn').addEventListener('click', logout);
});

function checkUser() {
  chrome.storage.local.get(['tailMeUser'], (result) => {
    if (result.tailMeUser) {
      showDashboard(result.tailMeUser);
    }
  });
}

function showDashboard(user) {
  document.getElementById('login-view').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  document.getElementById('user').textContent = user.username;
}

function login() {
  const username = document.getElementById('username').value.trim();
  if (!username) return alert('Enter username');

  const userData = { username: username };
  chrome.storage.local.set({ tailMeUser: userData }, () => {
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

function logout() {
  chrome.storage.local.remove('tailMeUser', () => {
    location.reload();
  });
}
