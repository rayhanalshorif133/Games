/**
 * =========================================================================
 * 📊 RICKY JUMP - SCORE API BRIDGE (apiscore.js)
 * =========================================================================
 * Bridges to send_score_api.js to submit scores on Game Over.
 */

export const ScoreAPI = {
  /**
   * Submit score via send_score_api.js
   * @param {number|Object} score - The player's final score
   * @param {Object} [data] - Optional additional game statistics
   */
  sendScore: async (score, data) => {
    try {
      if (typeof window !== 'undefined' && typeof window.sendScore === 'function') {
        return await window.sendScore(score);
      } else if (typeof sendScore === 'function') {
        return await sendScore(score);
      } else if (typeof globalThis !== 'undefined' && typeof globalThis.sendScore === 'function') {
        return await globalThis.sendScore(score);
      } else {
        console.warn('[ScoreAPI] sendScore function from send_score_api.js is not available.');
      }
    } catch (e) {
      console.error('[ScoreAPI] Error invoking sendScore:', e);
    }
  }
};

// Global availability
if (typeof window !== 'undefined') {
  window.ScoreAPI = ScoreAPI;
}

