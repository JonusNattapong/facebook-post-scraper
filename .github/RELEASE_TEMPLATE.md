# 🎉 Facebook Post Scraper v1.2.0 - "Unlimited Collection"

A major update focused on simplifying workflow and removing barriers to data collection!

---

## ✨ What's New

### 🚀 Core Features
- **No Duplicate Detection** - Add unlimited posts without restrictions
- **Single-Click Extraction** - Right-click "Add Post" to save instantly
- **Auto-Injection** - Content script automatically loads when needed
- **Enhanced Text Capture** - Multi-paragraph captions fully extracted
- **Smart Expansion** - Auto-clicks "See More" up to 3 times

### 🌐 Language & Encoding
- **Full UTF-8 Support** - Thai characters display properly (no garbled text)
- **Multi-language** - Works with English and Thai Facebook

### 💾 Data Management
- **Local Storage** - Up to 500 posts saved in browser
- **JSON Export** - Complete dataset with metadata
- **TXT Export** - Simple text format
- **Rich Data** - Author, timestamp, engagement, media URLs

---

## 🐛 Bug Fixes

- ✅ Fixed UTF-8 encoding (Thai characters now display correctly)
- ✅ Fixed "Could not establish connection" errors
- ✅ Fixed coordinate validation crashes (NaN/Infinity)
- ✅ Fixed caption truncation issues
- ✅ Fixed tab communication failures

---

## ⚠️ Known Issues

### Engagement Metrics Showing 0
Currently investigating why likes/comments/shares show as `0`.

**Status**: Debug logging added  
**Help Needed**: If you see engagement data, check Console (F12) and report aria-label formats

---

## 📥 Installation

### Fresh Install
1. Download `facebook-post-scraper-v1.2.0.zip` below
2. Extract the files
3. Go to `chrome://extensions`
4. Enable "Developer mode"
5. Click "Load unpacked"
6. Select the extracted folder

### Update from v1.1.0
1. Go to `chrome://extensions`
2. Click reload (🔄) on "Facebook Post Scraper"
3. Refresh Facebook tabs

---

## 🚀 Quick Start

1. Navigate to Facebook
2. Right-click on any post
3. Click "➕ Add Post"
4. Click extension icon to view
5. Export as JSON when ready

---

## 📊 Data Format

```json
{
  "id": "post_1",
  "text": "Complete caption...",
  "author": "Author Name",
  "url": "https://facebook.com/...",
  "timestamp": "2025-10-06T13:03:07.073Z",
  "images": [...],
  "engagement": {
    "likes": 0,
    "comments": 0,
    "shares": 0
  }
}
```

---

## 🎯 Use Cases

Perfect for:
- 📚 AI Training Datasets
- 📊 Social Media Research
- 🔍 Content Analysis
- 💡 Marketing Insights
- 🎓 Academic Studies

---

## 📚 Documentation

- [README.md](https://github.com/JonusNattapong/facebook-post-scraper/blob/master/README.md) - Complete guide
- [CHANGELOG.md](https://github.com/JonusNattapong/facebook-post-scraper/blob/master/CHANGELOG.md) - Version history
- [RELEASES.md](https://github.com/JonusNattapong/facebook-post-scraper/blob/master/RELEASES.md) - Detailed release notes

---

## 🔮 Coming in v1.3.0

- [ ] Fix engagement metrics
- [ ] Post filtering
- [ ] Search functionality
- [ ] Optional duplicate detection
- [ ] Facebook Stories support

---

## ⚠️ Important

**Use Responsibly:**
- For personal/research use only
- Respect Facebook's Terms of Service
- Don't scrape private content
- Respect user privacy

**Privacy:**
- All data stored locally in browser
- No external servers
- You control all data

---

## 📦 What's Changed

**Full Changelog**: https://github.com/JonusNattapong/facebook-post-scraper/compare/v1.1.0...v1.2.0

---

**Download below** ⬇️
