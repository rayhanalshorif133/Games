/**
 * Main Controller - Bootstrapping, UI Coordination & Score API Hooks
 * Construct 3 Compatible Architecture
 */

(function () {
  'use strict';

  // Game Instances
  let canvas, ctx;
  let renderer, soundEngine, game, scoreApi;
  let lastTimestamp = 0;
  let playerName = 'Striker';
  let matchSummaryData = null;

  // UI Element References
  const UI = {
    startScreen: document.getElementById('start-screen'),
    hud: document.getElementById('game-hud'),
    gameOverScreen: document.getElementById('game-over-screen'),
    leaderboardModal: document.getElementById('leaderboard-modal'),
    
    // Start screen inputs
    playerNameInput: document.getElementById('player-name-input'),
    btnStart: document.getElementById('btn-start-tournament'),
    btnViewLeaderboardStart: document.getElementById('btn-leaderboard-start'),

    // HUD displays
    hudKickCount: document.getElementById('hud-kick-count'),
    hudScore: document.getElementById('hud-score'),
    hudGkLevel: document.getElementById('hud-gk-level'),
    hudStreak: document.getElementById('hud-streak'),
    hudHistoryDots: document.getElementById('hud-history-dots'),
    btnMute: document.getElementById('btn-mute'),

    // Game over screen
    summaryScore: document.getElementById('summary-score'),
    summaryGoals: document.getElementById('summary-goals'),
    summaryAccuracy: document.getElementById('summary-accuracy'),
    summaryExtraKicks: document.getElementById('summary-extra-kicks'),
    summaryTopBins: document.getElementById('summary-top-bins'),
    summaryRankBadge: document.getElementById('summary-rank-badge'),
    btnSubmitScore: document.getElementById('btn-submit-score'),
    submitStatusText: document.getElementById('submit-status-text'),
    btnPlayAgain: document.getElementById('btn-play-again'),
    btnViewLeaderboardEnd: document.getElementById('btn-leaderboard-end'),

    // Leaderboard modal
    leaderboardList: document.getElementById('leaderboard-list'),
    btnCloseLeaderboard: document.getElementById('btn-close-leaderboard')
  };

  function init() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) {
      console.error('Canvas element #game-canvas not found!');
      return;
    }

    // Initialize systems
    soundEngine = window.soundEngine || new SoundEngine();
    renderer = new GameRenderer(canvas);
    game = new FootballKickGame(canvas, soundEngine, renderer);
    scoreApi = window.scoreApiClient || new ScoreAPI();

    // Hook game events
    game.onStateChange = updateHUD;
    game.onGameOver = handleGameOver;

    // Hook ScoreAPI events
    scoreApi.on('status', data => {
      if (UI.submitStatusText) {
        UI.submitStatusText.textContent = data.message;
      }
    });

    scoreApi.on('success', ({ result }) => {
      if (UI.submitStatusText) {
        UI.submitStatusText.className = 'status-confirmed';
        UI.submitStatusText.textContent = `✓ ${result.message}`;
      }
      if (UI.btnSubmitScore) {
        UI.btnSubmitScore.disabled = true;
        UI.btnSubmitScore.textContent = 'SCORE SUBMITTED!';
      }
    });

    scoreApi.on('error', ({ error }) => {
      if (UI.submitStatusText) {
        UI.submitStatusText.className = 'status-error';
        UI.submitStatusText.textContent = `Offline: Saved locally to sync later (${error.message || 'Network error'})`;
      }
    });

    // Attach User Input Listeners
    setupInputListeners();

    // Attach UI Button Listeners
    setupButtonListeners();

    // Start RAF Animation Loop
    lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop);

    console.log('[FootballKick] Game initialized successfully. Ready for tournament!');
  }

  // ================= INPUT COORDINATE CONVERSION =================

  function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Scale from CSS screen pixels to internal 1080 x 1920 coordinates
    const scaleX = 1080 / rect.width;
    const scaleY = 1920 / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function setupInputListeners() {
    // Prevent default touch scrolling on game canvas
    const opts = { passive: false };

    // Touch
    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const pos = getCanvasCoordinates(e);
      game.startAim(pos.x, pos.y);
    }, opts);

    window.addEventListener('touchmove', e => {
      if (!game.isAiming) return;
      e.preventDefault();
      const pos = getCanvasCoordinates(e);
      game.updateAim(pos.x, pos.y);
    }, opts);

    window.addEventListener('touchend', e => {
      if (!game.isAiming) return;
      e.preventDefault();
      const pos = e.changedTouches ? getCanvasCoordinates({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY }) : { x: 540, y: 1530 };
      game.releaseAim(pos.x, pos.y);
    }, opts);

    // Mouse
    canvas.addEventListener('mousedown', e => {
      const pos = getCanvasCoordinates(e);
      game.startAim(pos.x, pos.y);
    });

    window.addEventListener('mousemove', e => {
      if (!game.isAiming) return;
      const pos = getCanvasCoordinates(e);
      game.updateAim(pos.x, pos.y);
    });

    window.addEventListener('mouseup', e => {
      if (!game.isAiming) return;
      const pos = getCanvasCoordinates(e);
      game.releaseAim(pos.x, pos.y);
    });
  }

  function setupButtonListeners() {
    // Start Match Button
    UI.btnStart.addEventListener('click', () => {
      soundEngine.ensureContext();
      soundEngine.playWhistle(false);
      playerName = (UI.playerNameInput.value || '').trim() || 'Striker';
      
      UI.startScreen.classList.add('hidden');
      UI.hud.classList.remove('hidden');
      UI.gameOverScreen.classList.add('hidden');

      game.resetMatch();
      updateHUD(game);
    });

    // Mute Button
    UI.btnMute.addEventListener('click', () => {
      const isMuted = soundEngine.toggleMute();
      UI.btnMute.textContent = isMuted ? '🔇' : '🔊';
    });

    // Play Again Button
    UI.btnPlayAgain.addEventListener('click', () => {
      soundEngine.playWhistle(false);
      UI.gameOverScreen.classList.add('hidden');
      UI.hud.classList.remove('hidden');
      game.resetMatch();
      updateHUD(game);
    });

    // Submit Score API Button
    UI.btnSubmitScore.addEventListener('click', async () => {
      if (!matchSummaryData) return;
      UI.btnSubmitScore.disabled = true;
      UI.btnSubmitScore.textContent = 'SUBMITTING...';
      UI.submitStatusText.className = '';
      UI.submitStatusText.textContent = 'Contacting tournament server...';

      await scoreApi.submitScore({
        ...matchSummaryData,
        playerName: playerName
      });
    });

    // Leaderboard Buttons
    const openLeaderboard = async () => {
      UI.leaderboardModal.classList.remove('hidden');
      UI.leaderboardList.innerHTML = '<div class="loading">Loading tournament standings...</div>';
      const standings = await scoreApi.fetchLeaderboard(10);
      renderLeaderboard(standings);
    };

    if (UI.btnViewLeaderboardStart) UI.btnViewLeaderboardStart.addEventListener('click', openLeaderboard);
    if (UI.btnViewLeaderboardEnd) UI.btnViewLeaderboardEnd.addEventListener('click', openLeaderboard);
    if (UI.btnCloseLeaderboard) UI.btnCloseLeaderboard.addEventListener('click', () => {
      UI.leaderboardModal.classList.add('hidden');
    });
  }

  function renderLeaderboard(list) {
    if (!UI.leaderboardList) return;
    if (!list || list.length === 0) {
      UI.leaderboardList.innerHTML = '<div>No scores yet. Be the first champion!</div>';
      return;
    }

    let html = '';
    list.forEach(item => {
      html += `
        <div class="leaderboard-row">
          <span class="rank">#${item.rank}</span>
          <span class="name">${item.name}</span>
          <span class="goals">${item.goals}</span>
          <span class="score">${item.score} PTS</span>
        </div>
      `;
    });
    UI.leaderboardList.innerHTML = html;
  }

  // ================= HUD UPDATES =================

  function updateHUD(g) {
    if (!UI.hudKickCount) return;

    const remaining = g.kicksRemaining;
    const total = g.history.length + remaining;
    UI.hudKickCount.textContent = `${Math.min(total, g.history.length + 1)} / ${total}`;
    UI.hudScore.textContent = `${g.score}`;
    UI.hudGkLevel.textContent = g.goalkeeper.levelLabel;

    // Multiplier badge
    if (g.streak >= 2) {
      let mult = g.streak >= 4 ? '2.5x' : g.streak >= 3 ? '2.0x' : '1.5x';
      UI.hudStreak.textContent = `🔥 ${mult} STREAK`;
      UI.hudStreak.classList.remove('hidden');
    } else {
      UI.hudStreak.classList.add('hidden');
    }

    // History dots
    renderHistoryDots(g.history, total);
  }

  function renderHistoryDots(history, total) {
    if (!UI.hudHistoryDots) return;
    let html = '';
    for (let i = 0; i < total; i++) {
      if (i < history.length) {
        const res = history[i];
        let dotClass = 'dot-miss';
        let symbol = '✕';
        if (res === 'goal') {
          dotClass = 'dot-goal';
          symbol = '⚽';
        } else if (res === 'extra_bonus') {
          dotClass = 'dot-bonus';
          symbol = '⭐';
        } else if (res === 'saved') {
          dotClass = 'dot-saved';
          symbol = '🧤';
        }
        html += `<span class="dot ${dotClass}">${symbol}</span>`;
      } else {
        html += `<span class="dot dot-pending">${i + 1}</span>`;
      }
    }
    UI.hudHistoryDots.innerHTML = html;
  }

  // ================= GAME OVER HANDLER =================

  function handleGameOver(stats) {
    matchSummaryData = stats;

    UI.hud.classList.add('hidden');
    UI.gameOverScreen.classList.remove('hidden');

    UI.summaryScore.textContent = `${stats.score} PTS`;
    UI.summaryGoals.textContent = `${stats.goals} / ${stats.totalShots}`;
    UI.summaryAccuracy.textContent = `${stats.accuracy}%`;
    UI.summaryExtraKicks.textContent = `+${stats.extraKicksEarned}`;
    UI.summaryTopBins.textContent = `${stats.topBinsHit}`;

    // Rank Badge determination
    let badge = 'BRONZE STRIKER';
    let badgeClass = 'badge-bronze';
    if (stats.score >= 1400) {
      badge = '🏆 TOURNAMENT CHAMPION';
      badgeClass = 'badge-champion';
    } else if (stats.score >= 1000) {
      badge = '🥇 MASTER STRIKER';
      badgeClass = 'badge-gold';
    } else if (stats.score >= 600) {
      badge = '🥈 PRO STRIKER';
      badgeClass = 'badge-silver';
    }
    UI.summaryRankBadge.textContent = badge;
    UI.summaryRankBadge.className = `rank-badge ${badgeClass}`;

    // Reset submit button state
    UI.btnSubmitScore.disabled = false;
    UI.btnSubmitScore.textContent = '🚀 SUBMIT SCORE TO TOURNAMENT';
    UI.submitStatusText.textContent = '';
    UI.submitStatusText.className = '';
  }

  // ================= RAF GAME LOOP =================

  function gameLoop(timestamp) {
    const dt = Math.min(0.1, (timestamp - lastTimestamp) / 1000); // Clamp dt to prevent tunneling
    lastTimestamp = timestamp;

    // Update game physics & AI
    game.update(dt);

    // Update visual particle & animation systems
    renderer.updateVisuals(dt);

    // Render 1080x1920 scene
    renderer.renderScene(game);

    requestAnimationFrame(gameLoop);
  }

  // Construct 3 style bootstrapping
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for C3 integration if needed
  window.c3_footballGame = {
    restart: () => game && game.resetMatch(),
    getScore: () => game ? game.score : 0,
    submitScore: (data) => scoreApi && scoreApi.submitScore(data)
  };

})();

