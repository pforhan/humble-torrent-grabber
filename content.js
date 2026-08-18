async function getSelectedTorrentLinks(ignoreSelection = false) {
  const links = Array.from(document.querySelectorAll('a[href*=".torrent"]'));
  const selectedLinks = [];

  links.forEach(link => {
    if (ignoreSelection) {
      selectedLinks.push(link.href);
      return;
    }

    const container = link.closest('li, div'); 
    if (!container) {
      selectedLinks.push(link.href);
      return;
    }

    const checkbox = container.querySelector('input[type="checkbox"]');
    if (checkbox) {
      if (checkbox.checked) {
        selectedLinks.push(link.href);
      }
    } else {
      if (container.classList.contains('selected')) {
        selectedLinks.push(link.href);
      } else {
        selectedLinks.push(link.href);
      }
    }
  });

  return selectedLinks;
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'grabTorrents') {
    getSelectedTorrentLinks(request.ignoreSelection).then(links => {
      sendResponse({ links });
    });
    return true;
  }
});
