# Facebook Post Scraper

A Chrome extension for collecting Facebook posts with complete data extraction including text, images, videos, and engagement metrics. Perfect for AI training datasets, social media analysis, and content research.

## ✨ Features

- 🎯 **Single-Click Extraction** - Right-click "Add Post" to save any Facebook post
- � **Complete Text Capture** - Automatically expands "See More" to get full captions (supports multi-paragraph posts)
- �️ **Media Collection** - Extracts all images and videos with URLs
- 📊 **Engagement Metrics** - Captures likes, comments, and shares (with debugging support)
- 💾 **Local Storage** - Saves up to 500 posts locally in Chrome storage
- 📥 **Export Capabilities** - Export to JSON or TXT format with metadata
- 🌐 **Multi-language** - Supports English and Thai Facebook interfaces
- 🔄 **No Duplicates** - Currently disabled - adds ALL posts without duplicate checking
- 🎨 **UTF-8 Support** - Proper Thai language encoding

## 🚀 Installation

### From Source

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension folder
6. The extension is now ready to use!

## 📖 Usage

### Adding Posts

1. Navigate to any Facebook page or feed
2. **Right-click on a post** (anywhere on the post)
3. Click **"➕ Add Post"** from the context menu
4. Post data is automatically extracted and saved!

**Note:** Extension will auto-inject if needed - just reload the page if you encounter any issues.

### Viewing & Exporting Data

1. Click the extension icon in Chrome toolbar
2. View all saved posts with preview
3. Click **"📥 Export as JSON"** to download dataset
4. Or **"📄 Export as TXT"** for text-only format

### Data Structure

Each post includes:
- `id` - Unique post identifier
- `text` - Complete caption/post text
- `author` - Author name and profile URL
- `url` - Link to the post
- `timestamp` - When the post was extracted
- `images[]` - Array of image URLs with dimensions
- `videos[]` - Array of video URLs
- `post_type` - Type classification (text, image, video, etc.)
- `engagement` - Likes, comments, shares counts
- `image_count`, `video_count` - Media counts

## 📋 Data Format

### JSON Export Example

```json
{
  "dataset_info": {
    "name": "Facebook Posts Dataset",
    "description": "Facebook posts dataset with text, images, and videos for AI training",
    "version": "1.0.0",
    "created_at": "2025-10-06T13:08:27.700Z",
    "total_posts": 9,
    "source": "Facebook Post Scraper Extension"
  },
  "posts": [
    {
      "id": "post_1",
      "text": "Complete post caption...",
      "author": "Author Name",
      "author_profile_url": "https://www.facebook.com/username",
      "url": "https://www.facebook.com/...",
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
  ]
}
```

## 🔧 Troubleshooting

### Extension Not Working
1. **Reload the extension**: Go to `chrome://extensions` → Click reload (🔄)
2. **Reload Facebook tab**: Press `Ctrl+R` or `F5` on the Facebook page
3. **Check Console**: Press `F12` to see error messages

### "Could not establish connection" Error
- The extension auto-injects content script if needed
- If error persists, try:
  1. Close and reopen Facebook tab
  2. Remove and reinstall extension
  3. Clear browser cache

### Engagement Showing 0
- **Current Known Issue**: Engagement extraction needs debugging
- Enable Console (F12) and look for:
  ```
  🔍 Found X aria-labels in post
  ✅ Likes: XX (from aria-label: "...")
  ```
- Please report the aria-label formats you see

### Caption Not Complete
- Make sure to scroll to the post before right-clicking
- Extension auto-clicks "See More" up to 3 times
- For very long posts, try scrolling down first

## 🛠️ Development

### Project Structure

```
DSP Post Collector/
├── manifest.json          # Extension configuration
├── src/
│   ├── js/
│   │   ├── background.js  # Background service worker
│   │   ├── content.js     # Main extraction logic
│   │   └── popup.js       # Popup UI logic
│   └── html/
│       └── popup.html     # Popup interface
├── image/icon/           # Extension icons
└── README.md
```

### Key Technologies
- **Manifest V3** - Latest Chrome extension format
- **Content Scripts** - Injected into Facebook pages
- **Chrome Storage API** - Local data persistence
- **Async/Await** - Modern JavaScript patterns

## 📝 Known Issues

1. **Engagement Metrics** - Currently showing 0 (debugging in progress)
   - Need to identify correct Facebook DOM structure
   - Debug logging added to help identify patterns

2. **Duplicate Detection** - Currently disabled
   - All posts can be added without restriction
   - May result in duplicate entries if same post added multiple times

## 🚀 Roadmap

- [ ] Fix engagement metrics extraction
- [ ] Add filtering options in popup
- [ ] Implement search functionality
- [ ] Add batch export capabilities
- [ ] Support for Facebook Stories
- [ ] Comment thread extraction
- [ ] Re-enable smart duplicate detection

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## ⚠️ Disclaimer

This tool is for personal use and research purposes only. Please respect Facebook's Terms of Service and privacy policies. Do not use this tool to scrape private content or violate anyone's privacy.

## 📧 Support

If you encounter any issues or have questions:
1. Check the Console (F12) for error messages
2. Open an issue on GitHub
3. Include Console logs and screenshots if possible

---

**Version**: 1.0.0  
**Last Updated**: October 6, 2025

**Solution:**
- Make sure you've clicked into the full post (not viewing from feed)
- If in photo viewer, close it first or click "See post"
- Try using text selection mode instead

### Popup Shows Errors

**Solution:**
- Reload the extension: Go to `chrome://extensions` and click the reload icon
- Clear the errors by clicking "Clear all" in the Errors page

### Caption Contains Comments Instead of Post Text

**Solution:**
- Use **text selection mode** - highlight the actual caption text before right-clicking
- Make sure you're in full post view (not photo modal)

### Extension Not Appearing

**Solution:**
- Check that you're on `facebook.com` (extension only works on Facebook)
- Reload the Facebook page
- Check extension is enabled in `chrome://extensions`

## Development

### Project Structure

The codebase is organized into logical folders for better maintainability:

- **`src/css/`** - All CSS stylesheets (popup.css, design-guideline.css)
- **`src/html/`** - HTML templates and UI files
- **`src/js/`** - JavaScript logic files (background.js, content.js, popup.js)
- **`docs/`** - Documentation and development guides

### File Structure

```
dsp-scraper/
├── manifest.json          # Extension configuration
├── src/
│   ├── css/
│   │   ├── popup.css              # Popup UI styles
│   │   └── design-guideline.css   # Design guideline styles
│   ├── html/
│   │   ├── popup.html             # Extension popup UI
│   │   └── design-guideline.html  # UI/UX specifications
│   └── js/
│       ├── background.js          # Service worker for context menu
│       ├── content.js             # Main extraction logic
│       └── popup.js               # Popup logic
├── DEVELOPMENT.md        # Detailed development guide
├── PROGRESS.md           # Feature tracking
├── ERROR_LOG.md          # Error tracking and solutions
└── icons/                # Extension icons
```

### For Developers

See [DEVELOPMENT.md](DEVELOPMENT.md) for:
- Architecture overview
- Technical implementation details
- Debugging guide
- Adding new features
- Common issues and solutions

## Changelog

### Latest Updates (2025)

- 🎥 **Video Support** - Extract Facebook videos, reels, and external video links
- 📁 **Code Organization** - Reorganized codebase with dedicated CSS, HTML, and JS folders
- 📊 **Enhanced Export** - Improved JSON export with video metadata for AI training
- 🔄 **Duplicate Prevention** - Advanced duplicate detection for video posts
- 🎨 **Modular CSS** - Separated inline styles into dedicated CSS files

### Version 1.0

- ✅ Text selection for 100% accurate caption extraction
- ✅ Auto-detection in full post view
- ✅ "See more" auto-click for full captions
- ✅ Photo modal detection with helpful guidance
- ✅ Multi-language support (English/Thai)
- ✅ Complete engagement stats extraction
- ✅ Clean, simple popup UI

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - See [LICENSE](LICENSE) file for details

## Support

If you encounter any issues or have questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review [ERROR_LOG.md](ERROR_LOG.md) for known issues and solutions
3. Open an issue on GitHub

## Acknowledgments

Built with ❤️ for automating Facebook data collection workflows.
