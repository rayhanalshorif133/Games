/**
 * =========================================================================
 * 🎃 HALLOWEEN MATCH 3 - GAME OVER & REDIRECT CONFIGURATION
 * =========================================================================
 * 
 * You can set your redirect URL and customize redirect behavior directly in this file.
 */

// 👉 [1] SET YOUR REDIRECT URL HERE (এখানে আপনার রিডাইরেক্ট লিঙ্ক বসান):
// Example: "https://yourwebsite.com" or "result.html" or "https://google.com"
// লিঙ্ক ফাঁকা "" রাখলে কোনো রিডাইরেক্ট হবে না, সাধারণ গেম ওভার স্ক্রিন থাকবে।
export const REDIRECT_URL = "https://www.google.com/";

// 👉 [2] REDIRECT MODE (রিডাইরেক্ট পদ্ধতি):
// Options:
// - "OFF"     : রিডাইরেক্ট বন্ধ থাকবে। স্কোর দেখাবে এবং PLAY AGAIN বাটন ক্লিক করলে গেমটি পুনরায় শুরু হবে।
// - "auto"    : গেম ওভার স্ক্রিন ও স্কোর দেখানোর পর নির্ধারিত সময় কাউন্টডাউন হয়ে অটো রিডাইরেক্ট হবে।
// - "button"  : প্লেয়ার CONTINUE বাটনে ক্লিক করলে রিডাইরেক্ট হবে।
// - "instant" : সময় শেষ হওয়ার সাথে সাথেই কোনো স্ক্রিন না দেখিয়ে রিডাইরেক্ট হবে।
export const REDIRECT_MODE = "OFF";

// 👉 [3] REDIRECT DELAY (অটো রিডাইরেক্টের বিলম্ব মিলিসেকেন্ডে):
// 3000 = ৩ সেকেন্ড অপেক্ষা করে রিডাইরেক্ট হবে।
export const REDIRECT_DELAY_MS = 2000;

// 👉 [4] ATTACH SCORE TO URL AS QUERY PARAMETERS (URL-এ স্কোর পাঠানো)?
// true রাখলে URL-এর সাথে স্কোর যোগ হবে, যেমন: https://example.com?score=450&highScore=1200&duration=300
export const PASS_SCORE_IN_URL = true;


// =========================================================================
// ⚙️ CONTROLLER LOGIC
// =========================================================================

export class GameOverController {
  static redirectTimer = null;
  static countdownInterval = null;

  /**
   * Automatically triggered by scripts/main.js when the game timer expires.
   * @param {Object} data - { score, highScore, durationPlayed }
   */
  static handleGameOver(data) {
    console.log('[GameOver] Triggered with data:', data);

    // Clear any previous timers
    if (this.redirectTimer) clearTimeout(this.redirectTimer);
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    const mode = String(REDIRECT_MODE || '').trim().toUpperCase();

    // Mode: OFF -> No redirect. Display score, keep modal open, restart game on button click.
    if (mode === 'OFF') {
      console.log('[GameOver] REDIRECT_MODE is OFF. Redirect disabled, score modal displayed.');
      const redirectTextEl = document.getElementById('modal-redirect-text');
      if (redirectTextEl) redirectTextEl.textContent = '';

      const btn = document.getElementById('btn-restart');
      if (btn) {
        btn.textContent = 'PLAY AGAIN';
        btn.onclick = () => {
          if (window.halloweenGame && typeof window.halloweenGame.startNewGame === 'function') {
            window.halloweenGame.startNewGame();
          } else {
            window.location.reload();
          }
        };
      }
      return;
    }

    const targetUrl = (REDIRECT_URL || '').trim();

    // If no redirect URL specified, do nothing (keep default modal behavior)
    if (!targetUrl) {
      console.log('[GameOver] REDIRECT_URL is not set. Player remains on modal.');
      const btn = document.getElementById('btn-restart');
      if (btn) {
        btn.textContent = 'PLAY AGAIN';
        btn.onclick = () => {
          if (window.halloweenGame && typeof window.halloweenGame.startNewGame === 'function') {
            window.halloweenGame.startNewGame();
          } else {
            window.location.reload();
          }
        };
      }
      return;
    }

    // Build the final redirect URL
    let finalUrl = targetUrl;
    if (PASS_SCORE_IN_URL) {
      try {
        const parsed = new URL(targetUrl, window.location.origin);
        parsed.searchParams.set('score', data.score);
        parsed.searchParams.set('highScore', data.highScore);
        parsed.searchParams.set('duration', data.durationPlayed || 30);
        finalUrl = parsed.toString();
      } catch (e) {
        const sep = targetUrl.includes('?') ? '&' : '?';
        finalUrl = `${targetUrl}${sep}score=${data.score}&highScore=${data.highScore}&duration=${data.durationPlayed || 30}`;
      }
    }

    // Mode 1: Instant redirect
    if (REDIRECT_MODE === 'instant') {
      window.location.href = finalUrl;
      return;
    }

    // Mode 2: Auto redirect after delay
    if (REDIRECT_MODE === 'auto') {
      const redirectTextEl = document.getElementById('modal-redirect-text');
      let remainingSecs = Math.ceil(REDIRECT_DELAY_MS / 1000);

      if (redirectTextEl) {
        redirectTextEl.textContent = `Redirecting in ${remainingSecs}s...`;
        this.countdownInterval = setInterval(() => {
          remainingSecs--;
          if (remainingSecs > 0) {
            redirectTextEl.textContent = `Redirecting in ${remainingSecs}s...`;
          } else {
            clearInterval(this.countdownInterval);
            redirectTextEl.textContent = 'Redirecting...';
          }
        }, 1000);
      }

      // Allow clicking button immediately without waiting
      const btn = document.getElementById('btn-restart');
      if (btn) {
        btn.textContent = 'CONTINUE NOW';
        btn.onclick = () => {
          if (this.redirectTimer) clearTimeout(this.redirectTimer);
          if (this.countdownInterval) clearInterval(this.countdownInterval);
          window.location.href = finalUrl;
        };
      }

      this.redirectTimer = setTimeout(() => {
        window.location.href = finalUrl;
      }, REDIRECT_DELAY_MS);
      return;
    }

    // Mode 3: Button click redirect
    if (REDIRECT_MODE === 'button') {
      const redirectTextEl = document.getElementById('modal-redirect-text');
      if (redirectTextEl) {
        redirectTextEl.textContent = 'Click below to continue';
      }

      const btn = document.getElementById('btn-restart');
      if (btn) {
        btn.textContent = 'CONTINUE';
        btn.onclick = () => {
          window.location.href = finalUrl;
        };
      }
    }
  }
}
