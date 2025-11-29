function requireConsent(){
  const box = document.getElementById('checkboxConsent');
  if(!box || !box.checked){
    alert('Please confirm you have permission.');
    return false;
  }
  return true;
}

async function injectAndPing(){
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  if(!tab || !/^https:\/\/www\.linkedin\.com\//.test(tab.url || '')){
    alert('Open a LinkedIn profile or activity page first.');
    return null;
  }
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['dom-parsers.js','content.js'] });
  try { const resp = await chrome.tabs.sendMessage(tab.id, { type: 'PING' }); if(resp && resp.ok) return tab.id; } catch(_) {}
  alert('Could not reach the page script. Reload the page and extension.');
  return null;
}

async function run(type, args={}){
  const tabId = await injectAndPing();
  if(!tabId) return;
  await chrome.tabs.sendMessage(tabId, { type, args });
}

// One-click
document.getElementById('btnOneClick')?.addEventListener('click', async () => {
  if(!requireConsent()) return;
  const maxMinutes = parseInt(document.getElementById('maxMinutes')?.value || '1', 10);
  const intervalMs = parseInt(document.getElementById('intervalMs')?.value || '800', 10);
  await run('ONE_CLICK_ALL', { maxMinutes, intervalMs });
});

// Resume
document.getElementById('btnResumePdf')?.addEventListener('click', async () => {
  if(!requireConsent()) return;
  await run('RESUME_PDF');
});

// Activity
document.getElementById('btnLoadMore')?.addEventListener('click', async () => {
  if(!requireConsent()) return;
  const maxMinutes = parseInt(document.getElementById('maxMinutes')?.value || '1', 10);
  const intervalMs = parseInt(document.getElementById('intervalMs')?.value || '800', 10);
  await run('LOAD_MORE_ACTIVITY', { maxMinutes, intervalMs });
});

document.getElementById('btnStop')?.addEventListener('click', async () => {
  await run('STOP_SCROLL');
});

document.getElementById('btnExtractPosts')?.addEventListener('click', async () => {
  if(!requireConsent()) return;
  await run('EXTRACT_POSTS');
});

document.getElementById('btnExtractComments')?.addEventListener('click', async () => {
  if(!requireConsent()) return;
  await run('EXTRACT_COMMENTS');
});

// CSV download bridge
chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'DOWNLOAD_CSV') {
    const blob = new Blob([msg.csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url, filename: msg.filename });
  }
});

