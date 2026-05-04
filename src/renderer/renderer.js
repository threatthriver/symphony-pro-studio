const searchInput = document.getElementById('search-input');
const videoGrid = document.getElementById('video-grid');
const playerOverlay = document.getElementById('player-overlay');
const playerContainer = document.getElementById('player-container');
const closePlayer = document.getElementById('close-player');

searchInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    const query = searchInput.value;
    if (!query) return;

    videoGrid.innerHTML = '<div style="text-align: center; grid-column: 1/-1; padding-top: 100px;">Searching...</div>';

    try {
      const results = await window.api.search(query);
      displayVideos(results);
    } catch (error) {
      console.error(error);
      videoGrid.innerHTML = '<div style="text-align: center; grid-column: 1/-1; padding-top: 100px; color: #ff4444;">Error fetching videos.</div>';
    }
  }
});

function displayVideos(videos) {
  videoGrid.innerHTML = '';
  
  const videoItems = videos.filter(v => v.type === 'video');
  
  if (videoItems.length === 0) {
    videoGrid.innerHTML = '<div style="text-align: center; grid-column: 1/-1; padding-top: 100px; color: var(--text-secondary);">No videos found for this search.</div>';
    return;
  }

  videoItems.forEach(video => {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.innerHTML = `
      <div class="thumbnail" style="background-image: url('${video.bestThumbnail.url}')">
        <div class="duration-badge">${video.duration}</div>
      </div>
      <div class="video-info">
        <div class="video-title">${video.title}</div>
        <div class="video-meta">${video.author.name} • ${video.views || 'N/A'} views</div>
      </div>
    `;

    card.onclick = () => playVideo(video.id);
    videoGrid.appendChild(card);
  });
}

function playVideo(videoId) {
  playerContainer.innerHTML = `
    <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>
  `;
  playerOverlay.style.display = 'flex';
}

closePlayer.onclick = () => {
  playerOverlay.style.display = 'none';
  playerContainer.innerHTML = '';
};

// Handle escape key to close player
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && playerOverlay.style.display === 'flex') {
    closePlayer.onclick();
  }
});
