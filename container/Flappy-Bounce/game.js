/**
 * Flappy Bounce 2D - Ultra Vibrant Mobile Game
 * Target Canvas Native Resolution: 1080 x 1920 (9:16 Portrait)
 */

(function () {
  "use strict";

  // --- Constants & Config ---
  const CANVAS_WIDTH = 1080;
  const CANVAS_HEIGHT = 1920;

  const PHYSICS = {
    GRAVITY: 2700,         // px/s^2
    JUMP_IMPULSE: -980,    // px/s
    BOUNCE_IMPULSE: -1260, // px/s on ground bounce
    MAX_VELOCITY_Y: 1650,
    GROUND_Y: 1740,        // Y position where ground starts
    CEILING_Y: 50,
    OBSTACLE_SPEED_BASE: 440,
    OBSTACLE_SPAWN_INTERVAL: 1.85, // seconds between pillars
    OBSTACLE_GAP: 470,     // vertical gap
    OBSTACLE_WIDTH: 175,
  };

  const GAME_STATE = {
    MENU: "menu",
    PLAYING: "playing",
    PAUSED: "paused",
    GAMEOVER: "gameover"
  };

  // --- Audio Manager ---
  class AudioManager {
    constructor() {
      this.muted = localStorage.getItem("fb_muted") === "true";
      this.bgm = null;
      this.sounds = {};
      this.audioCtx = null;
      this.isAudioUnlocked = false;

      this.initSounds();
      this.updateMuteIcons();
    }

    initAudioContext() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      this.isAudioUnlocked = true;
    }

    initSounds() {
      const soundFiles = {
        bounce: "media/bounce.webm",
        click: "media/click.webm",
        score: "media/score.webm",
        game_over: "media/game_over.webm",
        music: "media/music_theme.webm"
      };

      for (const [key, src] of Object.entries(soundFiles)) {
        try {
          const audio = new Audio();
          audio.src = src;
          audio.preload = "auto";
          if (key === "music") {
            audio.loop = true;
            audio.volume = 0.4;
            this.bgm = audio;
          } else {
            audio.volume = 0.75;
            this.sounds[key] = audio;
          }
        } catch (e) {
          console.warn("Audio init fallback for:", key, e);
        }
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem("fb_muted", this.muted);
      if (this.bgm) {
        if (this.muted) {
          this.bgm.pause();
        } else {
          this.playBGM();
        }
      }
      this.updateMuteIcons();
    }

    updateMuteIcons() {
      const onIcon = document.getElementById("icon-sound-on-hud");
      const offIcon = document.getElementById("icon-sound-off-hud");
      if (onIcon && offIcon) {
        onIcon.style.display = this.muted ? "none" : "block";
        offIcon.style.display = this.muted ? "block" : "none";
      }
    }

    play(name) {
      if (this.muted) return;
      this.initAudioContext();

      const audio = this.sounds[name];
      if (audio) {
        try {
          const clone = audio.cloneNode();
          clone.volume = audio.volume;
          const promise = clone.play();
          if (promise) {
            promise.catch(() => this.playSynth(name));
          }
        } catch (e) {
          this.playSynth(name);
        }
      } else {
        this.playSynth(name);
      }
    }

    playBGM() {
      if (this.muted || !this.bgm) return;
      this.initAudioContext();
      this.bgm.currentTime = 0;
      const promise = this.bgm.play();
      if (promise) {
        promise.catch(() => {
          // Autoplay blocked until gesture
        });
      }
    }

    stopBGM() {
      if (this.bgm) {
        this.bgm.pause();
        this.bgm.currentTime = 0;
      }
    }

    playSynth(name) {
      if (this.muted || !this.audioCtx) return;
      try {
        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (name === "bounce") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);
          osc.frequency.exponentialRampToValueAtTime(260, now + 0.22);
          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
          osc.start(now);
          osc.stop(now + 0.22);
        } else if (name === "score") {
          const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
          notes.forEach((freq, idx) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = "sine";
            o.frequency.setValueAtTime(freq, now + idx * 0.06);
            g.gain.setValueAtTime(0.18, now + idx * 0.06);
            g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);
            o.connect(g);
            g.connect(ctx.destination);
            o.start(now + idx * 0.06);
            o.stop(now + idx * 0.06 + 0.18);
          });
        } else if (name === "click") {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.07);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
          osc.start(now);
          osc.stop(now + 0.07);
        } else if (name === "game_over") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.45);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
          osc.start(now);
          osc.stop(now + 0.45);
        }
      } catch (e) {
        // Synthesizer error fallback ignored
      }
    }
  }

  // --- Particle Engine ---
  class ParticleSystem {
    constructor() {
      this.particles = [];
    }

    spawn(opts) {
      this.particles.push({
        x: opts.x,
        y: opts.y,
        vx: opts.vx || 0,
        vy: opts.vy || 0,
        size: opts.size || 6,
        color: opts.color || "#ffffff",
        glowColor: opts.glowColor || null,
        alpha: opts.alpha !== undefined ? opts.alpha : 1,
        life: 0,
        maxLife: opts.maxLife || 0.6,
        shape: opts.shape || "circle",
        shrink: opts.shrink !== false,
        gravity: opts.gravity || 0,
        spin: opts.spin || 0,
        angle: Math.random() * Math.PI * 2
      });
    }

    emitPlayerTrail(x, y, vy) {
      for (let i = 0; i < 2; i++) {
        this.spawn({
          x: x - 30 + (Math.random() - 0.5) * 12,
          y: y + (Math.random() - 0.5) * 16,
          vx: -180 + (Math.random() - 0.5) * 60,
          vy: -vy * 0.12 + (Math.random() - 0.5) * 80,
          size: 7 + Math.random() * 8,
          color: Math.random() > 0.4 ? "#00f0ff" : "#ff00aa",
          glowColor: "#00f0ff",
          maxLife: 0.45 + Math.random() * 0.3,
          gravity: 50,
          shrink: true
        });
      }
    }

    emitBounceBurst(x, y) {
      for (let i = 0; i < 24; i++) {
        const angle = -Math.PI * 0.05 - Math.random() * Math.PI * 0.9;
        const speed = 250 + Math.random() * 550;
        this.spawn({
          x: x + (Math.random() - 0.5) * 40,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 8 + Math.random() * 10,
          color: i % 2 === 0 ? "#00f0ff" : "#ffbe0b",
          glowColor: "#ffbe0b",
          maxLife: 0.5 + Math.random() * 0.35,
          gravity: 800,
          shrink: true
        });
      }
    }

    emitScoreBurst(x, y) {
      const colors = ["#ffbe0b", "#00f0ff", "#ff007f", "#39ff14", "#ffffff"];
      for (let i = 0; i < 35; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 180 + Math.random() * 600;
        this.spawn({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 6 + Math.random() * 12,
          color: colors[Math.floor(Math.random() * colors.length)],
          glowColor: "#ffbe0b",
          shape: Math.random() > 0.5 ? "star" : "circle",
          maxLife: 0.65 + Math.random() * 0.4,
          gravity: 400,
          spin: (Math.random() - 0.5) * 12,
          shrink: true
        });
      }
    }

    emitDeathBurst(x, y) {
      const colors = ["#ff0055", "#ff00aa", "#00f0ff", "#ffffff", "#ffaa00"];
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 850;
        this.spawn({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 8 + Math.random() * 18,
          color: colors[Math.floor(Math.random() * colors.length)],
          glowColor: "#ff0055",
          shape: Math.random() > 0.4 ? "star" : "circle",
          maxLife: 0.8 + Math.random() * 0.5,
          gravity: 700,
          spin: (Math.random() - 0.5) * 15,
          shrink: true
        });
      }
    }

    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          this.particles.splice(i, 1);
          continue;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        p.angle += p.spin * dt;

        const progress = p.life / p.maxLife;
        p.currentAlpha = (1 - progress) * p.alpha;
        p.currentSize = p.shrink ? p.size * (1 - progress * 0.7) : p.size;
      }
    }

    draw(ctx) {
      ctx.save();
      for (const p of this.particles) {
        if (p.currentAlpha <= 0 || p.currentSize <= 0) continue;
        ctx.globalAlpha = p.currentAlpha;

        if (p.glowColor) {
          ctx.shadowColor = p.glowColor;
          ctx.shadowBlur = 15;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, p.currentSize), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "star") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          drawStar(ctx, 0, 0, 5, p.currentSize, p.currentSize * 0.45);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.restore();
    }

    clear() {
      this.particles = [];
    }
  }

  function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  // --- Floating Text System ---
  class FloatingTextManager {
    constructor() {
      this.texts = [];
    }

    spawn(x, y, text, color = "#ffbe0b", size = 48) {
      this.texts.push({
        x,
        y,
        text,
        color,
        size,
        alpha: 1,
        vy: -180,
        life: 0,
        maxLife: 0.9,
        scale: 0.5
      });
    }

    update(dt) {
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const item = this.texts[i];
        item.life += dt;
        if (item.life >= item.maxLife) {
          this.texts.splice(i, 1);
          continue;
        }
        item.y += item.vy * dt;
        item.vy *= 0.94; // deceleration

        const progress = item.life / item.maxLife;
        if (progress < 0.2) {
          item.scale = 0.5 + (progress / 0.2) * 0.7; // pop in
        } else {
          item.scale = 1.2 - ((progress - 0.2) / 0.8) * 0.2;
        }
        item.alpha = 1 - Math.pow(progress, 2);
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.font = "900 52px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const item of this.texts) {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.scale(item.scale, item.scale);
        ctx.globalAlpha = Math.max(0, item.alpha);

        ctx.shadowColor = item.color;
        ctx.shadowBlur = 20;

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 8;
        ctx.strokeText(item.text, 0, 0);

        ctx.fillStyle = item.color;
        ctx.fillText(item.text, 0, 0);

        ctx.restore();
      }
      ctx.restore();
    }

    clear() {
      this.texts = [];
    }
  }

  // --- Player Entity ---
  class Player {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = 320;
      this.y = 880;
      this.radius = 48;
      this.vy = 0;
      this.rotation = 0;
      this.scaleX = 1;
      this.scaleY = 1;
      this.targetScaleX = 1;
      this.targetScaleY = 1;

      // Wing animation
      this.wingAngle = 0;
      this.wingSpeed = 8;

      // Blink animation
      this.blinkTimer = 2.5;
      this.isBlinking = false;
      this.blinkProgress = 0;

      // Menu hovering
      this.hoverTime = 0;
    }

    jump() {
      this.vy = PHYSICS.JUMP_IMPULSE;
      // Squash & stretch: stretch vertically
      this.scaleX = 0.74;
      this.scaleY = 1.34;
      this.wingSpeed = 24;
    }

    bounceGround() {
      this.vy = PHYSICS.BOUNCE_IMPULSE;
      // Squash & stretch: squash heavily against ground
      this.scaleX = 1.48;
      this.scaleY = 0.58;
      this.wingSpeed = 20;
    }

    update(dt, state) {
      if (state === GAME_STATE.MENU) {
        this.hoverTime += dt * 3.2;
        this.y = 860 + Math.sin(this.hoverTime) * 36;
        this.rotation = Math.sin(this.hoverTime * 0.7) * 0.12;
      } else if (state === GAME_STATE.PLAYING || state === GAME_STATE.GAMEOVER) {
        // Apply gravity
        this.vy += PHYSICS.GRAVITY * dt;
        if (this.vy > PHYSICS.MAX_VELOCITY_Y) {
          this.vy = PHYSICS.MAX_VELOCITY_Y;
        }
        this.y += this.vy * dt;

        // Rotation tilts based on velocity
        const targetRot = Math.max(-0.6, Math.min(0.85, (this.vy / 900)));
        this.rotation += (targetRot - this.rotation) * dt * 10;
      }

      // Spring-back squash and stretch
      this.scaleX += (1 - this.scaleX) * dt * 12;
      this.scaleY += (1 - this.scaleY) * dt * 12;

      // Wing flapping animation
      this.wingSpeed += (8 - this.wingSpeed) * dt * 6;
      this.wingAngle += this.wingSpeed * dt;

      // Blink loop
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) {
        this.isBlinking = true;
        this.blinkProgress += dt * 8;
        if (this.blinkProgress >= 1) {
          this.isBlinking = false;
          this.blinkProgress = 0;
          this.blinkTimer = 2.5 + Math.random() * 3.5;
        }
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(this.scaleX, this.scaleY);

      // Outer Glowing Aura
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 32;

      // Back Wing
      ctx.save();
      ctx.translate(-22, 6);
      const flapRot = Math.sin(this.wingAngle) * 0.65;
      ctx.rotate(flapRot);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(-16, 0, 24, 14, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Main Orb Body with Vibrant Gradient
      const grad = ctx.createRadialGradient(-12, -14, 8, 0, 0, this.radius);
      grad.addColorStop(0, "#fff69b");
      grad.addColorStop(0.35, "#ff9500");
      grad.addColorStop(0.8, "#ff007f");
      grad.addColorStop(1, "#7928ca");

      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Body Highlight sheen
      ctx.beginPath();
      ctx.ellipse(-14, -18, 16, 9, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.fill();

      // Cute Rosy Cheek
      ctx.beginPath();
      ctx.ellipse(12, 14, 10, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 0, 100, 0.35)";
      ctx.fill();

      // Expressive Eyes
      const eyeLookY = Math.max(-4, Math.min(4, this.vy * 0.004));
      const eyeScaleY = this.isBlinking ? 0.12 : 1;

      // Left Eye
      ctx.save();
      ctx.translate(-4, -6);
      ctx.scale(1, eyeScaleY);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      if (!this.isBlinking) {
        // Pupil
        ctx.fillStyle = "#0c0824";
        ctx.beginPath();
        ctx.arc(3, eyeLookY, 5.5, 0, Math.PI * 2);
        ctx.fill();
        // Eye Catchlight
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(4.5, eyeLookY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Right Eye
      ctx.save();
      ctx.translate(18, -6);
      ctx.scale(1, eyeScaleY);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      if (!this.isBlinking) {
        // Pupil
        ctx.fillStyle = "#0c0824";
        ctx.beginPath();
        ctx.arc(3, eyeLookY, 5.5, 0, Math.PI * 2);
        ctx.fill();
        // Eye Catchlight
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(4.5, eyeLookY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Cute Smile
      ctx.beginPath();
      ctx.arc(10, 15, 6, 0.1, Math.PI * 0.9);
      ctx.strokeStyle = "rgba(40, 10, 60, 0.75)";
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.restore();
    }
  }

  // --- Obstacle (Neon Cyber Pillar) ---
  class ObstacleManager {
    constructor() {
      this.obstacles = [];
      this.spawnTimer = 0.5;
    }

    reset() {
      this.obstacles = [];
      this.spawnTimer = 0.6;
    }

    update(dt, speed, score) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawn(score);
        this.spawnTimer = PHYSICS.OBSTACLE_SPAWN_INTERVAL;
      }

      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.x -= speed * dt;

        // Oscillate floating pillars for higher difficulty
        if (obs.oscillate) {
          obs.oscTime += dt * 2.2;
          obs.yOffset = Math.sin(obs.oscTime) * 65;
        }

        // Remove offscreen
        if (obs.x + PHYSICS.OBSTACLE_WIDTH < -50) {
          this.obstacles.splice(i, 1);
        }
      }
    }

    spawn(score) {
      const minTop = 260;
      const maxTop = 950;
      const topHeight = minTop + Math.random() * (maxTop - minTop);
      const gap = PHYSICS.OBSTACLE_GAP;

      this.obstacles.push({
        x: CANVAS_WIDTH + 60,
        topHeight: topHeight,
        gap: gap,
        passed: false,
        oscillate: score >= 8 && Math.random() > 0.4,
        oscTime: Math.random() * Math.PI,
        yOffset: 0,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }

    checkCollision(player) {
      const px = player.x;
      const py = player.y;
      const pr = player.radius * 0.82; // Slight forgiving hitbox for great gamefeel

      for (const obs of this.obstacles) {
        const ox = obs.x;
        const ow = PHYSICS.OBSTACLE_WIDTH;
        const topY = obs.topHeight + obs.yOffset;
        const bottomY = topY + obs.gap;

        // Top Pillar bounding box check
        if (circleRectCollide(px, py, pr, ox, 0, ow, topY)) {
          return true;
        }

        // Bottom Pillar bounding box check
        if (circleRectCollide(px, py, pr, ox, bottomY, ow, PHYSICS.GROUND_Y - bottomY)) {
          return true;
        }
      }
      return false;
    }

    draw(ctx, globalTime) {
      for (const obs of this.obstacles) {
        const x = obs.x;
        const w = PHYSICS.OBSTACLE_WIDTH;
        const topY = obs.topHeight + obs.yOffset;
        const bottomY = topY + obs.gap;
        const pulse = 0.8 + Math.sin(globalTime * 4 + obs.pulseOffset) * 0.2;

        // 1. Draw Top Pillar
        drawCyberPillar(ctx, x, 0, w, topY, true, pulse);

        // 2. Draw Bottom Pillar
        drawCyberPillar(ctx, x, bottomY, w, PHYSICS.GROUND_Y - bottomY, false, pulse);

        // 3. Draw Gate Energy Field Particles / Gap Beacons
        drawEnergyBeacons(ctx, x, topY, bottomY, w, pulse);
      }
    }
  }

  function circleRectCollide(cx, cy, radius, rx, ry, rw, rh) {
    const testX = Math.max(rx, Math.min(cx, rx + rw));
    const testY = Math.max(ry, Math.min(cy, ry + rh));
    const distX = cx - testX;
    const distY = cy - testY;
    const distanceSquared = (distX * distX) + (distY * distY);
    return distanceSquared <= (radius * radius);
  }

  function drawCyberPillar(ctx, x, y, w, h, isTop, pulse) {
    if (h <= 0) return;
    ctx.save();

    // Pillar Body Gradient
    const bodyGrad = ctx.createLinearGradient(x, 0, x + w, 0);
    bodyGrad.addColorStop(0, "#151036");
    bodyGrad.addColorStop(0.3, "#2a1e5c");
    bodyGrad.addColorStop(0.7, "#1e1644");
    bodyGrad.addColorStop(1, "#100c28");

    ctx.fillStyle = bodyGrad;
    ctx.fillRect(x, y, w, h);

    // Glowing Neon Core Strip
    const coreGrad = ctx.createLinearGradient(x, 0, x + w, 0);
    coreGrad.addColorStop(0, "rgba(0, 240, 255, 0.05)");
    coreGrad.addColorStop(0.5, "rgba(0, 240, 255, " + (0.4 * pulse) + ")");
    coreGrad.addColorStop(1, "rgba(0, 240, 255, 0.05)");
    ctx.fillStyle = coreGrad;
    ctx.fillRect(x + w * 0.35, y, w * 0.3, h);

    // Neon Edge Stripes
    ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    // Pillar Cap (Opening Lip with vibrant glow)
    const capHeight = 44;
    const capExtraWidth = 14;
    const capX = x - capExtraWidth / 2;
    const capW = w + capExtraWidth;
    const capY = isTop ? (y + h - capHeight) : y;

    // Cap Glow
    ctx.shadowColor = "#ff007f";
    ctx.shadowBlur = 18 * pulse;

    const capGrad = ctx.createLinearGradient(capX, 0, capX + capW, 0);
    capGrad.addColorStop(0, "#ff007f");
    capGrad.addColorStop(0.5, "#ffbe0b");
    capGrad.addColorStop(1, "#ff007f");

    ctx.fillStyle = capGrad;
    roundRect(ctx, capX, capY, capW, capHeight, 14);
    ctx.fill();

    // Cap Tech Border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }

  function drawEnergyBeacons(ctx, x, topY, bottomY, w, pulse) {
    ctx.save();
    // Soft vertical glow strip along the gap
    const gapMidX = x + w / 2;
    const gapGrad = ctx.createRadialGradient(gapMidX, (topY + bottomY) / 2, 20, gapMidX, (topY + bottomY) / 2, (bottomY - topY) / 2);
    gapGrad.addColorStop(0, "rgba(0, 240, 255, " + (0.08 * pulse) + ")");
    gapGrad.addColorStop(1, "transparent");
    ctx.fillStyle = gapGrad;
    ctx.fillRect(x - 20, topY, w + 40, bottomY - topY);
    ctx.restore();
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // --- Background & Parallax World ---
  class WorldBackground {
    constructor() {
      this.time = 0;
      this.groundOffset = 0;

      // Stars
      this.stars = [];
      for (let i = 0; i < 75; i++) {
        this.stars.push({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * 1400,
          radius: 1.2 + Math.random() * 3.2,
          speed: 10 + Math.random() * 25,
          twinkleSpeed: 2 + Math.random() * 4,
          twinkleOffset: Math.random() * Math.PI * 2,
          color: i % 4 === 0 ? "#00f0ff" : i % 3 === 0 ? "#ff00aa" : "#ffffff"
        });
      }

      // Cyber Skyline Towers
      this.buildings = [];
      let curX = 0;
      while (curX < CANVAS_WIDTH * 1.5) {
        const bw = 70 + Math.random() * 110;
        const bh = 180 + Math.random() * 320;
        this.buildings.push({
          x: curX,
          w: bw,
          h: bh,
          windows: Math.random() > 0.3
        });
        curX += bw - 8;
      }

      // Floating Ambient Clouds
      this.clouds = [
        { x: 100, y: 350, scale: 1.2, speed: 28, alpha: 0.28 },
        { x: 600, y: 550, scale: 0.9, speed: 22, alpha: 0.22 },
        { x: 1000, y: 280, scale: 1.4, speed: 32, alpha: 0.3 },
        { x: 350, y: 750, scale: 1.0, speed: 24, alpha: 0.25 }
      ];

      // Ground bounce ripple
      this.groundBounceWave = 0;
    }

    triggerGroundBounce() {
      this.groundBounceWave = 1.0;
    }

    update(dt, speedMultiplier = 1) {
      this.time += dt;

      // Parallax Stars
      for (const s of this.stars) {
        s.x -= s.speed * dt * speedMultiplier;
        if (s.x < -10) s.x = CANVAS_WIDTH + 10;
      }

      // Parallax Clouds
      for (const c of this.clouds) {
        c.x -= c.speed * dt * speedMultiplier;
        if (c.x < -250 * c.scale) {
          c.x = CANVAS_WIDTH + 150;
          c.y = 200 + Math.random() * 650;
        }
      }

      // Parallax Buildings
      for (const b of this.buildings) {
        b.x -= 45 * dt * speedMultiplier;
      }
      if (this.buildings.length > 0 && this.buildings[0].x + this.buildings[0].w < 0) {
        const first = this.buildings.shift();
        const last = this.buildings[this.buildings.length - 1];
        first.x = last.x + last.w - 8;
        this.buildings.push(first);
      }

      // Ground Texture Offset
      this.groundOffset = (this.groundOffset + PHYSICS.OBSTACLE_SPEED_BASE * dt * speedMultiplier) % 80;

      // Decay ground wave
      if (this.groundBounceWave > 0) {
        this.groundBounceWave -= dt * 3.5;
        if (this.groundBounceWave < 0) this.groundBounceWave = 0;
      }
    }

    draw(ctx) {
      // 1. Twilight Cyber Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, "#060416");
      skyGrad.addColorStop(0.35, "#170a38");
      skyGrad.addColorStop(0.65, "#420d4c");
      skyGrad.addColorStop(0.85, "#801258");
      skyGrad.addColorStop(1, "#ff3366");

      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. Cosmic Nebula Radial Accent
      const nebula = ctx.createRadialGradient(CANVAS_WIDTH * 0.5, 400, 50, CANVAS_WIDTH * 0.5, 400, 500);
      nebula.addColorStop(0, "rgba(0, 240, 255, 0.14)");
      nebula.addColorStop(0.5, "rgba(255, 0, 128, 0.08)");
      nebula.addColorStop(1, "transparent");
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, CANVAS_WIDTH, 1000);

      // 3. Twinkling Stars
      for (const s of this.stars) {
        const twinkle = 0.4 + Math.sin(this.time * s.twinkleSpeed + s.twinkleOffset) * 0.6;
        ctx.globalAlpha = Math.max(0.1, twinkle);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 4. Distant Cyber Skyline Silhouette
      ctx.save();
      ctx.fillStyle = "rgba(18, 10, 42, 0.85)";
      const baseY = PHYSICS.GROUND_Y;
      for (const b of this.buildings) {
        ctx.fillRect(b.x, baseY - b.h, b.w, b.h);

        // Glowing Windows
        if (b.windows) {
          ctx.fillStyle = "rgba(0, 240, 255, 0.25)";
          for (let wy = baseY - b.h + 20; wy < baseY - 20; wy += 28) {
            for (let wx = b.x + 14; wx < b.x + b.w - 18; wx += 22) {
              if ((wx + wy) % 5 === 0) {
                ctx.fillRect(wx, wy, 8, 12);
              }
            }
          }
          ctx.fillStyle = "rgba(18, 10, 42, 0.85)";
        }
      }
      ctx.restore();

      // 5. Stylized Glowing Clouds
      for (const c of this.clouds) {
        drawStylizedCloud(ctx, c.x, c.y, c.scale, c.alpha);
      }

      // 6. Ground & Bounce Platform
      this.drawGround(ctx);
    }

    drawGround(ctx) {
      const gy = PHYSICS.GROUND_Y;
      const gh = CANVAS_HEIGHT - gy;

      ctx.save();

      // Ground Body Gradient
      const groundGrad = ctx.createLinearGradient(0, gy, 0, CANVAS_HEIGHT);
      groundGrad.addColorStop(0, "#0e0926");
      groundGrad.addColorStop(0.4, "#08051a");
      groundGrad.addColorStop(1, "#03020c");

      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, gy, CANVAS_WIDTH, gh);

      // Cyber Grid Scrolling Lines
      ctx.save();
      ctx.strokeStyle = "rgba(0, 240, 255, 0.2)";
      ctx.lineWidth = 3;
      for (let x = -this.groundOffset; x < CANVAS_WIDTH + 80; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x - 50, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Horizontal grid sub-lines
      ctx.strokeStyle = "rgba(255, 0, 128, 0.15)";
      ctx.beginPath();
      ctx.moveTo(0, gy + 40);
      ctx.lineTo(CANVAS_WIDTH, gy + 40);
      ctx.moveTo(0, gy + 90);
      ctx.lineTo(CANVAS_WIDTH, gy + 90);
      ctx.stroke();
      ctx.restore();

      // Bouncy Neon Surface Glow Line
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 24 + this.groundBounceWave * 30;

      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 8 + this.groundBounceWave * 6;
      ctx.beginPath();
      ctx.moveTo(0, gy);

      if (this.groundBounceWave > 0) {
        // Wave ripple upon bounce
        const rippleH = Math.sin(this.time * 20) * 14 * this.groundBounceWave;
        ctx.quadraticCurveTo(CANVAS_WIDTH * 0.35, gy + rippleH, CANVAS_WIDTH, gy);
      } else {
        ctx.lineTo(CANVAS_WIDTH, gy);
      }
      ctx.stroke();

      // Accent Neon Magenta Strip right under surface
      ctx.shadowColor = "#ff00aa";
      ctx.shadowBlur = 16;
      ctx.strokeStyle = "#ff00aa";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, gy + 10);
      ctx.lineTo(CANVAS_WIDTH, gy + 10);
      ctx.stroke();

      ctx.restore();
    }
  }

  function drawStylizedCloud(ctx, x, y, scale, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    const cloudGrad = ctx.createLinearGradient(0, -50, 0, 50);
    cloudGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    cloudGrad.addColorStop(1, "rgba(160, 140, 255, 0.3)");

    ctx.fillStyle = cloudGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.arc(42, -16, 38, 0, Math.PI * 2);
    ctx.arc(84, 4, 34, 0, Math.PI * 2);
    ctx.arc(36, 16, 44, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // --- Main Game Orchestrator ---
  class GameEngine {
    constructor() {
      this.canvas = document.getElementById("gameCanvas");
      this.ctx = this.canvas.getContext("2d");

      this.state = GAME_STATE.MENU;
      this.score = 0;
      this.bestScore = parseInt(localStorage.getItem("fb_best_score") || "0", 10);
      this.combo = 0;

      this.audio = new AudioManager();
      this.particles = new ParticleSystem();
      this.floatingTexts = new FloatingTextManager();
      this.player = new Player();
      this.obstacles = new ObstacleManager();
      this.world = new WorldBackground();

      // Screen juice
      this.screenShake = 0;
      this.screenFlash = 0;
      this.globalTime = 0;

      // Delta time calculation
      this.lastTimestamp = performance.now();

      // DOM UI Elements
      this.dom = {
        hudOverlay: document.getElementById("hud-overlay"),
        hudScore: document.getElementById("hud-score"),
        comboBadge: document.getElementById("combo-badge"),
        startScreen: document.getElementById("start-screen"),
        gameoverScreen: document.getElementById("gameover-screen"),
        pauseScreen: document.getElementById("pause-screen"),
        btnStart: document.getElementById("btn-start"),
        btnRestart: document.getElementById("btn-restart"),
        btnPause: document.getElementById("btn-pause"),
        btnResume: document.getElementById("btn-resume"),
        btnQuit: document.getElementById("btn-quit"),
        btnSoundHud: document.getElementById("btn-sound-hud"),
        menuBestScore: document.getElementById("menu-best-score"),
        statFinalScore: document.getElementById("stat-final-score"),
        statBestScore: document.getElementById("stat-best-score"),
        medalIcon: document.getElementById("medal-icon"),
        medalName: document.getElementById("medal-name"),
        newBestRibbon: document.getElementById("new-best-ribbon")
      };

      this.initEventListeners();
      this.updateBestScoreUI();

      // Start game loop
      requestAnimationFrame(this.loop.bind(this));
    }

    initEventListeners() {
      // Tap / Click to Flap & Bounce
      const triggerAction = (e) => {
        if (e) {
          // If tapping inside a button or modal content, let button handler execute
          if (e.target.closest("button") || e.target.closest(".gameover-card") || e.target.closest(".pause-card")) {
            return;
          }
          if (e.cancelable) e.preventDefault();
        }

        this.audio.initAudioContext();

        if (this.state === GAME_STATE.MENU) {
          this.startGame();
        } else if (this.state === GAME_STATE.PLAYING) {
          this.player.jump();
          this.audio.play("bounce");
          this.vibrate(22);
        } else if (this.state === GAME_STATE.GAMEOVER) {
          // Handled via Play Again button
        }
      };

      // Handle touch and mouse events
      const container = document.getElementById("app-container");
      container.addEventListener("pointerdown", triggerAction, { passive: false });

      // Keyboard support
      window.addEventListener("keydown", (e) => {
        if (e.code === "Space" || e.code === "ArrowUp") {
          e.preventDefault();
          triggerAction();
        } else if (e.code === "KeyP" || e.code === "Escape") {
          if (this.state === GAME_STATE.PLAYING) this.pauseGame();
          else if (this.state === GAME_STATE.PAUSED) this.resumeGame();
        }
      });

      // UI Button Clicks
      this.dom.btnStart.addEventListener("click", (e) => {
        e.stopPropagation();
        this.audio.play("click");
        this.startGame();
      });

      this.dom.btnRestart.addEventListener("click", (e) => {
        e.stopPropagation();
        this.audio.play("click");
        this.startGame();
      });

      this.dom.btnPause.addEventListener("click", (e) => {
        e.stopPropagation();
        this.audio.play("click");
        this.pauseGame();
      });

      this.dom.btnResume.addEventListener("click", (e) => {
        e.stopPropagation();
        this.audio.play("click");
        this.resumeGame();
      });

      this.dom.btnQuit.addEventListener("click", (e) => {
        e.stopPropagation();
        this.audio.play("click");
        this.showMenu();
      });

      this.dom.btnSoundHud.addEventListener("click", (e) => {
        e.stopPropagation();
        this.audio.toggleMute();
      });

      // Auto-pause when tab is hidden
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && this.state === GAME_STATE.PLAYING) {
          this.pauseGame();
        }
      });
    }

    vibrate(pattern) {
      if ("vibrate" in navigator) {
        try {
          navigator.vibrate(pattern);
        } catch (e) {
          // Vibrate permission or unsupported
        }
      }
    }

    startGame() {
      this.state = GAME_STATE.PLAYING;
      this.score = 0;
      this.combo = 0;
      this.gameStartTime = performance.now();
      this.player.reset();
      this.obstacles.reset();
      this.particles.clear();
      this.floatingTexts.clear();

      this.updateScoreHUD();
      this.dom.hudOverlay.style.display = "flex";
      this.dom.startScreen.classList.remove("active");
      this.dom.gameoverScreen.classList.remove("active");
      this.dom.pauseScreen.classList.remove("active");

      this.player.jump();
      this.audio.play("bounce");
      this.audio.playBGM();
    }

    pauseGame() {
      if (this.state !== GAME_STATE.PLAYING) return;
      this.state = GAME_STATE.PAUSED;
      this.dom.pauseScreen.classList.add("active");
    }

    resumeGame() {
      if (this.state !== GAME_STATE.PAUSED) return;
      this.state = GAME_STATE.PLAYING;
      this.dom.pauseScreen.classList.remove("active");
      this.lastTimestamp = performance.now();
    }

    showMenu() {
      this.state = GAME_STATE.MENU;
      this.player.reset();
      this.obstacles.reset();
      this.dom.hudOverlay.style.display = "none";
      this.dom.pauseScreen.classList.remove("active");
      this.dom.gameoverScreen.classList.remove("active");
      this.dom.startScreen.classList.add("active");
      this.updateBestScoreUI();
    }

    gameOver() {
      if (this.state === GAME_STATE.GAMEOVER) return;
      this.state = GAME_STATE.GAMEOVER;

      this.audio.play("game_over");
      this.audio.stopBGM();

      this.screenShake = 26;
      this.screenFlash = 0.75;
      this.vibrate([45, 60, 110]);

      // Shatter into neon particles
      this.particles.emitDeathBurst(this.player.x, this.player.y);

      // Check high score
      const isNewBest = this.score > this.bestScore;
      if (isNewBest) {
        this.bestScore = this.score;
        localStorage.setItem("fb_best_score", this.bestScore.toString());
      }

      this.updateBestScoreUI();

      // Dispatch score to backend via ScoreSendAPI
      if (window.ScoreSendAPI) {
        const duration = (performance.now() - (this.gameStartTime || performance.now())) / 1000;
        window.ScoreSendAPI.sendScore({
          score: this.score,
          bestScore: this.bestScore,
          combo: this.combo,
          duration: duration,
          metadata: { isNewBest }
        });
      }

      // Show GameOver modal with slight delay for dramatic impact
      setTimeout(() => {
        if (this.state === GAME_STATE.GAMEOVER) {
          this.dom.statFinalScore.textContent = this.score;
          this.dom.statBestScore.textContent = this.bestScore;

          // Medals logic
          if (this.score >= 30) {
            this.dom.medalIcon.textContent = "💎";
            this.dom.medalName.textContent = "DIAMOND MASTER";
          } else if (this.score >= 15) {
            this.dom.medalIcon.textContent = "🥇";
            this.dom.medalName.textContent = "GOLD BOUNCER";
          } else if (this.score >= 6) {
            this.dom.medalIcon.textContent = "🥈";
            this.dom.medalName.textContent = "SILVER SOARER";
          } else {
            this.dom.medalIcon.textContent = "🥉";
            this.dom.medalName.textContent = "BRONZE ROOKIE";
          }

          this.dom.newBestRibbon.style.display = isNewBest && this.score > 0 ? "block" : "none";
          this.dom.hudOverlay.style.display = "none";
          this.dom.gameoverScreen.classList.add("active");
        }
      }, 550);
    }

    updateScoreHUD() {
      this.dom.hudScore.textContent = this.score;
      this.dom.hudScore.classList.add("bump");
      setTimeout(() => {
        this.dom.hudScore.classList.remove("bump");
      }, 140);

      if (this.combo >= 2) {
        this.dom.comboBadge.textContent = "COMBO x" + this.combo;
        this.dom.comboBadge.style.display = "inline-block";
      } else {
        this.dom.comboBadge.style.display = "none";
      }
    }

    updateBestScoreUI() {
      this.dom.menuBestScore.textContent = this.bestScore;
      this.dom.statBestScore.textContent = this.bestScore;
    }

    // --- Main Game Loop ---
    loop(timestamp) {
      let dt = (timestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = timestamp;

      // Cap delta time to avoid huge tunneling on tab blur/resume
      if (dt > 0.1) dt = 0.1;
      this.globalTime += dt;

      this.update(dt);
      this.render();

      requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
      // Screen shake decay
      if (this.screenShake > 0) {
        this.screenShake *= 0.88;
        if (this.screenShake < 0.2) this.screenShake = 0;
      }

      // Screen flash decay
      if (this.screenFlash > 0) {
        this.screenFlash -= dt * 2.2;
        if (this.screenFlash < 0) this.screenFlash = 0;
      }

      // Parallax world always updates
      const speedMult = this.state === GAME_STATE.PLAYING ? 1 : 0.4;
      this.world.update(dt, speedMult);

      // Particle & floating text update
      this.particles.update(dt);
      this.floatingTexts.update(dt);

      if (this.state === GAME_STATE.MENU) {
        this.player.update(dt, this.state);
        return;
      }

      if (this.state === GAME_STATE.PAUSED) {
        return;
      }

      if (this.state === GAME_STATE.PLAYING) {
        // Player trail particles
        this.particles.emitPlayerTrail(this.player.x, this.player.y, this.player.vy);
        this.player.update(dt, this.state);

        // Ground collision: Bouncy mechanic!
        if (this.player.y + this.player.radius >= PHYSICS.GROUND_Y) {
          this.player.y = PHYSICS.GROUND_Y - this.player.radius;
          this.player.bounceGround();
          this.world.triggerGroundBounce();
          this.particles.emitBounceBurst(this.player.x, PHYSICS.GROUND_Y);
          this.audio.play("bounce");
          this.screenShake = 8;
          this.vibrate(30);
          this.floatingTexts.spawn(this.player.x, this.player.y - 80, "BOUNCE!", "#00f0ff", 42);
        }

        // Ceiling collision
        if (this.player.y - this.player.radius <= PHYSICS.CEILING_Y) {
          this.player.y = PHYSICS.CEILING_Y + this.player.radius;
          this.player.vy = 200;
        }

        // Dynamic Obstacle Speed
        const curSpeed = PHYSICS.OBSTACLE_SPEED_BASE + Math.min(this.score * 7, 220);
        this.obstacles.update(dt, curSpeed, this.score);

        // Check Obstacle Scoring
        for (const obs of this.obstacles.obstacles) {
          if (!obs.passed && obs.x + PHYSICS.OBSTACLE_WIDTH < this.player.x) {
            obs.passed = true;
            this.score++;

            // Check if player passed through center for combo
            const topY = obs.topHeight + obs.yOffset;
            const bottomY = topY + obs.gap;
            const gapCenter = (topY + bottomY) / 2;
            const distFromCenter = Math.abs(this.player.y - gapCenter);

            if (distFromCenter < 80) {
              this.combo++;
              if (this.combo >= 2) {
                this.floatingTexts.spawn(this.player.x, this.player.y - 70, "PERFECT! x" + this.combo, "#ffbe0b", 50);
              } else {
                this.floatingTexts.spawn(this.player.x, this.player.y - 70, "+1 PERFECT", "#ffbe0b", 46);
              }
            } else {
              this.combo = 0;
              this.floatingTexts.spawn(this.player.x, this.player.y - 70, "+1", "#00f0ff", 44);
            }

            this.particles.emitScoreBurst(this.player.x, (topY + bottomY) / 2);
            this.audio.play("score");
            this.updateScoreHUD();
            this.vibrate(26);
          }
        }

        // Check Obstacle Collisions
        if (this.obstacles.checkCollision(this.player)) {
          this.gameOver();
        }
      } else if (this.state === GAME_STATE.GAMEOVER) {
        this.player.update(dt, this.state);
        if (this.player.y + this.player.radius >= PHYSICS.GROUND_Y) {
          this.player.y = PHYSICS.GROUND_Y - this.player.radius;
        }
      }
    }

    render() {
      const ctx = this.ctx;
      ctx.save();

      // Screen Shake
      if (this.screenShake > 0) {
        const sx = (Math.random() - 0.5) * this.screenShake;
        const sy = (Math.random() - 0.5) * this.screenShake;
        ctx.translate(sx, sy);
      }

      // 1. Draw Background World & Ground
      this.world.draw(ctx);

      // 2. Draw Obstacles
      if (this.state === GAME_STATE.PLAYING || this.state === GAME_STATE.GAMEOVER || this.state === GAME_STATE.PAUSED) {
        this.obstacles.draw(ctx, this.globalTime);
      }

      // 3. Draw Particles
      this.particles.draw(ctx);

      // 4. Draw Player
      if (this.state !== GAME_STATE.GAMEOVER) {
        this.player.draw(ctx);
      }

      // 5. Draw Floating Popups
      this.floatingTexts.draw(ctx);

      // 6. Screen Flash on death / impact
      if (this.screenFlash > 0) {
        ctx.fillStyle = "rgba(255, 255, 255, " + Math.min(1, this.screenFlash) + ")";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      ctx.restore();
    }
  }

  // --- Custom Neon Mouse Cursor ---
  class CustomCursor {
    constructor() {
      this.dot = document.getElementById("custom-cursor-dot");
      this.ring = document.getElementById("custom-cursor-ring");
      this.container = document.getElementById("app-container");
      if (!this.dot || !this.ring || !this.container) return;

      this.mouseX = -100;
      this.mouseY = -100;
      this.ringX = -100;
      this.ringY = -100;
      this.visible = false;

      this.initEvents();
      this.loop();
    }

    initEvents() {
      window.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") {
          this.visible = false;
          this.updateVisibility();
          return;
        }

        const rect = this.container.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          this.visible = true;
          this.mouseX = e.clientX - rect.left;
          this.mouseY = e.clientY - rect.top;

          this.dot.style.left = this.mouseX + "px";
          this.dot.style.top = this.mouseY + "px";

          // Initial snap if offscreen
          if (this.ringX < 0) {
            this.ringX = this.mouseX;
            this.ringY = this.mouseY;
          }
        } else {
          this.visible = false;
        }
        this.updateVisibility();

        // Check hover over interactive elements
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const isHoverable = target && (
          target.closest("button") ||
          target.closest(".interactive") ||
          target.closest(".cta-button") ||
          target.closest(".icon-btn") ||
          target.closest(".stat-box")
        );

        if (isHoverable) {
          this.ring.classList.add("cursor-hover");
          this.dot.classList.add("cursor-hover");
        } else {
          this.ring.classList.remove("cursor-hover");
          this.dot.classList.remove("cursor-hover");
        }
      });

      window.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "touch") {
          this.ring.classList.add("cursor-active");
          this.dot.classList.add("cursor-active");
        }
      });

      window.addEventListener("pointerup", () => {
        this.ring.classList.remove("cursor-active");
        this.dot.classList.remove("cursor-active");
      });

      this.container.addEventListener("mouseleave", () => {
        this.visible = false;
        this.updateVisibility();
      });
    }

    updateVisibility() {
      const op = this.visible ? "1" : "0";
      if (this.dot.style.opacity !== op) this.dot.style.opacity = op;
      if (this.ring.style.opacity !== op) this.ring.style.opacity = op;
    }

    loop() {
      if (this.visible) {
        // Smooth lerp follower ring
        this.ringX += (this.mouseX - this.ringX) * 0.28;
        this.ringY += (this.mouseY - this.ringY) * 0.28;
        this.ring.style.left = this.ringX + "px";
        this.ring.style.top = this.ringY + "px";
      }
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  // --- Kickoff on DOM Loaded ---
  window.addEventListener("DOMContentLoaded", () => {
    window.gameInstance = new GameEngine();
    window.cursorInstance = new CustomCursor();
  });
})();
