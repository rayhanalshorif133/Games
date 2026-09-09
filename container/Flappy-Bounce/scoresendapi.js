/**
 * ScoreSendAPI - Flappy Bounce Score Backend Dispatcher
 * Handles sending game scores to a backend server with offline queueing & retries.
 */

(function (window) {
  'use strict';

  const DEFAULT_CONFIG = {
    endpoint: '/api/score',      // Change this to your backend score endpoint (e.g. 'https://yourserver.com/api/score')
    apiKey: '',                  // Optional API key or bearer token
    appId: 'flappy_bounce',
    storageKey: 'fb_pending_scores',
    maxRetries: 3,
    debug: true
  };

  class ScoreAPI {
    constructor() {
      this.config = { ...DEFAULT_CONFIG };
      this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      this.playerId = this.getOrCreatePlayerId();
      this.sessionId = this.generateSessionId();

      this.initNetworkListeners();
      // Try to flush queued offline scores on startup
      setTimeout(() => this.flushQueue(), 2000);
    }

    log(...args) {
      if (this.config.debug) {
        console.log('[ScoreSendAPI]', ...args);
      }
    }

    warn(...args) {
      console.warn('[ScoreSendAPI]', ...args);
    }

    setEndpoint(url) {
      this.config.endpoint = url;
      this.log('Endpoint set to:', url);
    }

    setApiKey(token) {
      this.config.apiKey = token;
    }

    getOrCreatePlayerId() {
      try {
        let id = localStorage.getItem('fb_player_id');
        if (!id) {
          id = 'player_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
          localStorage.setItem('fb_player_id', id);
        }
        return id;
      } catch (e) {
        return 'guest_' + Date.now();
      }
    }

    generateSessionId() {
      return 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    }

    initNetworkListeners() {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.log('Network online. Flushing queued scores...');
        this.flushQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.log('Network offline. Scores will be saved to local queue.');
      });
    }

    /**
     * Send player score to backend
     * @param {Object} scoreData - { score, bestScore, combo, duration, metadata }
     * @returns {Promise<Object>}
     */
    async sendScore(scoreData = {}) {
      const payload = {
        appId: this.config.appId,
        playerId: this.playerId,
        sessionId: this.sessionId,
        score: Number(scoreData.score || 0),
        bestScore: Number(scoreData.bestScore || 0),
        maxCombo: Number(scoreData.combo || 0),
        durationSeconds: Math.round(Number(scoreData.duration || 0)),
        timestamp: new Date().toISOString(),
        device: {
          userAgent: navigator.userAgent,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight
        },
        metadata: scoreData.metadata || {}
      };

      this.log('Preparing to send score payload:', payload);

      // If offline or no network, queue directly
      if (!this.isOnline) {
        this.queueScore(payload);
        return { success: false, queued: true, message: 'Device offline. Score queued for retry.' };
      }

      try {
        const headers = {
          'Content-Type': 'application/json'
        };
        if (this.config.apiKey) {
          headers['Authorization'] = 'Bearer ' + this.config.apiKey;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('HTTP ' + response.status + ': ' + response.statusText);
        }

        let responseData = {};
        try {
          responseData = await response.json();
        } catch (jsonErr) {
          responseData = { status: 'ok' };
        }

        this.log('Score successfully sent to backend!', responseData);

        // Dispatch custom event for UI or analytics
        window.dispatchEvent(new CustomEvent('flappy_score_sent', {
          detail: { payload, response: responseData }
        }));

        return { success: true, data: responseData, queued: false };
      } catch (err) {
        this.warn('Failed to send score to backend (' + err.message + '). Queuing score locally.');
        this.queueScore(payload);

        window.dispatchEvent(new CustomEvent('flappy_score_send_error', {
          detail: { payload, error: err.message }
        }));

        return { success: false, queued: true, error: err.message };
      }
    }

    queueScore(payload) {
      try {
        const existing = JSON.parse(localStorage.getItem(this.config.storageKey) || '[]');
        existing.push(payload);
        // Keep max 25 recent queued items to prevent localStorage bloat
        if (existing.length > 25) {
          existing.shift();
        }
        localStorage.setItem(this.config.storageKey, JSON.stringify(existing));
        this.log('Score added to local offline queue (Total queued:', existing.length + ')');
      } catch (e) {
        this.warn('Failed to save to localStorage queue:', e);
      }
    }

    async flushQueue() {
      let queue = [];
      try {
        queue = JSON.parse(localStorage.getItem(this.config.storageKey) || '[]');
      } catch (e) {
        queue = [];
      }

      if (!queue.length) return;
      this.log('Attempting to flush ' + queue.length + ' queued scores...');

      const remaining = [];
      for (const item of queue) {
        try {
          const headers = { 'Content-Type': 'application/json' };
          if (this.config.apiKey) headers['Authorization'] = 'Bearer ' + this.config.apiKey;

          const response = await fetch(this.config.endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(item)
          });

          if (!response.ok) {
            remaining.push(item);
          } else {
            this.log('Queued score sent successfully:', item.score);
          }
        } catch (err) {
          remaining.push(item);
        }
      }

      try {
        localStorage.setItem(this.config.storageKey, JSON.stringify(remaining));
      } catch (e) {}
    }
  }

  // Expose singleton instance to global scope
  window.ScoreSendAPI = new ScoreAPI();
})(window);
