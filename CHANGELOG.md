# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-10-06

### Major Changes

- **Disabled duplicate detection** - ALL posts can now be added without restriction
- **Simplified workflow** - Single "Add Post" action (removed batch processing)
- **Enhanced text extraction** - Improved multi-paragraph caption capture
- **Auto-injection** - Content script automatically injected when needed

### Added

- Auto-injection mechanism with ping/pong health check
- Debug logging for engagement metrics extraction
- Enhanced "See More" clicking (3 attempts with 200ms delay)
- Comprehensive aria-label logging for troubleshooting
- UTF-8 encoding support for Thai language
- Fallback post detection when coordinates invalid

### Changed

- Duplicate detection completely disabled (user can add same post multiple times)
- Text extraction now captures 100+ character captions
- Improved engagement pattern matching (added "All reactions", "Comment", "Share")
- Extended coordinate validation with isFinite() checks
- Popup UI now shows proper Thai characters

### Fixed

- ✅ Extension loading with auto-injection
- ✅ "Could not establish connection" errors
- ✅ UTF-8 encoding (garbled Thai characters → proper display)
- ✅ Coordinate validation errors (NaN/Infinity crashes)
- ✅ Caption truncation issues
- ✅ Tab communication failures

### Known Issues

- ⚠️ Engagement metrics (likes, comments, shares) showing 0
  - Debug logging added to identify Facebook DOM structure
  - Investigating aria-label formats across different regions
  - Users can check Console (F12) for engagement extraction logs

## [1.1.0] - 2025-10-06

### Added

- Video extraction support for Facebook posts, reels, and external video links
- Comprehensive video metadata collection (URLs, types, counts)
- Enhanced JSON export format with video data for AI training datasets
- Duplicate detection system for video posts
- Modular CSS architecture with dedicated stylesheet files

### Changed

- Reorganized codebase structure with dedicated folders:
  - `src/css/` - All CSS stylesheets (popup.css, design-guideline.css)
  - `src/html/` - HTML templates and UI files
  - `src/js/` - JavaScript logic files
- Updated manifest.json to reference new file paths
- Improved popup UI to display video indicators and counts
- Enhanced export functionality with video metadata support

### Fixed

- Resolved syntax errors in popup.js after video feature implementation
- Fixed file path references throughout the codebase
- Corrected CSS loading issues after reorganization

## [1.0.0] - 2024-12-XX

### Features

- Initial release of Facebook Post Scraper Chrome extension
- Right-click context menu for post extraction
- Text selection mode for 100% accurate caption extraction
- Auto-detection in full post view
- "See more" auto-click functionality for full captions
- Photo modal detection with user guidance
- Multi-language support (English and Thai Facebook interfaces)
- Complete engagement stats extraction (likes, comments, shares)
- Clean, simple popup UI for webhook configuration
- n8n webhook integration for automation workflows

### Technical Features

- Chrome Extension Manifest V3 compatibility
- Chrome Storage API for data persistence
- Context menu API integration
- Content script injection on Facebook pages
- Robust DOM traversal for data extraction
- Error handling and user feedback systems

---

## Types of changes

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities

## Version History

- **1.1.0** - Video support, code reorganization, and enhanced export features (2025-10-06)
- **1.0.0** - Initial stable release with core Facebook post extraction functionality
