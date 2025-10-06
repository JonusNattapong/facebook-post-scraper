# Facebook Post Scraper - Development Progress

## Project Goal
Create a Chrome extension that extracts Facebook post data (caption, media, likes, shares, comments, author) and sends it to an n8n workflow via webhook.

## Current Status: ✅ Enhanced & Ready

### ✅ Completed Features
- [x] Chrome extension manifest setup with storage permission
- [x] Popup UI for webhook configuration
- [x] **In-page buttons**: "Send to n8n" button injected next to Share button on every post
- [x] **Auto-detection**: Works on feeds, profiles, groups - buttons appear automatically
- [x] **Infinite scroll support**: New posts get buttons as you scroll
- [x] Enhanced post data extraction:
  - Author name & profile URL
  - Post caption/text (improved selectors)
  - Images with metadata (width, height)
  - Videos with poster images
  - Likes/reactions count (normalized: 1K → 1000)
  - Comments count (normalized)
  - Shares count (normalized)
  - Post type detection (text/image/video)
  - Thai language support (แชร์, ความคิดเห็น, etc.)
- [x] Webhook integration to send data to n8n
- [x] Storage for webhook URL
- [x] **Visual feedback**: Loading states (⏳ Sending → ✅ Sent! or ❌ Failed)
- [x] Enhanced error handling with debug info
- [x] Number normalization (K/M format → actual numbers)
- [x] Duplicate image filtering

### 🔄 Potential Future Improvements
- [ ] Support for shared/reposted content
- [ ] Extract comment text (not just count)
- [ ] Handle carousel/album posts better
- [ ] Add data preview before sending

### 📋 How to Use
1. Load the extension in Chrome (chrome://extensions → Developer mode → Load unpacked)
2. Open the extension popup and enter your n8n webhook URL
3. Click "Save Webhook URL"
4. Browse Facebook - you'll see a "📤 Send to n8n" button next to the Share button on every post
5. Click the button on any post to send its data to your webhook
6. Watch for visual feedback (⏳ Sending → ✅ Sent! or ❌ Failed)

### 📊 Data Format Sent to n8n
```json
{
  "url": "https://facebook.com/...",
  "timestamp": "2025-10-02T...",
  "author": "Page/Person Name",
  "authorProfileUrl": "https://facebook.com/profile",
  "caption": "Post text content...",
  "images": [{"url": "...", "alt": "...", "width": 1080, "height": 1080}],
  "videos": [{"url": "...", "poster": "..."}],
  "likes": "1500",
  "comments": "230",
  "shares": "45",
  "postType": "image|video|text"
}
```

### 🧪 Testing Checklist
- [ ] Text-only posts
- [ ] Posts with single image
- [ ] Posts with multiple images
- [ ] Posts with videos
- [ ] Shared posts
- [ ] Posts with different engagement levels (0 likes vs 1K+ likes)

### 📝 Notes
- Extension works on facebook.com pages only
- Requires manual trigger via popup button
- Data sent as JSON to configured webhook URL
