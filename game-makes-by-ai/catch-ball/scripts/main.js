/**
 * Air Superiority: Endless Dogfight - Main Game Controller
 * State management, mission waves, combat scoring, debriefing, power-ups, and main loop.
 */

class AirCombatGame {
  constructor() {
    this.runtime = window.Runtime;
    this.particles = window.Particles;
    this.terrain = window.Terrain;
    this.audio = window.AudioEngine;

    this.fighter = new window.FighterJet(this.runtime, this.particles);
    this.enemySystem = new window.EnemySystem(this.runtime, this.particles);
    this.powerupSystem = new window.PowerupSystem(this.runtime, this.particles);
    this.hud = new window.MilitaryHUD(this.runtime);

    // States
    this.STATE_MENU = 'MENU';
    this.STATE_PLAYING = 'PLAYING';
    this.STATE_PAUSED = 'PAUSED';
    this.STATE_GAMEOVER = 'GAMEOVER';
    this.state = this.STATE_MENU;

    // Mission Statistics
    this.score = 0;
    this.kills = 0;
    this.timeSurvived = 0;
    this.highScore = parseInt(localStorage.getItem('air_superiority_hiscore') || '0', 10);

    // Easy-to-Hard Wave Progression
    this.wave = 1;
    this.waveTimer = 0;
    this.waveDuration = 22; // Seconds per wave
    this.waveBanner = { title: '', subtitle: '', timer: 0, maxTimer: 3.5 };

    // Floating combat notifications
    this.combatTexts = [];

    // Sonic boom state
    this.wasSupersonic = false;

    this._bindUI();
  }

  _bindUI() {
    const modalBriefing = document.getElementById('modal-briefing');
    const modalGameOver = document.getElementById('modal-gameover');
    const btnStart = document.getElementById('btn-start-sortie');
    const btnRestart = document.getElementById('btn-restart-sortie');
    const btnPause = document.getElementById('btn-pause');

    btnStart.addEventListener('click', () => {
      this.audio.init();
      this.audio.resume();
      modalBriefing.style.display = 'none';
      this.startSortie();
    });

    btnRestart.addEventListener('click', () => {
      this.audio.init();
      this.audio.resume();
      modalGameOver.style.display = 'none';
      this.startSortie();
    });

    btnPause.addEventListener('click', () => {
      if (this.state === this.STATE_PLAYING) {
        this.state = this.STATE_PAUSED;
        btnPause.textContent = '▶';
      } else if (this.state === this.STATE_PAUSED) {
        this.state = this.STATE_PLAYING;
        btnPause.textContent = '⏸';
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === this.STATE_PLAYING) {
          this.state = this.STATE_PAUSED;
          btnPause.textContent = '▶';
        } else if (this.state === this.STATE_PAUSED) {
          this.state = this.STATE_PLAYING;
          btnPause.textContent = '⏸';
        }
      }
    });
  }

  _triggerWaveBanner(waveNum, title, subtitle) {
    this.waveBanner = {
      title: `>>> WAVE ${waveNum}: ${title} <<<`,
      subtitle: subtitle.toUpperCase(),
      timer: 3.5,
      maxTimer: 3.5
    };
    this.audio.playLockTone();
  }

  startSortie() {
    this.score = 0;
    this.kills = 0;
    this.timeSurvived = 0;
    this.wasSupersonic = false;
    this.combatTexts.length = 0;

    this.wave = 1;
    this.waveTimer = 0;
    this.enemySystem.wave = 1;

    this.particles.reset();
    this.fighter.reset();
    this.enemySystem.reset();
    this.powerupSystem.reset();

    this.state = this.STATE_PLAYING;
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) btnPause.textContent = '⏸';

    // Announce Wave 1
    this._triggerWaveBanner(1, 'INITIAL CONTACT', 'GENTLE RECON // MASTER YOUR FLIGHT DYNAMICS');

    // Spawn an early tutorial supply crate
    setTimeout(() => {
      if (this.state === this.STATE_PLAYING) {
        this.powerupSystem.spawnCrate(this.runtime.V_WIDTH / 2, -50);
      }
    }, 2500);
  }

  addCombatText(text, x, y, color = '#00ff66') {
    this.combatTexts.push({
      text,
      x, y,
      color,
      age: 0,
      maxAge: 1.6
    });
  }

  onEnemyKilled(scoreVal, x, y) {
    this.kills++;
    this.score += scoreVal;
    this.addCombatText(`+${scoreVal} DESTROYED`, x, y);

    // Chance to drop power-up crate from defeated enemies
    if (scoreVal >= 800 || Math.random() < 0.2) {
      this.powerupSystem.spawnCrate(x, y);
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('air_superiority_hiscore', this.highScore.toString());
    }
  }

  onFighterDestroyed() {
    this.state = this.STATE_GAMEOVER;
    this.audio.stopAll();

    setTimeout(() => {
      const modal = document.getElementById('modal-gameover');
      document.getElementById('debrief-score').textContent = this.score.toLocaleString();
      document.getElementById('debrief-kills').textContent = this.kills.toString();
      document.getElementById('debrief-time').textContent = `${Math.floor(this.timeSurvived)} SEC`;
      document.getElementById('debrief-hiscore').textContent = this.highScore.toLocaleString();
      modal.style.display = 'flex';
    }, 1800);
  }

  update(dt) {
    if (this.state !== this.STATE_PLAYING) {
      this.terrain.update(dt, 300);
      this.particles.update(dt, 300);
      return;
    }

    this.timeSurvived += dt;

    // Wave Progression Management
    this.waveTimer += dt;
    if (this.waveTimer >= this.waveDuration) {
      this.waveTimer = 0;
      this.wave++;
      this.enemySystem.wave = this.wave;

      const waveTitles = [
        { title: 'INITIAL CONTACT', sub: 'Scout fighters detected // Adapt flight controls' },
        { title: 'DRONE SWARM INCURSION', sub: 'Agile stealth UAVs approaching rapidly' },
        { title: 'ESCALATING DOGFIGHT', sub: 'Hostile interceptors armed with Fox-2 missiles' },
        { title: 'HEAVY BOMBERS DETECTED', sub: 'Warning: Tu-160 strategic dreadnoughts in sector' },
        { title: 'ALL-OUT AIR COMBAT', sub: 'Maximum threat level // Multiple squadrons converging' },
        { title: 'APEX AIR SUPERIORITY', sub: 'Ace interceptors inbound // Defend the airspace' }
      ];

      const waveInfo = waveTitles[Math.min(this.wave - 1, waveTitles.length - 1)];
      this._triggerWaveBanner(this.wave, waveInfo.title, waveInfo.sub);
      this.powerupSystem.spawnCrate();
    }

    if (this.waveBanner.timer > 0) {
      this.waveBanner.timer -= dt;
    }

    const scrollSpeed = this.fighter.speed * 1.1;

    // 1. Update Environment & Weather
    this.terrain.update(dt, scrollSpeed);

    // 2. Update Fighter Jet
    this.fighter.update(dt, this.enemySystem.enemies);

    // Sonic boom check
    const isSupersonic = this.fighter.speed > 720;
    if (isSupersonic && !this.wasSupersonic) {
      this.audio.playSonicBoom();
      this.runtime.addTrauma(0.5);
      this.addCombatText('SONIC BOOM // MACH 1.1', this.fighter.x, this.fighter.y - 80, '#00e5ff');
    }
    this.wasSupersonic = isSupersonic;

    // Check game over
    if (!this.fighter.isAlive && this.state === this.STATE_PLAYING) {
      this.onFighterDestroyed();
    }

    // 3. Update Enemy Combatants
    this.enemySystem.update(dt, this.fighter, (val, x, y) => this.onEnemyKilled(val, x, y));

    // 4. Update Airdrop Power-up System
    this.powerupSystem.update(dt, this.fighter, this.enemySystem, (msg, color) => {
      this.addCombatText(msg, this.fighter.x, this.fighter.y - 110, color);
    });

    // 5. Update Particle Systems
    this.particles.update(dt, scrollSpeed);

    // 6. Update Floating Combat Texts
    for (let i = this.combatTexts.length - 1; i >= 0; i--) {
      const ct = this.combatTexts[i];
      ct.age += dt;
      ct.y -= 45 * dt;
      if (ct.age >= ct.maxAge) {
        this.combatTexts.splice(i, 1);
      }
    }
  }

  draw() {
    const ctx = this.runtime.ctx;
    const W = this.runtime.V_WIDTH;
    const H = this.runtime.V_HEIGHT;

    ctx.clearRect(0, 0, W, H);

    this.runtime.applyCameraTransform();

    // 1. Ocean Water & Coastlines
    this.terrain.drawOcean(ctx);
    this.terrain.drawIslands(ctx);

    // 2. Dynamic Cloud Shadows
    this.terrain.drawCloudShadows(ctx);

    // 3. Low Volumetric Clouds
    this.terrain.drawLowClouds(ctx);

    // 4. Tactical Airdrop Supply Crates
    this.powerupSystem.draw(ctx);

    // 5. Combat Particles (Smoke trails, ribbon trails, debris, flares, explosions)
    this.particles.draw(ctx);

    // 6. Hostile Aircraft & Projectiles
    this.enemySystem.draw(ctx);

    // 7. Player Fighter Jet (With Quad pods & Hex shield)
    this.fighter.draw(ctx);

    // 8. High Volumetric Clouds
    this.terrain.drawHighClouds(ctx);

    // 9. Floating Combat Text
    for (const ct of this.combatTexts) {
      const alpha = Math.max(0, 1 - ct.age / ct.maxAge);
      ctx.save();
      ctx.font = 'bold 18px "Orbitron", monospace';
      ctx.fillStyle = ct.color;
      ctx.shadowColor = ct.color;
      ctx.shadowBlur = 10;
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.fillText(ct.text, ct.x, ct.y);
      ctx.restore();
    }

    this.runtime.restoreCameraTransform();

    // 10. Military Cockpit HUD with Power-up status & Wave banners
    if (this.state === this.STATE_PLAYING || this.state === this.STATE_PAUSED) {
      this.hud.draw(ctx, this.fighter, this.enemySystem, this.score, this.kills, this.waveBanner);
    }
  }

  loop() {
    this.runtime.tick();
    this.update(this.runtime.dt);
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

// Export class
window.AirCombatGame = AirCombatGame;

// Launch when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.Game = new AirCombatGame();
  window.Game.loop();
});
