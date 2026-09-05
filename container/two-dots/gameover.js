/**
 * gameover.js - Game Over Redirect & Callback Handler
 * 
 * Configure your redirect URL and redirect timing below.
 * Automatically triggered when the player's game ends.
 */

export const GAMEOVER_CONFIG = {
  // 1. Set your target redirect URL here (e.g. 'https://yourwebsite.com/results' or '/leaderboard'):
  REDIRECT_URL: '',

  // 2. Set to true to activate the automatic redirect:
  ENABLED: true,

  // 3. Delay before redirecting in milliseconds (e.g., 2500ms = 2.5s to let the player view their score):
  REDIRECT_DELAY_MS: 2500,

  // 4. If true, appends score query parameters to the URL:
  // Example: https://yourwebsite.com/results?score=25&best=60&time=72&combo=8
  APPEND_QUERY_PARAMS: true,

  // 5. Target window:
  // '_self' = current page / iframe
  // '_top'  = top-level window (breaks out of iframe)
  // '_blank'= open in new tab
  TARGET: '_self',
};

/**
 * Handles redirecting the user after Game Over.
 * 
 * @param {Object} scoreData
 * @param {number} scoreData.score
 * @param {number} scoreData.bestScore
 * @param {number} scoreData.maxCombo
 * @param {number} scoreData.timeSurvived
 */
export function handleGameOverRedirect(scoreData) {
  if (!GAMEOVER_CONFIG.ENABLED) {
    console.log('[gameover.js] Redirect is disabled in GAMEOVER_CONFIG.');
    return;
  }

  if (!GAMEOVER_CONFIG.REDIRECT_URL || GAMEOVER_CONFIG.REDIRECT_URL.trim() === '') {
    console.log('[gameover.js] No REDIRECT_URL configured yet. Skipping redirect.');
    return;
  }

  let finalUrl = GAMEOVER_CONFIG.REDIRECT_URL;

  // Append query parameters if enabled
  if (GAMEOVER_CONFIG.APPEND_QUERY_PARAMS) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    const params = new URLSearchParams({
      score: String(scoreData.score || 0),
      best: String(scoreData.bestScore || 0),
      combo: String(scoreData.maxCombo || 0),
      time: String(Math.floor(scoreData.timeSurvived || 0)),
      t: String(Date.now())
    });
    finalUrl += separator + params.toString();
  }

  console.log(`[gameover.js] Redirecting to ${finalUrl} in ${GAMEOVER_CONFIG.REDIRECT_DELAY_MS}ms...`);

  setTimeout(() => {
    try {
      if (GAMEOVER_CONFIG.TARGET === '_blank') {
        window.open(finalUrl, '_blank');
      } else if (GAMEOVER_CONFIG.TARGET === '_top') {
        window.top.location.href = finalUrl;
      } else {
        window.location.href = finalUrl;
      }
    } catch (e) {
      // Fallback in case cross-origin iframe security prevents accessing window.top
      window.location.href = finalUrl;
    }
  }, GAMEOVER_CONFIG.REDIRECT_DELAY_MS);
}

// Also attach to window object for global script access
if (typeof window !== 'undefined') {
  window.handleGameOverRedirect = handleGameOverRedirect;
  window.GAMEOVER_CONFIG = GAMEOVER_CONFIG;
}

