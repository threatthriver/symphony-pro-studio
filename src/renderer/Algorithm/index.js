/**
 * Symphony Algorithm System
 * Modular, secure personalization and recommendation engine.
 */

// --- System 1: Safety & Security Enforcer ---
class SafetyEnforcer {
  // Add potentially problematic or NSFW keywords to strip out
  static BANNED_KEYWORDS = new Set(['nsfw', 'porn', 'gore', 'hack', 'exploit', 'illegal']); 
  
  static sanitizeString(input) {
    if (!input || typeof input !== 'string') return '';
    // Strip malicious characters, HTML tags, or basic injection attempts
    return input.replace(/[<>'"%;()&]/g, '').trim();
  }

  static isSafeKeyword(keyword) {
    const cleanWord = keyword.toLowerCase();
    return !this.BANNED_KEYWORDS.has(cleanWord);
  }

  static validateVideoObject(video) {
    // Ensure the object has the required schema and no malformed data
    return video && typeof video.id === 'string' && typeof video.title === 'string';
  }
}

// --- System 2: User Profile Engine ---
class UserProfileEngine {
  static STOP_WORDS = new Set(['the', 'a', 'an', 'in', 'on', 'of', 'and', 'to', 'how', 'official', 'video', 'music', 'audio', 'lyrics', 'hd', '4k', 'live', 'with', 'for', 'part', 'full']);

  static extractKeywords(video) {
    if (!video || !video.title) return null;
    const sanitizedTitle = SafetyEnforcer.sanitizeString(video.title);
    const titleWords = sanitizedTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(' ');
    
    // Filter stop words and unsafe words
    const meaningfulWords = titleWords.filter(w => 
      w.length > 2 && 
      !this.STOP_WORDS.has(w) && 
      SafetyEnforcer.isSafeKeyword(w)
    );
    
    return meaningfulWords.slice(0, 2).join(' ');
  }

  static analyze(history, likedVideos, subscriptions) {
    // Safely parse subscriptions
    const subQueries = subscriptions.map(sub => SafetyEnforcer.sanitizeString(sub.name));
    
    // Extract keywords
    const likedKeywords = likedVideos.slice(0, 20).map(v => this.extractKeywords(v)).filter(Boolean);
    const historyKeywords = history.slice(0, 15).map(v => this.extractKeywords(v)).filter(Boolean);
    
    // Safely extract authors
    const likedAuthors = likedVideos.slice(0, 15).map(v => 
      v.author?.name ? SafetyEnforcer.sanitizeString(v.author.name) : null
    ).filter(Boolean);

    const allKeywords = [...subQueries, ...likedKeywords, ...historyKeywords, ...likedAuthors];
    return [...new Set(allKeywords)].filter(k => k && k.trim().length > 2);
  }
}

// --- System 3: Feed Blender & Diversity Filter ---
class FeedBlender {
  static MAX_VIDEOS_PER_AUTHOR = 3;

  static blend(baseFeed, interestFeeds, targetLength = 50) {
    const blended = [];
    
    for (let i = 0; i < targetLength; i++) {
      // Pull from interest searches
      for (let j = 0; j < interestFeeds.length; j++) {
         const currentInterestFeed = interestFeeds[j];
         if (currentInterestFeed && currentInterestFeed[i]) {
             blended.push(currentInterestFeed[i]);
         }
      }
      // Pull from base feed
      if (baseFeed && baseFeed[i]) {
        blended.push(baseFeed[i]);
      }
    }

    return this.enforceDiversity(blended).slice(0, targetLength);
  }

  static enforceDiversity(feed) {
    if (!feed || !Array.isArray(feed)) return [];
    
    const authorCounts = {};
    return feed
      .filter(v => SafetyEnforcer.validateVideoObject(v))
      .filter((v, index, self) => {
        // 1. Strict ID Deduplication
        const isFirstOccurrence = self.findIndex(t => t.id === v.id) === index;
        if (!isFirstOccurrence) return false;

        // 2. Creator Diversity Cap
        const authorId = v.author?.id || v.author?.name || 'unknown';
        authorCounts[authorId] = (authorCounts[authorId] || 0) + 1;
        
        return authorCounts[authorId] <= this.MAX_VIDEOS_PER_AUTHOR;
      })
      .sort(() => 0.5 - Math.random()); // Final shuffle for freshness
  }
}

// --- Main Orchestrator ---
export const SymphonyAlgorithm = {
  /**
   * Generates a personalized, diverse, and sanitized feed.
   * @param {Object} deps - { history, likedVideos, subscriptions, api }
   */
  getPersonalizedFeed: async ({ history = [], likedVideos = [], subscriptions = [], api }) => {
    try {
      const baseFeed = await api.getHomeFeed();
      
      // If user has no data, just return safe diverse base feed
      if (!history.length && !likedVideos.length && !subscriptions.length) {
        return FeedBlender.enforceDiversity(baseFeed);
      }

      // Analyze user profile
      const uniqueKeywords = UserProfileEngine.analyze(history, likedVideos, subscriptions);
      
      if (uniqueKeywords.length === 0) {
        return FeedBlender.enforceDiversity(baseFeed);
      }

      // Randomly select up to 5 interests to query
      const shuffledInterests = uniqueKeywords.sort(() => 0.5 - Math.random());
      const selectedInterests = shuffledInterests.slice(0, 5);
      
      // Fetch recommendations safely, ignore individual query failures
      const resultsArray = await Promise.all(
        selectedInterests.map(interest => api.search(interest).catch(() => []))
      );
      
      // Blend and return
      return FeedBlender.blend(baseFeed, resultsArray, 50);

    } catch (err) {
      console.error('Symphony Algorithm Security/Processing Error:', err);
      try {
        // Fallback to home feed, but still enforce safety and diversity
        const fallbackFeed = await api.getHomeFeed();
        return FeedBlender.enforceDiversity(fallbackFeed);
      } catch (fallbackErr) {
        return []; // Fail safe empty array
      }
    }
  }
};
