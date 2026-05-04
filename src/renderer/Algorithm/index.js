/**
 * Symphony Algorithm System
 * Centralized personalization and recommendation engine.
 */

export const SymphonyAlgorithm = {
  /**
   * Generates a personalized feed based on user history and likes.
   * @param {Object} deps - { history, likedVideos, subscriptions, api }
   */
  getPersonalizedFeed: async ({ history, likedVideos, subscriptions, api }) => {
    try {
      const baseFeed = await api.getHomeFeed();
      
      if (!history.length && !likedVideos.length && !subscriptions.length) {
        return baseFeed;
      }

      const samples = [...likedVideos.slice(0, 10), ...history.slice(0, 10)];
      const keywords = samples.map(v => v.title.split(' ').slice(0, 2).join(' '));
      const uniqueKeywords = [...new Set(keywords)].filter(k => k.length > 3);
      
      if (uniqueKeywords.length === 0) return baseFeed;

      const shuffledInterests = [...uniqueKeywords].sort(() => 0.5 - Math.random());
      const selectedInterests = shuffledInterests.slice(0, 3);
      
      const resultsArray = await Promise.all(
        selectedInterests.map(interest => api.search(interest))
      );
      
      const blended = [];
      const targetLength = Math.max(baseFeed.length, 30);
      
      for (let i = 0; i < targetLength; i++) {
        const interestIndex = i % (selectedInterests.length + 1);
        
        if (interestIndex < selectedInterests.length) {
          const currentInterestResults = resultsArray[interestIndex];
          const resultIdx = Math.floor(i / (selectedInterests.length + 1));
          
          if (currentInterestResults && currentInterestResults[resultIdx]) {
            blended.push(currentInterestResults[resultIdx]);
            continue;
          }
        }
        
        if (baseFeed[i]) {
          blended.push(baseFeed[i]);
        }
      }
      
      const finalFeed = blended
        .filter((v, i, self) => i === self.findIndex(t => t.id === v.id))
        .sort(() => 0.5 - Math.random());
        
      return finalFeed.slice(0, 40);
    } catch (err) {
      console.error('Symphony Algorithm Error:', err);
      return api.getHomeFeed();
    }
  }
};
