const statusDiv = document.getElementById('status');
const connStatusDiv = document.getElementById('connection-status');
const btn = document.getElementById('submit');
const listContainer = document.getElementById('link-list-container');
const linkList = document.getElementById('link-list');
const torrentCountSpan = document.getElementById('torrent-count');
const savepathInput = document.getElementById('savepath');
const tagsInput = document.getElementById('tags');
let cachedLinks = [];

async function updateLinkList() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    const response = await browser.tabs.sendMessage(activeTab.id, { 
      action: 'grabTorrents' 
    });
    cachedLinks = response.links;

    if (!cachedLinks || cachedLinks.length === 0) {
      listContainer.style.display = 'none';
      statusDiv.innerHTML = '<span class="error">No torrents found on this page.</span>';
      btn.disabled = true;
      return;
    }

    statusDiv.textContent = ''; 
    btn.disabled = false;

    torrentCountSpan.textContent = cachedLinks.length;

    linkList.innerHTML = '';
    cachedLinks.forEach(link => {
      const li = document.createElement('li');
      const url = new URL(link);
      let filename = url.pathname.split('/').pop();
      filename = filename.replace(/\.torrent$/i, '');
      li.textContent = filename;
      linkList.appendChild(li);
    });
    listContainer.style.display = 'block';
  } catch (e) {
    console.error('Error updating link list:', e);
    listContainer.style.display = 'none';
    statusDiv.innerHTML = '<span class="error">Could not scan page. Make sure you are on a Humble Bundle page.</span>';
    btn.disabled = true;
  }
}

async function saveSessionSettings() {
  await browser.storage.local.set({
    session: {
      savepath: savepathInput.value,
      tags: tagsInput.value
    }
  });
}

async function loadSessionSettings() {
  const result = await browser.storage.local.get('session');
  if (result.session) {
    const { savepath, tags } = result.session;
    savepathInput.value = savepath || '';
    tagsInput.value = tags || '';
  }
}

async function verifyConnection() {
  connStatusDiv.innerHTML = 'Checking connection...';
  const response = await browser.runtime.sendMessage({ action: 'checkConnection' });
  
  if (response.connected) {
    connStatusDiv.innerHTML = '<span class="success">Connected to qBittorrent</span>';
    setTimeout(() => { 
      if (connStatusDiv.innerHTML.includes('Connected')) {
        connStatusDiv.textContent = ''; 
      }
    }, 3000);
  } else {
    const errorMsg = response.error || 'Unknown error';
    let advice = 'Please ensure qBittorrent is running and the Web UI is enabled in settings.';
    
    if (errorMsg.includes('401') || errorMsg.toLowerCase().includes('unauthorized') || errorMsg.toLowerCase().includes('authentication failed')) {
      advice = 'Please check your username and password in the extension options.';
    }
    
    connStatusDiv.innerHTML = `<span class="error">qBittorrent Connection Error: ${errorMsg}.<br>${advice}</span>`;
    btn.disabled = true;
  }
}

// Initialize
(async () => {
  await loadSessionSettings();
  await updateLinkList();
  await verifyConnection();
})();

savepathInput.addEventListener('input', saveSessionSettings);
tagsInput.addEventListener('input', saveSessionSettings);

document.getElementById('submit').addEventListener('click', async () => {
  const savepath = savepathInput.value;
  const tags = tagsInput.value;

  if (!savepath) {
    statusDiv.innerHTML = '<span class="error">Please specify a save path.</span>';
    return;
  }

  btn.disabled = true;
  statusDiv.textContent = 'Submitting to qBittorrent...';

  try {
    if (!cachedLinks || cachedLinks.length === 0) {
      statusDiv.innerHTML = '<span class="error">No torrents found to submit.</span>';
      btn.disabled = false;
      return;
    }

    const result = await browser.runtime.sendMessage({
      action: 'submitTorrents',
      data: { links: cachedLinks, savepath, tags }
    });

    let summary = '';
    let successCount = 0;
    result.results.forEach(res => {
      if (res.status === 'success') successCount++;
      else summary += `Error: ${res.link.split('/').pop().substring(0, 30)}... - ${res.message}\n`;
    });

    statusDiv.innerHTML = `<span class="success">Successfully added ${successCount}/${cachedLinks.length} torrents.</span>\n${summary}`;
  } catch (e) {
    statusDiv.innerHTML = `<span class="error">Error: ${e.message}</span>`;
  } finally {
    btn.disabled = false;
  }
});
