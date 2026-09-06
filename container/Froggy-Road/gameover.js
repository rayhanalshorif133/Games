/**
 * =========================================================================
 * 🐸 FROGGY CROSS THE ROAD - GAME OVER & REDIRECT CONTROLLER (gameover.js)
 * =========================================================================
 * 
 * Customize redirect behavior and external redirect URLs here.
 */

// 👉 [1] SET YOUR REDIRECT URL HERE (এখানে আপনার রিডাইরেক্ট লিঙ্ক বসান):
// Example: "https://yourwebsite.com", "leaderboard.html", "https://google.com"
// লিঙ্ক ফাঁকা "" রাখলে কোনো রিডাইরেক্ট হবে না, সাধারণ গেম ওভার স্ক্রিন থাকবে।
const REDIRECT_URL = "https://www.google.com/";

// 👉 [2] REDIRECT MODE (রিডাইরেক্ট পদ্ধতি):
// Options:
// - "OFF"     : রিডাইরেক্ট বন্ধ থাকবে। স্কোর দেখাবে এবং PLAY AGAIN বাটন ক্লিক করলে গেমটি পুনরায় শুরু হবে।
// - "auto"    : গেম ওভার স্ক্রিন ও স্কোর দেখানোর পর নির্ধারিত সময় কাউন্টডাউন হয়ে অটো রিডাইরেক্ট হবে।
// - "button"  : প্লেয়ার CONTINUE বাটনে ক্লিক করলে রিডাইরেক্ট হবে।
// - "instant" : সময় শেষ বা মৃত্যুর সাথে সাথেই কোনো স্ক্রিন না দেখিয়ে রিডাইরেক্ট হবে।
const REDIRECT_MODE = "OFF";

// 👉 [3] REDIRECT DELAY (অটো রিডাইরেক্টের বিলম্ব মিলিসেকেন্ডে):
// 2500 = ২.৫ সেকেন্ড অপেক্ষা করে রিডাইরেক্ট হবে।
const REDIRECT_DELAY_MS = 2500;

// 👉 [4] ATTACH SCORE TO URL AS QUERY PARAMETERS (URL-এ স্কোর পাঠানো)?
// true রাখলে URL-এর সাথে স্কোর যোগ হবে, যেমন: https://example.com?score=45&highScore=120&distance=45
const PASS_SCORE_IN_URL = true;

// =========================================================================
// ⚙️ CONTROLLER LOGIC
// =========================================================================

class GameOverController {
    static redirectTimer = null;
    static countdownInterval = null;

    /**
     * Triggered when froggy exhausts all 3 lives and dies.
     * @param {Object} data - { score, highScore, distance, bonusScore, deathType, timePlayed }
     */
    static handleGameOver(data) {
        console.log('[GameOverController] Triggered with data:', data);

        // 1. Automatically submit score to backend API via ScoreAPI
        if (typeof window !== 'undefined' && window.ScoreAPI && typeof window.ScoreAPI.sendScore === 'function') {
            window.ScoreAPI.sendScore(data.score, data);
        }

        // 2. Clear any previous active timers
        if (this.redirectTimer) clearTimeout(this.redirectTimer);
        if (this.countdownInterval) clearInterval(this.countdownInterval);

        const mode = String(REDIRECT_MODE || '').trim().toUpperCase();

        // Mode: OFF -> No redirect. Standard game modal remains active.
        if (mode === 'OFF') {
            console.log('[GameOverController] REDIRECT_MODE is OFF. Redirect disabled, standard modal displayed.');
            const redirectTextEl = document.getElementById('modal-redirect-text');
            if (redirectTextEl) redirectTextEl.textContent = '';

            const restartBtn = document.getElementById('restartBtn');
            if (restartBtn) {
                restartBtn.textContent = 'PLAY AGAIN';
            }
            return;
        }

        const targetUrl = (REDIRECT_URL || '').trim();

        // If no target URL specified, fallback to default modal
        if (!targetUrl) {
            console.log('[GameOverController] REDIRECT_URL is not set. Player remains on modal.');
            const restartBtn = document.getElementById('restartBtn');
            if (restartBtn) {
                restartBtn.textContent = 'PLAY AGAIN';
            }
            return;
        }

        // Build the final redirect URL with score query parameters
        let finalUrl = targetUrl;
        if (PASS_SCORE_IN_URL) {
            try {
                const parsed = new URL(targetUrl, window.location.origin);
                parsed.searchParams.set('score', data.score || 0);
                parsed.searchParams.set('highScore', data.highScore || 0);
                parsed.searchParams.set('distance', data.distance || data.score || 0);
                if (data.deathType) parsed.searchParams.set('deathReason', data.deathType);
                finalUrl = parsed.toString();
            } catch (e) {
                const sep = targetUrl.includes('?') ? '&' : '?';
                finalUrl = `${targetUrl}${sep}score=${data.score || 0}&highScore=${data.highScore || 0}&distance=${data.distance || data.score || 0}`;
            }
        }

        // Mode 1: Instant redirect without waiting
        if (REDIRECT_MODE.toLowerCase() === 'instant') {
            window.location.href = finalUrl;
            return;
        }

        // Mode 2: Auto redirect after countdown delay
        if (REDIRECT_MODE.toLowerCase() === 'auto') {
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

            const restartBtn = document.getElementById('restartBtn');
            if (restartBtn) {
                restartBtn.textContent = 'CONTINUE NOW';
                restartBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
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

        // Mode 3: Manual button click redirect
        if (REDIRECT_MODE.toLowerCase() === 'button') {
            const redirectTextEl = document.getElementById('modal-redirect-text');
            if (redirectTextEl) {
                redirectTextEl.textContent = 'Click below to continue';
            }

            const restartBtn = document.getElementById('restartBtn');
            if (restartBtn) {
                restartBtn.textContent = 'CONTINUE';
                restartBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = finalUrl;
                };
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.GameOverController = GameOverController;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameOverController, REDIRECT_URL, REDIRECT_MODE, REDIRECT_DELAY_MS, PASS_SCORE_IN_URL };
}

