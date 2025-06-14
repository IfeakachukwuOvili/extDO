chrome.action.onClicked.addListener(async (tab) => {
  // Skip restricted pages
  if (tab.url.startsWith('chrome://') || 
      tab.url.startsWith('chrome-extension://') || 
      tab.url.startsWith('https://chrome.google.com/webstore/')) {
    console.log('Extension cannot run on this page');
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['content.css']
    });
  } catch (err) {
    console.error('Failed to inject scripts:', err);
  }
});