/**
 * sendscoreapi.js - Onet Classic Game Score Dispatcher API
 *
 * Dispatches game score on game over to:
 * 1. Iframe parent / top window via postMessage (standard for web game portals)
 * 2. Native Mobile WebViews (Android JavascriptInterface / iOS WKWebView)
 * 3. Custom DOM Events ('onet_game_over', 'score_submitted')
 * 4. REST API endpoint (if configured via URL parameter, window.SCORE_API_URL, or setEndpoint())
 * 5. Local storage persistence for backup & score history
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SendScoreAPI = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Read endpoint from URL query param if present (e.g. ?scoreApi=https://...)
  function getQueryParam(name) {
    if (typeof window === 'undefined' || !window.location) return null;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get(name);
    } catch (e) {
      return null;
    }
  }

  let apiEndpoint =
    (typeof window !== 'undefined' && window.SCORE_API_URL) ||
    getQueryParam('scoreApi') ||
    getQueryParam('apiUrl') ||
    null;

  const listeners = [];

  /**
   * Main Send Score function
   * @param {number} score - Player final score
   * @param {number} level - Level reached
   * @param {Object} [extra={}] - Additional details (e.g. { won: false, timeBonus: 0 })
   * @returns {Object} payload that was dispatched
   */
  function sendScore(score, level, extra = {}) {
    const numericScore = Number(score) || 0;
    const numericLevel = Number(level) || 1;

    const payload = {
      game: 'onet-game',
      title: 'Onet Classic 2D',
      action: 'sendScore',
      type: 'GAME_OVER',
      score: numericScore,
      level: numericLevel,
      won: Boolean(extra.won),
      timestamp: Date.now(),
      isoTime: new Date().toISOString(),
      ...extra
    };

    console.log('%c[SendScoreAPI] Game Over Score:', 'color: #00e5ff; font-weight: bold;', payload);

    // 1. Dispatch via postMessage to parent & top windows (if embedded in iframe)
    dispatchPostMessage(payload);

    // 2. Dispatch via Custom DOM Events on window
    dispatchDomEvent(payload);

    // 3. Dispatch to native app bridges if running inside hybrid app / webview
    dispatchNativeAppBridge(payload);

    // 4. Send to REST API endpoint if configured
    if (apiEndpoint) {
      sendToRestApi(apiEndpoint, payload);
    }

    // 5. Save submission to localStorage
    saveToLocalStorage(payload);

    // 6. Notify registered listeners
    listeners.forEach((callback) => {
      try {
        callback(payload);
      } catch (err) {
        console.error('[SendScoreAPI] Error in score listener callback:', err);
      }
    });

    return payload;
  }

  /**
   * PostMessage dispatch for iframe / host window integration
   */
  function dispatchPostMessage(payload) {
    if (typeof window === 'undefined') return;

    try {
      // Send to parent iframe container
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
        // Standard legacy format
        window.parent.postMessage(
          {
            type: 'score',
            score: payload.score,
            level: payload.level
          },
          '*'
        );
      }

      // Send to top window if nested
      if (window.top && window.top !== window && window.top !== window.parent) {
        window.top.postMessage(payload, '*');
      }

      // Send to window opener if opened via window.open()
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, '*');
      }
    } catch (err) {
      console.warn('[SendScoreAPI] postMessage dispatch failed:', err);
    }
  }

  /**
   * DOM CustomEvent dispatch
   */
  function dispatchDomEvent(payload) {
    if (typeof window === 'undefined') return;

    try {
      const eventDetail = { detail: payload };
      window.dispatchEvent(new CustomEvent('onet_game_over', eventDetail));
      window.dispatchEvent(new CustomEvent('score_submitted', eventDetail));
      window.dispatchEvent(new CustomEvent('sendScore', eventDetail));
    } catch (err) {
      console.warn('[SendScoreAPI] DOM Event dispatch error:', err);
    }
  }

  /**
   * Android / iOS Native WebView bridges
   */
  function dispatchNativeAppBridge(payload) {
    if (typeof window === 'undefined') return;

    try {
      // Android WebView JavascriptInterface
      if (window.Android) {
        if (typeof window.Android.sendScore === 'function') {
          window.Android.sendScore(payload.score);
        }
        if (typeof window.Android.onGameOver === 'function') {
          window.Android.onGameOver(JSON.stringify(payload));
        }
      }

      // iOS WKWebView messageHandlers
      if (
        window.webkit &&
        window.webkit.messageHandlers &&
        window.webkit.messageHandlers.sendScore &&
        typeof window.webkit.messageHandlers.sendScore.postMessage === 'function'
      ) {
        window.webkit.messageHandlers.sendScore.postMessage(payload);
      }
    } catch (err) {
      console.warn('[SendScoreAPI] Native bridge dispatch error:', err);
    }
  }

  /**
   * HTTP POST request to REST backend API
   */
  async function sendToRestApi(url, payload) {
    try {
      console.log('[SendScoreAPI] Posting score to REST endpoint: ' + url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn('[SendScoreAPI] REST API responded with HTTP status ' + response.status);
      } else {
        console.log('[SendScoreAPI] REST API score successfully delivered!');
      }
    } catch (err) {
      console.warn('[SendScoreAPI] Failed to post score to REST API:', err);
    }
  }

  /**
   * LocalStorage persistence for tracking & offline fallback
   */
  function saveToLocalStorage(payload) {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      localStorage.setItem('onet_last_submitted_score', JSON.stringify(payload));

      const historyKey = 'onet_score_submission_history';
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      history.unshift(payload);
      if (history.length > 20) history.pop();
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (err) {
      console.warn('[SendScoreAPI] localStorage save error:', err);
    }
  }

  // Public API
  return {
    sendScore,
    setEndpoint: function (url) {
      apiEndpoint = url;
    },
    getEndpoint: function () {
      return apiEndpoint;
    },
    onScoreSent: function (callback) {
      if (typeof callback === 'function') {
        listeners.push(callback);
      }
    },
    getLastScore: function () {
      try {
        return JSON.parse(localStorage.getItem('onet_last_submitted_score') || 'null');
      } catch (e) {
        return null;
      }
    }
  };
});
