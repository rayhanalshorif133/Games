/**
 * Construct 3 Game State Manager (6-Color Palette Rotation)
 */
class GameState {
  constructor() {
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('dots_high_score') || '0', 10);
    this.coins = 150;
    this.status = 'playing';
    this.lossReason = null;
    this.timerDuration = (typeof window !== 'undefined' && typeof window.GAME_TIMER_SECONDS === 'number') 
      ? window.GAME_TIMER_SECONDS 
      : 300;
    this.timeRemaining = this.timerDuration;
    this.targetQuota = 15;

    // 5-Color Palette (Red, Yellow, Green, Orange, Purple)
    this.colorPalette = ['red', 'yellow', 'green', 'orange', 'purple'];
    this.paletteNames = {
      red: 'Red',
      yellow: 'Yellow',
      green: 'Green',
      orange: 'Orange',
      purple: 'Purple'
    };

    // Active 4 colors
    this.activeColors = ['red', 'yellow', 'green', 'orange'];
    this.colorTargets = {
      red: this.targetQuota,
      yellow: this.targetQuota,
      green: this.targetQuota,
      orange: this.targetQuota
    };

    this.onStateChanged = null;
  }

  startPlaying() {
    this.status = 'playing';
    this.notify();
  }

  pauseGame() {
    if (this.status === 'playing') {
      this.status = 'paused';
      this.notify();
    }
  }

  resumeGame() {
    if (this.status === 'paused') {
      this.status = 'playing';
      this.notify();
    }
  }

  restartGame() {
    this.score = 0;
    this.timerDuration = (typeof window !== 'undefined' && typeof window.GAME_TIMER_SECONDS === 'number') 
      ? window.GAME_TIMER_SECONDS 
      : 300;
    this.timeRemaining = this.timerDuration;
    this.activeColors = ['red', 'yellow', 'green', 'orange'];
    this.colorTargets = {
      red: this.targetQuota,
      yellow: this.targetQuota,
      green: this.targetQuota,
      orange: this.targetQuota
    };
    this.status = 'playing';
    this.lossReason = null;
    this.notify();
  }

  restartLevel() {
    this.restartGame();
  }

  loadLevel() {
    this.restartGame();
  }

  addScore(points) {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('dots_high_score', this.highScore.toString());
      } catch (e) {}
    }
    this.notify();
  }

  getNextAvailableColor(excludeColor) {
    const available = this.colorPalette.filter(
      (c) => !this.activeColors.includes(c) && c !== excludeColor
    );
    if (available.length > 0) {
      const idx = Math.floor(Math.random() * available.length);
      return available[idx];
    }
    const anyOther = this.colorPalette.filter((c) => c !== excludeColor);
    return anyOther[Math.floor(Math.random() * anyOther.length)] || this.colorPalette[0];
  }

  updateColorTarget(color, count) {
    if (typeof this.colorTargets[color] !== 'number') {
      return { completed: false };
    }

    this.colorTargets[color] = Math.max(0, this.colorTargets[color] - count);
    
    if (this.colorTargets[color] <= 0) {
      const bonusPoints = 200;
      this.addScore(bonusPoints);

      // Rotate to a new color from the palette
      const newColor = this.getNextAvailableColor(color);
      const oldColorIdx = this.activeColors.indexOf(color);
      if (oldColorIdx !== -1) {
        this.activeColors[oldColorIdx] = newColor;
      }
      delete this.colorTargets[color];
      this.colorTargets[newColor] = this.targetQuota;

      this.notify();
      return { 
        completed: true, 
        bonusPoints, 
        oldColor: color, 
        newColor: newColor,
        newColorName: this.paletteNames[newColor] || newColor
      };
    }

    this.notify();
    return { completed: false };
  }

  updateTimer(dt) {
    if (this.status !== 'playing') return;

    this.timeRemaining = Math.max(0, this.timeRemaining - dt);
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.status = 'lost';
      this.lossReason = 'timeout';
      this.notify();
    }
  }

  addExtraTime(seconds = 60) {
    this.timeRemaining += seconds;
    this.status = 'playing';
    this.lossReason = null;
    this.notify();
  }

  notify() {
    if (this.onStateChanged) {
      this.onStateChanged();
    }
  }
}

window.GameState = GameState;
