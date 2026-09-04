/**
 * =========================================================================
 * 🎮 RICKY JUMP - GAME OVER & REDIRECT CONTROLLER (gameover.js)
 * =========================================================================
 * 
 * You can set your redirect URL and customize redirect behavior directly in this file.
 */

import { ScoreAPI } from './apiscore.js';

// 👉 [1] SET YOUR REDIRECT URL HERE (এখানে আপনার রিডাইরেক্ট লিঙ্ক বসান):
// Example: "https://yourwebsite.com" or "result.html" or "https://google.com"
// লিঙ্ক ফাঁকা "" রাখলে কোনো রিডাইরেক্ট হবে না, সাধারণ গেম ওভার স্ক্রিন থাকবে।
export const REDIRECT_URL = "https://www.google.com/";

// 👉 [2] REDIRECT MODE (রিডাইরেক্ট পদ্ধতি):
// Options:
// - "OFF"     : রিডাইরেক্ট বন্ধ থাকবে। স্কোর দেখাবে এবং PLAY AGAIN বাটন ক্লিক করলে গেমটি পুনরায় শুরু হবে।
// - "auto"    : গেম ওভার স্ক্রিন ও স্কোর দেখানোর পর নির্ধারিত সময় কাউন্টডাউন হয়ে অটো রিডাইরেক্ট হবে।
// - "button"  : প্লেয়ার CONTINUE বাটনে ক্লিক করলে রিডাইরেক্ট হবে।
// - "instant" : কোনো স্ক্রিন না দেখিয়ে সরাসরি রিডাইরেক্ট হবে।
export const REDIRECT_MODE = "OFF";

// 👉 [3] REDIRECT DELAY (অটো রিডাইরেক্টের বিলম্ব মিলিসেকেন্ডে):
// 2500 = ২.৫ সেকেন্ড অপেক্ষা করে রিডাইরেক্ট হবে।
export const REDIRECT_DELAY_MS = 2500;

// 👉 [4] ATTACH SCORE TO URL AS QUERY PARAMETERS (URL-এ স্কোর পাঠানো)?
// true রাখলে URL-এর সাথে স্কোর যোগ হবে, যেমন: https://example.com?score=45&highScore=120&jumps=15
export const PASS_SCORE_IN_URL = true;


// =========================================================================
// ⚙️ CONTROLLER LOGIC
// =========================================================================

export class GameOverController {
  static redirectTimer = null;
  static countdownInterval = null;

  /**
   * Automatically triggered when Ricky dies (hit ceiling spikes or fell into pit).
   * @param {Object} data - { score, highScore, jumps, perfectJumps, reason, timeElapsed }
   */
  static handleGameOver(data) {
    console.log('[GameOverController] Triggered with data:', data);

    // Automatically send score to API
    if (ScoreAPI && typeof ScoreAPI.sendScore === 'function') {
      ScoreAPI.sendScore(data.score, data);
    }

    // Clear any previous timers
    if (this.redirectTimer) clearTimeout(this.redirectTimer);
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    // Update modal elements in DOM
    const modalEl = document.getElementById('gameover-modal');
    if (modalEl) {
      modalEl.classList.remove('hidden');
    }

    const scoreEl = document.getElementById('final-score');
    if (scoreEl) scoreEl.textContent = data.score;

    const highScoreEl = document.getElementById('final-highscore');
    if (highScoreEl) highScoreEl.textContent = data.highScore;

    const jumpsEl = document.getElementById('final-jumps');
    if (jumpsEl) jumpsEl.textContent = data.jumps || 0;

    const perfectEl = document.getElementById('final-perfect');
    if (perfectEl) perfectEl.textContent = data.perfectJumps || 0;

    const reasonEl = document.getElementById('gameover-reason');
    if (reasonEl) reasonEl.textContent = data.reason || 'Ricky couldn\'t make the jump!';

    const newRecordBadge = document.getElementById('new-high-badge');
    if (newRecordBadge) {
      if (data.score > 0 && data.score >= data.highScore) {
        newRecordBadge.style.display = 'inline-block';
      } else {
        newRecordBadge.style.display = 'none';
      }
    }

    const mode = String(REDIRECT_MODE || '').trim().toUpperCase();

    // Mode: OFF -> No redirect. Display score, keep modal open, restart game on button click.
    if (mode === 'OFF') {
      console.log('[GameOverController] REDIRECT_MODE is OFF. Score modal active, redirect disabled.');
      const redirectTextEl = document.getElementById('modal-redirect-text');
      if (redirectTextEl) redirectTextEl.textContent = '';

      const btn = document.getElementById('btn-restart');
      if (btn) {
        btn.textContent = 'PLAY AGAIN';
        btn.onclick = () => {
          if (window.gameInstance && typeof window.gameInstance.restartGame === 'function') {
            window.gameInstance.restartGame();
          } else {
            window.location.reload();
          }
        };
      }
      return;
    }

    const targetUrl = (REDIRECT_URL || '').trim();

    // If no redirect URL specified, fallback to restart
    if (!targetUrl) {
      console.log('[GameOverController] REDIRECT_URL is not set. Player remains on modal.');
      const btn = document.getElementById('btn-restart');
      if (btn) {
        btn.textContent = 'PLAY AGAIN';
        btn.onclick = () => {
          if (window.gameInstance && typeof window.gameInstance.restartGame === 'function') {
            window.gameInstance.restartGame();
          } else {
            window.location.reload();
          }
        };
      }
      return;
    }

    // Build final redirect URL with score query parameters
    let finalUrl = targetUrl;
    if (PASS_SCORE_IN_URL) {
      try {
        const parsed = new URL(targetUrl, window.location.origin);
        parsed.searchParams.set('score', data.score || 0);
        parsed.searchParams.set('highScore', data.highScore || 0);
        parsed.searchParams.set('jumps', data.jumps || 0);
        parsed.searchParams.set('perfect', data.perfectJumps || 0);
        parsed.searchParams.set('reason', encodeURIComponent(data.reason || ''));
        finalUrl = parsed.toString();
      } catch (e) {
        const sep = targetUrl.includes('?') ? '&' : '?';
        finalUrl = `${targetUrl}${sep}score=${data.score || 0}&highScore=${data.highScore || 0}&jumps=${data.jumps || 0}`;
      }
    }

    // Mode 1: Instant redirect
    if (REDIRECT_MODE === 'instant') {
      window.location.href = finalUrl;
      return;
    }

    // Mode 2: Auto redirect after delay with live countdown
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

      // Allow clicking button immediately
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

if (typeof window !== 'undefined') {
  window.GameOverController = GameOverController;
}

