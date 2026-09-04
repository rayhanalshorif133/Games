/**
 * =========================================================================
 * 🎯 BALL-GRAVITY - SCORE API MODULE (sendscoreapi.js)
 * =========================================================================
 * 
 * Handles sending game scores and metadata to a remote backend endpoint.
 * Supports configurable endpoints, API authentication, and fallback handling.
 */

class ScoreAPIService {
  constructor() {
    // Configurable endpoint URL - customize to your backend score API
    this.endpoint = '/api/score';
    this.apiKey = null;
    this.gameName = 'Ball-Gravity';
  }

  /**
   * Set custom endpoint URL
   * @param {string} url 
   */
  setEndpoint(url) {
    this.endpoint = url;
  }

  /**
   * Set Bearer / Auth API key if required by backend
   * @param {string} key 
   */
  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Send score data to API endpoint
   * @param {number} score - Final game score
   * @param {object} [metadata] - Additional metrics (height, highScore, arrowsShot, bounces, etc.)
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async sendScore(score, metadata = {}) {
    const payload = {
      game: this.gameName,
      score: Math.floor(score),
      highScore: Math.floor(metadata.highScore || score),
      height: Math.floor(metadata.height || 0),
      arrowsShot: metadata.arrowsShot || 0,
      bounces: metadata.bounces || 0,
      timeElapsed: metadata.timeElapsed || 0,
      timestamp: Date.now(),
      ...metadata
    };

    console.log('[ScoreAPI] Submitting score payload:', payload);

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status} (${response.statusText})`);
      }

      const responseData = await response.json().catch(() => ({ status: 'success' }));
      console.log('[ScoreAPI] Score successfully submitted:', responseData);
      return { success: true, data: responseData };
    } catch (err) {
      console.warn('[ScoreAPI] Score submission notice (soft fallback):', err.message);
      return { success: false, error: err.message };
    }
  }
}

export const ScoreAPI = new ScoreAPIService();

// Make available globally on window
if (typeof window !== 'undefined') {
  window.ScoreAPI = ScoreAPI;
}

