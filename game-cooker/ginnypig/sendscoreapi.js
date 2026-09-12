/**
 * sendscoreapi.js - Coin Drop Piggy Bank Score Reporting API
 * Handles sending score on Game Over or Level Complete.
 * Compatible with Construct 3 style exports, iframe embedding, and external backend endpoints.
 */

(function (root, factory) {
    var api = factory();
    if (typeof root !== 'undefined') {
        root.SendScoreApi = api;
    }
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else if (typeof define === 'function' && define.amd) {
        define([], function () { return api; });
    }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this), function () {
    'use strict';

    var config = {
        // Default API endpoint (can be updated via SendScoreApi.configure)
        endpoint: '/api/submit-score',
        // Request method
        method: 'POST',
        // Additional headers
        headers: {
            'Content-Type': 'application/json'
        },
        // Whether to send window.parent postMessage (for iframe embeds)
        enablePostMessage: true,
        // Target origin for postMessage
        postMessageOrigin: '*',
        // Custom callback
        onSuccess: null,
        onError: null,
        // Enable debug logging
        debug: true
    };

    var scoreHistory = [];

    function log() {
        if (config.debug) {
            var args = Array.prototype.slice.call(arguments);
            args.unshift('[SendScoreApi]');
            console.log.apply(console, args);
        }
    }

    /**
     * Configure API options
     * @param {Object} options 
     */
    function configure(options) {
        if (!options || typeof options !== 'object') return;
        for (var key in options) {
            if (options.hasOwnProperty(key)) {
                config[key] = options[key];
            }
        }
        log('Config updated:', config);
    }

    /**
     * Send Score data when Game Over or Level Win occurs
     * @param {Object} scoreData 
     * @param {number} scoreData.score Total score points
     * @param {number} scoreData.level Current level number
     * @param {number} scoreData.coinsLeft Remaining player coins
     * @param {number} scoreData.coinsBanked Coins dropped into piggy bank
     * @param {number} scoreData.target Target coins required
     * @param {string} scoreData.status 'gameover' | 'win' | 'level_complete'
     * @param {number} [scoreData.stars] Stars earned (1-3)
     * @returns {Promise<Object>}
     */
    function sendScore(scoreData) {
        if (!scoreData || typeof scoreData !== 'object') {
            scoreData = { score: 0, status: 'gameover' };
        }

        var payload = {
            game: 'CoinDropPiggyBank',
            score: Number(scoreData.score) || 0,
            level: Number(scoreData.level) || 1,
            coinsLeft: Number(scoreData.coinsLeft) || 0,
            coinsBanked: Number(scoreData.coinsBanked) || 0,
            target: Number(scoreData.target) || 0,
            status: scoreData.status || 'gameover',
            stars: Number(scoreData.stars) || 0,
            timestamp: Date.now(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            screenResolution: typeof screen !== 'undefined' ? (screen.width + 'x' + screen.height) : '1080x1920'
        };

        log('Sending score payload:', payload);
        scoreHistory.push(payload);

        // 1. Dispatch DOM CustomEvent for in-page listeners
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            try {
                var event = new CustomEvent('coinGameScore', { detail: payload });
                window.dispatchEvent(event);
            } catch (e) {
                log('CustomEvent dispatch error:', e);
            }
        }

        // 2. PostMessage to parent (useful for iframe game portals / Construct 3 wrappers)
        if (config.enablePostMessage && typeof window !== 'undefined' && window.parent && window.parent !== window) {
            try {
                window.parent.postMessage({
                    type: 'GAME_OVER_SCORE',
                    source: 'CoinDropPiggyBank',
                    data: payload
                }, config.postMessageOrigin);
                log('Score dispatched to window.parent via postMessage');
            } catch (e) {
                log('postMessage error:', e);
            }
        }

        // 3. Optional REST POST request to backend API
        return new Promise(function (resolve, reject) {
            // If running on file:// or no valid server endpoint, simulate graceful response
            var isLocalOrFile = (typeof location !== 'undefined' && (location.protocol === 'file:' || !config.endpoint));

            if (isLocalOrFile) {
                log('Local or mock environment detected. Mocking score submit response.');
                var mockResponse = { success: true, mock: true, payload: payload };
                if (typeof config.onSuccess === 'function') {
                    config.onSuccess(mockResponse);
                }
                resolve(mockResponse);
                return;
            }

            if (typeof fetch === 'function') {
                fetch(config.endpoint, {
                    method: config.method,
                    headers: config.headers,
                    body: JSON.stringify(payload)
                })
                .then(function (res) {
                    return res.json().catch(function () { return { status: res.status }; });
                })
                .then(function (data) {
                    log('Score successfully submitted to server:', data);
                    if (typeof config.onSuccess === 'function') config.onSuccess(data);
                    resolve(data);
                })
                .catch(function (err) {
                    log('Score submit network notice (offline or local dev):', err.message);
                    if (typeof config.onError === 'function') config.onError(err);
                    // Resolve gracefully so game flow is never blocked
                    resolve({ success: false, error: err.message, payload: payload });
                });
            } else {
                resolve({ success: true, mock: true, payload: payload });
            }
        });
    }

    /**
     * Get submitted score history for this session
     */
    function getHistory() {
        return scoreHistory.slice();
    }

    return {
        configure: configure,
        sendScore: sendScore,
        getHistory: getHistory,
        getConfig: function () { return Object.assign({}, config); }
    };
}));
