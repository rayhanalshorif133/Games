/**
 * Player Controller & Cyber Runner Entity
 * Handles 3-lane switching, jumping, sliding, powerup timers, and procedural rendering.
 */

class Player {
  constructor(runtime) {
    this.runtime = runtime;

    // Lane positioning (-1 = Left, 0 = Center, 1 = Right)
    this.currentLane = 0;
    this.targetLane = 0;
    this.laneX = 0; // Smooth interpolated float

    // Vertical physics
    this.y = 0; // Height above track
    this.vy = 0;
    this.gravity = 2800;
    this.jumpForce = 1100;
    this.isGrounded = true;

    // Slide state
    this.isSliding = false;
    this.slideDuration = 0.75;
    this.slideTimer = 0;

    // Normal dimensions in world units
    this.width = 110;
    this.height = 160;

    // Animation variables
    this.animTime = 0;
    this.isDead = false;

    // Power-up States & Timers
    this.isShielded = false;
    this.magnetTimer = 0;
    this.multiplierTimer = 0;
    this.boostTimer = 0;
  }

  get isMagnet() {
    return this.magnetTimer > 0;
  }

  get is2x() {
    return this.multiplierTimer > 0;
  }

  get isBoosting() {
    return this.boostTimer > 0;
  }

  reset() {
    this.currentLane = 0;
    this.targetLane = 0;
    this.laneX = 0;
    this.y = 0;
    this.vy = 0;
    this.isGrounded = true;
    this.isSliding = false;
    this.slideTimer = 0;
    this.isDead = false;
    this.animTime = 0;

    this.isShielded = false;
    this.magnetTimer = 0;
    this.multiplierTimer = 0;
    this.boostTimer = 0;
  }

  // --- CONTROLS ---
  moveLeft() {
    if (this.isDead) return;
    if (this.targetLane > -1) {
      this.targetLane--;
      if (window.soundEngine) window.soundEngine.playLaneSwitch();
    }
  }

  moveRight() {
    if (this.isDead) return;
    if (this.targetLane < 1) {
      this.targetLane++;
      if (window.soundEngine) window.soundEngine.playLaneSwitch();
    }
  }

  jump() {
    if (this.isDead) return;
    // Cancel slide if sliding
    if (this.isSliding) {
      this.isSliding = false;
      this.slideTimer = 0;
    }

    if (this.isGrounded || this.isBoosting) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      if (window.soundEngine) window.soundEngine.playJump();

      // Emit jump dust particles
      const proj = this.runtime.camera.project(this.laneX, 0, 0);
      if (proj) {
        this.runtime.particles.emit({
          x: proj.x,
          y: proj.groundY,
          count: 14,
          color: '#00f0ff',
          spreadX: 10,
          spreadY: 4,
          size: 6,
          decay: 0.04
        });
      }
    }
  }

  slide() {
    if (this.isDead) return;
    // Fast drop down if jumping
    if (!this.isGrounded && !this.isBoosting) {
      this.vy = -1800; // Slam down quickly
    }

    this.isSliding = true;
    this.slideTimer = this.slideDuration;
    if (window.soundEngine) window.soundEngine.playSlide();

    // Slide friction sparks
    const proj = this.runtime.camera.project(this.laneX, 0, 0);
    if (proj) {
      this.runtime.particles.emit({
        x: proj.x,
        y: proj.groundY,
        count: 16,
        color: '#ff0077',
        spreadX: 14,
        spreadY: 4,
        size: 7,
        shape: 'spark',
        decay: 0.05
      });
    }
  }

  activatePowerup(type) {
    if (type === 'magnet') {
      this.magnetTimer = 10.0;
    } else if (type === 'shield') {
      this.isShielded = true;
      if (window.soundEngine) window.soundEngine.playShield();
    } else if (type === '2x') {
      this.multiplierTimer = 12.0;
    } else if (type === 'boost') {
      this.boostTimer = 7.0;
      this.y = 220; // Hover elevated
      this.vy = 0;
      this.isGrounded = false;
    }
  }

  die() {
    this.isDead = true;
  }

  updateIdle(dt) {
    this.animTime += dt * 5;
  }

  update(dt) {
    if (this.isDead) return;

    this.animTime += dt * 18;

    // Smooth lane horizontal lerp
    const laneLerpSpeed = 16;
    this.laneX += (this.targetLane - this.laneX) * Math.min(1, laneLerpSpeed * dt);

    // Update Powerup Timers
    if (this.magnetTimer > 0) this.magnetTimer = Math.max(0, this.magnetTimer - dt);
    if (this.multiplierTimer > 0) this.multiplierTimer = Math.max(0, this.multiplierTimer - dt);

    if (this.boostTimer > 0) {
      this.boostTimer = Math.max(0, this.boostTimer - dt);
      // Floating boost hover altitude
      const targetHoverY = 200 + Math.sin(this.animTime * 0.5) * 20;
      this.y += (targetHoverY - this.y) * 10 * dt;
      this.vy = 0;
      this.isGrounded = false;

      // Thruster flame particles
      const proj = this.runtime.camera.project(this.laneX, this.y, 0);
      if (proj) {
        this.runtime.particles.emit({
          x: proj.x,
          y: proj.y + 40,
          count: 3,
          color: Math.random() > 0.5 ? '#00f0ff' : '#ff0077',
          vx: 0,
          vy: 8,
          spreadX: 4,
          size: 10,
          decay: 0.05
        });
      }
    } else {
      // Normal Gravity & Jumping
      if (!this.isGrounded) {
        this.vy -= this.gravity * dt;
        this.y += this.vy * dt;

        if (this.y <= 0) {
          this.y = 0;
          this.vy = 0;
          this.isGrounded = true;

          // Landing dust
          const proj = this.runtime.camera.project(this.laneX, 0, 0);
          if (proj) {
            this.runtime.particles.emit({
              x: proj.x,
              y: proj.groundY,
              count: 10,
              color: '#ffffff',
              spreadX: 8,
              spreadY: 2,
              size: 5,
              decay: 0.05
            });
          }
        }
      }

      // Slide countdown
      if (this.isSliding) {
        this.slideTimer -= dt;
        if (this.slideTimer <= 0) {
          this.isSliding = false;
        } else {
          // Slide trail sparks
          if (Math.random() < 0.4) {
            const proj = this.runtime.camera.project(this.laneX, 0, 0);
            if (proj) {
              this.runtime.particles.emit({
                x: proj.x + (Math.random() - 0.5) * 40,
                y: proj.groundY,
                count: 2,
                color: '#00f0ff',
                spreadX: 6,
                spreadY: 2,
                size: 4,
                decay: 0.06
              });
            }
          }
        }
      }
    }
  }

  // Bounding box for collisions
  getBounds() {
    const effectiveHeight = this.isSliding ? 60 : this.height;
    return {
      laneX: this.laneX,
      targetLane: this.targetLane,
      y: this.y,
      top: this.y + effectiveHeight,
      width: this.width,
      height: effectiveHeight,
      isSliding: this.isSliding,
      isJumping: !this.isGrounded && this.y > 60
    };
  }

  draw(ctx, camera) {
    const proj = camera.project(this.laneX, this.y, 0);
    if (!proj) return;

    ctx.save();
    ctx.translate(proj.x, proj.y);

    // 1. Shadow on track
    const shadowProj = camera.project(this.laneX, 0, 0);
    if (shadowProj) {
      ctx.save();
      ctx.translate(0, shadowProj.groundY - proj.y);
      const shadowScale = Math.max(0.2, 1 - (this.y / 600));
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 0, (this.isSliding ? 70 : 45) * shadowScale, 18 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this.isDead) {
      // Draw shattered/crash pose
      ctx.rotate(0.6);
      ctx.fillStyle = '#ff0077';
      ctx.fillRect(-25, -60, 50, 60);
      ctx.restore();
      return;
    }

    // 2. Character Drawing
    if (this.isSliding) {
      this.drawSlidingCharacter(ctx);
    } else {
      this.drawRunningCharacter(ctx);
    }

    // 3. Power-up Aura Overlays
    if (this.isShielded) {
      this.drawShieldAura(ctx);
    }

    if (this.isMagnet) {
      this.drawMagnetAura(ctx);
    }

    ctx.restore();
  }

  drawRunningCharacter(ctx) {
    const runCycle = Math.sin(this.animTime);
    const legSwing = Math.sin(this.animTime) * 35;
    const armSwing = Math.cos(this.animTime) * 30;
    const bobY = Math.abs(Math.cos(this.animTime)) * 8;

    ctx.save();
    ctx.translate(0, -bobY);

    // Cyber Boots / Legs (Left and Right)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Left Leg
    ctx.beginPath();
    ctx.moveTo(-16, -55);
    ctx.lineTo(-24 + legSwing * 0.4, -25);
    ctx.lineTo(-20 + legSwing, 0);
    ctx.stroke();

    // Right Leg
    ctx.beginPath();
    ctx.moveTo(16, -55);
    ctx.lineTo(24 - legSwing * 0.4, -25);
    ctx.lineTo(20 - legSwing, 0);
    ctx.stroke();

    // Shoes Glow
    ctx.fillStyle = '#ff0077';
    ctx.fillRect(-26 + legSwing, -6, 20, 10);
    ctx.fillRect(14 - legSwing, -6, 20, 10);

    // Torso / Cyber Armor
    ctx.fillStyle = '#111a3b';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-24, -115, 48, 65, 8);
    ctx.fill();
    ctx.stroke();

    // Armor Core Reactor
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, -85, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cyber Scarf / Streamer
    ctx.strokeStyle = '#ff0077';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -110);
    ctx.quadraticCurveTo(-30 + runCycle * 15, -120, -50 + runCycle * 25, -100);
    ctx.stroke();

    // Cyber Helmet / Head
    ctx.fillStyle = '#0a1024';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-18, -155, 36, 36, 10);
    ctx.fill();
    ctx.stroke();

    // Glowing Neon Visor
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(-14, -145, 28, 12, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cyber Arms
    ctx.strokeStyle = '#c0d0f5';
    ctx.lineWidth = 10;
    // Left Arm
    ctx.beginPath();
    ctx.moveTo(-24, -105);
    ctx.lineTo(-38 - armSwing * 0.3, -80);
    ctx.lineTo(-35 - armSwing, -60);
    ctx.stroke();

    // Right Arm
    ctx.beginPath();
    ctx.moveTo(24, -105);
    ctx.lineTo(38 + armSwing * 0.3, -80);
    ctx.lineTo(35 + armSwing, -60);
    ctx.stroke();

    ctx.restore();
  }

  drawSlidingCharacter(ctx) {
    ctx.save();
    ctx.translate(0, 0);

    // Sliding low profile
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';

    // Extended sliding legs
    ctx.beginPath();
    ctx.moveTo(-10, -25);
    ctx.lineTo(35, -12);
    ctx.lineTo(70, -6);
    ctx.stroke();

    // Low Torso
    ctx.fillStyle = '#111a3b';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-45, -45, 60, 30, 8);
    ctx.fill();
    ctx.stroke();

    // Reactor Glow
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-15, -30, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Head tucked back
    ctx.fillStyle = '#0a1024';
    ctx.beginPath();
    ctx.roundRect(-65, -48, 28, 26, 8);
    ctx.fill();
    ctx.stroke();

    // Visor
    ctx.fillStyle = '#ff0077';
    ctx.shadowColor = '#ff0077';
    ctx.shadowBlur = 12;
    ctx.fillRect(-62, -40, 20, 9);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  drawShieldAura(ctx) {
    ctx.save();
    const pulse = 1 + Math.sin(this.animTime * 0.8) * 0.08;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.arc(0, -75, 95 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Orbiting shield plasma node
    const orbitAngle = this.animTime * 0.5;
    const ox = Math.cos(orbitAngle) * 95 * pulse;
    const oy = -75 + Math.sin(orbitAngle) * 95 * pulse;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ox, oy, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawMagnetAura(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 0, 119, 0.7)';
    ctx.lineWidth = 3;
    const rings = 3;
    for (let i = 0; i < rings; i++) {
      const prog = (this.animTime * 0.3 + i / rings) % 1;
      const radius = 50 + prog * 90;
      ctx.globalAlpha = 1 - prog;
      ctx.beginPath();
      ctx.arc(0, -75, radius, -Math.PI * 0.8, -Math.PI * 0.2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

window.Player = Player;

