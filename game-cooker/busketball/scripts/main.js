/**
 * Main Game Controller for Realistic 2D Basketball
 * Manages game loop, 3-minute timer, state machine, touch/mouse inputs, and scoring.
 */
class BasketballGame {
  constructor() {
    this.canvas = document.getElementById("c3-canvas");
    this.ctx = this.canvas.getContext("2d");

    // Native resolution 1080x1920
    this.canvas.width = 1080;
    this.canvas.height = 1920;

    // Load config or defaults
    this.config = {
      gameplay: {
        roundTimeSeconds: 180,
        warningTimeSeconds: 10,
        regularScore: 2,
        swishScore: 3,
        streakThreshold: 2,
        ballRadius: 54,
        gravity: 1850,
        airResistance: 0.9985,
        ballRestitution: 0.76,
        floorRestitution: 0.65,
        backboardRestitution: 0.58,
        rimRestitution: 0.72,
        floorY: 1740,
        hoop: {
          rimY: 760,
          rimLeftX: 660,
          rimRightX: 890,
          rimRadius: 14,
          backboardX: 910,
          backboardTopY: 480,
          backboardBottomY: 920,
          backboardWidth: 26
        }
      }
    };

    // Subsystems
    this.physics = new BasketballPhysics(this.config);
    this.net = new BasketballNet(
      this.config.gameplay.hoop.rimLeftX,
      this.config.gameplay.hoop.rimRightX,
      this.config.gameplay.hoop.rimY
    );
    this.renderer = new BasketballRenderer(this.canvas, this.ctx, this.config);

    // State Variables
    this.state = "START"; // 'START', 'PLAYING', 'PAUSED', 'GAMEOVER'
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem("bball_high_score") || "0", 10);
    this.highBaskets = parseInt(localStorage.getItem("bball_high_baskets") || "0", 10);
    this.basketsMade = 0;
    this.swishCount = 0;
    this.shotsTaken = 0;
    this.streak = 0;
    this.bestStreak = 0;

    // 3-Minute Timer
    this.roundDuration = 180; // 3 minutes = 180 seconds
    this.remainingTime = this.roundDuration;
    this.lastTickTime = 0;
    this.lastSecondRecorded = 180;

    // Ball & Input
    this.ball = null;
    this.respawnTimer = 0;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragCurrent = { x: 0, y: 0 };
    this.aimingVelocity = { vx: 0, vy: 0 };
    this.aimingTrajectory = null;

    // Time Tracking
    this.lastFrameTime = performance.now();

    // Cache UI Elements
    this.hudTimer = document.getElementById("hud-timer");
    this.hudScore = document.getElementById("hud-score");
    this.hudStreak = document.getElementById("hud-streak");
    this.hudBaskets = document.getElementById("hud-baskets");
    this.hudAccuracy = document.getElementById("hud-accuracy");
    this.startModal = document.getElementById("start-modal");
    this.gameoverModal = document.getElementById("gameover-modal");
    this.soundBtn = document.getElementById("btn-sound");
    this.pauseBtn = document.getElementById("btn-pause");
    this.dragHint = document.getElementById("drag-hint");

    // Initialize
    this.initEvents();
    this.spawnBall();
    this.updateHUD();

    // Start requestAnimationFrame loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  // Setup input listeners for touch & mouse
  initEvents() {
    const canvas = this.canvas;

    // Pointer helper
    const getCanvasPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    // Pointer Down
    const onPointerDown = (e) => {
      if (this.state !== "PLAYING") return;
      if (!this.ball || !this.ball.isHeld) return;

      const pos = getCanvasPos(e);
      // Can initiate aim if touching ball area or anywhere in lower court
      const dist = Math.hypot(pos.x - this.ball.x, pos.y - this.ball.y);
      if (dist < 260 || pos.y > 1100) {
        this.isDragging = true;
        this.dragStart = { x: pos.x, y: pos.y };
        this.dragCurrent = { x: pos.x, y: pos.y };
        this.calculateAimTrajectory();
        if (this.dragHint) this.dragHint.style.display = "none";
      }
    };

    // Pointer Move
    const onPointerMove = (e) => {
      if (!this.isDragging || !this.ball || !this.ball.isHeld) return;
      const pos = getCanvasPos(e);
      this.dragCurrent = { x: pos.x, y: pos.y };
      this.calculateAimTrajectory();
    };

    // Pointer Up (Release to Shoot)
    const onPointerUp = () => {
      if (!this.isDragging || !this.ball || !this.ball.isHeld) return;
      this.isDragging = false;

      // Minimum pull threshold
      const pullDist = Math.hypot(this.dragStart.x - this.dragCurrent.x, this.dragStart.y - this.dragCurrent.y);
      if (pullDist > 25 && this.aimingVelocity.vy < -250) {
        this.shootBall(this.aimingVelocity.vx, this.aimingVelocity.vy);
      }
      this.aimingTrajectory = null;
    };

    // Mouse Events
    canvas.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    // Touch Events
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      onPointerDown(e);
    }, { passive: false });

    window.addEventListener("touchmove", (e) => {
      if (this.isDragging) e.preventDefault();
      onPointerMove(e);
    }, { passive: false });

    window.addEventListener("touchend", onPointerUp);
    window.addEventListener("touchcancel", onPointerUp);

    // UI Buttons
    document.getElementById("btn-start-play").addEventListener("click", () => {
      window.soundEngine.resume();
      this.startGame();
    });

    document.getElementById("btn-play-again").addEventListener("click", () => {
      window.soundEngine.resume();
      this.startGame();
    });

    this.soundBtn.addEventListener("click", () => {
      const isMuted = window.soundEngine.toggleMute();
      this.soundBtn.innerHTML = isMuted ? "🔇" : "🔊";
    });

    this.pauseBtn.addEventListener("click", () => {
      if (this.state === "PLAYING") {
        this.state = "PAUSED";
        this.pauseBtn.innerHTML = "▶";
      } else if (this.state === "PAUSED") {
        this.state = "PLAYING";
        this.pauseBtn.innerHTML = "⏸";
        this.lastFrameTime = performance.now();
      }
    });

    // Window resize handling (forces integer/crisp canvas scale)
    window.addEventListener("resize", () => {
      // CSS handles responsive layout automatically
    });
  }

  // Calculate slingshot / flick launch trajectory
  calculateAimTrajectory() {
    if (!this.ball) return;

    const dragDeltaX = this.dragCurrent.x - this.dragStart.x;
    const dragDeltaY = this.dragCurrent.y - this.dragStart.y;
    const pullDist = Math.hypot(dragDeltaX, dragDeltaY);

    if (pullDist < 10) return;

    // Power multiplier tuned for 1080x1920 realistic basketball velocity
    const power = 4.2;
    let vx = 0;
    let vy = 0;

    // Detect gesture direction:
    // If dragging downwards (dragDeltaY > 0): Slingshot pull-back
    if (dragDeltaY > 0) {
      vy = -dragDeltaY * power;
      // If pulled left, shoots right; if pulled down-right, calculate natural launch towards hoop
      vx = (this.dragStart.x - this.dragCurrent.x) * power;
      if (vx < 100) {
        vx = (pullDist * 0.7) * power;
      }
    } 
    // If dragging upwards (dragDeltaY < 0): Direct flick towards hoop
    else {
      vy = dragDeltaY * power;
      vx = (this.dragCurrent.x - this.dragStart.x) * power;
      if (vx < 100) {
        vx = (pullDist * 0.7) * power;
      }
    }

    // Clamp velocities for realistic basketball arc
    vx = Math.max(160, Math.min(1150, vx));
    vy = Math.min(-450, Math.max(-1900, vy));

    this.aimingVelocity = { vx, vy };

    // Get parabolic points for visual arc guide
    const points = this.physics.getTrajectoryPath(
      this.ball.x,
      this.ball.y,
      vx,
      vy,
      36,
      0.026
    );

    this.aimingTrajectory = {
      isAiming: true,
      points,
      pullLength: pullDist,
      dragStart: this.dragStart,
      dragCurrent: this.dragCurrent
    };
  }

  // Shoot the ball
  shootBall(vx, vy) {
    this.physics.shoot(this.ball, vx, vy);
    this.shotsTaken++;
    this.updateHUD();
    this.respawnTimer = 0;
  }

  // Start / Restart 3-Minute Challenge
  startGame() {
    this.state = "PLAYING";
    this.score = 0;
    this.basketsMade = 0;
    this.swishCount = 0;
    this.shotsTaken = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.remainingTime = this.roundDuration;
    this.lastSecondRecorded = 180;
    this.lastFrameTime = performance.now();

    this.startModal.classList.add("hidden");
    this.gameoverModal.classList.add("hidden");
    if (this.dragHint) this.dragHint.style.display = "flex";

    this.spawnBall();
    this.updateHUD();
  }

  // Spawn ball at dynamic realistic court spot
  spawnBall() {
    // Dynamic shooting position (between 220 and 420 X, 1420 and 1560 Y)
    const spawnX = Math.floor(Math.random() * 200 + 220);
    const spawnY = Math.floor(Math.random() * 140 + 1420);

    this.ball = this.physics.createBall(spawnX, spawnY);
    this.isDragging = false;
    this.aimingTrajectory = null;
  }

  // Handle successful basket
  onBasketScored(event) {
    const isSwish = event.isSwish;
    const basePts = event.points;

    this.basketsMade++;
    this.streak++;
    if (this.streak > this.bestStreak) {
      this.bestStreak = this.streak;
    }

    // Streak multiplier
    let bonusMultiplier = 1;
    if (this.streak >= 5) bonusMultiplier = 3;
    else if (this.streak >= 2) bonusMultiplier = 2;

    const totalPts = basePts * bonusMultiplier;
    this.score += totalPts;

    // Visuals & Sound
    window.soundEngine.playScore(isSwish);
    window.soundEngine.playCheer();

    if (isSwish) {
      this.swishCount++;
      this.renderer.addFloatingText(`+${totalPts} SWISH!`, event.ballX, event.ballY - 50, "#00ffcc", 56);
      this.renderer.spawnConfetti(event.ballX, event.ballY, 40, true);
    } else {
      this.renderer.addFloatingText(`+${totalPts}`, event.ballX, event.ballY - 40, "#fbbf24", 50);
      this.renderer.spawnConfetti(event.ballX, event.ballY, 25, false);
    }

    if (this.streak >= 2) {
      this.renderer.addFloatingText(`STREAK x${this.streak}! 🔥`, event.ballX, event.ballY - 120, "#ff6a00", 42);
    }

    this.updateHUD();
  }

  // Update HUD text & timer
  updateHUD() {
    // Timer display (MM:SS)
    const mins = Math.floor(this.remainingTime / 60);
    const secs = Math.floor(this.remainingTime % 60);
    const timerStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    this.hudTimer.textContent = timerStr;

    // Danger pulse in last 10 seconds
    if (this.remainingTime <= this.config.gameplay.warningTimeSeconds && this.remainingTime > 0) {
      this.hudTimer.classList.add("warning");
    } else {
      this.hudTimer.classList.remove("warning");
    }

    // Score & Streak
    this.hudScore.textContent = this.score;
    this.hudStreak.textContent = this.streak;

    // Sub-bar (Baskets & Accuracy)
    this.hudBaskets.textContent = this.basketsMade;
    const accuracy = this.shotsTaken > 0 ? Math.round((this.basketsMade / this.shotsTaken) * 100) : 0;
    this.hudAccuracy.textContent = `${accuracy}%`;
  }

  // End Game (Timer ran out)
  endGame() {
    this.state = "GAMEOVER";
    window.soundEngine.playBuzzer();

    // Check High Scores
    const isNewHighScore = this.score > this.highScore;
    if (isNewHighScore) {
      this.highScore = this.score;
      localStorage.setItem("bball_high_score", this.highScore.toString());
    }

    if (this.basketsMade > this.highBaskets) {
      this.highBaskets = this.basketsMade;
      localStorage.setItem("bball_high_baskets", this.highBaskets.toString());
    }

    // Populate Game Over Modal
    document.getElementById("go-score").textContent = this.score;
    document.getElementById("go-baskets").textContent = this.basketsMade;
    document.getElementById("go-swishes").textContent = this.swishCount;
    document.getElementById("go-streak").textContent = this.bestStreak;

    const finalAccuracy = this.shotsTaken > 0 ? Math.round((this.basketsMade / this.shotsTaken) * 100) : 0;
    document.getElementById("go-accuracy").textContent = `${finalAccuracy}%`;

    // Rank Badge logic based on baskets made in 3 minutes
    let rank = "ROOKIE";
    if (this.basketsMade >= 40) rank = "GOAT 🏆";
    else if (this.basketsMade >= 28) rank = "ALL-STAR 🌟";
    else if (this.basketsMade >= 18) rank = "PRO SHOOTER 🎯";
    else if (this.basketsMade >= 10) rank = "VARSITY 🏀";

    document.getElementById("go-rank").textContent = rank;
    this.gameoverModal.classList.remove("hidden");
  }

  // Main Loop
  gameLoop(currentTime) {
    const dt = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = currentTime;

    if (this.state === "PLAYING") {
      // 3-Minute Countdown
      this.remainingTime -= dt;
      if (this.remainingTime <= 0) {
        this.remainingTime = 0;
        this.updateHUD();
        this.endGame();
      } else {
        // Warning sound tick on last 10 seconds
        const currentSec = Math.ceil(this.remainingTime);
        if (currentSec <= 10 && currentSec !== this.lastSecondRecorded) {
          this.lastSecondRecorded = currentSec;
          window.soundEngine.playTick();
        }
        this.updateHUD();
      }

      // Physics update
      if (this.ball && this.ball.isShooting) {
        this.physics.update(this.ball, dt, this.net, (evt) => this.onBasketScored(evt));

        // Ball lifecycle & respawn logic
        this.respawnTimer += dt;
        const ballResting = (this.ball.y + this.ball.radius >= this.config.gameplay.floorY - 5 && Math.abs(this.ball.vy) < 30);
        const ballStray = (this.ball.x > 1060 || this.ball.x < 20 || this.ball.y > 1900);

        // Respawn conditions
        if (this.ball.hasScored && this.respawnTimer > 1.2) {
          this.spawnBall();
        } else if (!this.ball.hasScored && (ballResting || ballStray || this.respawnTimer > 2.6)) {
          // Missed shot resets streak
          if (this.streak > 0) {
            this.streak = 0;
            this.updateHUD();
          }
          this.spawnBall();
        }
      }

      // Net simulation update
      this.net.update(dt, this.ball);

      // VFX updates
      this.renderer.updateVFX(dt);
    }

    // Render Scene
    this.renderer.renderScene(
      this.ball,
      this.net,
      this.streak,
      this.aimingTrajectory,
      this.remainingTime
    );

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

window.BasketballGame = BasketballGame;

// Instantiate on DOM load
window.addEventListener("DOMContentLoaded", () => {
  window.game = new BasketballGame();
});
