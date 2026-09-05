/**
 * sendscore.js - Score Submission API Handler
 * 
 * Configure your API endpoint, headers, and payload below.
 * This function is automatically triggered when a game ends.
 */

export const SEND_SCORE_CONFIG = {
  // 1. Set your backend API endpoint URL here:
  API_URL: 'https://example.com/api/submit-score',

  // 2. HTTP Method: 'POST', 'PUT', etc.
  METHOD: 'POST',

  // 3. Custom Headers (e.g. Content-Type, Bearer token, API Key)
  HEADERS: {
    'Content-Type': 'application/json',
    // 'Authorization': 'Bearer YOUR_API_TOKEN_HERE',
    // 'X-API-KEY': 'YOUR_API_KEY_HERE'
  },

  // 4. Set to true to enable sending to API, false to disable/debug
  ENABLED: true,

  // 5. Timeout in milliseconds
  TIMEOUT_MS: 5000,
};

/**
 * Sends the player's score to your API server.
 * 
 * @param {Object} scoreData
 * @param {number} scoreData.score - Final score of the session
 * @param {number} scoreData.bestScore - High score stored locally
 * @param {number} scoreData.maxCombo - Highest combo achieved
 * @param {number} scoreData.timeSurvived - Total time survived in seconds
 * @param {number} scoreData.timestamp - Unix timestamp (ms)
 * @returns {Promise<Object|null>}
 */
export async function sendScore(scoreData) {
  if (!SEND_SCORE_CONFIG.ENABLED) {
    console.log('[sendscore.js] API submission is disabled in config.');
    return null;
  }

  // Format request payload (customize this object to match your backend schema)
  const payload = {
    game: 'Three Dots',
    score: scoreData.score || 0,
    bestScore: scoreData.bestScore || 0,
    maxCombo: scoreData.maxCombo || 0,
    timeSurvived: Math.floor(scoreData.timeSurvived || 0),
    timestamp: scoreData.timestamp || Date.now()
  };

  console.log('[sendscore.js] Sending score payload to API:', payload);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SEND_SCORE_CONFIG.TIMEOUT_MS);

    const response = await fetch(SEND_SCORE_CONFIG.API_URL, {
      method: SEND_SCORE_CONFIG.METHOD,
      headers: SEND_SCORE_CONFIG.HEADERS,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json().catch(() => ({ status: 'ok' }));
    console.log('[sendscore.js] Score successfully submitted:', data);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('[sendscore.js] API request timed out after', SEND_SCORE_CONFIG.TIMEOUT_MS, 'ms');
    } else {
      console.warn('[sendscore.js] Failed to send score to API:', error.message);
    }
    return null;
  }
}

// Also attach to window object for global script access
if (typeof window !== 'undefined') {
  window.sendScore = sendScore;
  window.SEND_SCORE_CONFIG = SEND_SCORE_CONFIG;
}

