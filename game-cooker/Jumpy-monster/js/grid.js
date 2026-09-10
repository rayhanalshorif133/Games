/**
 * grid.js - Manages the 8-directional platform grid, safe logs, deadly hazards,
 * bonus pickups, Water.png environment with floating logs, and smooth world shifting.
 */
import { Assets } from './assets.js';
import { Audio } from './audio.js';

export const PlatformType = {
  SAFE: 'SAFE',
  DEADLY: 'DEADLY'
};

const POSSIBLE_SLOTS = [
  { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
  { x: -1, y: 0  },                  { x: 1, y: 0  },
  { x: -1, y: 1  }, { x: 0, y: 1  }, { x: 1, y: 1  }
];

export class GridManager {
  constructor(centerX, centerY) {
    this.centerX = centerX;
    this.centerY = centerY;

    // Platform spacing for 1080x1920 layout
    this.offsetX = 320;
    this.offsetY = 250;

    // Active platforms on screen
    this.platforms = [];

    // Smooth world shift transition
    this.isShifting = false;
    this.shiftTime = 0;
    this.shiftDuration = 0.30; // matches jump duration

    // Parallax background offset
    this.bgOffsetX = 0;
    this.bgOffsetY = 0;
    this.targetBgOffsetX = 0;
    this.targetBgOffsetY = 0;

    // Particle effects (water ripples, sparkles, landing splashes)
    this.particles = [];

    this.reset();
  }

  reset() {
    this.platforms = [];
    this.particles = [];
    this.isShifting = false;
    this.shiftTime = 0;
    this.bgOffsetX = 0;
    this.bgOffsetY = 0;
    this.targetBgOffsetX = 0;
    this.targetBgOffsetY = 0;

    // Center starting platform (floating pad)
    this.centerPlatform = {
      id: 'center_0',
      gridX: 0,
      gridY: 0,
      x: this.centerX,
      y: this.centerY + 30,
      startX: this.centerX,
      startY: this.centerY + 30,
      targetX: this.centerX,
      targetY: this.centerY + 30,
      type: PlatformType.SAFE,
      visualKey: 'pad',
      width: 230,
      height: 125,
      hasBonus: false,
      alpha: 1,
      scale: 1,
      rippleTimer: 0
    };
    this.platforms.push(this.centerPlatform);

    // Spawn initial surrounding platforms
    this.spawnSurrounding(0);
  }

  /**
   * Spawns platforms around center based on current score difficulty
   */
  spawnSurrounding(score) {
    const slots = [...POSSIBLE_SLOTS].sort(() => Math.random() - 0.5);

    let numPlatforms = 7;
    let maxDeadly = 0;

    if (score < 7) {
      numPlatforms = Math.floor(Math.random() * 2) + 7;
      maxDeadly = 0;
    } else if (score < 18) {
      numPlatforms = Math.floor(Math.random() * 2) + 5;
      maxDeadly = Math.random() < 0.65 ? 1 : 2;
    } else {
      numPlatforms = Math.floor(Math.random() * 2) + 4;
      maxDeadly = Math.random() < 0.5 ? 2 : 3;
    }

    const chosenSlots = slots.slice(0, numPlatforms);

    let deadlyAssigned = 0;
    let safeCount = 0;

    const slotConfigs = chosenSlots.map((slot, idx) => {
      let isDeadly = false;
      if (deadlyAssigned < maxDeadly && idx > 0 && Math.random() < 0.55) {
        isDeadly = true;
        deadlyAssigned++;
      } else {
        safeCount++;
      }
      return { slot, isDeadly };
    });

    if (safeCount === 0 && slotConfigs.length > 0) {
      slotConfigs[0].isDeadly = false;
    }

    let bonusGiven = false;
    const bonusChance = score > 0 ? 0.35 : 0.2;

    slotConfigs.forEach(({ slot, isDeadly }, index) => {
      const visualOptions = ['wood_1', 'wood_2', 'wood_3', 'pad'];
      const visualKey = isDeadly ? 'wood_1' : visualOptions[Math.floor(Math.random() * visualOptions.length)];

      let hasBonus = false;
      let bonusKey = null;

      if (!isDeadly && !bonusGiven && Math.random() < bonusChance) {
        hasBonus = true;
        bonusGiven = true;
        const trophyKeys = ['trophy_gold', 'trophy_silver', 'accs_2', 'accs_4'];
        bonusKey = trophyKeys[Math.floor(Math.random() * trophyKeys.length)];
      }

      const targetX = this.centerX + slot.x * this.offsetX;
      const targetY = this.centerY + slot.y * this.offsetY + 30;

      let w = 250;
      let h = 95;
      if (visualKey === 'wood_2') { w = 295; h = 100; }
      else if (visualKey === 'wood_3') { w = 235; h = 95; }
      else if (visualKey === 'pad') { w = 220; h = 120; }

      const plat = {
        id: `plat_${Date.now()}_${index}`,
        gridX: slot.x,
        gridY: slot.y,
        x: targetX,
        y: targetY,
        startX: targetX,
        startY: targetY,
        targetX: targetX,
        targetY: targetY,
        type: isDeadly ? PlatformType.DEADLY : PlatformType.SAFE,
        visualKey,
        width: w,
        height: h,
        hasBonus,
        bonusKey,
        alpha: 0,
        scale: 0.7,
        rippleTimer: Math.random()
      };

      this.platforms.push(plat);
    });
  }

  /**
   * Handle jump input to direction (dirX, dirY)
   */
  handleJump(dirX, dirY, currentScore) {
    const targetPlatform = this.platforms.find(
      (p) => p.gridX === dirX && p.gridY === dirY
    );

    if (!targetPlatform) {
      // 1. Jumped into empty void (water abyss)
      return { result: 'FALL' };
    }

    if (targetPlatform.type === PlatformType.DEADLY) {
      // 2. Jumped onto deadly hazard
      return { result: 'DEADLY', platform: targetPlatform };
    }

    // 3. Jumped onto safe platform!
    const hadBonus = targetPlatform.hasBonus;
    if (hadBonus) {
      targetPlatform.hasBonus = false;
      Audio.playBonus();
      this.spawnSparkles(targetPlatform.x, targetPlatform.y - 30);
    }

    // Begin shifting world: selected platform becomes new center
    this.startWorldShift(dirX, dirY, targetPlatform, currentScore);

    return {
      result: 'SAFE',
      hadBonus,
      bonusScore: 10,
      bonusTime: 5
    };
  }

  /**
   * Smoothly shift the world so target platform moves to center (0, 0),
   * old platforms disperse, background scrolls, and new platforms spawn.
   */
  startWorldShift(dirX, dirY, targetPlatform, currentScore) {
    this.isShifting = true;
    this.shiftTime = 0;

    const deltaX = dirX * this.offsetX;
    const deltaY = dirY * this.offsetY;

    // Background parallax target
    this.targetBgOffsetX -= dirX * 50;
    this.targetBgOffsetY -= dirY * 35;

    // Update target positions for all platforms
    this.platforms.forEach((plat) => {
      plat.startX = plat.x;
      plat.startY = plat.y;
      plat.targetX = plat.x - deltaX;
      plat.targetY = plat.y - deltaY;

      plat.gridX -= dirX;
      plat.gridY -= dirY;

      if (plat === targetPlatform) {
        plat.gridX = 0;
        plat.gridY = 0;
      }
    });

    // Spawn water ripple under the landing target
    this.spawnRipples(this.centerX, this.centerY + 40);

    setTimeout(() => {
      this.platforms = this.platforms.filter((p) => p.gridX === 0 && p.gridY === 0);
      this.spawnSurrounding(currentScore);
      this.isShifting = false;
    }, this.shiftDuration * 1000);
  }

  spawnRipples(x, y) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        type: 'ripple',
        x,
        y,
        radius: 25 + i * 20,
        maxRadius: 110 + i * 35,
        alpha: 0.8,
        speed: 180
      });
    }
  }

  spawnSparkles(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.4;
      const speed = 90 + Math.random() * 110;
      this.particles.push({
        type: 'sparkle',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        radius: 4 + Math.random() * 4,
        alpha: 1,
        color: Math.random() < 0.5 ? '#ffd700' : '#4bfe81',
        life: 0.7
      });
    }
  }

  update(dt, time) {
    // Parallax background easing
    this.bgOffsetX += (this.targetBgOffsetX - this.bgOffsetX) * Math.min(1, dt * 10);
    this.bgOffsetY += (this.targetBgOffsetY - this.bgOffsetY) * Math.min(1, dt * 10);

    // Smooth cubic easing during world shift
    if (this.isShifting) {
      this.shiftTime += dt;
      const progress = Math.min(1, this.shiftTime / this.shiftDuration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      this.platforms.forEach((plat) => {
        plat.x = plat.startX + (plat.targetX - plat.startX) * ease;
        plat.y = plat.startY + (plat.targetY - plat.startY) * ease;

        if (plat.gridX !== 0 || plat.gridY !== 0) {
          plat.alpha = Math.max(0, 1 - progress * 1.5);
        }
      });
    }

    // Update platforms & spawn ambient water ripples under floating logs
    this.platforms.forEach((plat) => {
      if (plat.alpha < 1 && !this.isShifting) {
        plat.alpha = Math.min(1, plat.alpha + dt * 4.5);
        plat.scale = Math.min(1, plat.scale + dt * 4);
      }

      // Continuous ambient ripples around logs
      plat.rippleTimer += dt;
      if (plat.rippleTimer > 1.2 && plat.alpha > 0.8) {
        plat.rippleTimer = 0;
        this.particles.push({
          type: 'ripple',
          x: plat.x,
          y: plat.y + 15,
          radius: 15,
          maxRadius: plat.width * 0.65,
          alpha: 0.5,
          speed: 60
        });
      }
    });

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.type === 'ripple') {
        p.radius += p.speed * dt;
        p.alpha -= dt * 0.9;
        if (p.alpha <= 0 || p.radius >= p.maxRadius) {
          this.particles.splice(i, 1);
        }
      } else if (p.type === 'sparkle') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += dt * 220;
        p.alpha -= dt / p.life;
        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }
  }

  render(ctx, time) {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;

    // 1. Draw Base Environment Background (Bg.png)
    const bgImg = Assets.get('bg');
    if (bgImg) {
      const bgW = 1080 * 1.35;
      const bgH = 1920 * 1.35;
      const bgX = (1080 - bgW) / 2 + this.bgOffsetX * 0.2;
      const bgY = (1920 - bgH) / 2 + this.bgOffsetY * 0.2;
      ctx.drawImage(bgImg, bgX, bgY, bgW, bgH);
    } else {
      ctx.fillStyle = '#0f2e22';
      ctx.fillRect(0, 0, 1080, 1920);
    }

    // 2. Draw Flowing Water Layer (Water.png) Across the Play Area
    const waterImg = Assets.get('water');
    if (waterImg) {
      ctx.save();
      // Flowing water surface covering the middle and lower river zone
      const waterYStart = 380;
      const waterHeightTotal = 1350;

      // Draw water with flowing horizontal shimmer and subtle wave offset
      const waveOffset = Math.sin(time * 1.8) * 14;
      const flowScrollX = ((time * 25 + this.bgOffsetX * 0.5) % 1080) - 1080;

      // Draw 3 water tiles to ensure seamless flow
      for (let offset = flowScrollX; offset < 1080 + 1080; offset += 1080) {
        ctx.drawImage(
          waterImg,
          offset + waveOffset,
          waterYStart + this.bgOffsetY * 0.3,
          1080,
          waterHeightTotal
        );
      }

      // Soft water reflection sheen
      const waterGrad = ctx.createLinearGradient(0, waterYStart, 0, waterYStart + waterHeightTotal);
      waterGrad.addColorStop(0, 'rgba(40, 140, 180, 0.2)');
      waterGrad.addColorStop(0.5, 'rgba(15, 80, 120, 0.15)');
      waterGrad.addColorStop(1, 'rgba(5, 45, 75, 0.35)');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, waterYStart, 1080, waterHeightTotal);

      ctx.restore();
    }

    // 3. Water ripples on top of water surface (under the floating logs)
    this.particles.forEach((p) => {
      if (p.type === 'ripple') {
        ctx.save();
        ctx.strokeStyle = `rgba(175, 235, 255, ${p.alpha * 0.75})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius, p.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    });

    // 4. Render Floating Platforms (Wood logs & Lily pads) on top of Water
    const sortedPlatforms = [...this.platforms].sort((a, b) => a.y - b.y);

    sortedPlatforms.forEach((plat) => {
      ctx.save();
      ctx.globalAlpha = plat.alpha;
      ctx.translate(plat.x, plat.y);
      ctx.scale(plat.scale, plat.scale);

      // Gentle floating water bobbing motion
      const bob = Math.sin(time * 2.8 + plat.x * 0.008) * 4.5;
      ctx.translate(0, bob);

      // Water displacement shadow directly under floating wood
      ctx.fillStyle = 'rgba(2, 28, 48, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, plat.height * 0.32, plat.width * 0.54, plat.height * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Subtle water edge glow around the log
      ctx.strokeStyle = 'rgba(160, 230, 255, 0.22)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, plat.height * 0.32, plat.width * 0.56, plat.height * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Wood Log or Lily Pad Sprite
      const platImg = Assets.get(plat.visualKey) || Assets.get('wood_1');
      if (platImg) {
        ctx.drawImage(
          platImg,
          -plat.width / 2,
          -plat.height / 2,
          plat.width,
          plat.height
        );
      }

      // If Deadly: Draw ominous pulsating red hazard spikes / trap warning
      if (plat.type === PlatformType.DEADLY) {
        ctx.save();
        const pulse = 0.6 + Math.sin(time * 7.5) * 0.35;
        ctx.fillStyle = `rgba(255, 30, 30, ${pulse * 0.7})`;
        ctx.strokeStyle = `rgba(255, 90, 90, ${pulse})`;
        ctx.lineWidth = 3.5;

        // Glowing hazard warning spikes on top of platform
        ctx.beginPath();
        const spikeW = plat.width * 0.36;
        const spikeY = -plat.height * 0.38;
        ctx.moveTo(-spikeW, spikeY);
        ctx.lineTo(-spikeW * 0.5, spikeY - 30);
        ctx.lineTo(0, spikeY - 10);
        ctx.lineTo(spikeW * 0.5, spikeY - 30);
        ctx.lineTo(spikeW, spikeY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, spikeY - 10, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Bonus Trophy Pickup
      if (plat.hasBonus && plat.bonusKey) {
        const bonusImg = Assets.get(plat.bonusKey) || Assets.get('trophy_gold');
        if (bonusImg) {
          ctx.save();
          const hoverY = -plat.height * 0.5 - 35 + Math.sin(time * 4) * 10;
          ctx.translate(0, hoverY);

          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 20;

          const bSize = 68;
          ctx.drawImage(bonusImg, -bSize / 2, -bSize / 2, bSize, bSize);
          ctx.restore();
        }
      }

      ctx.restore();
    });

    // 5. Sparkle particles above platforms
    this.particles.forEach((p) => {
      if (p.type === 'sparkle') {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }
}
