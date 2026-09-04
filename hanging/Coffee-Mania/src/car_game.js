import { carAudio } from './car_audio.js';
import { CarRenderer, DIR_VECTORS } from './car_render.js';
import { CAR_LEVELS, getCarLevel, canCarEscape } from './car_levels.js';
import { ParticleSystem } from './particles.js';

export class CarGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.renderer = new CarRenderer();
    this.particles = new ParticleSystem();

    this.currentLevelId = parseInt(localStorage.getItem('car_escape_level') || '1', 10);
    this.coins = parseInt(localStorage.getItem('car_escape_coins') || '150', 10);
    this.stars = JSON.parse(localStorage.getItem('car_escape_stars') || '{}');

    this.state = 'PLAYING'; // PLAYING, WIN, LEVEL_SELECT
    this.levelData = null;

    this.cars = [];
    this.escapedCars = [];
    this.moveHistory = [];
    this.hintCarId = null;

    this.gridBounds = { x: 0, y: 0, w: 0, h: 0 };
    this.cellSize = 120;

    this.totalLevelCars = 0;
    this.carsRemaining = 0;
    this.movesCount = 0;
    this.levelStartTime = 0;

    this.screenShake = 0;

    this.boosters = {
      undo: 3,
      hint: 3,
      heli: 2
    };

    this.initEvents();
  }

  init() {
    this.loadLevel(this.currentLevelId);
    this.lastTime = performance.now();
    carAudio.startMusic();
    requestAnimationFrame(this.loop.bind(this));
  }

  loadLevel(levelId) {
    this.currentLevelId = levelId;
    localStorage.setItem('car_escape_level', levelId.toString());

    this.levelData = getCarLevel(levelId);
    const { cols, rows } = this.levelData;

    // Calculate grid positioning centered on 1080x1920 canvas
    // Width available is 1080, margin ~120px on sides
    const maxGridW = 860;
    const maxGridH = 1050;
    this.cellSize = Math.min(maxGridW / cols, maxGridH / rows);

    const gridW = cols * this.cellSize;
    const gridH = rows * this.cellSize;
    const gridX = (1080 - gridW) / 2;
    const gridY = 320 + (maxGridH - gridH) / 2;

    this.gridBounds = { x: gridX, y: gridY, w: gridW, h: gridH };

    // Initialize car objects with pixel coordinates
    this.cars = this.levelData.cars.map(cDef => {
      const isHoriz = cDef.direction === 'LEFT' || cDef.direction === 'RIGHT';
      const lenPx = cDef.length * this.cellSize - 12;
      const widPx = this.cellSize * 0.72;

      // Center of car in pixels
      const cx = isHoriz
        ? gridX + (cDef.c + cDef.length / 2) * this.cellSize
        : gridX + (cDef.c + 0.5) * this.cellSize;
      const cy = isHoriz
        ? gridY + (cDef.r + 0.5) * this.cellSize
        : gridY + (cDef.r + cDef.length / 2) * this.cellSize;

      return {
        id: cDef.id,
        r: cDef.r,
        c: cDef.c,
        length: lenPx,
        width: widPx,
        cellLen: cDef.length,
        direction: cDef.direction,
        colorIdx: cDef.colorIdx,
        origX: cx,
        origY: cy,
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        isEscaping: false,
        hasEscaped: false,
        isBlocked: false,
        blockedTimer: 0,
        bumpOffset: null,
        scale: 1
      };
    });

    this.escapedCars = [];
    this.moveHistory = [];
    this.hintCarId = null;

    this.totalLevelCars = this.cars.length;
    this.carsRemaining = this.cars.length;
    this.movesCount = 0;
    this.levelStartTime = performance.now();

    this.updateHUD();
    this.state = 'PLAYING';
  }

  updateHUD() {
    const elLevel = document.getElementById('carHudLevel');
    const elCars = document.getElementById('carHudCount');
    const elCoins = document.getElementById('carHudCoins');

    if (elLevel) elLevel.textContent = `Level ${this.currentLevelId}`;
    if (elCars) elCars.textContent = `${this.carsRemaining} / ${this.totalLevelCars}`;
    if (elCoins) elCoins.textContent = `${this.coins}`;

    const btnUndo = document.getElementById('carBtnUndo');
    if (btnUndo) btnUndo.textContent = `↩ Undo (${this.boosters.undo})`;

    const btnHint = document.getElementById('carBtnHint');
    if (btnHint) btnHint.textContent = `💡 Hint (${this.boosters.hint})`;

    const btnHeli = document.getElementById('carBtnHeli');
    if (btnHeli) btnHeli.textContent = `🚁 Lift (${this.boosters.heli})`;
  }

  initEvents() {
    const handleTap = (clientX, clientY) => {
      if (this.state !== 'PLAYING') return;

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = 1080 / rect.width;
      const scaleY = 1920 / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      this.onTap(x, y);
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      carAudio.init();
      handleTap(e.clientX, e.clientY);
    });
  }

  onTap(x, y) {
    // Check if clicked any car (active, non-escaping)
    const activeCars = this.cars.filter(c => !c.hasEscaped && !c.isEscaping);

    for (let i = activeCars.length - 1; i >= 0; i--) {
      const car = activeCars[i];
      const isHoriz = car.direction === 'LEFT' || car.direction === 'RIGHT';
      const halfW = (isHoriz ? car.length : car.width) / 2;
      const halfH = (isHoriz ? car.width : car.length) / 2;

      // Generous hit box for tapping
      if (
        x >= car.x - halfW - 8 &&
        x <= car.x + halfW + 8 &&
        y >= car.y - halfH - 8 &&
        y <= car.y + halfH + 8
      ) {
        this.attemptCarRelease(car);
        return;
      }
    }
  }

  attemptCarRelease(car) {
    this.movesCount++;
    this.hintCarId = null;

    // Build active cars list with grid coordinates
    const remainingGridCars = this.cars
      .filter(c => !c.hasEscaped)
      .map(c => ({
        id: c.id,
        r: c.r,
        c: c.c,
        length: c.cellLen,
        direction: c.direction
      }));

    const canEscape = canCarEscape(
      {
        id: car.id,
        r: car.r,
        c: car.c,
        length: car.cellLen,
        direction: car.direction
      },
      remainingGridCars,
      this.levelData.cols,
      this.levelData.rows
    );

    if (canEscape) {
      // Car is free to zoom out!
      car.isEscaping = true;
      carAudio.playCarEscape();

      const dirInfo = DIR_VECTORS[car.direction];
      const speed = 2200; // pixels per second
      car.vx = dirInfo.dx * speed;
      car.vy = dirInfo.dy * speed;

      // Tire smoke puff
      for (let i = 0; i < 8; i++) {
        this.particles.addSteam(car.x, car.y + 10);
      }

      // Record move for Undo
      this.moveHistory.push({
        carId: car.id,
        origX: car.origX,
        origY: car.origY
      });
    } else {
      // Car is blocked! Honk and wobble
      carAudio.playHonk();
      car.isBlocked = true;
      car.blockedTimer = 0.5; // 0.5s alert
      this.screenShake = 6;

      const dirInfo = DIR_VECTORS[car.direction];
      car.bumpOffset = { x: dirInfo.dx * 18, y: dirInfo.dy * 18 };

      setTimeout(() => {
        car.bumpOffset = null;
      }, 120);

      this.showToast('Blocked! Path is obstructed 🚨', '#ff5252');
    }
  }

  // --- BOOSTERS ---

  useUndo() {
    if (this.boosters.undo <= 0) {
      this.showToast('No Undo boosters left!', '#ff9800');
      return;
    }
    if (this.moveHistory.length === 0) {
      this.showToast('No cars to recall!', '#ff9800');
      return;
    }

    const last = this.moveHistory.pop();
    const car = this.cars.find(c => c.id === last.carId);
    if (!car) return;

    car.hasEscaped = false;
    car.isEscaping = false;
    car.x = last.origX;
    car.y = last.origY;
    car.vx = 0;
    car.vy = 0;

    this.carsRemaining++;
    this.boosters.undo--;
    carAudio.playBooster();
    this.updateHUD();
    this.showToast('Car Returned to Bay! ↩', '#4caf50');
  }

  useHint() {
    if (this.boosters.hint <= 0) {
      this.showToast('No Hints left!', '#ff9800');
      return;
    }

    const remainingGridCars = this.cars
      .filter(c => !c.hasEscaped)
      .map(c => ({
        id: c.id,
        r: c.r,
        c: c.c,
        length: c.cellLen,
        direction: c.direction
      }));

    const unblocked = remainingGridCars.find(c =>
      canCarEscape(c, remainingGridCars, this.levelData.cols, this.levelData.rows)
    );

    if (unblocked) {
      this.hintCarId = unblocked.id;
      this.boosters.hint--;
      carAudio.playBooster();
      this.updateHUD();
      this.showToast('Clear Path Highlighted! 💡', '#ffd54f');
    } else {
      this.showToast('All cars currently locked!', '#ff5252');
    }
  }

  useHeli() {
    if (this.boosters.heli <= 0) {
      this.showToast('No Helicopter Lifts left!', '#ff9800');
      return;
    }

    // Find any remaining car to airlift out
    const active = this.cars.filter(c => !c.hasEscaped && !c.isEscaping);
    if (active.length === 0) return;

    const targetCar = active[0];
    targetCar.isEscaping = true;
    targetCar.hasEscaped = true;
    this.carsRemaining--;
    this.boosters.heli--;
    carAudio.playBooster();
    carAudio.playCarEscape();
    this.particles.addTrayBurst(targetCar.x, targetCar.y, '#29b6f6');
    this.updateHUD();
    this.showToast('Car Airlifted Out! 🚁', '#29b6f6');

    if (this.carsRemaining === 0) {
      this.onLevelWin();
    }
  }

  showToast(text, color = '#ffd54f') {
    const toast = document.getElementById('carFeedback');
    if (!toast) return;
    toast.textContent = text;
    toast.style.color = color;
    toast.classList.remove('active');
    void toast.offsetWidth;
    toast.classList.add('active');
  }

  // --- LOOP ---

  loop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    this.renderer.update(dt);
    this.particles.update(dt * 60);

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Update cars
    for (const car of this.cars) {
      if (car.blockedTimer > 0) {
        car.blockedTimer -= dt;
        if (car.blockedTimer <= 0) {
          car.isBlocked = false;
        }
      }

      if (car.isEscaping && !car.hasEscaped) {
        car.x += car.vx * dt;
        car.y += car.vy * dt;

        // Check if fully exited the screen bounds
        if (
          car.x < -200 || car.x > 1280 ||
          car.y < -200 || car.y > 2120
        ) {
          car.hasEscaped = true;
          this.carsRemaining--;
          this.coins += 10;
          localStorage.setItem('car_escape_coins', this.coins.toString());
          this.updateHUD();

          if (this.carsRemaining === 0) {
            this.onLevelWin();
          }
        }
      }
    }
  }

  onLevelWin() {
    this.state = 'WIN';
    carAudio.playVictory();
    this.particles.addWinCelebration(1080, 1920);

    const elapsed = (performance.now() - this.levelStartTime) / 1000;
    let earnedStars = 3;
    if (this.movesCount > this.totalLevelCars + 2) earnedStars = 2;
    if (this.movesCount > this.totalLevelCars + 5) earnedStars = 1;

    this.stars[this.currentLevelId] = Math.max(this.stars[this.currentLevelId] || 0, earnedStars);
    localStorage.setItem('car_escape_stars', JSON.stringify(this.stars));

    this.coins += 50;
    localStorage.setItem('car_escape_coins', this.coins.toString());

    // Unlock next level
    const maxUnlocked = parseInt(localStorage.getItem('car_escape_max_unlocked') || '1', 10);
    if (this.currentLevelId + 1 > maxUnlocked) {
      localStorage.setItem('car_escape_max_unlocked', (this.currentLevelId + 1).toString());
    }

    const modal = document.getElementById('carWinModal');
    const starsEl = document.getElementById('carWinStars');
    const statsEl = document.getElementById('carWinStats');

    if (starsEl) starsEl.textContent = '⭐'.repeat(earnedStars) + '☆'.repeat(3 - earnedStars);
    if (statsEl) {
      statsEl.innerHTML = `
        <p>Time: <strong>${Math.round(elapsed)}s</strong></p>
        <p>Moves: <strong>${this.movesCount}</strong></p>
        <p>Reward: <strong>+50 Coins 🪙</strong></p>
      `;
    }
    if (modal) modal.classList.add('visible');
  }

  // --- DRAW ---

  draw() {
    const { ctx } = this;
    ctx.clearRect(0, 0, 1080, 1920);

    ctx.save();
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // 1. Draw Background, Curbs, and Painted Arrows
    this.renderer.drawBackground(ctx, 1080, 1920, this.gridBounds);

    // 2. Draw Parking Slot Grid
    const { cols, rows } = this.levelData;
    this.renderer.drawParkingSlots(ctx, this.gridBounds.x, this.gridBounds.y, cols, rows, this.cellSize);

    // 3. Draw Cars
    for (const car of this.cars) {
      if (!car.hasEscaped) {
        const isHinted = car.id === this.hintCarId;
        this.renderer.drawCar(ctx, car, isHinted);
      }
    }

    // 4. Draw Particles (Smoke, Sparks, Confetti)
    this.particles.draw(ctx);

    ctx.restore();
  }
}

