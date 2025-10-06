# Facebook Post Scraper - Development Guide

## 📋 Table of Contents
- [Architecture Overview](#architecture-overview)
- [File Structure](#file-structure)
- [Technical Implementation](#technical-implementation)
- [Key Code Locations](#key-code-locations)
- [Common Issues & Solutions](#common-issues--solutions)
- [Development Workflow](#development-workflow)
- [Future Enhancement Guidelines](#future-enhancement-guidelines)

---

## Architecture Overview

This Chrome Extension uses **Manifest V3** architecture with the following components:

```
┌─────────────┐
│   popup.js  │ ← User configures webhook URL
└─────────────┘
       │
       ↓ (stores in chrome.storage.sync)
       │
┌─────────────────────────────────────────┐
│         background.js                    │
│  - Creates context menu                  │
│  - Listens for right-click events        │
│  - Sends messages to content script      │
└─────────────────────────────────────────┘
       │
       ↓ (chrome.tabs.sendMessage)
       │
┌─────────────────────────────────────────┐
│         content.js                       │
│  - Detects Facebook posts                │
│  - Extracts post data                    │
│  - Sends to n8n webhook                  │
│  - Shows visual feedback                 │
└─────────────────────────────────────────┘
```

### Message Flow
1. User right-clicks on a Facebook post
2. `background.js` detects the context menu click
3. `background.js` sends `{action: 'extractAndSend'}` message to `content.js`
4. `content.js` finds the post, extracts data, and sends to webhook
5. `content.js` shows notification and sends response back

---

## File Structure

```
dsp-scraper/
├── manifest.json          # Extension configuration (Manifest V3)
├── src/
│   ├── css/
│   │   ├── popup.css              # Popup UI styles
│   │   └── design-guideline.css   # Design guideline styles
│   ├── html/
│   │   ├── popup.html             # Popup UI structure
│   │   └── design-guideline.html  # UI/UX design specifications
│   └── js/
│       ├── background.js          # Service worker for context menu
│       ├── content.js             # Main scraping logic (runs on Facebook pages)
│       └── popup.js               # Popup logic for webhook config
├── PROGRESS.md           # Feature tracking
├── DEVELOPMENT.md        # This file
└── icons/                # Extension icons
```

### File Responsibilities

**manifest.json**
- Defines permissions: `activeTab`, `scripting`, `storage`, `contextMenus`
- Specifies content script injection for `facebook.com/*`
- Declares service worker (background.js)

**background.js** (Service Worker)
- Creates context menu item "📤 Send to n8n"
- Listens for context menu clicks
- Sends messages to content script with click coordinates

**content.js** (Content Script)
- Runs on all Facebook pages
- Tracks right-click events to identify clicked elements
- Detects post containers using multiple strategies
- Extracts post data (author, caption, images, engagement)
- Sends data to n8n webhook
- Displays success/error notifications

**popup.js** (Popup Script)
- Loads saved webhook URL from `chrome.storage.sync`
- Validates and saves webhook URL
- Provides scrape button (alternative to right-click)

---

## Technical Implementation

### 1. Post Detection Strategy

Facebook's DOM structure doesn't have consistent class names, so we use multiple detection strategies:

#### Primary Detection (DOM Traversal)
Starting from the clicked element, traverse up the DOM tree looking for:

1. **`role="article"`** - Standard post container
2. **`data-store` attribute** - Alternative post marker
3. **`aria-labelledby` with content** - Posts have this + images/text
4. **Legacy classes** - `userContentWrapper`, `_5pcr`

```javascript
// content.js:309-353
while (postElement && postElement !== document.body) {
  if (role === 'article') break;
  if (dataStore) break;
  if (ariaLabelledBy && (hasImages || hasText)) break;
  postElement = postElement.parentElement;
}
```

#### Fallback Detection (Spatial Search)
If traversal fails, find all `[aria-labelledby]` elements and select the one that:
- Contains the clicked element vertically
- Has images or text content
- Is closest to click position

```javascript
// content.js:355-398
const allPotentialPosts = document.querySelectorAll('[aria-labelledby]');
// Find post containing click coordinates
```

### 2. Data Extraction Logic

#### Author Extraction (content.js:21-105)
**Strategy 1**: Find via `aria-labelledby` attribute
- Parse the IDs from `aria-labelledby`
- Look for author name in those label elements
- Extract profile URL from nearby `<a>` tag

**Strategy 2**: Scan all links in post header
- Filter Facebook links near top of post (first 150px)
- Exclude action links (Like, Comment, Share)
- First valid link with substantial text = author

**Cleanup**: Remove UI elements like "· Follow" from author name

#### Caption/Text Extraction (content.js:107-154)
1. Click "See more" button if present to expand truncated text
2. Try multiple selectors in priority order:
   - `[data-ad-comet-preview="message"]`
   - `[data-ad-preview="message"]`
   - `div[dir="auto"][style*="text-align: start"]`
3. Filter out UI text (Like, Comment, Share)
4. Remove "See more" suffix from text

#### Media Extraction (content.js:156-188)
**Images**: `img[src*="scontent"], img[src*="fbcdn"]`
- Filter: min 100x100px, exclude emojis/static images
- Extract: URL, alt text, width, height
- Deduplicate by URL

**Videos**: `video` elements
- Extract: URL, poster image

#### Engagement Stats (content.js:199-261)
Uses regex patterns with number normalization:
- Likes: `(\d+(?:,\d+)*(?:\.\d+)?[KkMm]?)\s+(?:likes?|reactions?)`
- Comments: `(\d+(?:,\d+)*(?:\.\d+)?[KkMm]?)\s+comments?`
- Shares: `(\d+(?:,\d+)*(?:\.\d+)?[KkMm]?)\s+shares?`

Normalizes K/M format: `1.5K` → `1500`, `2M` → `2000000`

### 3. Message Passing (Manifest V3)

**Critical Pattern**: Use async/await properly with `sendResponse`

❌ **Wrong** (message channel closes before response):
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  chrome.storage.sync.get(['webhookUrl'], async (result) => {
    // Channel already closed!
    sendResponse({ success: true });
  });
});
```

✅ **Correct** (keep channel open):
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    const result = await chrome.storage.sync.get(['webhookUrl']);
    sendResponse({ success: true });
  })();
  return true; // Keep channel open for async response
});
```

### 4. Webhook Integration (content.js:374-388)

```javascript
const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(extractedData)
});
```

Shows visual notification based on response status.

---

## Key Code Locations

### Post Detection
- **Right-click tracking**: `content.js:276-279`
- **Message listener**: `content.js:282-404`
- **DOM traversal**: `content.js:301-353`
- **Fallback detection**: `content.js:355-398`

### Data Extraction
- **Author extraction**: `content.js:21-105`
- **Caption extraction**: `content.js:107-154`
- **Image extraction**: `content.js:156-177`
- **Video extraction**: `content.js:179-188`
- **Engagement stats**: `content.js:199-261`

### Webhook Communication
- **Storage retrieval**: `content.js:363`
- **Fetch request**: `content.js:374-380`
- **Error handling**: `content.js:389-393`

### Visual Feedback
- **Notification function**: `content.js:407-456`
- **Success notification**: `content.js:383`
- **Error notification**: `content.js:391`

### Context Menu
- **Menu creation**: `background.js:6-13`
- **Click handler**: `background.js:17-33`

---

## Common Issues & Solutions

### Issue 1: Context Menu Not Sending Data
**Symptom**: Right-click menu appears but nothing happens when clicked.

**Cause**: Async message response channel closes before `sendResponse()` is called.

**Solution** (Fixed in latest version):
```javascript
// Wrap in IIFE and use await instead of callbacks
(async () => {
  const result = await chrome.storage.sync.get(['webhookUrl']);
  // ... rest of logic
  sendResponse({ success: true });
})();
return true; // CRITICAL: Keep message channel open
```

**Location**: `content.js:352-394`

### Issue 2: Post Not Detected
**Symptom**: Error message "Could not find post"

**Root Causes**:
1. Facebook changed DOM structure
2. Clicked on non-post element (header, sidebar)
3. Post is in unusual format (stories, reels)

**Solutions**:
1. Check console logs for traversal attempts
2. Inspect element to find new post container patterns
3. Add new detection strategy in `content.js:309-353`
4. Fallback detection should catch most cases (content.js:355-398)

**Debugging**:
```javascript
// Check what elements are being traversed
console.log(`Attempt ${attempts}: Checking element`,
  postElement.tagName,
  role,
  postElement.className);
```

### Issue 3: Author Not Extracted
**Symptom**: `author` field is `null` in webhook data

**Causes**:
1. Author link has different structure
2. Post type doesn't follow standard pattern (ads, suggested posts)

**Solutions**:
1. Add new selector in Strategy 1 (content.js:24-49)
2. Adjust position threshold in Strategy 2 (content.js:84)
3. Check for new aria-label patterns

### Issue 4: Engagement Stats Missing
**Symptom**: `likes`, `comments`, or `shares` are `null`

**Causes**:
1. Facebook changed wording ("reactions" vs "likes")
2. Different language (Thai, etc.)
3. New number format

**Solutions**:
1. Add new regex pattern (content.js:219-261)
2. Add language support: `/(\d+)\s+ถูกใจ/i` (Thai for likes)
3. Test pattern with: `bodyText.match(pattern)`

---

## Development Workflow

### 1. Loading the Extension
1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `dsp-scraper` folder
5. Extension should appear in the list

### 2. Making Changes
1. Edit the relevant file (`content.js`, `background.js`, etc.)
2. Go to `chrome://extensions`
3. Click the refresh icon on your extension
4. For `content.js` changes: Also refresh the Facebook page

### 3. Debugging

#### Content Script Debugging
1. Open Facebook page
2. Right-click → Inspect → Console tab
3. Look for logs prefixed with emojis:
   - 🚀 Extension loaded
   - 🔍 Starting extraction
   - ✅ Success messages
   - ❌ Error messages

#### Background Script Debugging
1. Go to `chrome://extensions`
2. Click "Service worker" link under your extension
3. Console will show background script logs

#### Popup Debugging
1. Click extension icon to open popup
2. Right-click in popup → Inspect
3. Console shows popup.js logs

### 4. Testing Checklist
Test with different post types:
- [ ] Text-only post
- [ ] Single image post
- [ ] Multiple images post
- [ ] Video post
- [ ] Post with 0 engagement
- [ ] Post with high engagement (1K+ likes)
- [ ] Thai language post
- [ ] Shared/reposted content
- [ ] Sponsored/ad post

### 5. n8n Webhook Testing
1. Create test webhook in n8n
2. Set URL in extension popup
3. Right-click on post → "Send to n8n"
4. Check n8n for received data
5. Verify data structure matches expected format

---

## Future Enhancement Guidelines

### Adding New Data Fields

**Example**: Add "post timestamp" field

1. **Find the element** (Inspect Facebook post):
   ```javascript
   // Look for timestamp element
   const timestampEl = postElement.querySelector('a[href*="/posts/"] abbr');
   ```

2. **Extract the data** (in `extractPostData` function):
   ```javascript
   // Add to data object (content.js:7-18)
   const data = {
     // ... existing fields
     postTimestamp: null  // Add new field
   };

   // Extract timestamp (content.js:260+)
   const timestampEl = postElement.querySelector('a[href*="/posts/"] abbr');
   if (timestampEl) {
     data.postTimestamp = timestampEl.getAttribute('data-utime') ||
                          timestampEl.textContent;
   }
   ```

3. **Test thoroughly** with different post types

4. **Update PROGRESS.md** to document the new field

### Improving Post Detection

When Facebook changes structure:

1. **Inspect the new post container**:
   - Right-click on post → Inspect
   - Look for unique attributes (role, aria-*, data-*)
   - Note the element hierarchy

2. **Add new detection strategy** (content.js:309-353):
   ```javascript
   // Add new check in while loop
   const newAttribute = postElement.getAttribute('data-new-marker');
   if (newAttribute) {
     console.log('✅ Found post via new marker!');
     break;
   }
   ```

3. **Test on multiple post types** to ensure it works broadly

4. **Keep existing strategies** for backward compatibility

### Handling New Facebook Layouts

1. **Monitor console logs** when extension fails
2. **Identify the breaking change** (new selector, different structure)
3. **Add fallback logic** - never remove old code, add alternatives
4. **Use defensive programming**:
   ```javascript
   // Instead of:
   const author = element.querySelector('h2 a').textContent;

   // Use:
   const authorEl = element.querySelector('h2 a');
   const author = authorEl ? authorEl.textContent : null;
   ```

### Performance Optimization

Current implementation is optimized for accuracy over speed. If performance becomes an issue:

1. **Limit DOM queries**: Cache frequently accessed elements
2. **Debounce context menu**: Add delay before showing menu
3. **Lazy load data**: Only extract what's needed initially
4. **Use IntersectionObserver**: For detecting posts in viewport

### Adding New Features

**Example**: Preview data before sending

1. **Add UI** in `popup.html`:
   ```html
   <div id="preview" style="display:none;">
     <h3>Preview</h3>
     <pre id="previewData"></pre>
   </div>
   ```

2. **Update message flow**:
   - Extract data but don't send immediately
   - Send data to popup for preview
   - Add "Confirm & Send" button

3. **Update permissions** if needed in `manifest.json`

---

## Design Guidelines

For UI changes, refer to `design-guideline.html` which includes:
- Color palette (purple theme: #a094e1)
- Typography (Poppins font)
- Button styles
- Notification styles
- Spacing/sizing standards

---

## Support & Resources

- **Chrome Extension Docs**: https://developer.chrome.com/docs/extensions/
- **Manifest V3 Migration**: https://developer.chrome.com/docs/extensions/mv3/intro/
- **Message Passing**: https://developer.chrome.com/docs/extensions/mv3/messaging/
- **Content Scripts**: https://developer.chrome.com/docs/extensions/mv3/content_scripts/

---

## Notes for AI Assistants

When working on this extension:

1. **Always test changes** by loading the extension in Chrome
2. **Check console logs** at each step to understand the flow
3. **Preserve existing detection strategies** - add new ones, don't replace
4. **Use async/await patterns** for message passing (see Issue 1)
5. **Facebook's DOM changes frequently** - build defensive, flexible selectors
6. **Keep PROGRESS.md updated** when adding features
7. **Refer to design-guideline.html** for any UI changes

### Common AI Mistakes to Avoid

❌ Don't replace entire functions - make surgical edits
❌ Don't remove fallback detection strategies
❌ Don't use callback-based chrome.storage - use await
❌ Don't forget `return true` in async message listeners
❌ Don't hardcode selectors - use multiple fallback strategies

✅ Do test with real Facebook posts
✅ Do check console logs before and after changes
✅ Do preserve backward compatibility
✅ Do document new patterns in this guide
✅ Do ask user to test if uncertain
