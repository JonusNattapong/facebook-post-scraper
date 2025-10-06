// Content script that runs on Facebook pages
console.log('🚀 Facebook Post Scraper extension loaded');

// Extract data from a specific post element
async function extractPostData(postElement) {
  try {
    const data = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      author: null,
      authorProfileUrl: null,
      caption: null,
      images: [],
      videos: [],
      likes: null,
      comments: null,
      shares: null,
      postType: null
    };

    // Extract author name - search within this post only
    console.log('🔍 Starting author extraction...');
    const labelledBy = postElement.getAttribute('aria-labelledby');
    if (labelledBy) {
      console.log('Found aria-labelledby:', labelledBy);
      const labelIds = labelledBy.split(' ');

      for (const id of labelIds) {
        const labelEl = document.getElementById(id);
        if (labelEl) {
          const text = labelEl.textContent.trim();
          console.log(`  Label element text: "${text}"`);

          // Check if this looks like an author name
          if (text && text.length > 0 && text.length < 150) {
            // Try to find a link near this element
            const link = labelEl.querySelector('a') || labelEl.closest('a');
            if (link && link.href) {
              data.author = text;
              data.authorProfileUrl = link.href.split('?')[0];
              console.log('✅ Found author via aria-label:', text);
              break;
            }
          }
        }
      }
    }

    // Strategy 2: Look for all links in the first part of the post (likely the header)
    if (!data.author) {
      console.log('Trying Strategy 2: scanning all links...');
      const allLinks = postElement.querySelectorAll('a[href*="facebook.com"]');
      console.log(`Found ${allLinks.length} Facebook links`);

      for (const link of allLinks) {
        const text = link.textContent.trim();

        // Skip empty links, very long text, and navigation items
        if (!text ||
            text.length === 0 ||
            text.length > 150 ||
            text.includes('Like') ||
            text.includes('ถูกใจ') ||
            text.includes('Comment') ||
            text.includes('ความคิดเห็น') ||
            text.includes('Share') ||
            text.includes('แชร์') ||
            text.includes('See more') ||
            text.includes('ดูเพิ่มเติม') ||
            link.href.includes('/photo') ||
            link.href.includes('/video')) {
          continue;
        }

        console.log(`  Potential author link: "${text}" -> ${link.href}`);

        // Check if this link is near the top of the post (author names are usually at the top)
        const linkPosition = link.getBoundingClientRect().top;
        const postPosition = postElement.getBoundingClientRect().top;
        const relativePosition = linkPosition - postPosition;

        if (relativePosition < 150) { // Within first 150px of the post
          data.author = text;
          data.authorProfileUrl = link.href.split('?')[0];
          console.log('✅ Found author via link scan:', text);
          break;
        }
      }
    }

    // Clean up author name - remove UI elements
    if (data.author) {
      data.author = data.author
        .replace(/\s*·\s*Follow$/i, '')
        .replace(/\s*·\s*ติดตาม$/i, '')
        .replace(/\s*\·\s*Follow$/i, '')
        .replace(/\s*\·\s*ติดตาม$/i, '')
        .replace(/\s+·\s+/g, ' : ')  // Replace middle dots with colon
        .trim();
    }

    console.log(`Final author result: "${data.author}"`);
    console.log(`Final profile URL: "${data.authorProfileUrl}"`);

    // Extract caption/text - HYBRID approach: selection first, then auto-detect
    console.log('📝 Extracting caption...');

    let captionText = null;

    // PRIORITY 0: Check if user has selected/highlighted text
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText && selectedText.length > 0) {
      // Verify the selection is within the post (not from outside)
      const range = selection.getRangeAt(0);
      const selectionContainer = range.commonAncestorContainer;
      const selectionElement = selectionContainer.nodeType === Node.TEXT_NODE
        ? selectionContainer.parentElement
        : selectionContainer;

      if (postElement.contains(selectionElement)) {
        captionText = selectedText;
        console.log('✅ Using user-selected text as caption (100% accurate)');
        console.log(`   Selected text (${captionText.length} chars): ${captionText.substring(0, 100)}${captionText.length > 100 ? '...' : ''}`);
      } else {
        console.log('⚠️ Selected text is outside the post, ignoring...');
      }
    } else {
      console.log('ℹ️ No text selected, will auto-detect caption...');
    }

    // If no valid selection, proceed with auto-detection
    if (!captionText) {
      // PHASE 1: Detect view context (feed vs full post view)
      const isFullPostView = window.location.href.includes('/posts/') ||
                             window.location.href.includes('/permalink/') ||
                             window.location.href.includes('/photo/') ||
                             document.querySelectorAll('[role="article"]').length === 1;

      if (isFullPostView) {
        console.log('📍 Detected: Full post view (cleaner extraction possible)');
      } else {
        console.log('📍 Detected: Feed view (will try to expand text)');
      }

      // PHASE 2: Auto-click "See More" button if in feed view
      if (!isFullPostView) {
        const seeMoreButtons = Array.from(postElement.querySelectorAll('div[role="button"]'));
        const seeMoreButton = seeMoreButtons.find(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          return text.includes('see more') || text.includes('ดูเพิ่มเติม');
        });

        if (seeMoreButton) {
          console.log('🔘 Found "See more" button, clicking to expand...');
          seeMoreButton.click();
          // Wait for expansion (synchronous is okay for small delay)
          const startTime = Date.now();
          while (Date.now() - startTime < 150) { /* wait 150ms */ }
          console.log('✅ Text should be expanded now');
        } else {
          console.log('ℹ️ No "See more" button found');
        }
      }

      // Priority 1: Facebook's specific caption data attributes
      const specificSelectors = [
        '[data-ad-comet-preview="message"]',
        '[data-ad-preview="message"]',
        '[data-ad-rendering-role="body"]',
        'div[data-ad-rendering-role="message"]'
      ];

      for (const selector of specificSelectors) {
        const element = postElement.querySelector(selector);
        if (element) {
          captionText = element.textContent?.trim();
          console.log(`✅ Found caption via selector: ${selector}`);
          break;
        }
      }

      // Priority 2: Look for text containers with specific characteristics near top of post
      if (!captionText) {
        console.log('⚠️ Specific selectors failed, trying structural approach...');

        // Find elements with dir="auto" that contain substantial text and are positioned early in the post
        const textElements = postElement.querySelectorAll('div[dir="auto"]');

        for (const element of textElements) {
          const text = element.textContent?.trim() || '';

          // Adjust minimum length based on view context
          const minLength = isFullPostView ? 10 : 20; // More lenient in full view
          if (text.length < minLength) continue;

          // Skip if it's clearly UI text
          if (text.match(/^(Like|Comment|Share|ถูกใจ|ความคิดเห็น|แชร์)\s*$/i)) continue;
          if (text.match(/^\d+\s*(likes?|reactions?|comments?|shares?|ถูกใจ|ความคิดเห็น|แชร์)/i)) continue;
          if (text.match(/^(See translation|Write a comment|View more comments)/i)) continue;

          // Check if this element is NOT inside the comments section
          const isInComments = element.closest('[aria-label*="comment" i]') ||
                              element.closest('[aria-label*="ความคิดเห็น" i]');
          if (isInComments) continue;

          // Adjust nesting threshold based on view context
          const childDivs = element.querySelectorAll('div');
          const maxNesting = isFullPostView ? 8 : 5; // More lenient in full view (cleaner DOM)
          const hasMinimalNesting = childDivs.length < maxNesting;

          if (hasMinimalNesting && text.length >= minLength) {
            captionText = text;
            console.log(`✅ Found caption via structural approach (view: ${isFullPostView ? 'full' : 'feed'})`);
            break;
          }
        }
      }

      // Priority 3: Fallback to finding first substantial text block
      if (!captionText) {
        console.log('⚠️ Structural approach failed, using fallback...');

        const allTextElements = postElement.querySelectorAll('[dir="auto"]');
        for (const element of allTextElements) {
          const text = element.textContent?.trim() || '';
          if (text.length > 30 &&
              !text.match(/^(Like|Comment|Share|ถูกใจ|ความคิดเห็น|แชร์)/i) &&
              !text.match(/^\d+\s*(likes?|reactions?|comments?|shares?)/i)) {
            captionText = text;
            console.log(`✅ Found caption via fallback`);
            break;
          }
        }
      }
    }

    // Clean up the caption text
    if (captionText) {
      // Remove "See more" suffixes
      captionText = captionText.replace(/…\s*(See more|ดูเพิ่มเติม)/gi, '');
      captionText = captionText.replace(/\.\.\.\s*(See more|ดูเพิ่มเติม)/gi, '');
      captionText = captionText.replace(/\s*(See more|ดูเพิ่มเติม)\s*$/gi, '');
      captionText = captionText.replace(/…+$/g, '');
      captionText = captionText.replace(/\.\.\.+$/g, '');

      // Remove common UI text patterns
      captionText = captionText.replace(/^(Like|Comment|Share|ถูกใจ|ความคิดเห็น|แชร์)\s*/gi, '');
      captionText = captionText.trim();

      if (captionText.length > 0) {
        data.caption = captionText;
        console.log(`✅ Extracted caption (${data.caption.length} chars)`);
        console.log(`   Preview: ${data.caption.substring(0, 150)}${data.caption.length > 150 ? '...' : ''}`);
      } else {
        console.log('⚠️ Caption was empty after cleanup');
      }
    } else {
      console.log('⚠️ No caption found');
    }

    // Extract images from this post only
    const images = postElement.querySelectorAll('img[src*="scontent"], img[src*="fbcdn"]');
    const seenUrls = new Set();

    console.log(`🖼️ Found ${images.length} potential images in post`);

    images.forEach(img => {
      if (img.src &&
          !img.src.includes('emoji') &&
          !img.src.includes('static') &&
          !img.src.includes('safe_image') &&
          img.width > 100 &&
          img.height > 100 &&
          !seenUrls.has(img.src)) {

        seenUrls.add(img.src);
        data.images.push({
          url: img.src,
          alt: img.alt || null,
          width: img.width,
          height: img.height
        });
        console.log(`✅ Added image: ${img.src} (${img.width}x${img.height})`);
      }
    });

    console.log(`📊 Total images extracted: ${data.images.length}`);

    // Extract videos from this post only - Enhanced detection
    console.log('🎥 Extracting videos...');

    // Method 1: Direct video elements
    const videoElements = postElement.querySelectorAll('video');
    videoElements.forEach(video => {
      if (video.src) {
        data.videos.push({
          url: video.src,
          poster: video.poster || null,
          type: 'direct',
          duration: video.duration || null
        });
        console.log(`✅ Found direct video: ${video.src}`);
      }
    });

    // Method 2: Video links and thumbnails
    const videoLinks = postElement.querySelectorAll('a[href*="/video"], a[href*="/watch"], a[href*="youtube.com"], a[href*="youtu.be"], a[href*="vimeo.com"], a[href*="tiktok.com"]');
    videoLinks.forEach(link => {
      const href = link.href;
      if (href && !href.includes('#') && !href.includes('?comment_id=')) {
        // Check if this link has a video thumbnail
        const img = link.querySelector('img');
        let thumbnail = null;
        if (img && img.src) {
          thumbnail = img.src;
        }

        // Determine video type
        let videoType = 'link';
        if (href.includes('youtube.com') || href.includes('youtu.be')) {
          videoType = 'youtube';
        } else if (href.includes('vimeo.com')) {
          videoType = 'vimeo';
        } else if (href.includes('tiktok.com')) {
          videoType = 'tiktok';
        } else if (href.includes('/video')) {
          videoType = 'facebook';
        }

        // Avoid duplicates
        const isDuplicate = data.videos.some(v => v.url === href);
        if (!isDuplicate) {
          data.videos.push({
            url: href,
            poster: thumbnail,
            type: videoType,
            duration: null
          });
          console.log(`✅ Found ${videoType} video: ${href}`);
        }
      }
    });

    // Method 3: Video data attributes (Facebook's internal video data)
    const videoContainers = postElement.querySelectorAll('[data-store*="video"], [data-video-id], [data-sigil*="video"]');
    videoContainers.forEach(container => {
      const dataStore = container.getAttribute('data-store');
      const videoId = container.getAttribute('data-video-id');

      if (dataStore) {
        try {
          const storeData = JSON.parse(dataStore);
          if (storeData.videoID || storeData.video_id) {
            const videoUrl = `https://www.facebook.com/video/${storeData.videoID || storeData.video_id}`;
            const isDuplicate = data.videos.some(v => v.url === videoUrl);
            if (!isDuplicate) {
              data.videos.push({
                url: videoUrl,
                poster: storeData.thumbnailImage || null,
                type: 'facebook-data',
                duration: storeData.duration || null
              });
              console.log(`✅ Found Facebook video via data-store: ${videoUrl}`);
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      } else if (videoId) {
        const videoUrl = `https://www.facebook.com/video/${videoId}`;
        const isDuplicate = data.videos.some(v => v.url === videoUrl);
        if (!isDuplicate) {
          data.videos.push({
            url: videoUrl,
            poster: null,
            type: 'facebook-id',
            duration: null
          });
          console.log(`✅ Found Facebook video via ID: ${videoUrl}`);
        }
      }
    });

    console.log(`📊 Total videos extracted: ${data.videos.length}`);

    // Determine post type - Enhanced with video types
    if (data.videos.length > 0) {
      // Determine specific video type
      const hasDirectVideo = data.videos.some(v => v.type === 'direct');
      const hasFacebookVideo = data.videos.some(v => v.type === 'facebook' || v.type === 'facebook-data' || v.type === 'facebook-id');
      const hasExternalVideo = data.videos.some(v => ['youtube', 'vimeo', 'tiktok'].includes(v.type));

      if (hasDirectVideo) {
        data.postType = 'video';
      } else if (hasFacebookVideo) {
        data.postType = 'facebook-video';
      } else if (hasExternalVideo) {
        data.postType = 'external-video';
      } else {
        data.postType = 'video-link';
      }
    } else if (data.images.length > 0) {
      data.postType = 'image';
    } else if (data.caption) {
      data.postType = 'text';
    }

    // Extract engagement stats from this post only
    // Strategy: Get text from the entire post, but we'll use smart pattern matching
    // to avoid timestamp issues (already handled by excluding lowercase 'm')
    const postText = postElement.innerText;

    console.log('📊 Extracting engagement stats...');
    console.log(`   Post text length: ${postText.length} chars`);

    // Function to normalize numbers
    function normalizeCount(match) {
      if (!match) return null;

      const raw = match.replace(/,/g, '');
      const value = parseFloat(raw);

      if (raw.includes('K') || raw.includes('k')) {
        return Math.round(value * 1000).toString();
      } else if (raw.includes('M')) {
        // Only uppercase M for million - lowercase m is for minutes (timestamps)
        return Math.round(value * 1000000).toString();
      }

      return Math.round(value).toString();
    }

    // Likes/Reactions
    // Priority 1: Look for "All reactions:" pattern (most reliable)
    const allReactionsMatch = postText.match(/All reactions:\s*(\d+(?:,\d+)*(?:\.\d+)?[KM]?)/i);
    if (allReactionsMatch) {
      data.likes = normalizeCount(allReactionsMatch[1]);
      console.log(`   ✅ Likes: ${data.likes} (via "All reactions:")`);
    } else {
      // Priority 2: Look for engagement patterns, but exclude timestamp patterns
      const likesPatterns = [
        // Match "X reactions" or "X likes" but NOT if preceded by "m " (timestamp)
        /(?<!\d[m]\s)(\d+(?:,\d+)*(?:\.\d+)?[KM]?)\s+(?:likes?|reactions?)/i,
        /(\d+(?:,\d+)*(?:\.\d+)?[KM]?)\s+people like this/i
      ];

      for (const pattern of likesPatterns) {
        const match = postText.match(pattern);
        if (match) {
          data.likes = normalizeCount(match[1]);
          console.log(`   ✅ Likes: ${data.likes} (via pattern)`);
          break;
        }
      }
    }
    if (!data.likes) console.log('   ⚠️ Likes: not found');

    // Comments
    const commentsPatterns = [
      // Match plain numbers or K/M suffixed numbers (but not lowercase m for timestamps)
      /(\d+(?:,\d+)*(?:\.\d+)?[KM]?)\s+comments?/i,
      /(\d+(?:,\d+)*(?:\.\d+)?[KM]?)\s+ความคิดเห็น/i,
      /View all (\d+(?:,\d+)*(?:\.\d+)?[KM]?)\s+comments?/i
    ];

    for (const pattern of commentsPatterns) {
      const match = postText.match(pattern);
      if (match) {
        data.comments = normalizeCount(match[1]);
        console.log(`   ✅ Comments: ${data.comments} (matched: "${match[0]}")`);
        break;
      }
    }
    if (!data.comments) console.log('   ⚠️ Comments: not found');

    // Shares
    const sharesPatterns = [
      // Match plain numbers or K/M suffixed numbers (but not lowercase m for timestamps)
      /(\d+(?:,\d+)*(?:\.\d+)?[KM]?)\s+shares?/i,
      /(\d+(?:,\d+)*(?:\.\d+)?[KM]?)\s+การแชร์/i,
      /Shared (\d+(?:,\d+)*(?:\.\d+)?[KM]?)\s+times?/i
    ];

    for (const pattern of sharesPatterns) {
      const match = postText.match(pattern);
      if (match) {
        data.shares = normalizeCount(match[1]);
        console.log(`   ✅ Shares: ${data.shares} (matched: "${match[0]}")`);
        break;
      }
    }
    if (!data.shares) console.log('   ⚠️ Shares: not found');

    return data;
  } catch (error) {
    return {
      error: `Extraction failed: ${error.message}`,
      stack: error.stack
    };
  }
}

// Store the last right-clicked element
let lastClickedElement = null;

// Track right-clicks to know which post was clicked
document.addEventListener('contextmenu', (e) => {
  lastClickedElement = e.target;
  console.log('Right-clicked on element:', e.target);
}, true);

// Listen for messages from background script and popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'ready' });
    return true;
  }

  if (request.action === 'extractAndSave') {
    console.log('📥 Received extractAndSave message');
    console.log('Last clicked element:', lastClickedElement);

    // If no element was tracked, try to find any post on the page
    if (!lastClickedElement) {
      console.log('⚠️ No clicked element tracked, trying to find post using coordinates');
      const clickX = request.clickX || 0;
      const clickY = request.clickY || 0;
      lastClickedElement = document.elementFromPoint(clickX, clickY);
      console.log('Found element at coordinates:', lastClickedElement);
    }

    // PHASE 1: Detect if we're in a photo modal/lightbox (not full post dialog)
    let inPhotoModal = false;
    let tempElement = lastClickedElement;
    while (tempElement && tempElement !== document.body) {
      const role = tempElement.getAttribute ? tempElement.getAttribute('role') : null;
      if (role === 'dialog') {
        // Check if it's specifically a PHOTO modal (not full post dialog)
        const url = window.location.href;
        if (url.includes('/photo/') || url.includes('/photo.php') || url.includes('photo_id=')) {
          inPhotoModal = true;
          console.log('📸 Detected photo modal/lightbox (URL contains photo identifier)');
        } else {
          console.log('ℹ️ Detected dialog but not photo modal (likely full post view) - will proceed with extraction');
        }
        break;
      }
      tempElement = tempElement.parentElement;
    }

    // PHASE 2: If in photo modal, show helpful error message instead of trying to extract
    if (inPhotoModal) {
      console.log('📸 User is in photo viewer - guiding them to close it first');
      const errorMessage = '📸 You\'re viewing a photo. Please close the photo viewer or click "See post" to view the full post, then right-click to extract.\n\nTip: You can also highlight the caption text and right-click for 100% accurate extraction.';
      sendResponse({ success: false, error: errorMessage });
      showNotification(errorMessage, 'error');
      return true;
    }

    // Continue with normal post detection
    let postElement = lastClickedElement;
    let attempts = 0;
    const maxAttempts = 50; // Prevent infinite loop

    // Traverse up the DOM to find the post container
    while (postElement && postElement !== document.body && attempts < maxAttempts) {
      attempts++;
      const role = postElement.getAttribute ? postElement.getAttribute('role') : null;
      const dataStore = postElement.getAttribute ? postElement.getAttribute('data-store') : null;
      const ariaLabelledBy = postElement.getAttribute ? postElement.getAttribute('aria-labelledby') : null;

      console.log(`Attempt ${attempts}: Checking element`, postElement.tagName, role, postElement.className);

      // Check for role="article" (standard post container)
      if (role === 'article') {
        console.log('✅ Found post element via role="article"!');
        break;
      }

      // Check for data-store attribute (alternative post marker)
      if (dataStore) {
        console.log('✅ Found post element via data-store!');
        break;
      }

      // Check for aria-labelledby (posts usually have this)
      if (ariaLabelledBy && ariaLabelledBy.length > 0) {
        // Make sure it's substantial enough to be a post container
        const hasImages = postElement.querySelector('img[src*="scontent"]');
        const hasText = postElement.querySelector('[dir="auto"]');

        if (hasImages || hasText) {
          console.log('✅ Found post element via aria-labelledby!');
          break;
        }
      }

      // Check for class that might indicate a post
      const classList = postElement.classList;
      if (classList && (
          classList.toString().includes('userContentWrapper') ||
          classList.toString().includes('_5pcr')
        )) {
        console.log('✅ Found post element via class!');
        break;
      }

      postElement = postElement.parentElement;
    }

    if (!postElement || postElement === document.body || attempts >= maxAttempts) {
      console.log('⚠️ Could not find post via traversal, trying alternative method...');

      // Alternative method: Find all elements with aria-labelledby on the page
      const allPotentialPosts = document.querySelectorAll('[aria-labelledby]');
      console.log(`Found ${allPotentialPosts.length} elements with aria-labelledby`);

      let closestPost = null;
      let closestDistance = Infinity;

      const clickRect = lastClickedElement.getBoundingClientRect();
      const clickY = clickRect.top + clickRect.height / 2;

      for (const candidate of allPotentialPosts) {
        // Check if it has content that looks like a post
        const hasImages = candidate.querySelector('img[src*="scontent"]');
        const hasText = candidate.querySelector('[dir="auto"]');

        if (!hasImages && !hasText) continue;

        const candidateRect = candidate.getBoundingClientRect();
        const candidateY = candidateRect.top;
        const candidateBottom = candidateRect.bottom;

        // Check if click is within this element's vertical bounds
        if (clickY >= candidateY && clickY <= candidateBottom) {
          const distance = Math.abs(clickY - candidateY);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPost = candidate;
          }
        }
      }

      if (closestPost) {
        console.log('✅ Found post using alternative method!');
        postElement = closestPost;
      } else {
        console.log('❌ Could not find post element');
        console.log('Last clicked element:', lastClickedElement);

        // Provide context-aware error message
        let errorMessage = 'Could not find post.';
        if (inPhotoModal) {
          errorMessage = '📸 You\'re viewing a photo. Please close the photo viewer and right-click on the post, or click "See post" to view the full post first.';
        } else {
          errorMessage = 'Could not find post. Please try right-clicking on the post text or image.';
        }

        sendResponse({ success: false, error: errorMessage });
        showNotification(errorMessage, 'error');
        return true;
      }
    }

    console.log('✅ Using post element:', postElement);

    // Extract data from the post (async)
    (async () => {
      try {
        const data = await extractPostData(postElement);

        if (data.error) {
          console.log('❌ Extraction error:', data.error);
          sendResponse({ success: false, error: data.error });
          return;
        }

        // Save data locally with duplicate detection
        try {
          const storageResult = await chrome.storage.local.get(['savedPosts']);
          const savedPosts = storageResult.savedPosts || [];

          // Check for duplicates - prevent saving the same post multiple times
          const isDuplicate = savedPosts.some(existingPost => {
            // Check by URL (most reliable)
            if (existingPost.url === data.url) {
              return true;
            }
            // Also check by author + timestamp (within 5 minutes) as backup
            if (existingPost.author === data.author &&
                Math.abs(new Date(existingPost.timestamp) - new Date(data.timestamp)) < 5 * 60 * 1000) {
              return true;
            }
            return false;
          });

          if (isDuplicate) {
            console.log('⚠️ Duplicate post detected, skipping save');
            showNotification('⚠️ This post was already saved!', 'error');
            sendResponse({ success: false, error: 'Post already saved' });
            return;
          }

          savedPosts.push(data);
          // Keep only last 100 posts to avoid storage limits
          if (savedPosts.length > 100) {
            savedPosts.shift();
          }
          await chrome.storage.local.set({ savedPosts });
          console.log('💾 Data saved locally! Total posts:', savedPosts.length);
          console.log('📊 Saved post data:', data);
          showNotification(`✅ Data saved locally! (${savedPosts.length} total posts)`, 'success');
          sendResponse({ success: true, data });
        } catch (storageError) {
          console.log('⚠️ Failed to save locally:', storageError);
          showNotification('❌ Failed to save data locally', 'error');
          sendResponse({ success: false, error: storageError.message });
        }
      } catch (error) {
        console.log('❌ Error:', error);
        showNotification('❌ Failed to send to n8n', 'error');
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Keep the message channel open for async response
  }

  return true;
});

// Show a temporary notification on the page
function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.textContent = message;

  const backgroundColor = type === 'success' ? '#42b72a' : '#e4434d';
  const duration = type === 'success' ? 3000 : 5000; // Error messages stay longer

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
    background: ${backgroundColor};
    color: white;
    max-width: 400px;
    line-height: 1.4;
  `;

  // Add animation keyframes
  if (!document.querySelector('#n8n-notification-style')) {
    const style = document.createElement('style');
    style.id = 'n8n-notification-style';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => notification.remove(), 300);
  }, duration);
}