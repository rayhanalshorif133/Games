/**
 * engine.js - Core Engine, Asset Loader, Input & Particles
 * Canvas Native Resolution: 1080 x 1920
 */

class AssetManager {
  constructor() {
    this.images = {};
    this.total = 0;
    this.loaded = 0;
    this.onProgress = null;
    this.onComplete = null;

    this.assetList = [
      'Artboard 84 copy 3.png',
      'Bottom_Bar.png',
      'Box_Bg.png',
      'Box_Bg_Pressed.png',
      'Btn_Blue.png',
      'Btn_Blue_Pressed.png',
      'Btn_Brown.png',
      'Btn_Geen_Pressed.png',
      'Btn_Green.png',
      'Btn_Hint.png',
      'Btn_Home.png',
      'Btn_Leaderboard.png',
      'Btn_Leaderboard_Pressed.png',
      'Btn_Music.png',
      'Btn_Music_Disable.png',
      'Btn_Pause.png',
      'Btn_Pause_Pressed.png',
      'Btn_Play.png',
      'Btn_Play_Pressed.png',
      'Btn_Roll.png',
      'Btn_Setting.png',
      'Btn_Setting_Pressed.png',
      'Btn_Share.png',
      'Btn_Share_Pressed.png',
      'Btn_Sound.png',
      'Btn_Sound_Disable.png',
      'Btn_Time.png',
      'Btn_Vibra.png',
      'Btn_Vibra_Disable.png',
      'Clock_Bar.png',
      'Clock_Icon.png',
      'Close_Icon.png',
      'Dark_overlay.png',
      'Gameplay_Bg.png',
      'HighScore_Box.png',
      'Icon_Ads.png',
      'Icon_Ads_Disable.png',
      'Icon_Crown.png',
      'Icon_Hints.png',
      'Icon_Roll.png',
      'Icon_Time.png',
      'Load_Bar_Bg.png',
      'Load_Bar_Fg.png',
      'MainMenu_Bg.png',
      'Notifications.png',
      'Onet_Logo.png',
      'Pink_Line_Horizontal.png',
      'Pink_Line_Vertical.png',
      'PopUp_Result.png',
      'PopUp_Setting.png',
      'Score_Box.png',
      'Top_Bar.png'
    ];

    // Add all 30 monsters
    for (let i = 1; i <= 30; i++) {
      const num = i < 10 ? '0' + i : '' + i;
      this.assetList.push(`Onet${num}.png`);
    }

    this.total = this.assetList.length;
  }

  loadAll(onProgress, onComplete) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;

    if (this.total === 0) {
      if (this.onComplete) this.onComplete();
      return;
    }

    this.assetList.forEach((filename) => {
      const img = new Image();
      const key = filename.replace(/\.png$/i, '');
      img.src = `assets/Parts/${filename}`;
      img.onload = () => {
        this.images[key] = img;
        this.loaded++;
        if (this.onProgress) {
          this.onProgress(this.loaded / this.total);
        }
        if (this.loaded >= this.total) {
          if (this.onComplete) this.onComplete();
        }
      };
      img.onerror = () => {
        console.warn(`Failed to load: assets/Parts/${filename}`);
        this.loaded++;
        if (this.onProgress) {
          this.onProgress(this.loaded / this.total);
        }
        if (this.loaded >= this.total) {
          if (this.onComplete) this.onComplete();
        }
      };
    });
  }

  get(key) {
    return this.images[key] || null;
  }
}

// Particle System
class ParticleManager {
  constructor() {
    this.particles = [];
  }

  spawnMatchBurst(x, y, count = 28) {
    const colors = ['#ffcc00', '#ff3388', '#00e5ff', '#ff8800', '#ffffff', '#a855f7', '#00ff88'];
    // Expanding shockwave ring
    this.particles.push({
      x: x,
      y: y,
      isRing: true,
      currentRadius: 18,
      expandSpeed: 320,
      lineWidth: 8,
      color: '#ffffff',
      alpha: 1,
      life: 0,
      maxLife: 0.35,
      vx: 0, vy: 0, rotation: 0, rotSpeed: 0
    });
    this.particles.push({
      x: x,
      y: y,
      isRing: true,
      currentRadius: 12,
      expandSpeed: 260,
      lineWidth: 6,
      color: '#ff007f',
      alpha: 1,
      life: 0,
      maxLife: 0.4,
      vx: 0, vy: 0, rotation: 0, rotSpeed: 0
    });

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 200 + Math.random() * 520;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120,
        size: 14 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 15,
        isStar: Math.random() > 0.45,
        isConfetti: Math.random() > 0.65
      });
    }
  }

  spawnLaserSparks(x, y, count = 3) {
    const colors = ['#ffffff', '#ff69b4', '#ff007f', '#00e5ff'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 160;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 8 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 0.18 + Math.random() * 0.12,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 20,
        isStar: Math.random() > 0.5
      });
    }
  }

  spawnWinConfetti(count = 70) {
    const colors = ['#ff2a6d', '#05d9e8', '#00ff66', '#ffdd00', '#9d4edd', '#ff9e00'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: 100 + Math.random() * 880,
        y: 400 + Math.random() * 300,
        vx: (Math.random() - 0.5) * 500,
        vy: -400 - Math.random() * 450,
        size: 16 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 1.8 + Math.random() * 1.2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 10,
        isConfetti: true
      });
    }
  }

  spawnHintSparkles(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 80,
        y: y + (Math.random() - 0.5) * 80,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        size: 12 + Math.random() * 14,
        color: '#fffa65',
        alpha: 1,
        life: 0,
        maxLife: 0.7,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: 5,
        isStar: true
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

      if (p.isRing) {
        p.currentRadius += p.expandSpeed * dt;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.isConfetti ? 600 : 750) * dt; // gravity
      p.vx *= 0.98; // air drag
      p.rotation += p.rotSpeed * dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    }
  }

  render(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);

      if (p.isRing) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, (p.lineWidth || 6) * p.alpha);
        ctx.beginPath();
        ctx.arc(0, 0, p.currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.isStar) {
        this.drawStar(ctx, 0, 0, 5, p.size, p.size * 0.45);
      } else if (p.isConfetti) {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
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
    ctx.fill();
  }
}

// Floating Scores & Combos
class FloatingTextManager {
  constructor() {
    this.items = [];
  }

  spawn(text, x, y, color = '#ffeb3b', size = 48, scale = 1.2) {
    this.items.push({
      text,
      x,
      y,
      color,
      size,
      scale,
      life: 0,
      maxLife: 0.9,
      alpha: 1
    });
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.life += dt;
      if (it.life >= it.maxLife) {
        this.items.splice(i, 1);
        continue;
      }
      it.y -= 90 * dt;
      const progress = it.life / it.maxLife;
      it.alpha = Math.max(0, 1 - progress);
      it.scale = 1 + Math.sin(progress * Math.PI) * 0.25;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const it of this.items) {
      ctx.save();
      ctx.globalAlpha = it.alpha;
      ctx.translate(it.x, it.y);
      ctx.scale(it.scale, it.scale);
      ctx.font = `900 ${it.size}px "Passion One", sans-serif`;

      // Thick stroke outline for cartoon look
      ctx.strokeStyle = '#2b1055';
      ctx.lineWidth = 10;
      ctx.lineJoin = 'round';
      ctx.strokeText(it.text, 0, 0);

      ctx.fillStyle = it.color;
      ctx.fillText(it.text, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }
}

// Screen Shake
class ScreenShake {
  constructor() {
    this.intensity = 0;
    this.duration = 0;
    this.elapsed = 0;
  }

  start(intensity = 12, duration = 0.25) {
    this.intensity = intensity;
    this.duration = duration;
    this.elapsed = 0;
  }

  update(dt) {
    if (this.elapsed < this.duration) {
      this.elapsed += dt;
    }
  }

  getOffset() {
    if (this.elapsed >= this.duration) return { x: 0, y: 0 };
    const progress = 1 - this.elapsed / this.duration;
    const currentIntensity = this.intensity * progress;
    return {
      x: (Math.random() - 0.5) * 2 * currentIntensity,
      y: (Math.random() - 0.5) * 2 * currentIntensity
    };
  }
}

// UI Interactive Button
class UIButton {
  constructor({ id, x, y, w, h, normalKey, pressedKey, onClick, scaleOnPress = true }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.normalKey = normalKey;
    this.pressedKey = pressedKey || normalKey;
    this.onClick = onClick;
    this.scaleOnPress = scaleOnPress;
    this.isPressed = false;
    this.visible = true;
    this.enabled = true;
    this.badgeText = null;
    this.pulse = 0;
  }

  contains(px, py) {
    if (!this.visible || !this.enabled) return false;
    return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h;
  }

  render(ctx, assets) {
    if (!this.visible) return;

    ctx.save();
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    ctx.translate(cx, cy);

    let scale = 1.0;
    if (this.isPressed && this.scaleOnPress) {
      scale = 0.94;
    } else if (this.pulse > 0) {
      scale = 1.0 + Math.sin(Date.now() * 0.008) * 0.05;
    }
    ctx.scale(scale, scale);

    const imgKey = this.isPressed ? this.pressedKey : this.normalKey;
    const img = assets.get(imgKey);
    if (img) {
      ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
    }

    // Render badge if exists (like powerup remaining count)
    if (this.badgeText !== null && this.badgeText !== undefined) {
      const notifImg = assets.get('Notifications');
      const badgeX = this.w * 0.35;
      const badgeY = -this.h * 0.35;
      const badgeRadius = 28;

      if (notifImg) {
        ctx.drawImage(notifImg, badgeX - badgeRadius, badgeY - badgeRadius, badgeRadius * 2, badgeRadius * 2);
      } else {
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff1744';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 34px "Passion One", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('' + this.badgeText, badgeX, badgeY + 2);
    }

    ctx.restore();
  }
}
