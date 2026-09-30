/**
 * Construct 3 Runtime - Swipy Basketball Engine
 * Full implementation of physics, swipe detection, collisions, animations, sound, and juice.
 * Layout size: 1080 x 1920 (Portrait)
 */

(function (global) {
  'use strict';

  class SoundManager {
    constructor() {
      this.ctx = null;
      this.sounds = {};
      this.soundFiles = [
        'whoosh', 'swish', 'rim_hit', 'keep_it_up',
        'star_collect', 'miss', 'revive', 'button_click'
      ];
      this.initContext();
      this.loadAudioFiles();
    }

    initContext() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    loadAudioFiles() {
      this.soundFiles.forEach(name => {
        const audio = new Audio();
        audio.src = `media/${name}.wav`;
        audio.preload = 'auto';
        this.sounds[name] = audio;
      });
    }

    play(name) {
      this.resume();
      if (this.sounds[name]) {
        try {
          const clone = this.sounds[name].cloneNode();
          clone.volume = 0.85;
          clone.play().catch(() => {
            this.synth(name);
          });
          return;
        } catch (e) {
          // fallback
        }
      }
      this.synth(name);
    }

    synth(name) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      switch (name) {
        case 'whoosh':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, t);
          osc.frequency.exponentialRampToValueAtTime(140, t + 0.25);
          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
          osc.start(t);
          osc.stop(t + 0.25);
          break;

        case 'swish':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(920, t);
          osc.frequency.exponentialRampToValueAtTime(460, t + 0.32);
          gain.gain.setValueAtTime(0.45, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.32);
          osc.start(t);
          osc.stop(t + 0.32);
          break;

        case 'rim_hit':
          osc.type = 'square';
          osc.frequency.setValueAtTime(540, t);
          osc.frequency.exponentialRampToValueAtTime(180, t + 0.18);
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
          osc.start(t);
          osc.stop(t + 0.18);
          break;

        case 'star_collect':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1318, t);
          osc.frequency.setValueAtTime(1568, t + 0.08);
          osc.frequency.setValueAtTime(2093, t + 0.16);
          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
          osc.start(t);
          osc.stop(t + 0.35);
          break;

        case 'keep_it_up':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523, t);
          osc.frequency.setValueAtTime(659, t + 0.08);
          osc.frequency.setValueAtTime(784, t + 0.16);
          osc.frequency.setValueAtTime(1046, t + 0.24);
          gain.gain.setValueAtTime(0.45, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
          osc.start(t);
          osc.stop(t + 0.45);
          break;

        case 'miss':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(260, t);
          osc.frequency.exponentialRampToValueAtTime(110, t + 0.3);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
          osc.start(t);
          osc.stop(t + 0.3);
          break;

        case 'revive':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, t);
          osc.frequency.exponentialRampToValueAtTime(950, t + 0.5);
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
          osc.start(t);
          osc.stop(t + 0.5);
          break;

        case 'button_click':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(900, t);
          osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
          osc.start(t);
          osc.stop(t + 0.05);
          break;
      }
    }
  }

  class Particle {
    constructor(x, y, vx, vy, color, size, life, shape = 'circle') {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.size = size;
      this.initialSize = size;
      this.life = life;
      this.maxLife = life;
      this.shape = shape;
      this.rotation = Math.random() * Math.PI * 2;
      this.vRot = (Math.random() - 0.5) * 8;
    }

    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vy += 800 * dt;
      this.rotation += this.vRot * dt;
      this.life -= dt;
      this.size = this.initialSize * Math.max(0, this.life / this.maxLife);
    }

    draw(ctx) {
      if (this.life <= 0) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = Math.max(0, this.life / this.maxLife);

      if (this.shape === 'star') {
        const r_out = this.size;
        const r_in = this.size * 0.45;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? r_out : r_in;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class C3Runtime {
    constructor(canvas, data) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.projectData = data;

      // Layout constants matching Construct 3 project
      this.layoutWidth = 1080;
      this.layoutHeight = 1920;
      this.canvas.width = this.layoutWidth;
      this.canvas.height = this.layoutHeight;

      // Subsystems
      this.sound = new SoundManager();
      this.images = {};
      this.particles = [];
      this.floatingTexts = [];
      this.popups = [];

      // Game state variables
      this.score = 0;
      this.bestScore = parseInt(localStorage.getItem('swipy_best_score') || '0', 10);
      this.stars = parseInt(localStorage.getItem('swipy_stars') || '0', 10);
      this.streak = 0;
      this.revivesUsed = 0;
      this.gameState = 'PLAYING'; // PLAYING, REVIVE, GAMEOVER

      // Revive countdown
      this.reviveTimeTotal = 5.0;
      this.reviveTimeRemaining = 5.0;

      // Visual pulse
      this.scorePulse = 1.0;
      this.starPulse = 1.0;

      // Hoop configuration (Matching exact video proportions)
      this.hoop = {
        baseX: 540,
        x: 540,
        y: 420,
        width: 640,
        height: 380,
        rimY: 500,
        rimWidth: 340,
        pegRadius: 18,
        leftPegX: 540 - 135,
        rightPegX: 540 + 135,
        netScaleY: 1.0,
        netScaleX: 1.0,
        moveTime: 0,
        amplitude: 0,
        frequency: 1.5
      };

      // Basketball state
      this.ballBaseX = 540;
      this.ballBaseY = 1520;
      this.ballRadius = 96;
      this.ball = {
        x: this.ballBaseX,
        y: this.ballBaseY,
        vx: 0,
        vy: 0,
        rotation: 0,
        scale: 1.0,
        state: 'IDLE', // IDLE, FLYING, SCORED, MISSED
        scoredThisShot: false,
        hitRim: false,
        swish: true,
        spawnProgress: 1.0
      };

      // Star collectible
      this.starItem = {
        active: false,
        x: 320,
        y: 380,
        radius: 44,
        animTime: 0
      };

      // Speed lines for high streak
      this.speedLines = [];
      for (let i = 0; i < 16; i++) {
        this.speedLines.push({
          x: Math.random() * this.layoutWidth,
          y: Math.random() * this.layoutHeight,
          speed: 1400 + Math.random() * 800,
          length: 140 + Math.random() * 220,
          width: 8 + Math.random() * 12,
          alpha: 0.15 + Math.random() * 0.18
        });
      }

      // Input tracking
      this.isPointerDown = false;
      this.dragStart = { x: 0, y: 0, time: 0 };
      this.dragCurrent = { x: 0, y: 0 };
      this.dragHistory = [];

      // Timing
      this.lastTime = performance.now();
      this.totalTime = 0;

      // Asset preloading
      this.assetList = [
        'background', 'court', 'backboard', 'rim', 'net',
        'net_swish', 'ball', 'ball_fire', 'ring_glow', 'star',
        'star_icon', 'popup_keepitup', 'popup_miss', 'popup_swish',
        'popup_perfect', 'btn_revive', 'speed_line'
      ];
    }

    start() {
      this.setupInput();
      this.preloadImages(() => {
        const loader = document.getElementById('loading-overlay');
        if (loader) {
          loader.classList.add('hidden');
          setTimeout(() => { loader.style.display = 'none'; }, 400);
        }
        this.resetGame();
        requestAnimationFrame((t) => this.loop(t));
      });
    }

    preloadImages(onComplete) {
      let loaded = 0;
      const total = this.assetList.length;

      this.assetList.forEach((name) => {
        const img = new Image();
        img.src = `images/${name}.png`;
        img.onload = () => {
          this.images[name] = img;
          loaded++;
          if (loaded >= total && onComplete) onComplete();
        };
        img.onerror = () => {
          console.warn(`Could not load images/${name}.png`);
          loaded++;
          if (loaded >= total && onComplete) onComplete();
        };
      });
    }

    setupInput() {
      const getCanvasCoords = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const scaleX = this.layoutWidth / rect.width;
        const scaleY = this.layoutHeight / rect.height;
        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
        };
      };

      const onPointerDown = (e) => {
        this.sound.resume();
        const pos = getCanvasCoords(e);
        this.handlePointerDown(pos.x, pos.y);
      };

      const onPointerMove = (e) => {
        if (!this.isPointerDown) return;
        const pos = getCanvasCoords(e);
        this.handlePointerMove(pos.x, pos.y);
      };

      const onPointerUp = (e) => {
        if (!this.isPointerDown) return;
        this.handlePointerUp();
      };

      this.canvas.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onPointerDown(e);
      }, { passive: false });

      window.addEventListener('touchmove', (e) => {
        if (!this.isPointerDown) return;
        e.preventDefault();
        onPointerMove(e);
      }, { passive: false });

      window.addEventListener('touchend', (e) => {
        if (!this.isPointerDown) return;
        e.preventDefault();
        onPointerUp(e);
      }, { passive: false });
    }

    handlePointerDown(x, y) {
      if (this.gameState === 'REVIVE') {
        // Revive button click: (540, 1020), 380x260
        if (Math.abs(x - 540) < 190 && Math.abs(y - 1020) < 130) {
          this.doRevive();
          return;
        }
        // Skip button click: (540, 1260)
        if (Math.abs(x - 540) < 140 && Math.abs(y - 1280) < 60) {
          this.triggerGameOver();
          return;
        }
        return;
      }

      if (this.gameState === 'GAMEOVER') {
        // Play Again button at (540, 1180), 480x110
        if (Math.abs(x - 540) < 240 && Math.abs(y - 1180) < 60) {
          this.sound.play('button_click');
          this.resetGame();
          return;
        }
        return;
      }

      // In PLAYING state: swipe launch detection
      if (this.ball.state === 'IDLE') {
        const dx = x - this.ball.x;
        const dy = y - this.ball.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 220 || y > 1200) {
          this.isPointerDown = true;
          this.dragStart = { x, y, time: performance.now() };
          this.dragCurrent = { x, y };
          this.dragHistory = [{ x, y, time: performance.now() }];
        }
      }
    }

    handlePointerMove(x, y) {
      this.dragCurrent = { x, y };
      this.dragHistory.push({ x, y, time: performance.now() });
      if (this.dragHistory.length > 8) {
        this.dragHistory.shift();
      }
    }

    handlePointerUp() {
      this.isPointerDown = false;
      if (this.ball.state !== 'IDLE' || this.dragHistory.length < 2) return;

      const first = this.dragHistory[0];
      const last = this.dragHistory[this.dragHistory.length - 1];

      const dt = Math.max(16, last.time - first.time) / 1000;
      const dx = last.x - first.x;
      const dy = last.y - first.y;

      if (dy < -35) {
        // Launch velocity tuning
        let vx = (dx / dt) * 0.70;
        let vy = (dy / dt) * 0.70;

        // Arcade trajectory clamping
        vy = Math.min(-1800, Math.max(-2800, vy));
        vx = Math.max(-1300, Math.min(1300, vx));

        this.launchBall(vx, vy);
      }
    }

    launchBall(vx, vy) {
      this.ball.vx = vx;
      this.ball.vy = vy;
      this.ball.state = 'FLYING';
      this.ball.scoredThisShot = false;
      this.ball.hitRim = false;
      this.ball.swish = true;
      this.sound.play('whoosh');
    }

    resetGame() {
      this.score = 0;
      this.streak = 0;
      this.revivesUsed = 0;
      this.gameState = 'PLAYING';
      this.hoop.baseX = 540;
      this.hoop.x = 540;
      this.hoop.amplitude = 0;
      this.hoop.moveTime = 0;
      this.spawnBall();
      this.maybeSpawnStar(true);
    }

    spawnBall() {
      this.ball.x = this.ballBaseX;
      this.ball.y = this.ballBaseY;
      this.ball.vx = 0;
      this.ball.vy = 0;
      this.ball.scale = 1.0;
      this.ball.rotation = 0;
      this.ball.state = 'IDLE';
      this.ball.scoredThisShot = false;
      this.ball.hitRim = false;
      this.ball.swish = true;
      this.ball.spawnProgress = 0;
    }

    doRevive() {
      this.sound.play('revive');
      this.revivesUsed++;
      this.gameState = 'PLAYING';
      this.streak = 0;
      this.spawnBall();

      for (let i = 0; i < 35; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 250 + Math.random() * 500;
        this.particles.push(new Particle(540, 1020, Math.cos(a) * s, Math.sin(a) * s, '#ffd53d', 14, 0.9, 'star'));
      }
    }

    triggerGameOver() {
      this.sound.play('button_click');
      this.gameState = 'GAMEOVER';
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem('swipy_best_score', this.bestScore.toString());
      }
      localStorage.setItem('swipy_stars', this.stars.toString());
    }

    maybeSpawnStar(force = false) {
      if (force || (!this.starItem.active && Math.random() < 0.7)) {
        this.starItem.active = true;
        const offsetSide = Math.random() < 0.5 ? -240 : 240;
        this.starItem.x = this.hoop.x + offsetSide;
        this.starItem.y = this.hoop.rimY - 120 + (Math.random() - 0.5) * 140;
      }
    }

    addPopup(type, x, y) {
      this.popups.push({
        type,
        x,
        y,
        life: 1.2,
        maxLife: 1.2,
        scale: 0.1,
        vy: -70
      });
    }

    addFloatingScore(text, x, y, color = '#ffffff') {
      this.floatingTexts.push({
        text,
        x,
        y,
        life: 1.0,
        maxLife: 1.0,
        scale: 0.2,
        vy: -110,
        color
      });
    }

    loop(currentTime) {
      const dt = Math.min(0.05, (currentTime - this.lastTime) / 1000);
      this.lastTime = currentTime;
      this.totalTime += dt;

      this.update(dt);
      this.draw();

      requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
      // 1. Update Hoop position
      if (this.score >= 3) {
        this.hoop.amplitude = Math.min(300, 140 + (this.score - 3) * 14);
        this.hoop.frequency = Math.min(2.8, 1.4 + (this.score - 3) * 0.08);
        this.hoop.moveTime += dt * this.hoop.frequency;
        this.hoop.x = this.hoop.baseX + this.hoop.amplitude * Math.sin(this.hoop.moveTime);
      } else {
        this.hoop.x = this.hoop.baseX;
      }

      this.hoop.leftPegX = this.hoop.x - 135;
      this.hoop.rightPegX = this.hoop.x + 135;

      this.hoop.netScaleX += (1.0 - this.hoop.netScaleX) * 8 * dt;
      this.hoop.netScaleY += (1.0 - this.hoop.netScaleY) * 8 * dt;

      // 2. Update Ball
      if (this.ball.state === 'IDLE') {
        if (this.ball.spawnProgress < 1.0) {
          this.ball.spawnProgress = Math.min(1.0, this.ball.spawnProgress + dt * 5);
        }
      } else if (this.ball.state === 'FLYING' || this.ball.state === 'SCORED') {
        const gravity = 2500;
        this.ball.vy += gravity * dt;
        this.ball.x += this.ball.vx * dt;
        this.ball.y += this.ball.vy * dt;
        this.ball.rotation += this.ball.vx * 0.003;

        // Perspective depth scale
        const targetScale = Math.max(0.76, Math.min(1.0, 0.76 + (this.ball.y - 500) / 1400 * 0.24));
        this.ball.scale += (targetScale - this.ball.scale) * 12 * dt;

        // Trail particles on fire streak
        if (this.streak >= 2) {
          for (let i = 0; i < 2; i++) {
            this.particles.push(new Particle(
              this.ball.x + (Math.random() - 0.5) * 30,
              this.ball.y + (Math.random() - 0.5) * 30,
              (Math.random() - 0.5) * 80,
              (Math.random() - 0.5) * 80,
              Math.random() < 0.5 ? '#ffb81c' : '#ff4d4d',
              8 + Math.random() * 8,
              0.35,
              'circle'
            ));
          }
        }

        // Check Star Collection
        if (this.starItem.active) {
          const sDist = Math.hypot(this.ball.x - this.starItem.x, this.ball.y - this.starItem.y);
          if (sDist < (this.ballRadius * this.ball.scale + this.starItem.radius)) {
            this.starItem.active = false;
            this.stars++;
            this.starPulse = 1.6;
            this.sound.play('star_collect');
            this.addFloatingScore('+1', this.starItem.x, this.starItem.y, '#fcd32a');

            for (let i = 0; i < 22; i++) {
              const a = Math.random() * Math.PI * 2;
              const sp = 160 + Math.random() * 320;
              this.particles.push(new Particle(
                this.starItem.x, this.starItem.y,
                Math.cos(a) * sp, Math.sin(a) * sp,
                '#fcd32a', 12, 0.65, 'star'
              ));
            }
          }
        }

        // Backboard Collision: x in [hoop.x - 300, hoop.x + 300], y in [hoop.y - 180, hoop.rimY - 20]
        const bbLeft = this.hoop.x - 300;
        const bbRight = this.hoop.x + 300;
        const bbTop = this.hoop.y - 180;
        const bbBottom = this.hoop.rimY - 10;

        if (this.ball.x > bbLeft && this.ball.x < bbRight &&
            this.ball.y > bbTop && this.ball.y < bbBottom && this.ball.vy < 0) {
          this.ball.vy = Math.abs(this.ball.vy) * 0.45;
          this.ball.vx *= 0.7;
          this.ball.hitRim = true;
          this.ball.swish = false;
          this.sound.play('rim_hit');
        }

        // Peg Collisions (Left & Right Rim Pegs)
        const checkPeg = (px, py) => {
          const dx = this.ball.x - px;
          const dy = this.ball.y - py;
          const dist = Math.hypot(dx, dy);
          const minDist = this.ballRadius * this.ball.scale + this.hoop.pegRadius;

          if (dist < minDist && dist > 1) {
            const nx = dx / dist;
            const ny = dy / dist;
            const dot = this.ball.vx * nx + this.ball.vy * ny;
            if (dot < 0) {
              this.ball.vx = (this.ball.vx - 1.7 * dot * nx) * 0.75;
              this.ball.vy = (this.ball.vy - 1.7 * dot * ny) * 0.75;
              this.ball.hitRim = true;
              this.ball.swish = false;
              this.sound.play('rim_hit');
            }
          }
        };

        checkPeg(this.hoop.leftPegX, this.hoop.rimY);
        checkPeg(this.hoop.rightPegX, this.hoop.rimY);

        // Through-the-Hoop Scoring Trigger
        if (!this.ball.scoredThisShot && this.ball.vy > 0 &&
            Math.abs(this.ball.x - this.hoop.x) < 110 &&
            this.ball.y >= this.hoop.rimY - 10 && this.ball.y <= this.hoop.rimY + 70) {
          
          this.ball.scoredThisShot = true;
          this.ball.state = 'SCORED';

          let points = 2;
          if (this.ball.swish) {
            this.streak++;
            if (this.streak >= 3) {
              points = 4;
              this.addPopup('KEEP_IT_UP', this.hoop.x + 160, this.hoop.rimY + 220);
              this.sound.play('keep_it_up');
            } else if (this.streak === 2) {
              points = 3;
              this.addPopup('PERFECT', this.hoop.x, this.hoop.rimY + 180);
              this.sound.play('swish');
            } else {
              this.addPopup('SWISH', this.hoop.x, this.hoop.rimY + 180);
              this.sound.play('swish');
            }
          } else {
            this.streak = 1;
            points = 2;
            this.sound.play('swish');
          }

          this.score += points;
          this.scorePulse = 1.45;
          this.addFloatingScore(`+${points}`, this.hoop.x, this.hoop.rimY + 80, points >= 4 ? '#ffd21f' : '#ffffff');

          this.hoop.netScaleX = 1.35;
          this.hoop.netScaleY = 1.25;

          // Confetti particles
          for (let i = 0; i < 28; i++) {
            const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
            const sp = 200 + Math.random() * 450;
            const colors = ['#fcd32a', '#eb2165', '#3b82f6', '#10b981', '#ffffff'];
            this.particles.push(new Particle(
              this.hoop.x + (Math.random() - 0.5) * 80,
              this.hoop.rimY + 20,
              Math.cos(a) * sp,
              Math.sin(a) * sp,
              colors[Math.floor(Math.random() * colors.length)],
              9 + Math.random() * 6,
              0.8,
              Math.random() < 0.3 ? 'star' : 'circle'
            ));
          }

          this.ball.vy *= 0.45;
          this.ball.vx *= 0.6;

          setTimeout(() => {
            if (this.gameState === 'PLAYING') {
              this.spawnBall();
              this.maybeSpawnStar();
            }
          }, 650);
        }

        // Missed Shot
        if (this.ball.y > 1980 || this.ball.x < -200 || this.ball.x > this.layoutWidth + 200) {
          if (!this.ball.scoredThisShot) {
            this.ball.state = 'MISSED';
            this.streak = 0;
            this.sound.play('miss');
            this.addPopup('MISS', this.ball.x > 0 && this.ball.x < 1080 ? this.ball.x : 540, 1100);

            setTimeout(() => {
              if (this.revivesUsed === 0) {
                this.gameState = 'REVIVE';
                this.reviveTimeRemaining = this.reviveTimeTotal;
              } else {
                this.triggerGameOver();
              }
            }, 600);
          }
        }
      }

      // 3. Update Revive Countdown
      if (this.gameState === 'REVIVE') {
        this.reviveTimeRemaining -= dt;
        if (this.reviveTimeRemaining <= 0) {
          this.triggerGameOver();
        }
      }

      // 4. Update Speed lines
      this.speedLines.forEach((line) => {
        line.y += line.speed * dt;
        if (line.y > this.layoutHeight + line.length) {
          line.y = -line.length;
          line.x = Math.random() * this.layoutWidth;
        }
      });

      // 5. Update Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.update(dt);
        if (p.life <= 0) this.particles.splice(i, 1);
      }

      // 6. Update Popups
      for (let i = this.popups.length - 1; i >= 0; i--) {
        const pop = this.popups[i];
        pop.life -= dt;
        pop.y += pop.vy * dt;
        const progress = 1.0 - pop.life / pop.maxLife;
        if (progress < 0.25) {
          pop.scale = (progress / 0.25) * 1.15;
        } else if (progress < 0.4) {
          pop.scale = 1.15 - ((progress - 0.25) / 0.15) * 0.15;
        } else {
          pop.scale = 1.0;
        }
        if (pop.life <= 0) this.popups.splice(i, 1);
      }

      // 7. Update Floating Texts
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.life -= dt;
        ft.y += ft.vy * dt;
        if (ft.life <= 0) this.floatingTexts.splice(i, 1);
      }

      this.scorePulse += (1.0 - this.scorePulse) * 8 * dt;
      this.starPulse += (1.0 - this.starPulse) * 8 * dt;
    }

    draw() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.layoutWidth, this.layoutHeight);

      // --- LAYER 0: Background ---
      if (this.images.background) {
        ctx.drawImage(this.images.background, 0, 0, this.layoutWidth, this.layoutHeight);
      } else {
        ctx.fillStyle = '#463a9c';
        ctx.fillRect(0, 0, this.layoutWidth, this.layoutHeight);
      }

      // --- LAYER 1: Speed Lines ---
      if (this.streak >= 2) {
        ctx.save();
        this.speedLines.forEach((line) => {
          ctx.fillStyle = `rgba(135, 175, 255, ${line.alpha * Math.min(1.0, (this.streak - 1) * 0.5)})`;
          ctx.fillRect(line.x, line.y, line.width, line.length);
        });
        ctx.restore();
      }

      // --- LAYER 2: Basketball Court Floor (Drawn behind hoop & ball) ---
      if (this.images.court) {
        const ch = 340;
        ctx.drawImage(this.images.court, 0, this.layoutHeight - ch, this.layoutWidth, ch);
      }

      // --- LAYER 3: Backboard ---
      if (this.images.backboard) {
        const bw = this.hoop.width;
        const bh = this.hoop.height;
        ctx.drawImage(this.images.backboard, this.hoop.x - bw / 2, this.hoop.y - bh / 2, bw, bh);
      }

      // --- LAYER 4: Star Collectible ---
      if (this.starItem.active && this.images.star) {
        ctx.save();
        const bob = Math.sin(this.totalTime * 4) * 12;
        const starSize = 110;
        ctx.translate(this.starItem.x, this.starItem.y + bob);
        ctx.rotate(Math.sin(this.totalTime * 2) * 0.15);
        ctx.drawImage(this.images.star, -starSize / 2, -starSize / 2, starSize, starSize);
        ctx.restore();
      }

      // --- LAYER 5: Center Score Badge (y = 1080) ---
      ctx.save();
      const scoreStr = this.score.toString();
      const fontSize = 170 * this.scorePulse;
      ctx.font = `900 ${fontSize}px "Arial Black", Impact, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outer glow and stroke
      ctx.lineWidth = 28;
      ctx.strokeStyle = '#ffffff';
      ctx.lineJoin = 'round';
      ctx.strokeText(scoreStr, 540, 1080);

      ctx.fillStyle = '#e82669';
      ctx.fillText(scoreStr, 540, 1080);
      ctx.restore();

      // --- LAYER 6: Net Back ---
      const netW = 320 * this.hoop.netScaleX;
      const netH = 260 * this.hoop.netScaleY;
      const netX = this.hoop.x - netW / 2;
      const netY = this.hoop.rimY + 12;
      const netImg = (this.ball.state === 'SCORED' && this.images.net_swish) ? this.images.net_swish : this.images.net;
      if (netImg) {
        ctx.drawImage(netImg, netX, netY, netW, netH);
      }

      // --- LAYER 7: Launch Ring & Basketball ---
      this.drawBall(ctx);

      // --- LAYER 8: Rim Front ---
      if (this.images.rim) {
        const rw = 340;
        const rh = 56;
        ctx.drawImage(this.images.rim, this.hoop.x - rw / 2, this.hoop.rimY, rw, rh);
      }

      // --- LAYER 9: Particles ---
      this.particles.forEach((p) => p.draw(ctx));

      // --- LAYER 10: Top HUD (Star counter) ---
      ctx.save();
      const starIconSize = 64 * this.starPulse;
      if (this.images.star_icon) {
        ctx.drawImage(this.images.star_icon, 50, 60, starIconSize, starIconSize);
      }
      ctx.font = '900 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
      ctx.fillStyle = '#ffde25';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 8;
      ctx.fillText(this.stars.toString(), 135, 96);
      ctx.restore();

      // --- LAYER 11: Popups & Floating Scores ---
      this.drawPopups(ctx);

      // --- LAYER 12: Overlays (Revive or Game Over) ---
      if (this.gameState === 'REVIVE') {
        this.drawReviveDialog(ctx);
      } else if (this.gameState === 'GAMEOVER') {
        this.drawGameOverDialog(ctx);
      }
    }

    drawBall(ctx) {
      // 1. Launch Ring Glow (when IDLE)
      if (this.ball.state === 'IDLE' && this.images.ring_glow) {
        ctx.save();
        const pulse = 1.0 + Math.sin(this.totalTime * 6) * 0.08;
        const ringSize = 250 * pulse * Math.max(0.2, this.ball.spawnProgress);
        ctx.translate(this.ball.x, this.ball.y);
        ctx.drawImage(this.images.ring_glow, -ringSize / 2, -ringSize / 2, ringSize, ringSize);
        ctx.restore();
      }

      // 2. Drag trajectory line
      if (this.isPointerDown && this.ball.state === 'IDLE') {
        const dx = this.dragCurrent.x - this.dragStart.x;
        const dy = this.dragCurrent.y - this.dragStart.y;
        if (dy < -20) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 235, 120, 0.65)';
          ctx.lineWidth = 10;
          ctx.setLineDash([18, 14]);
          ctx.beginPath();
          ctx.moveTo(this.ball.x, this.ball.y);
          ctx.lineTo(this.ball.x + dx * 0.85, this.ball.y + dy * 0.85);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 3. Ball Sprite
      ctx.save();
      const bScale = this.ball.scale * Math.max(0.1, this.ball.spawnProgress);
      ctx.translate(this.ball.x, this.ball.y);
      ctx.rotate(this.ball.rotation);
      ctx.scale(bScale, bScale);

      const ballImg = (this.streak >= 2 && this.images.ball_fire) ? this.images.ball_fire : this.images.ball;
      const bSize = (this.streak >= 2) ? 260 : 220;

      if (ballImg) {
        ctx.drawImage(ballImg, -bSize / 2, -bSize / 2, bSize, bSize);
      }
      ctx.restore();
    }

    drawPopups(ctx) {
      this.popups.forEach((pop) => {
        let img = null;
        if (pop.type === 'KEEP_IT_UP') img = this.images.popup_keepitup;
        else if (pop.type === 'MISS') img = this.images.popup_miss;
        else if (pop.type === 'SWISH') img = this.images.popup_swish;
        else if (pop.type === 'PERFECT') img = this.images.popup_perfect;

        if (img) {
          ctx.save();
          ctx.translate(pop.x, pop.y);
          ctx.scale(pop.scale, pop.scale);
          ctx.globalAlpha = Math.min(1.0, pop.life / 0.3);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          ctx.restore();
        }
      });

      this.floatingTexts.forEach((ft) => {
        ctx.save();
        ctx.font = '900 68px "Arial Black", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = Math.min(1.0, ft.life / 0.3);

        ctx.lineWidth = 14;
        ctx.strokeStyle = '#221a4f';
        ctx.strokeText(ft.text, ft.x, ft.y);

        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });
    }

    drawReviveDialog(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(25, 18, 55, 0.78)';
      ctx.fillRect(0, 0, this.layoutWidth, this.layoutHeight);

      const rx = 540;
      const ry = 1020;
      const rw = 380;
      const rh = 260;

      // Depleting yellow circular timer border hugging button
      const progress = Math.max(0, this.reviveTimeRemaining / this.reviveTimeTotal);
      const timerRadius = 195;

      ctx.save();
      ctx.beginPath();
      ctx.arc(rx, ry, timerRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false);
      ctx.strokeStyle = '#ffeb3b';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.restore();

      if (this.images.btn_revive) {
        ctx.drawImage(this.images.btn_revive, rx - rw / 2, ry - rh / 2, rw, rh);
      }

      ctx.font = '900 48px "Arial Black", Impact, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SKIP', 540, 1280);
      ctx.restore();
    }

    drawGameOverDialog(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(20, 14, 45, 0.85)';
      ctx.fillRect(0, 0, this.layoutWidth, this.layoutHeight);

      const cx = 540;
      const cy = 960;
      const cw = 760;
      const ch = 840;

      ctx.fillStyle = '#392c7d';
      ctx.strokeStyle = '#54c0c5';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.roundRect(cx - cw / 2, cy - ch / 2, cw, ch, 44);
      ctx.fill();
      ctx.stroke();

      // Title: GAME OVER
      ctx.font = '900 84px "Arial Black", Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#eb2165';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 16;
      ctx.strokeText('GAME OVER', cx, cy - 280);
      ctx.fillText('GAME OVER', cx, cy - 280);

      // Score Stat
      ctx.font = '800 38px -apple-system, sans-serif';
      ctx.fillStyle = '#b0b8db';
      ctx.fillText('SCORE', cx, cy - 160);
      ctx.font = '900 88px "Arial Black", Impact, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.score.toString(), cx, cy - 90);

      // Best Score Stat
      ctx.font = '800 36px -apple-system, sans-serif';
      ctx.fillStyle = '#b0b8db';
      ctx.fillText('BEST SCORE', cx, cy + 10);
      ctx.font = '900 68px "Arial Black", Impact, sans-serif';
      ctx.fillStyle = '#ffde25';
      ctx.fillText(this.bestScore.toString(), cx, cy + 75);

      // Stars Stat
      if (this.images.star_icon) {
        ctx.drawImage(this.images.star_icon, cx - 65, cy + 140, 48, 48);
        ctx.font = '900 44px "Arial Black", Impact, sans-serif';
        ctx.fillStyle = '#ffde25';
        ctx.textAlign = 'left';
        ctx.fillText(this.stars.toString(), cx - 5, cy + 164);
        ctx.textAlign = 'center';
      }

      const btnW = 480;
      const btnH = 110;
      const btnY = cy + 270;

      ctx.fillStyle = '#10b981';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, 32);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 52px "Arial Black", Impact, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('PLAY AGAIN', cx, btnY);

      ctx.restore();
    }
  }

  global.C3Runtime = C3Runtime;
})(window);
