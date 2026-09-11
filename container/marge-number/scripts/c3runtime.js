/**
 * c3runtime.js - Construct 3 Runtime Bridge
 * Drop & Merge Numbers
 */
(function (window) {
  'use strict';

  class C3RuntimeBridge {
    constructor() {
      this.isReady = true;
      this.gameId = 'drop-merge-numbers';
      console.log('[C3Runtime] Initialized bridge.');
    }

    getScore() {
      return window.dropMergeGame ? window.dropMergeGame.getScore() : 0;
    }

    getCoins() {
      return window.dropMergeGame ? window.dropMergeGame.getCoins() : 0;
    }

    restart() {
      if (window.dropMergeGame) window.dropMergeGame.restartGame();
    }
  }

  window.c3runtime = new C3RuntimeBridge();
  window.C3 = {
    ScriptsInEvents: {},
    Runtime: window.c3runtime
  };

})(window);
