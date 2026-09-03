/**
 * Retro Space Invaders - Application Bootstrap & Controller
 * 
 * Manages user interactions, keyboard & touch controls, UI screens,
 * audio settings, and hooks into ScoreAPI.
 */

(function () {
  'use strict';

  let game;
  let scoreApi;
  let lastGameOverStats = null;

  // DOM Elements
  const canvas = document.getElementById('game-canvas');
  const hudContainer = document.getElementById('game-hud');
  const hudScore = document.getElementById('hud-score');
  const hudHighScore = document.getElementById('hud-high-score');
  const hudWave = document.getElementById('hud-wave');
  const hudLivesContainer = document.getElementById('hud-lives-icons');
  const btnMute = document.getElementById('btn-mute');
  const btnCrtToggle = document.getElementById('btn-crt-toggle');
  const btnPause = document.getElementById('btn-pause');
  const crtOverlay = document.getElementById('crt-overlay');

  // Screens
  const startScreen = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const leaderboardModal = document.getElementById('leaderboard-modal');
  const playerNameInput = document.getElementById('player-name-input');

  // Buttons
  const btnStart = document.getElementById('btn-start');
  const btnPlayAgain = document.getElementById('btn-play-again');
  const btnSubmitScore = document.getElementById('btn-submit-score');
  const btnLeaderboardStart = document.getElementById('btn-leaderboard-start');
  const btnLeaderboardEnd = document.getElementById('btn-leaderboard-end');
  const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
  const submitStatus = document.getElementById('submit-status-text');

  // Summary Elements
  const summaryScore = document.getElementById('summary-score');
  const summaryWave = document.getElementById('summary-wave');
  const summaryAliens = document.getElementById('summary-aliens');
  const summaryAccuracy = document.getElementById('summary-accuracy');
  const summaryRankBadge = document.getElementById('summary-rank-badge');
  const leaderboardList = document.getElementById('leaderboard-list');

  // Mobile Touch Controls
  const touchControls = document.getElementById('mobile-touch-controls');
  const btnTouchLeft = document.getElementById('btn-touch-left');
  const btnTouchRight = document.getElementById('btn-touch-right');
  const btnTouchFire = document.getElementById('btn-touch-fire');

  // Key tracking
  const activeKeys = {
    left: false,
    right: false,
    shoot: false
  };

  /**
   * Bootstrap
   */
  function init() {
    // 1. Initialize Game & API
    game = new SpaceInvadersGame(canvas);
    scoreApi = window.scoreApiClient || new ScoreAPI();

    // 2. Load saved settings
    if (playerNameInput) {
      const savedName = localStorage.getItem('invaders_player_name');
      if (savedName) playerNameInput.value = savedName;
    }

    const crtDisabled = localStorage.getItem('invaders_crt_disabled') === 'true';
    if (crtDisabled && crtOverlay) {
      crtOverlay.classList.add('crt-off');
      btnCrtToggle.textContent = 'HOLO: OFF';
    }

    updateMuteButtonUI();

    // 3. Bind Game Callbacks
    game.onScoreUpdate = (score, highScore) => {
      if (hudScore) hudScore.textContent = score.toString().padStart(5, '0');
      if (hudHighScore) hudHighScore.textContent = highScore.toString().padStart(5, '0');
    };

    game.onLivesUpdate = (lives) => {
      renderLives(lives);
    };

    game.onWaveUpdate = (wave) => {
      if (hudWave) hudWave.textContent = `WAVE ${wave}`;
    };

    game.onGameOverCallback = (stats) => {
      handleGameOver(stats);
    };

    // 4. Bind ScoreAPI Event Handlers
    scoreApi.on('status', (data) => {
      if (submitStatus) {
        submitStatus.textContent = data.message;
        submitStatus.className = 'status-feedback status-info';
      }
    });

    scoreApi.on('success', ({ result }) => {
      if (submitStatus) {
        submitStatus.textContent = `✅ ${result.message || 'Score recorded!'}`;
        submitStatus.className = 'status-feedback status-success';
      }
      if (summaryRankBadge && result.rankTitle) {
        summaryRankBadge.textContent = result.rankTitle;
      }
      if (btnSubmitScore) {
        btnSubmitScore.disabled = true;
        btnSubmitScore.textContent = '✔️ SCORE RECORDED';
      }
    });

    scoreApi.on('error', ({ error }) => {
      if (submitStatus) {
        submitStatus.textContent = `⚠️ Saved offline (${error ? error.message : 'network unavailable'}). Will sync when reconnected.`;
        submitStatus.className = 'status-feedback status-warning';
      }
    });

    // 5. Setup UI & Input Listeners
    setupInputListeners();
    setupButtonListeners();
    detectTouchDevice();

    // 6. Start Canvas Render Loop
    game.startLoop();
  }

  /**
   * Render Mini Cannon icons in HUD
   */
  function renderLives(lives) {
    if (!hudLivesContainer) return;
    hudLivesContainer.innerHTML = '';
    for (let i = 0; i < Math.max(0, lives); i++) {
      const icon = document.createElement('span');
      icon.className = 'life-icon';
      icon.title = 'Reserve Cannon';
      hudLivesContainer.appendChild(icon);
    }
  }

  /**
   * Handle Game Over Transition
   */
  function handleGameOver(stats) {
    lastGameOverStats = stats;

    if (summaryScore) summaryScore.textContent = `${stats.score} PTS`;
    if (summaryWave) summaryWave.textContent = `WAVE ${stats.wave}`;
    if (summaryAliens) summaryAliens.textContent = `${stats.aliensKilled}`;
    if (summaryAccuracy) summaryAccuracy.textContent = `${stats.accuracy}%`;

    // Calculate preliminary badge
    if (summaryRankBadge) {
      if (stats.score >= 5000) summaryRankBadge.textContent = 'Galactic Emperor 👑';
      else if (stats.score >= 3000) summaryRankBadge.textContent = 'Star Marshal ⭐';
      else if (stats.score >= 1500) summaryRankBadge.textContent = 'Space Ace 🚀';
      else if (stats.score >= 700) summaryRankBadge.textContent = 'Veteran Gunner 🛡️';
      else summaryRankBadge.textContent = 'Space Cadet 🛸';
    }

    if (btnSubmitScore) {
      btnSubmitScore.disabled = false;
      btnSubmitScore.textContent = '🚀 SUBMIT SCORE TO API';
    }
    if (submitStatus) {
      submitStatus.textContent = '';
      submitStatus.className = 'status-feedback';
    }

    gameOverScreen.classList.remove('hidden');
  }

  /**
   * Keyboard & Controls Binding
   */
  function setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      // First user key interaction un-mutes / initializes AudioContext
      game.sound.initContext();

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        activeKeys.left = true;
        game.player.moveLeft();
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        activeKeys.right = true;
        game.player.moveRight();
      } else if (e.code === 'Space') {
        // Prevent scrolling
        e.preventDefault();
        activeKeys.shoot = true;
        game.playerShoot();
      } else if (e.code === 'KeyP') {
        const isPaused = game.togglePause();
        if (btnPause) btnPause.textContent = isPaused ? '▶️' : '⏸️';
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        activeKeys.left = false;
        if (activeKeys.right) game.player.moveRight();
        else game.player.stopMove();
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        activeKeys.right = false;
        if (activeKeys.left) game.player.moveLeft();
        else game.player.stopMove();
      } else if (e.code === 'Space') {
        activeKeys.shoot = false;
      }
    });

    // Touch Button Events (Mobile / Tablet)
    if (btnTouchLeft) {
      const startLeft = (e) => {
        e.preventDefault();
        game.sound.initContext();
        activeKeys.left = true;
        game.player.moveLeft();
      };
      const endLeft = (e) => {
        e.preventDefault();
        activeKeys.left = false;
        if (activeKeys.right) game.player.moveRight();
        else game.player.stopMove();
      };
      btnTouchLeft.addEventListener('touchstart', startLeft, { passive: false });
      btnTouchLeft.addEventListener('touchend', endLeft, { passive: false });
      btnTouchLeft.addEventListener('mousedown', startLeft);
      btnTouchLeft.addEventListener('mouseup', endLeft);
    }

    if (btnTouchRight) {
      const startRight = (e) => {
        e.preventDefault();
        game.sound.initContext();
        activeKeys.right = true;
        game.player.moveRight();
      };
      const endRight = (e) => {
        e.preventDefault();
        activeKeys.right = false;
        if (activeKeys.left) game.player.moveLeft();
        else game.player.stopMove();
      };
      btnTouchRight.addEventListener('touchstart', startRight, { passive: false });
      btnTouchRight.addEventListener('touchend', endRight, { passive: false });
      btnTouchRight.addEventListener('mousedown', startRight);
      btnTouchRight.addEventListener('mouseup', endRight);
    }

    if (btnTouchFire) {
      const startFire = (e) => {
        e.preventDefault();
        game.sound.initContext();
        game.playerShoot();
      };
      btnTouchFire.addEventListener('touchstart', startFire, { passive: false });
      btnTouchFire.addEventListener('mousedown', startFire);
    }
  }

  /**
   * UI Buttons Binding
   */
  function setupButtonListeners() {
    // Start Game
    btnStart.addEventListener('click', () => {
      savePlayerName();
      game.sound.initContext();
      startScreen.classList.add('hidden');
      hudContainer.classList.remove('hidden');
      game.startNewGame();
    });

    // Play Again
    btnPlayAgain.addEventListener('click', () => {
      gameOverScreen.classList.add('hidden');
      game.startNewGame();
    });

    // Submit Score via ScoreAPI
    btnSubmitScore.addEventListener('click', async () => {
      if (!lastGameOverStats) return;

      savePlayerName();
      const playerName = playerNameInput ? (playerNameInput.value.trim() || 'SpaceDefender') : 'SpaceDefender';

      btnSubmitScore.disabled = true;
      btnSubmitScore.textContent = '⏳ TRANSMITTING...';

      try {
        await scoreApi.submitScore({
          playerName: playerName,
          score: lastGameOverStats.score,
          wave: lastGameOverStats.wave,
          aliensKilled: lastGameOverStats.aliensKilled,
          ufoHits: lastGameOverStats.ufoHits,
          shotsFired: lastGameOverStats.shotsFired,
          durationSeconds: lastGameOverStats.durationSeconds
        });
      } catch (err) {
        console.warn('Submission handled by ScoreAPI error hook:', err);
      }
    });

    // Leaderboard Modals
    const openLeaderboard = async () => {
      leaderboardModal.classList.remove('hidden');
      await loadLeaderboardUI();
    };

    btnLeaderboardStart.addEventListener('click', openLeaderboard);
    btnLeaderboardEnd.addEventListener('click', openLeaderboard);
    btnCloseLeaderboard.addEventListener('click', () => {
      leaderboardModal.classList.add('hidden');
    });

    // Sound Mute Toggle
    btnMute.addEventListener('click', () => {
      const muted = game.sound.toggleMute();
      updateMuteButtonUI();
    });

    // Holographic Tactical Grid Toggle
    btnCrtToggle.addEventListener('click', () => {
      if (!crtOverlay) return;
      const isOff = crtOverlay.classList.toggle('crt-off');
      btnCrtToggle.textContent = isOff ? 'HOLO: OFF' : 'HOLO: ON';
      localStorage.setItem('invaders_crt_disabled', isOff ? 'true' : 'false');
    });

    // Pause button
    btnPause.addEventListener('click', () => {
      const isPaused = game.togglePause();
      btnPause.textContent = isPaused ? '▶️' : '⏸️';
    });
  }

  function updateMuteButtonUI() {
    if (btnMute && game) {
      btnMute.textContent = game.sound.isMuted ? '🔇' : '🔊';
      btnMute.title = game.sound.isMuted ? 'Unmute Sound' : 'Mute Sound';
    }
  }

  function savePlayerName() {
    if (playerNameInput) {
      const name = playerNameInput.value.trim() || 'SpaceDefender';
      localStorage.setItem('invaders_player_name', name);
    }
  }

  /**
   * Fetch and display Leaderboard
   */
  async function loadLeaderboardUI() {
    if (!leaderboardList) return;
    leaderboardList.innerHTML = '<div class="leaderboard-loading">📡 RETRIEVING GALACTIC SCORES...</div>';

    try {
      const list = await scoreApi.fetchLeaderboard(10);
      leaderboardList.innerHTML = '';

      if (!list || list.length === 0) {
        leaderboardList.innerHTML = '<div class="leaderboard-empty">No scores recorded yet. Be the first!</div>';
        return;
      }

      list.forEach(item => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        if (item.badge === 'YOU') row.classList.add('leaderboard-row-self');

        row.innerHTML = `
          <div class="lb-rank">#${item.rank}</div>
          <div class="lb-name">${escapeHtml(item.name)}</div>
          <div class="lb-wave">WAVE ${item.wave || 1}</div>
          <div class="lb-score">${item.score} PTS</div>
          <div class="lb-badge">${item.badge || ''}</div>
        `;
        leaderboardList.appendChild(row);
      });
    } catch (e) {
      leaderboardList.innerHTML = '<div class="leaderboard-error">Failed to load leaderboard.</div>';
    }
  }

  function detectTouchDevice() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch && touchControls) {
      touchControls.classList.remove('hidden-touch');
    }
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // Launch on window load
  window.addEventListener('DOMContentLoaded', init);
})();

