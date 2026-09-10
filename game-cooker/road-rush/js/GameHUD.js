/**
 * GameHUD.js
 * 
 * Manages all portrait HUD visual components and user interface interactions:
 * - Player HP bar with original frame images/assets/UserInterface/HpBar01.png
 * - Gold/Cash bar with original frame images/assets/UserInterface/Goldbar.png
 * - K.O. trophy counter with images/assets/UserInterface/Trophy.png
 * - Attack button images/assets/UserInterface/ActionBtn.png
 * - Brake button images/assets/ui/break_button.png
 * - Speedometer, timer, distance, tier badge, and game over modal.
 */

class GameHUD {
  constructor() {
    this.hudSpeed = document.getElementById('hud-speed');
    this.hudDistance = document.getElementById('hud-distance');
    this.hudScore = document.getElementById('hud-score');
    this.hudTimer = document.getElementById('hud-timer');
    this.tierBadge = document.getElementById('tier-badge');
    this.hpFill = document.getElementById('hp-fill');
    this.hpText = document.getElementById('hp-text');
    this.goldText = document.getElementById('gold-text');
    this.koText = document.getElementById('ko-text');
    this.brakeBarFill = document.getElementById('brake-bar-fill');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.startScreen = document.getElementById('start-screen');
    this.attackWrapper = document.getElementById('attack-button-wrapper');
    this.brakeWrapper = document.getElementById('brake-button-wrapper');

    this.bindEvents();
  }

  bindEvents() {
    // Attack Button
    if (this.attackWrapper) {
      this.attackWrapper.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (window.player) window.player.performAttack();
      });
    }

    // Brake Button
    if (this.brakeWrapper) {
      const onBrakeDown = (e) => {
        if (e) e.preventDefault();
        if (window.player && !window.player.isBrakeOverheated) {
          window.player.isBraking = true;
          this.updateBrakeUI(true);
        }
      };

      const onBrakeUp = (e) => {
        if (e) e.preventDefault();
        if (window.player) {
          window.player.isBraking = false;
          this.updateBrakeUI(false);
        }
      };

      this.brakeWrapper.addEventListener('pointerdown', onBrakeDown);
      this.brakeWrapper.addEventListener('pointerup', onBrakeUp);
      this.brakeWrapper.addEventListener('pointercancel', onBrakeUp);
      this.brakeWrapper.addEventListener('pointerleave', onBrakeUp);
    }

    // Start & Restart
    const triggerStart = () => {
      if (window.gameManager && window.gameManager.currentState !== GameState.PLAYING) {
        if (this.startScreen) this.startScreen.classList.add('hidden');
        if (this.gameOverScreen) this.gameOverScreen.classList.add('hidden');
        if (window.startGame) window.startGame();
      }
    };

    const btnStart = document.getElementById('btn-start');
    const btnRestart = document.getElementById('btn-restart');

    if (btnStart) btnStart.addEventListener('click', triggerStart);
    if (btnRestart) btnRestart.addEventListener('click', triggerStart);
    if (this.startScreen) this.startScreen.addEventListener('click', triggerStart);

    window.addEventListener('keydown', e => {
      if (window.gameManager && window.gameManager.currentState !== GameState.PLAYING) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          triggerStart();
        }
      }
    });
  }

  update() {
    if (!window.gameManager) return;

    // Speed
    const kmh = Math.round(window.gameManager.scrollSpeed * 0.16);
    if (this.hudSpeed) this.hudSpeed.innerHTML = kmh + ' <span class="unit">km/h</span>';

    // Distance & Score
    if (this.hudDistance) this.hudDistance.innerHTML = Math.floor(window.gameManager.distanceMeters) + ' <span class="unit">m</span>';
    if (this.hudScore) this.hudScore.innerText = window.gameManager.score.toLocaleString();

    // Cash & KOs
    if (this.goldText) this.goldText.innerText = '$ ' + window.gameManager.cash.toLocaleString();
    if (this.koText) this.koText.innerText = 'K.O. ' + window.gameManager.kos;

    // Timer
    const t = window.gameManager.gameTimer;
    const mins = Math.floor(t / 60).toString().padStart(2, '0');
    const secs = Math.floor(t % 60).toString().padStart(2, '0');
    const ms = Math.floor((t * 10) % 10);
    if (this.hudTimer) this.hudTimer.innerText = mins + ':' + secs + '.' + ms;

    // Player HP
    if (window.player && this.hpFill && this.hpText) {
      const hpRatio = Math.max(0, window.player.hp / window.player.maxHp);
      this.hpFill.style.width = (hpRatio * 100) + '%';
      this.hpText.innerText = window.player.hp + ' / ' + window.player.maxHp + ' HP';
      if (hpRatio > 0.5) {
        this.hpFill.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
      } else if (hpRatio > 0.25) {
        this.hpFill.style.background = 'linear-gradient(90deg, #f1c40f, #e67e22)';
      } else {
        this.hpFill.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
      }
    }

    // Brake Heat Bar
    if (window.player && this.brakeBarFill) {
      const heatRatio = (window.player.brakeHeat / window.player.maxBrakeHeat) * 100;
      this.brakeBarFill.style.width = heatRatio + '%';
    }
  }

  updateTier(tier) {
    if (!this.tierBadge) return;
    this.tierBadge.className = '';
    if (tier === 'EASY') {
      this.tierBadge.classList.add('tier-easy');
      this.tierBadge.innerText = 'TIER: EASY (0-30s)';
    } else if (tier === 'MEDIUM') {
      this.tierBadge.classList.add('tier-medium');
      this.tierBadge.innerText = 'TIER: MEDIUM (30-60s)';
    } else {
      this.tierBadge.classList.add('tier-hard');
      this.tierBadge.innerText = 'TIER: HARD / INFINITE (60s+)';
    }
  }

  pulseAttackButton() {
    if (!this.attackWrapper) return;
    this.attackWrapper.classList.add('active');
    setTimeout(() => this.attackWrapper.classList.remove('active'), 180);
  }

  updateBrakeUI(active) {
    if (!this.brakeWrapper) return;
    if (active) this.brakeWrapper.classList.add('active');
    else this.brakeWrapper.classList.remove('active');
  }

  showGameOver(stats) {
    const finalKos = document.getElementById('final-kos');
    const finalCash = document.getElementById('final-cash');
    const finalTime = document.getElementById('final-time');
    const finalDist = document.getElementById('final-distance');
    const finalScore = document.getElementById('final-score');

    if (finalKos) finalKos.innerText = stats.kos;
    if (finalCash) finalCash.innerText = '$ ' + stats.cash.toLocaleString();
    if (finalTime) finalTime.innerText = stats.time.toFixed(1) + 's';
    if (finalDist) finalDist.innerText = Math.floor(stats.distance) + ' m';
    if (finalScore) finalScore.innerText = stats.score.toLocaleString();

    if (this.gameOverScreen) this.gameOverScreen.classList.remove('hidden');
  }
}

window.gameHUD = new GameHUD();
