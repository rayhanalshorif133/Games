/**
 * Duck Shooter - Backend Score API Client (sendscoreapi.js)
 * 
 * Handles reliable score submission to any backend server:
 * - Configurable API endpoint (via SCORE_API_ENDPOINT or URL query parameter)
 * - REST JSON POST with Authorization Bearer support
 * - Automatic iframe parent notification (postMessage)
 * - navigator.sendBeacon fallback for reliable dispatch on close
 * - Offline queueing with auto-sync when back online
 * - Live status tracking ('idle' | 'sending' | 'synced' | 'queued')
 */

(function (root, factory) {
  const instance = factory();
  if (typeof root !== 'undefined') {
    root.ScoreAPI = instance;
    root.sendScoreApi = instance;
  }
  if (typeof window !== 'undefined') {
    window.ScoreAPI = instance;
    window.sendScoreApi = instance;
  }
  if (typeof module === 'object' && module.exports) {
    module.exports = instance;
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_OFFLINE_QUEUE = 'DUCK_SHOOTER_OFFLINE_SCORES';
  const STORAGE_PLAYER_ID = 'DUCK_SHOOTER_PLAYER_ID';
  const STORAGE_PLAYER_NAME = 'DUCK_SHOOTER_PLAYER_NAME';

  // Helper to read query parameters safely
  function getQueryParam(name) {
    if (typeof window === 'undefined' || !window.location || !window.location.search) {
      return null;
    }
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get(name);
    } catch (e) {
      return null;
    }
  }

  // Generate or retrieve persistent player ID
  function getOrCreatePlayerId() {
    const fromParam = getQueryParam('userId') || getQueryParam('playerId') || getQueryParam('uid');
    if (fromParam) return fromParam;

    try {
      if (typeof localStorage !== 'undefined') {
        let id = localStorage.getItem(STORAGE_PLAYER_ID);
        if (!id) {
          id = 'player_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
          localStorage.setItem(STORAGE_PLAYER_ID, id);
        }
        return id;
      }
    } catch (e) {}

    return 'guest_' + Math.floor(Math.random() * 1000000);
  }

  // Get player display name
  function getPlayerName() {
    const fromParam = getQueryParam('name') || getQueryParam('playerName') || getQueryParam('user');
    if (fromParam) return fromParam;

    try {
      if (typeof localStorage !== 'undefined') {
        const name = localStorage.getItem(STORAGE_PLAYER_NAME);
        if (name) return name;
      }
    } catch (e) {}

    return 'Sharpshooter';
  }

  // Resolve backend endpoint
  function resolveEndpoint() {
    if (typeof window !== 'undefined') {
      if (window.SCORE_API_ENDPOINT) return window.SCORE_API_ENDPOINT;
      const paramEndpoint = getQueryParam('apiEndpoint') || getQueryParam('api');
      if (paramEndpoint) return paramEndpoint;
    }
    return '/api/score';
  }

  class ScoreAPIClient {
    constructor() {
      this.endpoint = resolveEndpoint();
      this.playerId = getOrCreatePlayerId();
      this.playerName = getPlayerName();
      this.token = getQueryParam('token') || (typeof window !== 'undefined' && window.SCORE_API_TOKEN) || null;
      this.status = 'idle'; // 'idle', 'sending', 'synced', 'queued'
      this.lastError = null;
      this.lastResponse = null;
      this.listeners = {
        success: [],
        error: [],
        statusChange: []
      };

      this.initNetworkListeners();
      // Try to flush any previously stored offline scores
      setTimeout(() => this.flushOfflineQueue(), 2000);
    }

    initNetworkListeners() {
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('online', () => {
          console.log('[ScoreAPI] Back online! Retrying queued scores...');
          this.flushOfflineQueue();
        });
      }
    }

    setEndpoint(url) {
      this.endpoint = url;
    }

    setUser(playerId, playerName = null, token = null) {
      if (playerId) this.playerId = playerId;
      if (playerName) this.playerName = playerName;
      if (token) this.token = token;
    }

    setStatus(newStatus) {
      this.status = newStatus;
      this.emit('statusChange', { status: newStatus, error: this.lastError });
    }

    getStatus() {
      return {
        status: this.status,
        lastError: this.lastError,
        lastResponse: this.lastResponse,
        pendingCount: this.getOfflineQueue().length,
        endpoint: this.endpoint,
        playerId: this.playerId,
        playerName: this.playerName
      };
    }

    onSuccess(fn) {
      if (typeof fn === 'function') this.listeners.success.push(fn);
      return this;
    }

    onError(fn) {
      if (typeof fn === 'function') this.listeners.error.push(fn);
      return this;
    }

    onStatusChange(fn) {
      if (typeof fn === 'function') this.listeners.statusChange.push(fn);
      return this;
    }

    emit(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(fn => {
          try { fn(data); } catch (e) { console.error('[ScoreAPI] Callback error:', e); }
        });
      }

      if (typeof window !== 'undefined' && window.dispatchEvent && typeof CustomEvent !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('duckshooter:score' + event, { detail: data }));
        } catch (e) {}
      }
    }

    /**
     * Send game score data to backend.
     * @param {Object} scoreData - Information about the completed game session.
     * @returns {Promise<Object>}
     */
    async sendScore(scoreData = {}) {
      const payload = {
        game: 'duck_shooter',
        version: '2.0.0',
        playerId: this.playerId,
        playerName: this.playerName,
        score: Number(scoreData.score) || 0,
        bestScore: Number(scoreData.bestScore) || Number(scoreData.score) || 0,
        wave: Number(scoreData.wave) || 1,
        accuracy: Number(scoreData.accuracy) || 0,
        accuracyStats: scoreData.accuracyStats || { high: 0, lowHigh: 0, medium: 0, low: 0 },
        totalShots: Number(scoreData.totalShots) || 0,
        totalHits: Number(scoreData.totalHits) || 0,
        maxCombo: Number(scoreData.maxCombo) || 0,
        timestamp: new Date().toISOString(),
        clientMeta: {
          screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        }
      };

      console.log('[ScoreAPI] Preparing score payload:', payload);

      // 1. Notify parent window if running inside an iframe (e.g. portal / webview)
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        try {
          window.parent.postMessage({
            type: 'DUCK_SHOOTER_SCORE_SUBMIT',
            payload: payload
          }, '*');
        } catch (e) {
          console.warn('[ScoreAPI] postMessage failed:', e);
        }
      }

      this.setStatus('sending');

      // 2. Perform HTTP POST to backend endpoint
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      try {
        if (typeof fetch === 'undefined') {
          throw new Error('Fetch API not supported in this environment');
        }

        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 9000) : null;

        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload),
          signal: controller ? controller.signal : undefined
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
        }

        let responseData = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = { success: true, text: await response.text() };
        }

        this.lastResponse = responseData;
        this.lastError = null;
        this.setStatus('synced');
        this.emit('success', { payload, response: responseData });
        console.log('[ScoreAPI] Score successfully submitted to backend!', responseData);
        return { success: true, response: responseData };

      } catch (err) {
        console.warn('[ScoreAPI] Backend submission failed or offline, saving to queue:', err.message);
        this.lastError = err.message;
        this.queueOffline(payload);
        this.setStatus('queued');
        this.emit('error', { payload, error: err.message });

        // Try beacon as immediate fallback if supported and not aborted
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
          try {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon(this.endpoint, blob);
          } catch (beaconErr) {}
        }

        return { success: false, queued: true, error: err.message };
      }
    }

    // Offline queue management
    getOfflineQueue() {
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(STORAGE_OFFLINE_QUEUE);
          return raw ? JSON.parse(raw) : [];
        }
      } catch (e) {}
      return [];
    }

    saveOfflineQueue(queue) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_OFFLINE_QUEUE, JSON.stringify(queue.slice(-25)));
        }
      } catch (e) {}
    }

    queueOffline(payload) {
      const queue = this.getOfflineQueue();
      queue.push(payload);
      this.saveOfflineQueue(queue);
    }

    async flushOfflineQueue() {
      const queue = this.getOfflineQueue();
      if (!queue || queue.length === 0) return;

      console.log(`[ScoreAPI] Flushing ${queue.length} pending offline scores...`);
      const remaining = [];

      for (const item of queue) {
        try {
          const headers = { 'Content-Type': 'application/json' };
          if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

          const res = await fetch(this.endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(item)
          });
          if (!res.ok) {
            remaining.push(item);
          }
        } catch (e) {
          remaining.push(item);
        }
      }

      this.saveOfflineQueue(remaining);
      if (remaining.length === 0) {
        console.log('[ScoreAPI] All offline scores successfully flushed!');
      }
    }
  }

  // Create singleton instance
  const instance = new ScoreAPIClient();
  return instance;
}));
