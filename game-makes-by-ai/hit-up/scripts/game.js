// scripts/game.js - Main Game Engine, States, Camera, Input, and HUD
import { SoundManager } from './audio.js';
import { AssetManager } from './sprites.js';
import { ParticleManager } from './particles.js';
import { World } from './world.js';
import { Player } from './player.js';
import { RepairerPig, PatrolPig, BomberPig, Bomb, CannonHazard, CannonBall, KingPig } from './enemies.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Canvas resolution: 1080 x 1920
    this.canvas.width = 1080;
    this.canvas.height = 1920;

    // Enable crisp pixelated scaling
    this.ctx.imageSmoothingEnabled = false;

    // Subsystems
    this.audio = new SoundManager();
    this.assets = new AssetManager();
    this.particles = new ParticleManager();
    this.world = new World(this);
    this.player = new Player(this);

    // Entities
    this.enemies = [];
    this.bombs = [];
    this.projectiles = [];

    // Camera
    this.camera = {
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      shakeIntensity: 0,
      shakeDuration: 0,
      shake: (intensity, duration) => {
        this.camera.shakeIntensity = intensity;
        this.camera.shakeDuration = duration;
      }
    };

    // Game State
    this.state = 'LOADING'; // LOADING, START, PLAYING, PAUSED, STAGE_CLEAR, GAME_OVER
    this.loadProgress = 0;
    this.stage = 1;
    this.score = 0;
    this.gems = 0;
    this.currentFloor = 1;
    this.damageFlash = 0;
    this.deathReason = 'Enemy Attack';

    // Input States
    this.input = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      attack: false,
      attackJustPressed: false,
      upSmashJustPressed: false
    };

    this.lastTime = performance.now();

    this.setupInputs();
  }

  setupInputs() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      this.audio.init();

      if (e.repeat) return;
      const key = e.key.toLowerCase();

      if (key === 'a' || key === 'arrowleft') this.input.left = true;
      if (key === 'd' || key === 'arrowright') this.input.right = true;
      if (key === 'w' || key === 'arrowup') {
        this.input.up = true;
        this.input.jump = true;
      }
      if (key === 's' || key === 'arrowdown') this.input.down = true;
      if (key === ' ' || key === 'w') this.input.jump = true;

      // Attack keys: J, Z, X, Enter, F
      if (key === 'j' || key === 'z' || key === 'x' || key === 'enter' || key === 'f') {
        this.input.attack = true;
        this.input.attackJustPressed = true;
      }

      // Up Smash shortcut: K or U
      if (key === 'k' || key === 'u') {
        this.input.upSmashJustPressed = true;
      }

      // Pause key: P or Escape
      if (key === 'p' || key === 'escape') {
        this.togglePause();
      }

      // Start game from title / retry
      if (this.state === 'START' || this.state === 'GAME_OVER' || this.state === 'STAGE_CLEAR') {
        if (key === ' ' || key === 'enter') {
          this.handleStateAction();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') this.input.left = false;
      if (key === 'd' || key === 'arrowright') this.input.right = false;
      if (key === 'w' || key === 'arrowup') {
        this.input.up = false;
        this.input.jump = false;
      }
      if (key === 's' || key === 'arrowdown') this.input.down = false;
      if (key === ' ') this.input.jump = false;
      if (key === 'j' || key === 'z' || key === 'x' || key === 'enter' || key === 'f') {
        this.input.attack = false;
      }
    });

    // Touch / On-screen Button inputs
    this.bindTouchButton('btn-left', (pressed) => this.input.left = pressed);
    this.bindTouchButton('btn-right', (pressed) => this.input.right = pressed);
    this.bindTouchButton('btn-jump', (pressed) => {
      this.input.jump = pressed;
    });
    this.bindTouchButton('btn-attack', (pressed) => {
      this.input.attack = pressed;
      if (pressed) this.input.attackJustPressed = true;
    });
    this.bindTouchButton('btn-up-smash', (pressed) => {
      if (pressed) this.input.upSmashJustPressed = true;
    });

    // UI Buttons
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.togglePause());
    }

    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        this.audio.init();
        const isMuted = this.audio.toggleMute();
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    // Canvas click/touch for Title Screen, Game Over, Stage Clear
    this.canvas.addEventListener('pointerdown', (e) => {
      this.audio.init();
      if (this.state === 'START' || this.state === 'GAME_OVER' || this.state === 'STAGE_CLEAR') {
        this.handleStateAction();
      }
    });
  }

  bindTouchButton(id, callback) {
    const el = document.getElementById(id);
    if (!el) return;

    const start = (e) => {
      e.preventDefault();
      this.audio.init();
      callback(true);
      el.classList.add('active');
    };

    const end = (e) => {
      e.preventDefault();
      callback(false);
      el.classList.remove('active');
    };

    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', end);
  }

  handleStateAction() {
    if (this.state === 'START') {
      this.startStage(1);
    } else if (this.state === 'GAME_OVER') {
      this.score = 0;
      this.gems = 0;
      this.startStage(1);
    } else if (this.state === 'STAGE_CLEAR') {
      this.startStage(this.stage + 1);
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  }

  addScore(points) {
    this.score += points;
  }

  addGem() {
    this.gems += 1;
  }

  spawnBomb(x, y, vx, vy) {
    this.bombs.push(new Bomb(this, x, y, vx, vy));
  }

  spawnCannonBall(x, y, vx) {
    this.projectiles.push(new CannonBall(this, x, y, vx));
  }

  startStage(stageNum) {
    this.stage = stageNum;
    this.state = 'PLAYING';
    this.particles.reset();
    this.enemies = [];
    this.bombs = [];
    this.projectiles = [];

    // Build World
    this.world.buildLevel(this.stage);

    // Reset Player at bottom
    this.player.reset(540 - this.player.width / 2, this.world.groundY - this.player.height);

    // Initial camera snap to bottom
    this.camera.y = this.world.groundY - this.camera.height + 250;

    // Spawn Enemies on Floors (Balanced, smooth, fun progression)
    // Floor 1: Safe practice floor for jumping & breaking walls!

    // Floor 2: 1 slow Repairer Pig ("enemy ra vanga wall jora lagete chaiba")
    this.enemies.push(new RepairerPig(this, 2, 450));

    // Floor 3: 1 slow Patrol Pig
    this.enemies.push(new PatrolPig(this, 3, 350));

    // Floor 4: 1 slow Repairer Pig
    this.enemies.push(new RepairerPig(this, 4, 520));

    // Floor 5: 1 Bomber Pig
    this.enemies.push(new BomberPig(this, 5, 750));

    // Floor 6 (Top Throne Floor): Boss King Pig guarding the Royal Door!
    this.enemies.push(new KingPig(this, 6, 540));

    // Start chiptune BGM
    this.audio.startBGM();
  }

  triggerDamageFlash() {
    this.damageFlash = 0.45;
  }

  onPlayerDeath(reason = 'Enemy Attack') {
    this.deathReason = reason;
    setTimeout(() => {
      this.state = 'GAME_OVER';
    }, 1200);
  }

  onStageCleared() {
    setTimeout(() => {
      this.state = 'STAGE_CLEAR';
      this.addScore(2000);
    }, 1800);
  }

  async start() {
    // Show Loading
    this.state = 'LOADING';

    await this.assets.loadAll((progress) => {
      this.loadProgress = progress;
    });

    this.state = 'START';
    this.loop(performance.now());
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    this.update(dt);
    this.draw();

    // Reset single-frame inputs
    this.input.attackJustPressed = false;
    this.input.upSmashJustPressed = false;

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.state === 'PLAYING') {
      // Update Player
      this.player.update(dt, this.input);

      // Update World
      this.world.update(dt);

      // Update Enemies
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];
        enemy.update(dt);
        if (enemy.dead && enemy.currentAnim.finished) {
          this.enemies.splice(i, 1);
        }
      }

      // Update Bombs
      for (let i = this.bombs.length - 1; i >= 0; i--) {
        const b = this.bombs[i];
        b.update(dt);
        if (b.exploded && b.currentAnim.finished) {
          this.bombs.splice(i, 1);
        }
      }

      // Update Projectiles
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.update(dt);
        if (p.dead) {
          this.projectiles.splice(i, 1);
        }
      }

      // Update Particles & FX
      this.particles.update(dt);

      // Calculate player's current floor
      const playerY = this.player.y + this.player.height;
      let floorIdx = 0;
      for (let i = 0; i < this.world.floors.length; i++) {
        if (playerY <= this.world.floors[i].y + 20) {
          floorIdx = i;
        }
      }
      this.currentFloor = Math.max(1, floorIdx);

      // Camera smoothly follows player vertically
      const targetCamY = this.player.y - this.camera.height * 0.58;
      this.camera.y += (targetCamY - this.camera.y) * 0.08;

      // Clamp camera bounds
      const minCamY = 60;
      const maxCamY = this.world.groundY - this.camera.height + 150;
      if (this.camera.y < minCamY) this.camera.y = minCamY;
      if (this.camera.y > maxCamY) this.camera.y = maxCamY;

      // Damage Flash Timer
      if (this.damageFlash > 0) {
        this.damageFlash -= dt;
      }

      // Camera Shake
      if (this.camera.shakeDuration > 0) {
        this.camera.shakeDuration -= dt;
        this.camera.x = (Math.random() * 2 - 1) * this.camera.shakeIntensity;
        this.camera.y += (Math.random() * 2 - 1) * this.camera.shakeIntensity;
      } else {
        this.camera.x = 0;
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === 'LOADING') {
      this.drawLoadingScreen();
      return;
    }

    if (this.state === 'START') {
      this.drawStartScreen();
      return;
    }

    // 1. Draw World & Platforms
    this.world.draw(this.ctx, this.assets, this.camera);

    // 2. Draw Enemies
    for (const enemy of this.enemies) {
      enemy.draw(this.ctx, this.assets, this.camera);
    }

    // 3. Draw Bombs & Projectiles
    for (const b of this.bombs) {
      b.draw(this.ctx, this.assets, this.camera);
    }
    for (const p of this.projectiles) {
      p.draw(this.ctx, this.assets, this.camera);
    }

    // 4. Draw Player
    this.player.draw(this.ctx, this.assets, this.camera);

    // 5. Draw Particles, Debris & Floating Texts
    this.particles.draw(this.ctx, this.assets, this.camera);

    // 6. Red Damage Flash Overlay
    if (this.damageFlash > 0) {
      this.ctx.save();
      this.ctx.fillStyle = `rgba(255, 30, 30, ${Math.min(0.4, this.damageFlash * 0.8)})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }

    // 7. Draw HUD Overlay
    this.drawHUD();

    // 8. Draw State Overlays (Paused, Stage Clear, Game Over)
    if (this.state === 'PAUSED') {
      this.drawPauseOverlay();
    } else if (this.state === 'STAGE_CLEAR') {
      this.drawStageClearOverlay();
    } else if (this.state === 'GAME_OVER') {
      this.drawGameOverOverlay();
    }
  }

  // --- HUD RENDERING ---
  drawHUD() {
    const ctx = this.ctx;

    // 1. Live Bar & Hearts
    const liveBarImg = this.assets.getImage('live_bar');
    const heartImg = this.assets.getImage('big_heart_idle');

    if (liveBarImg) {
      ctx.save();
      const hudScale = 3.0;
      ctx.drawImage(liveBarImg, 30, 40, liveBarImg.width * hudScale, liveBarImg.height * hudScale);

      // Draw active hearts inside bar
      if (heartImg) {
        for (let h = 0; h < this.player.maxHealth; h++) {
          if (h < this.player.health) {
            ctx.drawImage(heartImg, 0, 0, 18, 14, 72 + h * 24, 66, 24, 18);
          }
        }
      }
      ctx.restore();
    }

    // 2. Score & Gems (Top Right)
    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = '900 36px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`SCORE  ${this.score}`, 1050, 75);

    // Diamonds count
    const diamondImg = this.assets.getImage('small_diamond');
    if (diamondImg) {
      ctx.drawImage(diamondImg, 0, 0, 18, 14, 880, 95, 32, 26);
    }
    ctx.fillStyle = '#50e3c2';
    ctx.font = '900 32px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`× ${this.gems}`, 1050, 120);

    // 3. Current Floor Indicator (Top Center)
    ctx.textAlign = 'center';
    ctx.font = '900 42px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`STAGE ${this.stage} • FLOOR ${this.currentFloor} / 6`, 540, 75);

    // Climbing Progress Bar
    const progressTotal = this.world.groundY - 240;
    const currentProgress = Math.max(0, Math.min(1, (this.world.groundY - (this.player.y + this.player.height)) / progressTotal));
    ctx.fillStyle = '#2d2540';
    ctx.fillRect(420, 95, 240, 12);
    ctx.fillStyle = '#f5a623';
    ctx.fillRect(420, 95, 240 * currentProgress, 12);

    ctx.restore();
  }

  // --- SCREENS & OVERLAYS ---

  drawLoadingScreen() {
    const ctx = this.ctx;
    ctx.fillStyle = '#14121e';
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.fillStyle = '#fff';
    ctx.font = '900 56px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOADING ASSETS...', 540, 900);

    // Progress Bar
    const barW = 600;
    const barH = 28;
    ctx.fillStyle = '#333';
    ctx.fillRect(240, 960, barW, barH);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(240, 960, barW * this.loadProgress, barH);
  }

  drawStartScreen() {
    const ctx = this.ctx;
    ctx.fillStyle = '#171424';
    ctx.fillRect(0, 0, 1080, 1920);

    // Background Castle Brick Lines
    ctx.strokeStyle = '#272238';
    ctx.lineWidth = 3;
    for (let y = 0; y < 1920; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }

    // Title Banner
    ctx.save();
    ctx.textAlign = 'center';

    // Game Logo
    ctx.font = '900 88px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#f5a623';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 20;
    ctx.fillText('HIT UP!', 540, 480);

    ctx.font = '900 46px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("KING'S TOWER SMASH", 540, 560);

    // King Human hero preview
    const kingImg = this.assets.getImage('king_idle');
    if (kingImg) {
      const scale = 4.5;
      const frameW = 78;
      const frameH = 58;
      const frameIdx = Math.floor(Date.now() * 0.008) % 11;
      ctx.drawImage(
        kingImg,
        frameIdx * frameW, 0, frameW, frameH,
        540 - (frameW * scale) / 2, 660,
        frameW * scale, frameH * scale
      );
    }

    // Mission description
    ctx.font = '600 32px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#c5b8e0';
    ctx.fillText('🔨 Smash ceiling blocks with your War Hammer!', 540, 1020);
    ctx.fillText('🪜 Jump through gaps to ascend the castle floors!', 540, 1080);
    ctx.fillText('🐷 Beware! Builder Pigs rush to repair the holes!', 540, 1140);
    ctx.fillText('💣 Defeat bombers, patrol pigs & King Pig at the top!', 540, 1200);

    // Controls Guide Box
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(160, 1270, 760, 240);
    ctx.strokeStyle = '#4e4368';
    ctx.lineWidth = 4;
    ctx.strokeRect(160, 1270, 760, 240);

    ctx.font = '700 28px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('CONTROLS', 540, 1315);
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 26px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Desktop: WASD / Arrows = Move & Jump | J / Enter / Space = Hammer', 540, 1370);
    ctx.fillText('Up + Hammer (or K) = Upward Smash to break ceiling', 540, 1420);
    ctx.fillText('Mobile / Touch: On-Screen Touch Buttons', 540, 1470);

    // Press to Start Button
    const pulse = Math.sin(Date.now() * 0.006) * 6;
    ctx.fillStyle = '#4cd964';
    ctx.fillRect(290, 1580 - pulse, 500, 100);
    ctx.fillStyle = '#000';
    ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
    ctx.fillText('TAP TO PLAY', 540, 1648 - pulse);

    ctx.restore();
  }

  drawPauseOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(10, 8, 18, 0.75)';
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 72px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('PAUSED', 540, 920);

    ctx.font = '600 36px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press P or Tap Pause to Resume', 540, 1000);
    ctx.restore();
  }

  drawStageClearOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(15, 12, 28, 0.88)';
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = '900 80px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('STAGE CLEARED!', 540, 750);

    ctx.font = '600 38px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Stage ${this.stage} Conquered!`, 540, 840);
    ctx.fillText(`Score: ${this.score}`, 540, 920);
    ctx.fillText(`Diamonds: ${this.gems}`, 540, 990);

    // Next Stage Button
    ctx.fillStyle = '#4cd964';
    ctx.fillRect(320, 1100, 440, 100);
    ctx.fillStyle = '#000';
    ctx.font = '900 42px "Segoe UI", Arial, sans-serif';
    ctx.fillText('NEXT STAGE', 540, 1168);
    ctx.restore();
  }

  drawGameOverOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(25, 8, 12, 0.94)';
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = '900 84px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ff3b30';
    ctx.fillText('GAME OVER', 540, 680);

    // Explicit cause of death
    ctx.font = '900 42px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`KILLED BY: ${this.deathReason || 'Enemy Attack'}`, 540, 770);

    ctx.font = '600 36px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Reached Floor: ${this.currentFloor} / 6`, 540, 840);
    ctx.fillText(`Final Score: ${this.score}`, 540, 900);
    ctx.fillText(`Diamonds Collected: ${this.gems}`, 540, 960);

    // Actionable Tactical Tip
    ctx.font = '500 28px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#c5b8e0';
    let tip = '💡 Tip: Swing your hammer to strike enemies before they touch you!';
    if (this.deathReason && this.deathReason.includes('Bomb')) {
      tip = '💡 Tip: You can hit bombs with your hammer to deflect them away!';
    } else if (this.deathReason && this.deathReason.includes('Patrol')) {
      tip = '💡 Tip: Strike the patrol pig with your hammer to defeat it in 1 hit!';
    } else if (this.deathReason && this.deathReason.includes('Cannon')) {
      tip = '💡 Tip: Watch for cannon fuse sparks and jump to dodge!';
    }
    ctx.fillText(tip, 540, 1030);

    // Retry Button
    ctx.fillStyle = '#f5a623';
    ctx.fillRect(320, 1100, 440, 100);
    ctx.fillStyle = '#000';
    ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
    ctx.fillText('TRY AGAIN', 540, 1168);
    ctx.restore();
  }
}

// Auto-boot game in browser
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.start();
  });
}
