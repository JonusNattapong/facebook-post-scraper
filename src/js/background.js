// Backg    title: 'Save Post Locally',ound script for handling context menu

console.log('Background script loaded');

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Simple Add Post option
  chrome.contextMenus.create({
    id: 'addPost',
    title: '➕ Add Post',
    contexts: ['page', 'selection', 'link', 'image'],
    documentUrlPatterns: ['https://www.facebook.com/*']
  });

  console.log('Context menu created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked', { menuItemId: info.menuItemId, info, tab });

  if (info.menuItemId === 'addPost') {
    // Validate and sanitize coordinates
    let clickX = info.x;
    let clickY = info.y;

    // If coordinates are not available or invalid, send null to trigger fallback
    if (!isFinite(clickX) || !isFinite(clickY) || clickX < 0 || clickY < 0) {
      console.log('⚠️ Invalid coordinates from context menu, will use fallback');
      clickX = null;
      clickY = null;
    }

    // Helper to ensure content script is injected, then send message
    async function ensureContentScriptAndSend(tabId, message) {
      try {
        console.log('🔍 Checking if content script is already loaded in tab:', tabId);
        
        // Try to ping the content script first
        let scriptLoaded = false;
        try {
          await chrome.tabs.sendMessage(tabId, { action: 'ping' });
          scriptLoaded = true;
          console.log('✅ Content script already loaded');
        } catch (err) {
          console.log('ℹ️ Content script not loaded yet, will inject...');
        }

        // If not loaded, inject it
        if (!scriptLoaded) {
          try {
            console.log('💉 Injecting content script into tab:', tabId);
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['src/js/content.js']
            });
            console.log('✅ Content script injected successfully');
            
            // Wait a bit for script to initialize
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (injectErr) {
            console.error('❌ Failed to inject content script:', injectErr);
            throw injectErr;
          }
        }

        // Now send the actual message
        console.log('📤 Sending message to tab:', tabId);
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            const err = chrome.runtime.lastError;
            console.error('❌ Error sending message to tab:', err.message || err);
          } else {
            if (response && response.success) {
              console.log('✅ Post added successfully:', response);
            } else if (response && !response.success) {
              console.warn('⚠️ Content script returned error:', response.error);
              if (response.debug) {
                console.log('Debug info:', response.debug);
              }
            } else {
              console.log('Response from content script:', response);
            }
          }
        });
      } catch (ex) {
        console.error('❌ Exception in ensureContentScriptAndSend:', ex);
      }
    }

    // Get the tab ID and ensure content script is loaded
    const tabId = tab && tab.id;
    if (tabId) {
      ensureContentScriptAndSend(tabId, {
        action: 'addPost',
        clickX: clickX,
        clickY: clickY
      });
    } else {
      console.error('❌ No valid tab ID available');
    }
  }
});
