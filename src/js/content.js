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

      // PHASE 2: Auto-click "See More" button if in feed view (AGGRESSIVE)
      if (!isFullPostView) {
        // Try multiple times to ensure we catch all "See More" buttons
        for (let attempt = 0; attempt < 3; attempt++) {
          const seeMoreButtons = Array.from(postElement.querySelectorAll('div[role="button"]'));
          const seeMoreButton = seeMoreButtons.find(btn => {
            const text = btn.textContent?.toLowerCase() || '';
            return text.includes('see more') || 
                   text.includes('ดูเพิ่มเติม') || 
                   text.includes('see translation') ||
                   text.includes('ดูการแปล');
          });

          if (seeMoreButton && seeMoreButton.offsetParent !== null) { // Check if visible
            console.log(`🔘 Found "See more" button (attempt ${attempt + 1}), clicking to expand...`);
            seeMoreButton.click();
            // Wait for expansion
            const startTime = Date.now();
            while (Date.now() - startTime < 200) { /* wait 200ms */ }
          } else {
            break; // No more buttons to click
          }
        }
        console.log('✅ Text expansion complete');
      }

      // Priority 1: Try to find the main post content container first
      const contentContainerSelectors = [
        '[data-ad-comet-preview="message"]',
        '[data-ad-preview="message"]',
        '[data-ad-rendering-role="body"]',
        'div[data-ad-rendering-role="message"]',
        '[data-ad-preview="message"]',
        '.userContent',
        '[data-testid="post_message"]'
      ];

      for (const selector of contentContainerSelectors) {
        const element = postElement.querySelector(selector);
        if (element && element.textContent?.trim()) {
          captionText = element.textContent.trim();
          console.log(`✅ Found caption via selector: ${selector} (${captionText.length} chars)`);
          break;
        }
      }

      // Priority 2: Comprehensive text extraction using DOM traversal
      if (!captionText) {
        console.log('⚠️ Specific selectors failed, trying comprehensive DOM traversal...');

        // Find ALL potential text containers
        const allTextElements = postElement.querySelectorAll(
          'div[dir="auto"], span[dir="auto"], p, ' +
          '[data-ad-preview="message"] span, ' +
          '.userContent, .text_exposed_root, ' +
          '[style*="text-align"]'
        );
        
        const textBlocks = [];
        const seenTexts = new Set(); // Prevent duplicates

        for (const element of allTextElements) {
          const text = element.textContent?.trim() || '';

          // Skip if too short
          if (text.length < 3) continue;

          // Skip if we've already seen this exact text
          if (seenTexts.has(text)) continue;

          // Skip pure engagement UI elements
          if (text.match(/^(Like|Comment|Share|Send|Save)$/i)) continue;
          if (text.match(/^(ถูกใจ|ความคิดเห็น|แชร์|ส่ง|บันทึก)$/i)) continue;
          
          // Skip engagement counts (but allow if part of sentence)
          if (text.match(/^\d+\s*(likes?|reactions?|comments?|shares?|K|M)$/i)) continue;

          // Skip timestamps
          if (text.match(/^\d+\s*[mhd]$/i) || text.match(/^(Just now|Now|·|•)$/i)) continue;
          if (text.match(/^(เมื่อสักครู่|ตอนนี้)$/i)) continue;

          // Skip "See more" and translation buttons
          if (text.match(/^(See more|See translation|See less|ดูเพิ่มเติม|ดูการแปล|ดูน้อยลง)$/i)) continue;

          // Skip if clearly in comments section (multiple strategies)
          const isInComments = 
            element.closest('[aria-label*="comment" i]') ||
            element.closest('[aria-label*="ความคิดเห็น" i]') ||
            element.closest('[data-pagelet*="Comment"]') ||
            element.closest('.commentable_item') ||
            element.closest('[role="article"] ~ div'); // After the main article

          if (isInComments) continue;

          // Skip if this element is contained within a larger text block we already have
          let isContainedInOther = false;
          for (const otherBlock of textBlocks) {
            if (otherBlock.element.contains(element) && otherBlock.text.includes(text)) {
              isContainedInOther = true;
              break;
            }
          }
          if (isContainedInOther) continue;

          // Get element position for sorting
          const rect = element.getBoundingClientRect();
          const postRect = postElement.getBoundingClientRect();
          const relativeTop = rect.top - postRect.top;

          textBlocks.push({
            text: text,
            element: element,
            length: text.length,
            relativeTop: relativeTop
          });

          seenTexts.add(text);
        }

        console.log(`📊 Found ${textBlocks.length} unique text blocks`);

        // Sort by vertical position to maintain reading order
        textBlocks.sort((a, b) => a.relativeTop - b.relativeTop);

        // Collect text - be smart about deduplication
        const finalTexts = [];
        const usedTexts = new Set();

        for (const block of textBlocks) {
          // Skip if this text is a substring of something we already have
          let isDuplicate = false;
          for (const used of usedTexts) {
            if (used.includes(block.text) || block.text.includes(used)) {
              // Keep the longer version
              if (block.text.length > used.length) {
                finalTexts.splice(finalTexts.indexOf(used), 1);
                usedTexts.delete(used);
              } else {
                isDuplicate = true;
              }
              break;
            }
          }

          if (!isDuplicate) {
            finalTexts.push(block.text);
            usedTexts.add(block.text);
          }
        }

        // Combine all text blocks
        if (finalTexts.length > 0) {
          captionText = finalTexts.join('\n\n');
          console.log(`✅ Collected complete caption from ${finalTexts.length} text blocks (${captionText.length} chars)`);

          // Debug log
          console.log('📝 All text blocks collected:');
          finalTexts.forEach((text, index) => {
            const preview = text.length > 80 ? text.substring(0, 80) + '...' : text;
            console.log(`   [${index + 1}] (${text.length} chars): "${preview}"`);
          });
        }
      }

      // Priority 3: Ultimate fallback - get all readable text from post article
      if (!captionText || captionText.length < 10) {
        console.log('⚠️ All structured approaches failed, using fallback extraction...');

        // Find the article element (main post container)
        const article = postElement.closest('[role="article"]') || postElement;
        
        // Get all text but be very selective about what we exclude
        const allText = article.textContent || '';
        const lines = allText.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        // Filter out only obvious UI elements
        const contentLines = lines.filter(line => {
          // Skip engagement buttons
          if (['like', 'comment', 'share', 'send', 'save'].includes(line.toLowerCase())) return false;
          if (['ถูกใจ', 'ความคิดเห็น', 'แชร์', 'ส่ง', 'บันทึก'].includes(line.toLowerCase())) return false;

          // Skip engagement counts at start of line
          if (line.match(/^\d+\s*(likes?|reactions?|comments?|shares?)/i)) return false;

          // Skip timestamps
          if (line.match(/^\d+[mhd]$/i)) return false;
          if (['just now', 'now', '·', '•', 'เมื่อสักครู่'].includes(line.toLowerCase())) return false;

          // Keep everything else (be permissive)
          return true;
        });

        if (contentLines.length > 0) {
          captionText = contentLines.join('\n\n');
          console.log(`✅ Found caption via comprehensive extraction (${captionText.length} chars, ${contentLines.length} lines)`);
          console.log(`   Full extracted text: ${captionText.substring(0, 200)}${captionText.length > 200 ? '...' : ''}`);
        }
      }
    }

    // Clean up the caption text (be more conservative)
    if (captionText) {
      // Only remove obvious "See more" suffixes that are clearly truncated
      const originalLength = captionText.length;

      // Remove "See more" only if it's at the very end and followed by ellipsis
      if (captionText.match(/\.\.\.\s*(See more|ดูเพิ่มเติม)\s*$/i)) {
        captionText = captionText.replace(/\.\.\.\s*(See more|ดูเพิ่มเติม)\s*$/i, '');
      }

      // Remove trailing ellipsis only if it's clearly truncation
      if (captionText.match(/\.\.\.\s*$/) && !captionText.match(/\w\.\.\.$/)) {
        captionText = captionText.replace(/\.\.\.\s*$/, '');
      }

      // Remove common UI prefixes only if they're standalone at the start
      if (captionText.match(/^(Like|Comment|Share|ถูกใจ|ความคิดเห็น|แชร์)\s+/i)) {
        captionText = captionText.replace(/^(Like|Comment|Share|ถูกใจ|ความคิดเห็น|แชร์)\s+/i, '');
      }

      captionText = captionText.trim();

      // Remove excessive whitespace
      captionText = captionText.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
      captionText = captionText.replace(/ {2,}/g, ' '); // Max 1 consecutive space

      if (captionText.length > 0) {
        data.caption = captionText;
        console.log(`✅ Extracted complete caption (${data.caption.length} chars, cleaned ${originalLength - data.caption.length} chars)`);
        console.log(`   Full text: ${data.caption}`);
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

        // Clean up alt text by removing UI elements and unwanted text
        let cleanAlt = img.alt || '';

        // Remove common UI text patterns that pollute alt text
        const uiPatterns = [
          /\b(?:LIKE|COMMENT|SHARE|SAVE|COPY|EDIT|DELETE|REPORT|FOLLOW|UNFOLLOW)\b/gi,
          /\b(?:ถูกใจ|ความคิดเห็น|แชร์|บันทึก|คัดลอก|แก้ไข|ลบ|รายงาน|ติดตาม|เลิกติดตาม)\b/gi,
          /\b(?:Save|Print|Cast|Translate|Create QR Code|Send|View Page Source|Inspect)\b/gi,
          /\b(?:Webhook URL|URL|Save As|Print|Cast|Translate|QR Code|Page Source)\b/gi,
          /\b(?:Your Devices|Meta AI|Search this page|Reading Mode|Contacts)\b/gi,
          /\b(?:See more|ดูเพิ่มเติม|View more|Show more|Load more)\b/gi,
          /\b(?:Reload|Refresh|Update|Sync|Loading|Please wait)\b/gi,
          /\b(?:Success Strategies|กลยุทธ์แห่งความสำเร็จ|กลยุทธ์แท่)\b/gi,
          /\b(?:DSP Post|DSPPostCollectorr|Collectorr|Foll W|ใส่ url|เรา DSP)\b/gi,
          /\b(?:tarjkp\.me|webhook|ft-scrape|รับ|ส่ง|คลิกขวา|กด)\b/gi,
          /\b(?:Database|เราแล้ว|คมกีร์ชีวิต|ชาร์ลี|Your Devices)\b/gi,
          /\b(?:Open Search|Lens|Reading Mode|Contacts|Birthday|Birthdays)\b/gi,
          /\b(?:have their bi|their birthdays today|nave their bi)\b/gi,
          /\b(?:and others|akul and others|others nave their)\b/gi,
          /\b(?:CUIHTCIL|CUIIHTCIL|딸기|Success Strategies)\b/gi,
          /\b(?:อาจเป็นรูปภาพของ|ข้อความพูดว่า|พูดว่า|รูปภาพของ)\b/gi,
          /\b(?:View Page Source|Inspect|Translate to English|Send or)\b/gi,
          /\b(?:Poor Charlie's Almanack|ประวัติชีวิตและภูมิปัญ)\b/gi,
          /\b(?:มาของชาร์ลี มังเกอร์|Charlie Munger|Almanack)\b/gi,
          // Additional patterns for corrupted/mixed text
          /\b(?:I CUIIHTCIL|CUIIHTCIL 딸기|딸기 Success)\b/gi,
          /\b(?:2h ใส่ url|เรา DSP Post)\b/gi,
          /\b(?:DSPPostCollectorr Collectorr|Collectorr Foll W)\b/gi,
          /\b(?:ตรงนี้ค้าบ 2|สรุปหนังสือ)\b/gi,
          /\b(?:See more https|Back อย่าลิมปรับเป็น)\b/gi,
          /\b(?:POST tarjkp\.me|Reload Save)\b/gi,
          /\b(?:Webhook URL Save|Save As\.\.\.|Print\.\.|Cast\.\.)\b/gi,
          /\b(?:akul and others|and others nave)\b/gi,
          /\b(?:their bi irthdays|nave their bi)\b/gi,
          /\b(?:irthdays today|bi irthdays)\b/gi,
          /\b(?:Open Search this|Search this page)\b/gi,
          /\b(?:with Google Lens|Google Lens Reading)\b/gi,
          /\b(?:Reading Mode Contacts|Mode Contacts 3)\b/gi,
          /\b(?:ทุกอย่างถูกเซฟลง|ถูกเซฟลง Database)\b/gi,
          /\b(?:คมกีร์ชีวิต ชาร์ลี|ชีวิต ชาร์ลี Your)\b/gi,
          /\b(?:Your Devices Meta|Devices Meta AI)\b/gi,
          /\b(?:Meta AI Send|AI Send Create)\b/gi,
          /\b(?:Create QR Code|QR Code for)\b/gi,
          /\b(?:for his Page|his Page Translate)\b/gi,
          /\b(?:Translate to English|to English Send)\b/gi,
          /\b(?:Send or 8n|or 8n Poor)\b/gi,
          /\b(?:Poor Charlie's Al|Charlie's Al View)\b/gi,
          /\b(?:View Page Source|Page Source Inspect)\b/gi,
          /\b(?:เจอโพสที่ชอบก็คลิก|ที่ชอบก็คลิก ขวา)\b/gi,
          /\b(?:ก็คลิก ขวากด|ขวากด "ส่ง")\b/gi
        ];

        // Apply all UI pattern removals
        for (const pattern of uiPatterns) {
          cleanAlt = cleanAlt.replace(pattern, '').trim();
        }

        // Remove excessive whitespace and clean up
        cleanAlt = cleanAlt.replace(/\s+/g, ' ').trim();

        // Remove leading/trailing punctuation and quotes
        cleanAlt = cleanAlt.replace(/^["""''""''\s]+|["""''""''\s]+$/g, '');

        // If alt text is too long or contains too many non-alphabetic characters, consider it polluted
        const alphabeticRatio = (cleanAlt.match(/[a-zA-Zก-ฮะ-์]/g) || []).length / cleanAlt.length;
        const hasCorruptedText = /\b(?:CUIIHTCIL|I CUIIHTCIL|딸기|irthdays|nave their|bi irthdays)\b/i.test(cleanAlt);
        const hasUIFragments = /\b(?:Save As\.\.\.|Print\.\.|Cast\.\.|Send or 8n|Al View)\b/i.test(cleanAlt);
        const hasWebhookText = /\b(?:webhook|ft-scrape|tarjkp\.me)\b/i.test(cleanAlt);

        if (cleanAlt.length > 150 ||
            (cleanAlt.length > 30 && alphabeticRatio < 0.4) ||
            hasCorruptedText ||
            hasUIFragments ||
            hasWebhookText) {
          cleanAlt = null; // Mark as polluted
        }

        // Only keep alt text if it's meaningful (not empty after cleaning and not just numbers/symbols)
        if (!cleanAlt || cleanAlt.length < 3 || /^[^\wก-ฮ]*$/.test(cleanAlt)) {
          cleanAlt = null;
        }

        seenUrls.add(img.src);
        data.images.push({
          url: img.src,
          alt: cleanAlt,
          width: img.width,
          height: img.height
        });
        console.log(`✅ Added image: ${img.src} (${img.width}x${img.height}) - Alt: "${cleanAlt || 'none'}" (was: "${img.alt ? img.alt.substring(0, 50) + (img.alt.length > 50 ? '...' : '') : 'none'}")`);
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

    // Determine post type - Enhanced classification
    if (data.videos.length > 0) {
      // Determine specific video type
      const hasDirectVideo = data.videos.some(v => v.type === 'direct');
      const hasFacebookVideo = data.videos.some(v => v.type === 'facebook' || v.type === 'facebook-data' || v.type === 'facebook-id');
      const hasExternalVideo = data.videos.some(v => ['youtube', 'vimeo', 'tiktok'].includes(v.type));

      if (hasDirectVideo) {
        data.postType = data.images.length > 0 ? 'video-with-images' : 'video';
      } else if (hasFacebookVideo) {
        data.postType = data.images.length > 0 ? 'facebook-video-with-images' : 'facebook-video';
      } else if (hasExternalVideo) {
        data.postType = data.images.length > 0 ? 'external-video-with-images' : 'external-video';
      } else {
        data.postType = data.images.length > 0 ? 'video-link-with-images' : 'video-link';
      }
    } else if (data.images.length > 1) {
      data.postType = data.caption ? 'multi-image' : 'multi-image-no-text';
    } else if (data.images.length === 1) {
      data.postType = data.caption ? 'image' : 'image-no-text';
    } else if (data.caption) {
      data.postType = 'text';
    } else {
      data.postType = 'empty'; // No content detected
    }

    console.log(`📋 Post type determined: ${data.postType} (${data.images.length} images, ${data.videos.length} videos, caption: ${data.caption ? 'yes' : 'no'})`);

    // Extract engagement stats from this post only
    // Strategy 1: Look for specific engagement DOM elements (more reliable)
    // Strategy 2: Fall back to text pattern matching

    console.log('📊 Extracting engagement stats...');

    // Function to normalize numbers
    function normalizeCount(match) {
      if (!match) return null;

      const raw = match.replace(/,/g, '').replace(/\s+/g, '');
      const value = parseFloat(raw);

      if (raw.includes('K') || raw.includes('k')) {
        return Math.round(value * 1000).toString();
      } else if (raw.includes('M')) {
        return Math.round(value * 1000000).toString();
      }

      return Math.round(value).toString();
    }

    // DEBUG: Log all aria-labels to see what Facebook provides
    const allAriaLabels = Array.from(postElement.querySelectorAll('[aria-label]'))
      .map(el => el.getAttribute('aria-label'))
      .filter(label => label && label.trim().length > 0);
    
    console.log(`   🔍 Found ${allAriaLabels.length} aria-labels in post`);
    allAriaLabels.forEach((label, idx) => {
      if (idx < 10) { // Log first 10 only
        console.log(`      [${idx + 1}] "${label}"`);
      }
    });

    // Strategy 1: Extract from aria-labels (most reliable for Facebook)
    const ariaElements = postElement.querySelectorAll('[aria-label]');
    
    for (const element of ariaElements) {
      const ariaLabel = element.getAttribute('aria-label') || '';
      
      // Likes/Reactions - look for patterns like "57 reactions" or "Like: 57"
      if (!data.likes) {
        const reactionsMatch = ariaLabel.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMk]?)\s*(?:reactions?|likes?|ถูกใจ|All reactions)/i);
        if (reactionsMatch) {
          data.likes = normalizeCount(reactionsMatch[1]);
          console.log(`   ✅ Likes: ${data.likes} (from aria-label: "${ariaLabel}")`);
        }
      }

      // Comments - look for patterns like "57 comments"
      if (!data.comments) {
        const commentsMatch = ariaLabel.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMk]?)\s*(?:comments?|ความคิดเห็น|Comment)/i);
        if (commentsMatch) {
          data.comments = normalizeCount(commentsMatch[1]);
          console.log(`   ✅ Comments: ${data.comments} (from aria-label: "${ariaLabel}")`);
        }
      }

      // Shares - look for patterns like "57 shares"
      if (!data.shares) {
        const sharesMatch = ariaLabel.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMk]?)\s*(?:shares?|แชร์|Share)/i);
        if (sharesMatch) {
          data.shares = normalizeCount(sharesMatch[1]);
          console.log(`   ✅ Shares: ${data.shares} (from aria-label: "${ariaLabel}")`);
        }
      }
    }

    // Strategy 2: Look for specific engagement section (usually near bottom of post)
    if (!data.likes || !data.comments || !data.shares) {
      // Find engagement footer/toolbar
      const engagementSections = postElement.querySelectorAll('[role="toolbar"], [aria-label*="actions" i], .x1i10hfl');
      
      for (const section of engagementSections) {
        const sectionText = section.textContent || '';
        
        // Extract numbers that appear before keywords
        if (!data.likes) {
          const likesMatch = sectionText.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMk]?)\s*(?:reactions?|likes?|ถูกใจ)/i);
          if (likesMatch) {
            data.likes = normalizeCount(likesMatch[1]);
            console.log(`   ✅ Likes: ${data.likes} (from engagement section)`);
          }
        }

        if (!data.comments) {
          const commentsMatch = sectionText.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMk]?)\s*(?:comments?|ความคิดเห็น)/i);
          if (commentsMatch) {
            data.comments = normalizeCount(commentsMatch[1]);
            console.log(`   ✅ Comments: ${data.comments} (from engagement section)`);
          }
        }

        if (!data.shares) {
          const sharesMatch = sectionText.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMk]?)\s*(?:shares?|แชร์)/i);
          if (sharesMatch) {
            data.shares = normalizeCount(sharesMatch[1]);
            console.log(`   ✅ Shares: ${data.shares} (from engagement section)`);
          }
        }
      }
    }

    // Strategy 3: Fallback to text pattern matching if still missing
    if (!data.likes || !data.comments || !data.shares) {
      const postText = postElement.innerText;
      console.log(`   Falling back to text pattern matching on ${postText.length} chars`);

      // Likes/Reactions
      if (!data.likes) {
        const allReactionsMatch = postText.match(/All reactions:\s*(\d+(?:,\d+)*(?:\.\d+)?[KMk]?)/i);
        if (allReactionsMatch) {
          data.likes = normalizeCount(allReactionsMatch[1]);
          console.log(`   ✅ Likes: ${data.likes} (via "All reactions:")`);
        } else {
          const likesPatterns = [
            /(?<!\d[m]\s)(\d+(?:,\d+)*(?:\.\d+)?[KMk]?)\s+(?:likes?|reactions?)/i,
            /(\d+(?:,\d+)*(?:\.\d+)?[KMk]?)\s+people like this/i
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
      }

      // Comments
      if (!data.comments) {
        const commentsPatterns = [
          /(\d+(?:,\d+)*(?:\.\d+)?[KMk]?)\s+comments?/i,
          /(\d+(?:,\d+)*(?:\.\d+)?[KMk]?)\s+ความคิดเห็น/i,
          /View all (\d+(?:,\d+)*(?:\.\d+)?[KMk]?)\s+comments?/i
        ];

        for (const pattern of commentsPatterns) {
          const match = postText.match(pattern);
          if (match) {
            data.comments = normalizeCount(match[1]);
            console.log(`   ✅ Comments: ${data.comments} (matched: "${match[0]}")`);
            break;
          }
        }
      }

      // Shares
      if (!data.shares) {
        const sharesPatterns = [
          /(\d+(?:,\d+)*(?:\.\d+)?[KMk]?)\s+shares?/i,
          /(\d+(?:,\d+)*(?:\.\d+)?[KMk]?)\s+การแชร์/i,
          /Shared (\d+(?:,\d+)*(?:\.\d+)?[KMk]?)\s+times?/i
        ];

        for (const pattern of sharesPatterns) {
          const match = postText.match(pattern);
          if (match) {
            data.shares = normalizeCount(match[1]);
            console.log(`   ✅ Shares: ${data.shares} (matched: "${match[0]}")`);
            break;
          }
        }
      }
    }

    // Log results
    if (!data.likes) console.log('   ⚠️ Likes: not found');
    if (!data.comments) console.log('   ⚠️ Comments: not found');
    if (!data.shares) console.log('   ⚠️ Shares: not found');

    // Data validation and quality checks
    console.log('🔍 Running data validation...');

    // Validate URLs
    if (data.url && !data.url.startsWith('http')) {
      console.log('⚠️ Invalid URL format detected');
      data.url = null;
    }

    if (data.authorProfileUrl && !data.authorProfileUrl.startsWith('http')) {
      console.log('⚠️ Invalid author profile URL format detected');
      data.authorProfileUrl = null;
    }

    // Validate images
    data.images = data.images.filter(img => {
      const isValid = img.url &&
                     img.url.startsWith('http') &&
                     img.width > 0 &&
                     img.height > 0 &&
                     img.width < 10000 && // Reasonable max dimensions
                     img.height < 10000;

      if (!isValid) {
        console.log(`⚠️ Filtered out invalid image: ${img.url || 'no-url'} (${img.width}x${img.height})`);
      }
      return isValid;
    });

    // Validate videos
    data.videos = data.videos.filter(video => {
      const isValid = video.url && video.url.startsWith('http');

      if (!isValid) {
        console.log(`⚠️ Filtered out invalid video: ${video.url || 'no-url'}`);
      }
      return isValid;
    });

    // Validate engagement numbers (should be reasonable)
    ['likes', 'comments', 'shares'].forEach(metric => {
      if (data[metric] && (isNaN(data[metric]) || data[metric] < 0 || data[metric] > 100000000)) {
        console.log(`⚠️ Invalid ${metric} count: ${data[metric]}, setting to null`);
        data[metric] = null;
      }
    });

    // Validate caption (should not be excessively long or contain only UI text)
    if (data.caption) {
      if (data.caption.length > 10000) { // Unreasonably long
        console.log('⚠️ Caption too long, truncating');
        data.caption = data.caption.substring(0, 10000) + '...';
      }

      // Check if caption is mostly UI text (similar to alt text filtering)
      const uiWords = ['like', 'comment', 'share', 'follow', 'see more', 'view', 'click', 'save', 'copy', 'edit'];
      const words = data.caption.toLowerCase().split(/\s+/);
      const uiWordCount = words.filter(word => uiWords.some(ui => word.includes(ui))).length;
      const uiRatio = uiWordCount / words.length;

      if (uiRatio > 0.5 && words.length > 10) {
        console.log('⚠️ Caption appears to contain mostly UI text, marking as potentially polluted');
        data.captionQuality = 'low';
      } else {
        data.captionQuality = 'good';
      }
    }

    // Ensure we have at least some basic data
    const hasBasicData = data.author || data.caption || data.images.length > 0 || data.videos.length > 0;
    if (!hasBasicData) {
      console.log('⚠️ Post has no meaningful content extracted');
      data.quality = 'poor';
    } else {
      data.quality = 'good';
    }

    // Add extraction metadata
    data.extractionMetadata = {
      totalImagesFound: data.images.length,
      totalVideosFound: data.videos.length,
      hasEngagementData: !!(data.likes || data.comments || data.shares),
      extractionTimestamp: new Date().toISOString()
    };

    console.log(`✅ Data validation complete. Quality: ${data.quality}, Images: ${data.images.length}, Videos: ${data.videos.length}`);

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
  console.log('📬 Content script received message:', request.action);

  if (request.action === 'ping') {
    console.log('🏓 Ping received, sending ready response');
    sendResponse({ status: 'ready' });
    return true;
  }

  if (request.action === 'addPost') {
    console.log('➕ Adding post... coordinates:', { x: request.clickX, y: request.clickY });

    (async () => {
      try {
        // Find the post element near the click position (or use fallback if coordinates invalid)
        const postElement = findPostElementAtPosition(request.clickX, request.clickY);

        if (!postElement) {
          console.error('❌ Could not find post element');
          showNotification('❌ Could not find post at click location', 'error');
          sendResponse({ success: false, error: 'No post found at click location' });
          return;
        }

        console.log('✅ Found post element, extracting data...');
        const postData = await extractPostData(postElement);

        // Check if post has sufficient content (text, images, or videos)
        const hasText = postData && postData.caption && postData.caption.trim().length >= 3; // Check caption, not text
        const hasImages = postData && postData.images && postData.images.length > 0;
        const hasVideos = postData && postData.videos && postData.videos.length > 0;

        console.log('📊 Post content analysis:', {
          hasText,
          hasImages,
          hasVideos,
          textLength: postData?.caption?.length || 0,
          textPreview: postData?.caption?.substring(0, 50) || 'no text',
          imageCount: postData?.images?.length || 0,
          videoCount: postData?.videos?.length || 0
        });

        if (!postData || (!hasText && !hasImages && !hasVideos)) {
          const textLen = postData?.caption?.length || 0;
          console.log('Post content check:', { hasText, hasImages, hasVideos, textLength: textLen });

          // Collect debug snippets from the post element to help diagnose extraction failures
          let textPreview = '';
          try {
            textPreview = (postElement.innerText || postElement.textContent || '').trim().substring(0, 300);
          } catch (e) {
            textPreview = '<unable to read post text>';
          }

          let outerSnippet = '';
          try {
            outerSnippet = (postElement.outerHTML || '').substring(0, 2000);
          } catch (e) {
            outerSnippet = '<unable to read outerHTML>';
          }

          console.warn('❌ Insufficient content for post. Preview:', textPreview);
          console.debug('Post element snippet (truncated):', outerSnippet);

          showNotification(`❌ Post has insufficient content (text ${textLen}, images ${postData?.images?.length || 0}, videos ${postData?.videos?.length || 0})`, 'error');
          sendResponse({
            success: false,
            error: 'Insufficient content',
            debug: {
              textLength: textLen,
              textPreview,
              imageCount: postData?.images?.length || 0,
              videoCount: postData?.videos?.length || 0
            }
          });

          return;
        }

        // Save to storage
        const storageResult = await chrome.storage.local.get(['savedPosts']);
        let savedPosts = storageResult.savedPosts || [];

        // NO DUPLICATE CHECK - Allow all posts to be added
        console.log('✅ Adding new post (duplicate check disabled):', {
          author: postData.author,
          captionPreview: postData.caption?.substring(0, 50) || 'no caption',
          imageCount: postData.images?.length || 0,
          videoCount: postData.videos?.length || 0,
          timestamp: postData.timestamp
        });

        savedPosts.push(postData);

        // Keep only last 500 posts
        if (savedPosts.length > 500) {
          savedPosts = savedPosts.slice(-500);
        }

        await chrome.storage.local.set({ savedPosts });
        showNotification('✅ Post added successfully!', 'success');
        sendResponse({ success: true, postData });

      } catch (error) {
        console.error('❌ Error adding post:', error);
        showNotification('❌ Failed to add post', 'error');
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true;
  }

  return true;
});

// Confirm content script is loaded and ready
console.log('✅ Content script message listener registered');
console.log('📍 Current page URL:', window.location.href);
console.log('🔗 Extension ready to receive messages');

// Global variables for auto-extraction
let autoExtractEnabled = false;
let lastProcessedPostIds = new Set();
let autoExtractInterval = null;

// Find post element near click position
function findPostElementAtPosition(x, y) {
  console.log('🎯 Finding post at position:', { x, y });

  // Validate coordinates
  if (!isFinite(x) || !isFinite(y) || x < 0 || y < 0) {
    console.log('⚠️ Invalid coordinates, using fallback method');
    return findPostByFallback();
  }

  // Facebook post selectors
  const postSelectors = [
    '[data-pagelet="FeedUnit_0"]',
    '[data-pagelet="FeedUnit_1"]',
    '[data-pagelet="FeedUnit_2"]',
    '[data-pagelet="FeedUnit_3"]',
    '[data-pagelet="FeedUnit_4"]',
    '[data-pagelet="FeedUnit_5"]',
    '[data-pagelet="FeedUnit_6"]',
    '[data-pagelet="FeedUnit_7"]',
    '[data-pagelet="FeedUnit_8"]',
    '[data-pagelet="FeedUnit_9"]',
    '[data-pagelet="FeedUnit_10"]',
    '[role="article"]',
    '[data-visualcompletion="ignore-dynamic"] [role="article"]',
    '.userContentWrapper',
    '[data-testid="post_container"]',
    '[data-testid="fbfeed_story"]'
  ];

  try {
    // Find element at click position
    const clickedElement = document.elementFromPoint(x, y);
    if (!clickedElement) {
      console.log('❌ No element found at click position, using fallback');
      return findPostByFallback();
    }

    console.log('Clicked element:', clickedElement);

    // Check if clicked element is a post
    for (const selector of postSelectors) {
      if (clickedElement.matches && clickedElement.matches(selector)) {
        console.log('✅ Found post directly:', selector);
        return clickedElement;
      }
    }

    // Search up the DOM tree for a post element
    let currentElement = clickedElement;
    let depth = 0;
    const maxDepth = 10;

    while (currentElement && depth < maxDepth) {
      for (const selector of postSelectors) {
        if (currentElement.matches && currentElement.matches(selector)) {
          console.log('✅ Found post by traversing up:', selector, 'at depth:', depth);
          return currentElement;
        }
      }

      currentElement = currentElement.parentElement;
      depth++;
    }

    // If not found by traversing up, search nearby posts
    console.log('🔍 Searching for nearest post...');
    for (const selector of postSelectors) {
      const posts = document.querySelectorAll(selector);
      for (const post of posts) {
        const rect = post.getBoundingClientRect();
        // Check if click is within or near the post (within 50px)
        if (x >= rect.left - 50 && x <= rect.right + 50 &&
            y >= rect.top - 50 && y <= rect.bottom + 50) {
          console.log('✅ Found nearby post:', selector);
          return post;
        }
      }
    }

    console.log('❌ No post found near click position, using fallback');
    return findPostByFallback();

  } catch (error) {
    console.error('❌ Error in findPostElementAtPosition:', error);
    return findPostByFallback();
  }
}

// Fallback method to find a post when coordinates are invalid
function findPostByFallback() {
  console.log('🔄 Using fallback method to find post');

  const postSelectors = [
    '[data-pagelet="FeedUnit_0"]',
    '[data-pagelet="FeedUnit_1"]',
    '[data-pagelet="FeedUnit_2"]',
    '[data-pagelet="FeedUnit_3"]',
    '[data-pagelet="FeedUnit_4"]',
    '[data-pagelet="FeedUnit_5"]',
    '[data-pagelet="FeedUnit_6"]',
    '[data-pagelet="FeedUnit_7"]',
    '[data-pagelet="FeedUnit_8"]',
    '[data-pagelet="FeedUnit_9"]',
    '[data-pagelet="FeedUnit_10"]',
    '[role="article"]',
    '[data-visualcompletion="ignore-dynamic"] [role="article"]',
    '.userContentWrapper',
    '[data-testid="post_container"]',
    '[data-testid="fbfeed_story"]'
  ];

  // Try to find the first visible post on the page
  for (const selector of postSelectors) {
    const posts = document.querySelectorAll(selector);
    for (const post of posts) {
      const rect = post.getBoundingClientRect();
      // Check if post is visible and in viewport
      if (rect.width > 0 && rect.height > 0 &&
          rect.top >= 0 && rect.bottom <= window.innerHeight) {
        console.log('✅ Found visible post with fallback:', selector);
        return post;
      }
    }
  }

  // If no visible posts found, return the first post found
  for (const selector of postSelectors) {
    const post = document.querySelector(selector);
    if (post) {
      console.log('✅ Found any post with fallback:', selector);
      return post;
    }
  }

  console.log('❌ No posts found with fallback method');
  return null;
}

// Show a temporary notification on the page
function showNotification(message, type, customDuration) {
  const notification = document.createElement('div');
  notification.textContent = message;

  const backgroundColor = type === 'success' ? '#42b72a' : type === 'info' ? '#2196f3' : '#e4434d';
  const duration = customDuration || (type === 'success' ? 3000 : type === 'info' ? 2000 : 5000);

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