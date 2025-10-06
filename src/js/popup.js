// Wait for DOM to be fully loaded before accessing elements

document.addEventListener('DOMContentLoaded', () => {

  // Auto-load posts when popup opens
  loadAndDisplayPosts();

  // Load saved posts
  document.getElementById('loadSavedBtn').addEventListener('click', () => {
    loadAndDisplayPosts();
  });

  // Refresh saved posts
  document.getElementById('refreshBtn').addEventListener('click', () => {
    loadAndDisplayPosts();
  });

  // Export saved posts
  document.getElementById('exportBtn').addEventListener('click', () => {
    chrome.storage.local.get(['savedPosts'], (result) => {
      const savedPosts = result.savedPosts || [];

      if (savedPosts.length === 0) {
        showStatus('No posts to export!', 'error');
        return;
      }

      const format = document.getElementById('exportFormat').value;
      let dataStr, mimeType, filename;

      if (format === 'json') {
        const dataset = {
          dataset_info: {
            name: "Facebook Posts Dataset",
            description: "Facebook posts dataset with text, images, and videos for AI training",
            version: "1.0.0",
            created_at: new Date().toISOString(),
            total_posts: savedPosts.length,
            source: "Facebook Post Scraper Extension"
          },
          posts: savedPosts.map((post, index) => ({
            id: `post_${index + 1}`,
            text: post.caption || "",
            author: post.author || "Unknown",
            author_profile_url: post.authorProfileUrl || null,
            url: post.url,
            timestamp: post.timestamp,
            images: post.images || [],
            videos: post.videos || [],
            post_type: post.postType || "text",
            engagement: {
              likes: parseInt(post.likes) || 0,
              comments: parseInt(post.comments) || 0,
              shares: parseInt(post.shares) || 0
            },
            extracted_at: new Date().toISOString(),
            image_count: (post.images || []).length,
            video_count: (post.videos || []).length
          }))
        };

        dataStr = JSON.stringify(dataset, null, 2);
        mimeType = 'application/json';
        filename = `facebook-posts-dataset-${new Date().toISOString().split('T')[0]}.json`;

      } else {
        // TXT format
        dataStr = `Facebook Posts Dataset - Text Summary\n`;
        dataStr += `Generated: ${new Date().toLocaleString()}\n`;
        dataStr += `Total Posts: ${savedPosts.length}\n\n`;

        dataStr += savedPosts.map((post, index) => {
          let txt = `Post ${index + 1}:\n`;
          txt += `Author: ${post.author || 'Unknown'}\n`;
          txt += `Date: ${new Date(post.timestamp).toLocaleString()}\n`;
          txt += `URL: ${post.url}\n`;
          if (post.caption) txt += `Caption: ${post.caption}\n`;
          if (post.likes) txt += `Likes: ${post.likes}\n`;
          if (post.comments) txt += `Comments: ${post.comments}\n`;
          if (post.shares) txt += `Shares: ${post.shares}\n`;

          if (post.videos && post.videos.length > 0) {
            txt += `Videos (${post.videos.length}): [URLs and types in JSON export only]\n`;
          }

          txt += '\n' + '='.repeat(50) + '\n\n';
          return txt;
        }).join('');

        dataStr += `\nNote: Image and video URLs are available in the JSON export format.\n`;
        dataStr += `To download images, use the "Download Images" button.\n`;

        mimeType = 'text/plain';
        filename = `facebook-posts-summary-${new Date().toISOString().split('T')[0]}.txt`;
      }

      // Create and download the file
      const dataBlob = new Blob([dataStr], {type: mimeType});
      const url = URL.createObjectURL(dataBlob);

      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          showStatus('Export failed: ' + chrome.runtime.lastError.message, 'error');
        } else {
          showStatus(`✅ Data exported as ${format.toUpperCase()}!`, 'success');
        }
      });
    });
  });

  // Download images
  document.getElementById('downloadImagesBtn').addEventListener('click', () => {
    chrome.storage.local.get(['savedPosts'], (result) => {
      const savedPosts = result.savedPosts || [];
      const allImages = [];

      savedPosts.forEach(post => {
        if (post.images && post.images.length > 0) {
          post.images.forEach(img => {
            if (img.url) {
              allImages.push({
                url: img.url,
                filename: `fb-post-${post.author || 'unknown'}-${new Date(post.timestamp).getTime()}-${allImages.length + 1}.jpg`
              });
            }
          });
        }
      });

      if (allImages.length === 0) {
        showStatus('No images to download!', 'error');
        return;
      }

      let downloaded = 0;
      let failed = 0;

      allImages.forEach((img, index) => {
        setTimeout(() => {
          chrome.downloads.download({
            url: img.url,
            filename: img.filename,
            saveAs: false
          }, (downloadId) => {
            if (chrome.runtime.lastError) {
              failed++;
            } else {
              downloaded++;
            }

            if (downloaded + failed === allImages.length) {
              if (failed === 0) {
                showStatus(`Image list exported! (${allImages.length} images)`, 'success');
              } else {
                showStatus(`Downloaded ${downloaded} images, ${failed} failed`, failed > 0 ? 'error' : 'success');
              }
            }
          });
        }, index * 500); // Stagger downloads to avoid overwhelming
      });
    });
  });

  // Clear all saved posts
  document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all saved posts?')) {
      chrome.storage.local.set({ savedPosts: [] }, () => {
        document.getElementById('savedPostsContainer').style.display = 'none';
        showStatus('All saved posts cleared!', 'success');
      });
    }
  });

  function loadAndDisplayPosts() {
    chrome.storage.local.get(['savedPosts'], (result) => {
      const savedPosts = result.savedPosts || [];
      displaySavedPosts(savedPosts);
    });
  }

  function displaySavedPosts(posts) {
    const container = document.getElementById('savedPostsContainer');
    const list = document.getElementById('savedPostsList');
    const countEl = document.getElementById('postCount');

    countEl.textContent = posts.length;

    if (posts.length === 0) {
      list.innerHTML = '<p style=\"color: #777; font-style: italic;\">No saved posts yet.</p>';
      container.style.display = 'block';
      return;
    }

    list.innerHTML = posts.map((post, index) => `
      <div style=\"border: 1px solid #444; border-radius: 6px; padding: 8px; margin-bottom: 8px; background: #2a2a2a;\">
        <div style=\"font-weight: 600; color: #a094e1;\">${post.author || 'Unknown'}</div>
        <div style=\"font-size: 12px; color: #777;\">${new Date(post.timestamp).toLocaleString()}</div>
        <div style=\"margin-top: 4px; font-size: 13px;\">${post.caption ? post.caption.substring(0, 100) + (post.caption.length > 100 ? '...' : '') : 'No caption'}</div>
        <div style=\"margin-top: 4px; font-size: 12px; color: #b0b0b0;\">
          ${post.likes ? `👍 ${post.likes}` : ''}
          ${post.comments ? `💬 ${post.comments}` : ''}
          ${post.shares ? `🔗 ${post.shares}` : ''}
          ${(post.images && post.images.length > 0) ? `<span style=\"color: #4CAF50;\">🖼️ ${post.images.length} img</span>` : ''}
          ${(post.videos && post.videos.length > 0) ? `<span style=\"color: #FF9800;\">🎥 ${post.videos.length} vid${post.videos.length === 1 ? ` (${post.videos[0].type || 'video'})` : ''}</span>` : ''}
        </div>
      </div>
    `).join('');

    container.style.display = 'block';
  }

  function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = type;
    status.style.display = 'block';

    if (type === 'success') {
      setTimeout(() => {
        status.style.display = 'none';
      }, 3000);
    }
  }
}); // End of DOMContentLoaded