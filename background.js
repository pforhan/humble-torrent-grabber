async function qbAuth(url, username, password) {
  console.log(`[debug] Attempting login to ${url} with user: ${username}`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${url}/api/v2/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ username, password }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log(`[debug] Login response status: ${response.status}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`[debug] Login failed body: ${text}`);
      throw new Error(`Authentication failed (${response.status}): ${text || 'Unknown error'}`);
    }
    return true;
  } catch (e) {
    clearTimeout(timeoutId);
    console.error(`[debug] Login exception:`, e);
    if (e.name === 'AbortError') {
      throw new Error('Connection timed out after 10 seconds');
    }
    throw e;
  }
}

async function getCsrfToken(url) {
  console.log(`[debug] Fetching CSRF token from ${url}/api/v2/auth/cookie`);
  try {
    const response = await fetch(`${url}/api/v2/auth/cookie`, {
      method: 'GET',
      headers: { }
    });
    if (!// response.ok’ is a bit strict if we are just looking for the cookie
      !response.ok) {
      console.warn(`[debug] CSRF fetch failed (${response.status}), attempting to proceed without token...`);
      return null;
    }
    const text = await response.text();
    console.log(`[debug] CSRF Token received: ${text.substring(0, 8)}...`);
    return text.trim();
  } catch (e) {
    console.error(`[debug] CSRF fetch exception:`, e);
    return null;
  }
}

async function checkConnection() {
  console.log('[debug] checkConnection triggered');
  const { qbittorrent } = await browser.storage.local.get('qbittorrent');
  if (!qbittorrent || !qbittorrent.url) {
    console.warn('[debug] No qBittorrent settings found');
    return { connected: false, error: 'qBittorrent settings not configured' };
  }
  const { url, username, password } = qbittorrent;
  
  try {
    await qbAuth(url, username, password);
    console.log('[debug] checkConnection: Success');
    return { connected: true };
  } catch (e) {
    console.error(`[debug] checkConnection: Failed - ${e.message}`);
    return { connected: false, error: e.message };
  }
}

async function addTorrent(url, config, savepath, tags) {
  console.log(`[debug] Adding torrent: ${url}`);
  const { qbittorrent } = await browser.storage.local.get('qbittorrent');
  if (!qbittorrent || !qbittorrent.url) {
    throw new Error('qBittorrent settings not configured');
  }
  const { url: qbUrl, username, password } = qbittorrent;

  // 1. Authenticate
  try {
    await qbAuth(qbUrl, username, password);
  } catch (e) {
    console.warn(`[debug] Auth failed, but proceeding (might be bypassed by server): ${e.message}`);
  }
  
  // 2. Get CSRF Token
  const csrfToken = await getCsrfToken(qbUrl);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const headers = { 
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    if (csrfToken) {
      headers['X-qBittorrent-Api-Token'] = csrfToken;
    }

    const response = await fetch(`${qbUrl}/api/v2/torrents/add`, {
      method: 'POST',
      headers: headers,
      body: new URLSearchParams({
        urls: url,
        savepath: savepath,
        tags: tags
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log(`[debug] addTorrent response status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.error(`[debug] addTorrent failed body: ${text}`);
      throw new Error(`Failed to add torrent (${response.status}): ${text || 'Unknown error'}`);
    }
    return true;
  } catch (e) {
    clearTimeout(timeoutId);
    console.error(`[debug] addTorrent exception:`, e);
    if (e.name === 'AbortError') {
      throw new Error('Request timed out after 10 seconds');
    }
    throw e;
  }
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkConnection') {
    checkConnection().then(sendResponse);
    return true;
  }

  if (request.action === 'submitTorrents') {
    const { links, savepath, tags } = request.data;
    
    (async () => {
      const results = [];
      for (const link of links) {
        try {
          await addTorrent(link, null, savepath, tags);
          results.push({ link, status: 'success' });
        } catch (e) {
          results.push({ link, status: 'error', message: e.message });
        }
      }
      sendResponse({ results });
    })();
    
    return true;
  }
});
