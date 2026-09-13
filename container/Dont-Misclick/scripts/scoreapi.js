/**
 * Don't Misclick - Score API Module (scripts/scoreapi.js)
 * Handles score tracking, high score persistence (localStorage & cookies),
 * event listeners, and optional remote backend/leaderboard integration.
 */

class ScoreAPI {
    constructor() {
        this.storageKey = 'dont_misclick_highscore';
        this.leaderboardKey = 'dont_misclick_leaderboard';
        this.listeners = [];
        this.remoteEndpoint = null; // Can be set to your backend API URL (e.g. 'https://api.yourdomain.com/score')
    }

    /**
     * Get the player's saved high score
     * @returns {number} High score
     */
    getHighScore() {
        try {
            const localVal = localStorage.getItem(this.storageKey);
            if (localVal !== null) {
                return parseInt(localVal, 10) || 0;
            }
        } catch (e) {
            console.warn('LocalStorage unavailable, checking cookies', e);
        }

        // Fallback to cookie
        if (window.CookieUtil) {
            const cookieVal = window.CookieUtil.get(this.storageKey);
            if (cookieVal) return parseInt(cookieVal, 10) || 0;
        }

        return 0;
    }

    /**
     * Save high score if current score exceeds previous record
     * @param {number} newScore 
     * @returns {boolean} True if new high score was set
     */
    saveHighScore(newScore) {
        const currentHigh = this.getHighScore();
        if (newScore > currentHigh) {
            try {
                localStorage.setItem(this.storageKey, newScore.toString());
            } catch (e) {
                console.warn('Failed to save to localStorage', e);
            }

            if (window.CookieUtil) {
                window.CookieUtil.set(this.storageKey, newScore.toString(), 365);
            }

            this.notifyListeners('highscore_updated', {
                score: newScore,
                previousHigh: currentHigh
            });
            return true;
        }
        return false;
    }

    /**
     * Submit a finished game run score
     * @param {number} score Final score
     * @param {object} metadata Extra game metrics (misclicks, accuracy, timeSurvived)
     * @returns {Promise<object>} Result
     */
    async submitScore(score, metadata = {}) {
        const isNewHigh = this.saveHighScore(score);

        const runRecord = {
            score,
            misclicks: metadata.misclicks || 0,
            accuracy: metadata.accuracy || 100,
            rank: metadata.rank || 'D',
            timestamp: new Date().toISOString()
        };

        this.addLeaderboardEntry(runRecord);

        // If a remote server endpoint is configured, POST the score
        if (this.remoteEndpoint) {
            try {
                const res = await fetch(this.remoteEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(runRecord)
                });
                return await res.json();
            } catch (err) {
                console.warn('Remote score submission failed, saved locally:', err);
            }
        }

        return { success: true, isNewHigh, record: runRecord };
    }

    /**
     * Get top local scores (Leaderboard)
     * @param {number} limit 
     * @returns {Array} Top score records
     */
    getLeaderboard(limit = 10) {
        try {
            const data = localStorage.getItem(this.leaderboardKey);
            if (data) {
                const list = JSON.parse(data);
                return list.sort((a, b) => b.score - a.score).slice(0, limit);
            }
        } catch (e) {
            console.warn('Failed to get leaderboard', e);
        }
        return [];
    }

    /**
     * Add a record to the local leaderboard
     * @param {object} record 
     */
    addLeaderboardEntry(record) {
        try {
            const list = this.getLeaderboard(50);
            list.push(record);
            list.sort((a, b) => b.score - a.score);
            localStorage.setItem(this.leaderboardKey, JSON.stringify(list.slice(0, 50)));
        } catch (e) {
            console.warn('Failed to update leaderboard', e);
        }
    }

    /**
     * Subscribe to score change events
     * @param {function} callback 
     */
    addScoreListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    notifyListeners(event, data) {
        this.listeners.forEach(fn => {
            try { fn(event, data); } catch (e) { console.error(e); }
        });
    }

    /**
     * Reset scores (utility for testing)
     */
    resetScores() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.leaderboardKey);
        } catch (e) {}
        if (window.CookieUtil) {
            window.CookieUtil.set(this.storageKey, '0', 0);
        }
        this.notifyListeners('scores_reset', {});
    }
}

// Global Singleton Instance
window.scoreAPI = new ScoreAPI();

