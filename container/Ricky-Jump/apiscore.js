/**
 * =========================================================================
 * 🎯 RICKY JUMP - SCORE API MODULE (apiscore.js)
 * =========================================================================
 * 
 * Handles sending game scores and player performance metrics to your backend API.
 * 
 * ব্যবহারবিধি (How to configure):
 * 1. আপনার নিজস্ব ব্যাকএন্ড এন্ডপয়েন্ট থাকলে setEndpoint("https://your-api.com/score") সেট করুন।
 * 2. যদি অথেনটিকেশন / API Key দরকার হয় তবে setApiKey("your-token") সেট করুন।
 */

class ScoreAPIService {
  constructor() {
    // Configurable endpoint URL - customize to your backend score API
    // আপনার স্কোর রিসিভ করার API এন্ডপয়েন্ট লিংক
    this.endpoint = '/api/score';
    this.apiKey = null;
    this.gameName = 'Ricky Jump';
  }

  /**
   * Set custom endpoint URL (কাস্টম API এন্ডপয়েন্ট সেট করার মেথড)
   * @param {string} url 
   */
  setEndpoint(url) {
    this.endpoint = url;
  }

  /**
   * Set Bearer / Auth API key if required by backend (API Key সেট করার মেথড)
   * @param {string} key 
   */
  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Send score data to API endpoint (স্কোর এবং গেম ডাটা ব্যাকএন্ডে পাঠানো)
   * @param {number} score - Final score
   * @param {object} [metadata] - Additional metrics (highScore, jumps, perfectJumps, reason, timeElapsed, etc.)
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async sendScore(score, metadata = {}) {
    const payload = {
      game: this.gameName,
      score: Math.floor(score),
      highScore: Math.floor(metadata.highScore || score),
      jumps: metadata.jumps || 0,
      perfectJumps: metadata.perfectJumps || 0,
      reason: metadata.reason || 'gameover',
      timeElapsed: metadata.timeElapsed || 0,
      timestamp: Date.now(),
      ...metadata
    };

    console.log('[ScoreAPI] Submitting Ricky Jump score payload:', payload);

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

// Make available globally on window for easy access
if (typeof window !== 'undefined') {
  window.ScoreAPI = ScoreAPI;
}

