/**
 * Core Game State Machine & Rules Controller for Bubble Shooter 2D
 * Manages 5 Love Lives, Miss/Foul system, Ceiling Drops, Combos, Scoring, and Level Progression.
 */
class Game {
  constructor(config, grid, shooter, renderer) {
    this.config = config;
    this.grid = grid;
    this.shooter = shooter;
    this.renderer = renderer;

    this.state = 'START'; // 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'STAGE_WIN'

    // 5 Love Lives System
    this.maxLives = config.gameplay.maxLives || 5;
    this.lives = this.maxLives;

    // Score & Stats
    this.score = 0;
    this.level = 1;
    this.streak = 0;
    this.maxStreak = 0;
    this.totalPopped = 0;
    this.totalDropped = 0;

    // Miss & Ceiling descent
    this.missesBeforeDrop = config.gameplay.missesBeforeCeilingDrop || 5;
    this.missesLeft = this.missesBeforeDrop;
    this.comboThresholdForHeart = config.gameplay.comboThresholdForHeart || 3;

    // Cache DOM Elements
    this.dom = {
      score: document.getElementById('hud-score'),
      level: document.getElementById('hud-level'),
      streak: document.getElementById('hud-streak'),
      missesLeft: document.getElementById('hud-misses-left'),
      comboStatus: document.getElementById('hud-combo-status'),
      livesContainer: document.getElementById('hud-lives'),
      nextBubbleDisplay: document.getElementById('next-bubble-display'),
      dragHint: document.getElementById('drag-hint'),
      startModal: document.getElementById('start-modal'),
      gameoverModal: document.getElementById('gameover-modal'),
      winModal: document.getElementById('win-modal'),
      pauseModal: document.getElementById('pause-modal'),
      goScore: document.getElementById('go-score'),
      goPopped: document.getElementById('go-bubbles-popped'),
      goDropped: document.getElementById('go-dropped'),
      goStreak: document.getElementById('go-best-streak'),
      goReason: document.getElementById('go-reason'),
      winScore: document.getElementById('win-score'),
      winHeartsBonus: document.getElementById('win-hearts-bonus')
    };

    this.updateHUD();
    this.updateNextBubbleDisplay();
  }

  startGame() {
    this.lives = this.maxLives;
    this.score = 0;
    this.level = 1;
    this.streak = 0;
    this.maxStreak = 0;
    this.totalPopped = 0;
    this.totalDropped = 0;
    this.missesLeft = this.missesBeforeDrop;

    this.grid.generateLevel(this.level);
    this.shooter.initBubbles();
    this.state = 'PLAYING';

    this.updateHUD();
    this.updateNextBubbleDisplay();

    // Hide modals
    if (this.dom.startModal) this.dom.startModal.classList.add('hidden');
    if (this.dom.gameoverModal) this.dom.gameoverModal.classList.add('hidden');
    if (this.dom.winModal) this.dom.winModal.classList.add('hidden');
    if (this.dom.pauseModal) this.dom.pauseModal.classList.add('hidden');
  }

  nextStage() {
    this.level++;
    this.missesLeft = this.missesBeforeDrop;
    this.grid.generateLevel(this.level);
    this.shooter.initBubbles();
    this.state = 'PLAYING';

    this.updateHUD();
    this.updateNextBubbleDisplay();

    if (this.dom.winModal) this.dom.winModal.classList.add('hidden');
  }

  pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      if (this.dom.pauseModal) this.dom.pauseModal.classList.remove('hidden');
    }
  }

  resumeGame() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      if (this.dom.pauseModal) this.dom.pauseModal.classList.add('hidden');
    }
  }

  /**
   * Called when a fired bullet snaps to the hex grid
   */
  onBulletSnapped(bullet, snappedCell, hitCeiling) {
    if (!snappedCell) return;

    if (this.dom.dragHint && !this.dom.dragHint.classList.contains('hidden')) {
      this.dom.dragHint.classList.add('hidden');
    }

    // Check for matches
    const matches = this.grid.findMatches(snappedCell.row, snappedCell.col);

    if (matches.length >= 3 || (snappedCell.type === 'bomb' && matches.length > 0)) {
      // SUCCESSFUL POP!
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;

      // Pop SFX with pitch scaling
      if (snappedCell.type === 'bomb') {
        if (window.soundEngine) window.soundEngine.playBomb();
        this.renderer.addScreenShake(20);
      } else {
        if (window.soundEngine) window.soundEngine.playPop(this.streak);
      }

      // Pop particles for each matched bubble
      for (const b of matches) {
        this.renderer.addPopParticles(b.x, b.y, b.colorId, 16);
      }

      // Remove from grid
      this.grid.removeBubbles(matches);
      this.totalPopped += matches.length;

      // Check for disconnected floating bubbles to drop
      const floating = this.grid.findFloatingBubbles();
      for (const fb of floating) {
        this.renderer.addFallingBubble(fb);
      }
      this.totalDropped += floating.length;

      // Score calculation with streak multiplier
      const multiplier = 1 + (this.streak - 1) * 0.5;
      const popPoints = Math.round(matches.length * this.config.gameplay.scoring.popPerBubble * multiplier);
      const dropPoints = floating.length * this.config.gameplay.scoring.dropPerBubble;
      const totalPoints = popPoints + dropPoints;

      this.score += totalPoints;

      // Floating Score Text
      const centerBubble = matches[Math.floor(matches.length / 2)] || snappedCell;
      let scoreLabel = `+${totalPoints}`;
      if (this.streak >= 2) scoreLabel += ` (${this.streak}x STREAK!)`;
      this.renderer.addFloatingText(scoreLabel, centerBubble.x, centerBubble.y - 20, '#ffeaa7', 34);

      // Check Heart Recovery Bonus
      if (this.streak >= this.comboThresholdForHeart || matches.length >= 8) {
        this.recoverLife();
      }

      // Check Level Clear
      if (this.grid.isCleared()) {
        this.triggerStageWin();
        return;
      }
    } else {
      // MISSED SHOT / FOUL!
      this.streak = 0;
      this.loseLife();

      this.missesLeft--;
      if (this.missesLeft <= 0) {
        this.missesLeft = this.missesBeforeDrop;
        this.grid.descendCeiling();
        this.renderer.addScreenShake(14);
        this.renderer.addFloatingText('⚠️ CEILING LOWERED!', 540, this.grid.ceilingY + 60, '#ff4757', 36);
        if (window.soundEngine) window.soundEngine.playCeilingDrop();
      }
    }

    // Check Danger Line Breach
    if (this.grid.hasCrossedDangerLine(this.config.gameplay.bottomDangerY)) {
      this.triggerGameOver('danger_line');
      return;
    }

    this.updateHUD();
    this.updateNextBubbleDisplay();
  }

  /**
   * Decrements 1 Love Heart life and animates the loss
   */
  loseLife() {
    if (this.lives <= 0) return;

    this.lives--;
    const lostIndex = this.lives; // Slot 0 to 4

    // Trigger Heart Shatter in HUD
    const slots = this.dom.livesContainer ? this.dom.livesContainer.querySelectorAll('.heart-slot') : [];
    if (slots[lostIndex]) {
      slots[lostIndex].classList.remove('heart-full');
      slots[lostIndex].classList.add('heart-empty', 'shatter');
      setTimeout(() => {
        slots[lostIndex].classList.remove('shatter');
      }, 600);
    }

    // Audio & Visual Effects
    if (window.soundEngine) window.soundEngine.playHeartLost();
    this.renderer.addScreenShake(15);
    this.renderer.addHeartShatterParticles(540, 200, 28);
    this.renderer.addFloatingText(`💔 LIFE LOST! (${this.lives} LEFT)`, 540, 360, '#ff2d55', 38);

    if (this.lives <= 0) {
      this.triggerGameOver('out_of_hearts');
    }
  }

  /**
   * Recovers 1 Love Heart life if under 5
   */
  recoverLife() {
    if (this.lives < this.maxLives) {
      const recoveredIndex = this.lives;
      this.lives++;

      const slots = this.dom.livesContainer ? this.dom.livesContainer.querySelectorAll('.heart-slot') : [];
      if (slots[recoveredIndex]) {
        slots[recoveredIndex].classList.remove('heart-empty');
        slots[recoveredIndex].classList.add('heart-full');
      }

      if (window.soundEngine) window.soundEngine.playHeartGain();
      this.renderer.addFloatingText('❤️ +1 LOVE LIFE BONUS!', 540, 380, '#ff6b8b', 40);
      this.score += this.config.gameplay.scoring.heartRecoveryBonus;
    }
  }

  triggerGameOver(reason) {
    this.state = 'GAMEOVER';
    if (window.soundEngine) window.soundEngine.playGameOver();
    this.renderer.addScreenShake(25);

    if (this.dom.gameoverModal) {
      if (this.dom.goReason) {
        if (reason === 'danger_line') {
          this.dom.goReason.innerText = 'বাবলগুলো ডেঞ্জার লাইন অতিক্রম করেছে!';
        } else {
          this.dom.goReason.innerText = 'সকল লাভ লাইভ শেষ হয়ে গেছে!';
        }
      }
      if (this.dom.goScore) this.dom.goScore.innerText = this.score.toLocaleString();
      if (this.dom.goPopped) this.dom.goPopped.innerText = this.totalPopped;
      if (this.dom.goDropped) this.dom.goDropped.innerText = this.totalDropped;
      if (this.dom.goStreak) this.dom.goStreak.innerText = this.maxStreak + 'x';
      this.dom.gameoverModal.classList.remove('hidden');
    }
  }

  triggerStageWin() {
    this.state = 'STAGE_WIN';
    const livesBonus = this.lives * 200;
    this.score += 1000 + livesBonus;

    if (window.soundEngine) window.soundEngine.playWin();
    this.renderer.addScreenShake(12);

    if (this.dom.winModal) {
      if (this.dom.winScore) this.dom.winScore.innerText = this.score.toLocaleString();
      if (this.dom.winHeartsBonus) this.dom.winHeartsBonus.innerText = `+${livesBonus} (❤️ × ${this.lives})`;
      this.dom.winModal.classList.remove('hidden');
    }
  }

  updateHUD() {
    if (this.dom.score) this.dom.score.innerText = this.score.toLocaleString();
    if (this.dom.level) this.dom.level.innerText = this.level;
    if (this.dom.streak) this.dom.streak.innerText = this.streak;
    if (this.dom.missesLeft) this.dom.missesLeft.innerText = this.missesLeft;

    if (this.dom.comboStatus) {
      if (this.streak >= 2) {
        this.dom.comboStatus.innerText = `🔥 ${this.streak}X COMBO ACTIVE!`;
        this.dom.comboStatus.style.color = '#ff9f43';
      } else {
        this.dom.comboStatus.innerText = 'READY TO SHOOT';
        this.dom.comboStatus.style.color = '#00d2d3';
      }
    }

    // Sync Love Heart Life slots in DOM
    const slots = this.dom.livesContainer ? this.dom.livesContainer.querySelectorAll('.heart-slot') : [];
    slots.forEach((slot, index) => {
      if (index < this.lives) {
        slot.classList.add('heart-full');
        slot.classList.remove('heart-empty');
      } else {
        slot.classList.remove('heart-full');
        slot.classList.add('heart-empty');
      }
    });
  }

  updateNextBubbleDisplay() {
    if (!this.dom.nextBubbleDisplay || !this.shooter.nextBubble) return;
    const next = this.shooter.nextBubble;
    const colorMap = this.renderer.colorMap;
    const color = colorMap[next.colorId] || { primary: '#ff2d55', shadow: '#800018' };

    if (next.type === 'bomb') {
      this.dom.nextBubbleDisplay.style.background = 'radial-gradient(circle at 35% 35%, #64748b, #020617)';
      this.dom.nextBubbleDisplay.innerText = '💣';
      this.dom.nextBubbleDisplay.style.display = 'flex';
      this.dom.nextBubbleDisplay.style.alignItems = 'center';
      this.dom.nextBubbleDisplay.style.justifyContent = 'center';
      this.dom.nextBubbleDisplay.style.fontSize = '18px';
    } else if (next.type === 'rainbow') {
      this.dom.nextBubbleDisplay.style.background = 'conic-gradient(#ff6b6b, #feca57, #1dd1a1, #54a0ff, #ff9ff3, #ff6b6b)';
      this.dom.nextBubbleDisplay.innerText = '🌈';
      this.dom.nextBubbleDisplay.style.display = 'flex';
      this.dom.nextBubbleDisplay.style.alignItems = 'center';
      this.dom.nextBubbleDisplay.style.justifyContent = 'center';
      this.dom.nextBubbleDisplay.style.fontSize = '18px';
    } else {
      this.dom.nextBubbleDisplay.style.background = `radial-gradient(circle at 30% 30%, #ffffff, ${color.primary} 40%, ${color.shadow} 90%)`;
      this.dom.nextBubbleDisplay.innerText = '';
    }
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    this.grid.update(dt);
    const snapResult = this.shooter.update(dt);
    if (snapResult) {
      this.onBulletSnapped(snapResult.bullet, snapResult.snapped, snapResult.hitCeiling);
    }
  }
}

window.Game = Game;

