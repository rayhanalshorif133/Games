/**
 * SendScoreAPI - Universal Game Score Transmission Module
 * Ball Sort Puzzle
 * 
 * Supports:
 * - postMessage to parent iframe / opener / top window (GameCooker / Web portals)
 * - CustomEvent dispatching (window & document)
 * - HTTP / REST API endpoint transmission with offline retry queue
 * - URL query param configuration (?userId=...&token=...&score_api=...)
 * - LocalStorage high-score and last-score tracking
 */

(function(window) {
    'use strict';

    class ScoreAPI {
        constructor() {
            this.gameId = 'ball-sort-puzzle';
            this.queryParams = this.parseQueryParams();
            
            // Configuration from query params or global window settings
            this.endpoint = this.queryParams.score_api || 
                            this.queryParams.api_url || 
                            this.queryParams.endpoint || 
                            window.SCORE_API_ENDPOINT || 
                            null;

            this.userId = this.queryParams.userId || 
                          this.queryParams.user_id || 
                          this.queryParams.uid || 
                          localStorage.getItem('bsp_player_id') || 
                          this.generateGuestId();

            this.authToken = this.queryParams.token || 
                             this.queryParams.auth || 
                             window.SCORE_API_TOKEN || 
                             null;

            this.callbacks = {
                success: [],
                error: []
            };

            // Save user ID for persistence
            try {
                localStorage.setItem('bsp_player_id', this.userId);
            } catch (e) {}

            // Setup offline sync listener
            if (typeof window.addEventListener === 'function') {
                window.addEventListener('online', () => this.flushQueue());
            }

            console.log(`[SendScoreAPI] Initialized for game: ${this.gameId}, User: ${this.userId}`);
        }

        parseQueryParams() {
            const params = {};
            try {
                const search = window.location.search.substring(1);
                if (search) {
                    const pairs = search.split('&');
                    for (const pair of pairs) {
                        const [key, val] = pair.split('=');
                        if (key) params[decodeURIComponent(key)] = decodeURIComponent(val || '');
                    }
                }
            } catch (e) {}
            return params;
        }

        generateGuestId() {
            const id = 'guest_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
            return id;
        }

        /**
         * Main function to send game score
         * @param {number} score - Current total score or level points
         * @param {number} level - Current level number
         * @param {object} metadata - Extra details (e.g. stars, moves, time)
         */
        sendScore(score, level = 1, metadata = {}) {
            const numScore = Number(score) || 0;
            const numLevel = Number(level) || 1;

            // 1. Update LocalStorage tracking
            this.updateLocalScores(numScore, numLevel);

            // 2. Build standardized payload
            const payload = {
                type: 'SCORE',
                action: 'submitScore',
                event: 'game_score',
                game: this.gameId,
                score: numScore,
                level: numLevel,
                userId: this.userId,
                timestamp: Date.now(),
                metadata: Object.assign({
                    gameTitle: 'Balls Sort Puzzle',
                    highScore: this.getHighScore()
                }, metadata)
            };

            // 3. PostMessage to Parent / Opener / Top
            this.broadcastPostMessage(payload);

            // 4. Dispatch DOM CustomEvents
            this.broadcastCustomEvents(payload);

            // 5. Send to HTTP endpoint if configured
            if (this.endpoint) {
                this.sendHttp(payload);
            }

            console.log(`[SendScoreAPI] Score submitted: ${numScore} (Level ${numLevel})`, payload);
            return payload;
        }

        broadcastPostMessage(payload) {
            try {
                // Post to parent window (if running in iframe)
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage(payload, '*');
                }
                // Post to top window
                if (window.top && window.top !== window && window.top !== window.parent) {
                    window.top.postMessage(payload, '*');
                }
                // Post to opener window (if opened as popup)
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage(payload, '*');
                }
            } catch (err) {
                console.warn('[SendScoreAPI] postMessage error:', err);
            }
        }

        broadcastCustomEvents(payload) {
            try {
                const eventNames = ['sendScore', 'gameScore', 'scoreUpdate'];
                eventNames.forEach(evtName => {
                    const evt = new CustomEvent(evtName, { detail: payload, bubbles: true });
                    window.dispatchEvent(evt);
                    document.dispatchEvent(evt);
                });
            } catch (err) {
                console.warn('[SendScoreAPI] CustomEvent dispatch error:', err);
            }
        }

        sendHttp(payload) {
            if (!this.endpoint) return;

            const headers = {
                'Content-Type': 'application/json'
            };
            if (this.authToken) {
                headers['Authorization'] = `Bearer ${this.authToken}`;
            }

            fetch(this.endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error ${res.status}`);
                return res.json().catch(() => ({ status: 'ok' }));
            })
            .then(data => {
                console.log('[SendScoreAPI] API Endpoint success:', data);
                this.triggerCallbacks('success', data);
            })
            .catch(err => {
                console.warn('[SendScoreAPI] API Endpoint failed, queuing for offline retry:', err);
                this.queueScore(payload);
                this.triggerCallbacks('error', err);
            });
        }

        queueScore(payload) {
            try {
                const queue = JSON.parse(localStorage.getItem('bsp_queued_scores') || '[]');
                queue.push(payload);
                // Keep max 20 queued scores
                if (queue.length > 20) queue.shift();
                localStorage.setItem('bsp_queued_scores', JSON.stringify(queue));
            } catch (e) {}
        }

        flushQueue() {
            if (!this.endpoint) return;
            try {
                const queue = JSON.parse(localStorage.getItem('bsp_queued_scores') || '[]');
                if (queue.length === 0) return;

                console.log(`[SendScoreAPI] Flushing ${queue.length} queued scores...`);
                while (queue.length > 0) {
                    const item = queue.shift();
                    this.sendHttp(item);
                }
                localStorage.setItem('bsp_queued_scores', '[]');
            } catch (e) {}
        }

        updateLocalScores(score, level) {
            try {
                localStorage.setItem('game_last_score', String(score));
                localStorage.setItem('game_last_level', String(level));

                const currentHigh = Number(localStorage.getItem('game_high_score') || 0);
                if (score > currentHigh) {
                    localStorage.setItem('game_high_score', String(score));
                }
            } catch (e) {}
        }

        getHighScore() {
            try {
                return Number(localStorage.getItem('game_high_score') || 0);
            } catch (e) {
                return 0;
            }
        }

        getLastScore() {
            try {
                return Number(localStorage.getItem('game_last_score') || 0);
            } catch (e) {
                return 0;
            }
        }

        on(event, callback) {
            if (this.callbacks[event] && typeof callback === 'function') {
                this.callbacks[event].push(callback);
            }
        }

        triggerCallbacks(event, data) {
            if (this.callbacks[event]) {
                this.callbacks[event].forEach(cb => {
                    try { cb(data); } catch (e) {}
                });
            }
        }
    }

    // Singleton instance
    const instance = new ScoreAPI();

    // Global exports
    window.SendScoreAPI = instance;
    window.sendScore = function(score, level, metadata) {
        return instance.sendScore(score, level, metadata);
    };

})(window);
