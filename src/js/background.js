// Backg    title: 'Save Post Locally',ound script for handling context menu

console.log('Background script loaded');

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveLocally',
    title: '� Save Post Locally',
    contexts: ['page', 'selection', 'link', 'image'],
    documentUrlPatterns: ['https://www.facebook.com/*']
  });
  console.log('Context menu created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'saveLocally') {
    console.log('Context menu clicked', { info, tab });

    // Send message to content script to extract and save data locally
    chrome.tabs.sendMessage(tab.id, {
      action: 'extractAndSave',
      clickX: info.x,
      clickY: info.y
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
      } else {
        console.log('Response from content script:', response);
      }
    });
  }
});
