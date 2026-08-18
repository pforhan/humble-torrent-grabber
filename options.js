document.getElementById('save').addEventListener('click', () => {
  const url = document.getElementById('url').value;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  browser.storage.local.set({
    qbittorrent: { url, username, password }
  }).then(() => {
    const status = document.getElementById('status');
    status.textContent = 'Settings saved!';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
});

// Load existing settings or use defaults
browser.storage.local.get('qbittorrent').then((result) => {
  const defaults = {
    url: 'http://localhost:8080',
    username: 'admin',
    password: ''
  };
  
  const settings = result.qbittorrent || {};
  
  document.getElementById('url').value = settings.url || defaults.url;
  document.getElementById('username').value = settings.username || defaults.username;
  document.getElementById('password').value = settings.password || defaults.password;
});
