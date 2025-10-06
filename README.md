# Facebook Post Scraper

A Chrome extension that extracts Facebook post data and sends it to an n8n webhook for automation workflows.

## Features

- 📤 **Right-click context menu** - Extract post data with a simple right-click
- ✏️ **Text selection mode** - Highlight caption text for 100% accurate extraction
- 🔄 **Auto-expand captions** - Automatically clicks "See more" to get full text
- 📊 **Complete data extraction** - Captures author, caption, images, videos, and engagement stats
- 🌐 **Multi-language support** - Works with English and Thai Facebook interfaces
- ⚡ **n8n integration** - Sends data directly to your n8n webhook

## Installation

### From Source

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `dsp-scraper` folder
6. The extension is now installed!

## Configuration

### Set Up Your Webhook URL

1. Click the extension icon in Chrome toolbar
2. Enter your n8n webhook URL in the input field
3. Click "💾 Save Webhook URL"

**Important:** Make sure your n8n webhook is configured to accept POST requests.

## Usage

### Method 1: Text Selection (Recommended for 100% Accuracy)

1. Go to any Facebook post
2. **Highlight/select the caption text** you want to extract
3. Right-click on the selected text
4. Click "📤 Send to n8n"
5. Data is sent to your webhook!

### Method 2: Auto-Detection

1. **Click into the full post** (not from feed view)
2. Right-click anywhere on the post
3. Click "📤 Send to n8n"
4. Extension will auto-detect and extract the data

### Important Notes

- ✅ **Works best in full post view** - Click on a post to open it fully before extracting
- ✅ **Text selection is most accurate** - Highlight the caption for guaranteed accuracy
- ❌ **Photo viewer not supported** - Close the photo lightbox and click "See post" first

## Data Extracted

The extension captures the following data:

```json
{
  "url": "Post URL",
  "timestamp": "ISO timestamp",
  "author": "Author name",
  "authorProfileUrl": "Author profile URL",
  "caption": "Post caption/text",
  "images": [
    {
      "url": "Image URL",
      "alt": "Alt text",
      "width": 1200,
      "height": 800
    }
  ],
  "videos": [
    {
      "url": "Video URL",
      "poster": "Poster image URL"
    }
  ],
  "likes": "1500",
  "comments": "42",
  "shares": "286",
  "postType": "image|video|text"
}
```

## Troubleshooting

### "Could not find post" Error

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
