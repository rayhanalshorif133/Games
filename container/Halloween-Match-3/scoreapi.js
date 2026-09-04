/**
 * Score API Module
 * Handles sending game scores to a remote backend / API endpoint.
 */

class ScoreAPIService {
  constructor() {
    // Configurable endpoint URL - change to your backend score submission API
    this.endpoint = '/api/score';
    this.apiKey = null;
  }

  /**
   * Set a custom endpoint URL
   * @param {string} url 
   */
  setEndpoint(url) {
    this.endpoint = url;
  }

  /**
   * Set an API key if required by your backend
   * @param {string} key 
   */
  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Send score data to the API
   * @param {number} score - Current or final game score
   * @param {object} [metadata] - Optional additional details (e.g. gameMode, timeElapsed, matchesCount)
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async sendScore(score, metadata = {}) {
    const payload = {
      score: Math.floor(score),
      timestamp: Date.now(),
      game: 'Halloween Match 3',
      ...metadata
    };

    console.log('[ScoreAPI] Sending score payload:', payload);

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
        throw new Error(`Server returned HTTP status ${response.status} (${response.statusText})`);
      }

      const responseData = await response.json().catch(() => ({ status: 'received' }));
      console.log('[ScoreAPI] Score successfully submitted:', responseData);
      return { success: true, data: responseData };
    } catch (err) {
      console.warn('[ScoreAPI] Warning: Failed to send score to API:', err.message);
      // Soft failure so game continues smoothly even without active backend
      return { success: false, error: err.message };
    }
  }
}

export const ScoreAPI = new ScoreAPIService();

// Make it available globally on window as well for convenience
if (typeof window !== 'undefined') {
  window.ScoreAPI = ScoreAPI;
}

