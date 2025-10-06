# Release Notes

## [v1.2.0] - Facebook Post Scraper - October 6, 2025

### 🎉 Major Update: Unlimited Post Collection

This release focuses on simplifying the workflow and removing barriers to data collection. All posts can now be added without duplicate detection, making it perfect for building comprehensive AI training datasets.

---

### ✨ What's New

#### 🚀 Core Features
- **Single-Click Extraction** - Right-click "Add Post" to instantly save any Facebook post
- **No Duplicate Blocking** - Add as many posts as you want, including the same post multiple times
- **Auto-Injection** - Extension automatically loads content script when needed
- **Enhanced Text Capture** - Improved multi-paragraph caption extraction
- **Smart "See More" Expansion** - Automatically clicks up to 3 times to reveal full text

#### 🌐 Language & Encoding
- **Full UTF-8 Support** - Proper Thai character display (no more garbled text)
- **Multi-language Interface** - Works with English and Thai Facebook

#### 💾 Data Management
- **Local Storage** - Save up to 500 posts in browser
- **JSON Export** - Download complete dataset with metadata
- **TXT Export** - Text-only format for quick review
- **Rich Metadata** - Author, timestamp, engagement, media URLs

---

### 🔧 Technical Improvements

#### Auto-Injection System
```javascript
// Extension now auto-detects and injects content script
- Ping/pong health check mechanism
- Automatic script injection if missing
- Enhanced error logging
```

#### Enhanced Text Extraction
- Multi-strategy DOM traversal
- Deduplication of text blocks
- Position-based sorting for reading order
- Support for 100+ character captions

#### Improved Reliability
- Coordinate validation with `isFinite()` checks
- Fallback post detection when coordinates invalid
- Connection error handling with retry logic

---

### 📊 Data Format

Each exported post includes:

```json
{
  "id": "post_1",
  "text": "Complete caption with full text...",
  "author": "Author Name",
  "author_profile_url": "https://www.facebook.com/username",
  "url": "https://www.facebook.com/post/...",
  "timestamp": "2025-10-06T13:03:07.073Z",
  "images": [
    {
      "url": "https://...",
      "alt": null,
      "width": 590,
      "height": 331
    }
  ],
  "videos": [],
  "post_type": "image",
  "engagement": {
    "likes": 0,
    "comments": 0,
    "shares": 0
  },
  "extracted_at": "2025-10-06T13:08:27.700Z",
  "image_count": 1,
  "video_count": 0
}
```

---

### 🐛 Bug Fixes

#### Fixed Issues
- ✅ **Extension Loading** - Auto-injection prevents "Could not establish connection" errors
- ✅ **UTF-8 Encoding** - Thai characters now display correctly (fixed garbled text)
- ✅ **Coordinate Validation** - No more NaN/Infinity crashes
- ✅ **Caption Truncation** - Full text now captured properly
- ✅ **Tab Communication** - Improved message passing between background and content scripts

---

### ⚠️ Known Issues

#### Engagement Metrics Not Working
Currently, likes/comments/shares show as `0` for all posts.

**Status**: Under investigation  
**Workaround**: Debug logging added - check Console (F12) to see what aria-labels are detected

**What we're doing:**
- Added comprehensive debug logging for aria-labels
- Investigating Facebook's DOM structure variations
- Testing pattern matching improvements

**How to help:**
If you see engagement metrics, please:
1. Open Console (F12)
2. Look for: `🔍 Found X aria-labels in post`
3. Share the aria-label formats you see

---

### 📥 Installation

#### Fresh Install
1. Download the extension files
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extension folder
6. Done! 🎉

#### Updating from v1.1.0
1. Go to `chrome://extensions`
2. Click reload (🔄) on "Facebook Post Scraper"
3. Refresh any open Facebook tabs
4. Changes will take effect immediately

---

### 🎯 Use Cases

This extension is perfect for:

- 📚 **AI Training Datasets** - Collect diverse Facebook content
- 📊 **Social Media Research** - Analyze post patterns and engagement
- 🔍 **Content Analysis** - Study viral posts and trends
- 💡 **Marketing Insights** - Learn from successful posts
- 🎓 **Academic Research** - Gather data for studies

---

### 🚀 Quick Start

1. **Navigate to Facebook** - Any page or feed
2. **Find a post you want** - Scroll to it
3. **Right-click on the post** - Anywhere on the post
4. **Click "➕ Add Post"** - Data is instantly saved
5. **View your collection** - Click extension icon
6. **Export when ready** - Click "📥 Export as JSON"

---

### 📝 What Changed from v1.1.0

#### Removed
- ❌ Duplicate detection (was blocking valid posts)
- ❌ Batch processing options (simplified to single-click)

#### Changed
- 🔄 Simplified workflow to single "Add Post" action
- 🔄 Text extraction now handles longer captions
- 🔄 Improved engagement pattern matching (still debugging)

#### Added
- ✅ Auto-injection mechanism
- ✅ Debug logging for troubleshooting
- ✅ UTF-8 encoding support
- ✅ Enhanced error handling

---

### 🔮 Coming Soon (v1.3.0)

**Planned Features:**
- [ ] Fix engagement metrics extraction
- [ ] Add post filtering in popup
- [ ] Search functionality
- [ ] Batch export improvements
- [ ] Optional duplicate detection (toggle)
- [ ] Facebook Stories support
- [ ] Comment thread extraction

---

### 📚 Documentation

- **README.md** - Complete usage guide
- **CHANGELOG.md** - Detailed version history
- **ERROR_LOG.md** - Troubleshooting guide
- **DEVELOPMENT.md** - Developer documentation

---

### 🤝 Contributing

Found a bug? Have a feature request?

1. Check existing issues on GitHub
2. Open a new issue with details
3. Include Console logs (F12) if reporting bugs
4. Screenshots are always helpful!

---

### ⚠️ Important Notes

**Privacy & Terms of Service:**
- This tool is for **personal use and research** only
- Respect Facebook's Terms of Service
- Do not scrape private content
- Respect user privacy
- Use responsibly

**Data Storage:**
- All data stored **locally** in your browser
- Maximum 500 posts
- No data sent to external servers
- You control all exports

---

### 📦 Technical Specifications

**Requirements:**
- Google Chrome (latest version)
- Developer mode enabled
- Active Facebook session

**File Size:** ~50KB  
**Storage:** ~5MB max (500 posts)  
**Permissions Required:**
- `activeTab` - Access current tab
- `scripting` - Inject scripts
- `storage` - Save data locally
- `contextMenus` - Right-click menu
- `downloads` - Export files

---

### 🙏 Acknowledgments

- Built with **Claude Code** assistance
- Inspired by the need for better Facebook data collection tools
- Thanks to all beta testers for feedback!

---

### 📧 Support

**Need help?**
1. Check the [README.md](README.md) for usage guide
2. Review [CHANGELOG.md](CHANGELOG.md) for version history
3. Open an issue on GitHub
4. Include Console logs and screenshots

---

### 📄 License

MIT License - Free to use, modify, and distribute

---

**Version:** 1.2.0  
**Release Date:** October 6, 2025  
**Code Name:** "Unlimited Collection"

**Download:** [GitHub Releases](https://github.com/JonusNattapong/facebook-post-scraper/releases/tag/v1.2.0)

---

## Previous Releases

### [v1.1.0] - October 6, 2025
- Added video extraction support
- Reorganized codebase structure
- Enhanced export format

### [v1.0.0] - December 2024
- Initial release
- Basic post extraction
- Local storage and export functionality
