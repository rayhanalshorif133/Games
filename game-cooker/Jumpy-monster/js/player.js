/**
 * player.js - Frogie character controller with state machine, animations,
 * support for both Front View and Side View (SV_) jump & idle animations.
 */
import { Assets } from './assets.js';
import { Audio } from './audio.js';

export const PlayerState = {
  IDLE: 'IDLE',
  JUMP_PREP: 'JUMP_PREP',
  JUMP_AIR: 'JUMP_AIR',
  LANDING: 'LANDING',
  FALLING: 'FALLING',
  DEADLY_HIT: 'DEADLY_HIT'
};

export class Player {
  constructor(centerX, centerY) {
    this.x = centerX;
    this.y = centerY;
    this.baseX = centerX;
    this.baseY = centerY;

    this.state = PlayerState.IDLE;
    this.dirX = 0;
    this.dirY = 0;

    // Visual dimensions scaled for 1080x1920 resolution
    this.width = 195;
    this.height = 150;

    // View mode: true for Side View (SV_), false for Front View
    this.isSideJump = false;
    this.isSideView = false;

    // Animation timers
    this.animTime = 0;
    this.currentFrame = 0;
    this.stateTimer = 0;
    this.jumpDuration = 0.30; // seconds in flight

    // Jump flight offsets
    this.jumpArcY = 0;
    this.jumpProgress = 0;
    this.targetVisualOffsetX = 0;
    this.targetVisualOffsetY = 0;

    // Facing angle (radians)
    this.facingAngle = 0;
    this.targetAngle = 0;
    this.facingFlipX = false;

    // Defeat states
    this.fallY = 0;
    this.fallScale = 1;
    this.fallAlpha = 1;
    this.fallRotation = 0;

    // Flash effect on hit
    this.flashWhite = 0;
  }

  reset(centerX, centerY) {
    this.x = centerX;
    this.y = centerY;
    this.baseX = centerX;
    this.baseY = centerY;
    this.state = PlayerState.IDLE;
    this.dirX = 0;
    this.dirY = 0;
    this.isSideJump = false;
    this.isSideView = false;
    this.animTime = 0;
    this.currentFrame = 0;
    this.stateTimer = 0;
    this.jumpArcY = 0;
    this.jumpProgress = 0;
    this.targetVisualOffsetX = 0;
    this.targetVisualOffsetY = 0;
    this.facingAngle = 0;
    this.targetAngle = 0;
    this.facingFlipX = false;
    this.fallY = 0;
    this.fallScale = 1;
    this.fallAlpha = 1;
    this.fallRotation = 0;
    this.flashWhite = 0;
  }

  /**
   * Initiates a jump towards (dirX, dirY)
   * Activates Side View animations for horizontal / diagonal jumps!
   */
  startJump(dirX, dirY, offsetX, offsetY) {
    if (this.state !== PlayerState.IDLE && this.state !== PlayerState.LANDING) return;

    this.dirX = dirX;
    this.dirY = dirY;
    this.state = PlayerState.JUMP_AIR;
    this.stateTimer = 0;
    this.jumpProgress = 0;

    // Offset in screen space for relative jump visual
    this.targetVisualOffsetX = dirX * offsetX;
    this.targetVisualOffsetY = dirY * offsetY;

    // Determine if this should use Side View (SV_) animations
    if (Math.abs(dirX) > 0) {
      // Left, Right, Up-Left, Up-Right, Down-Left, Down-Right
      this.isSideJump = true;
      this.isSideView = true;

      // Flip sprite for Left vs Right
      if (dirX < 0) {
        this.facingFlipX = true;
      } else {
        this.facingFlipX = false;
      }

      // Slight angle tilt for diagonal side jumps
      this.targetAngle = dirY * 0.22;
    } else {
      // Pure vertical jump (Up or Down) -> Use front view
      this.isSideJump = false;
      this.isSideView = false;
      this.facingFlipX = false;
      this.targetAngle = 0;
    }

    Audio.playJump();
  }

  triggerFall() {
    this.state = PlayerState.FALLING;
    this.stateTimer = 0;
    Audio.playSplash();
  }

  triggerDeadly() {
    this.state = PlayerState.DEADLY_HIT;
    this.stateTimer = 0;
    this.flashWhite = 1;
    Audio.playDeadly();
  }

  triggerLand() {
    this.state = PlayerState.LANDING;
    this.stateTimer = 0;
    this.animTime = 0;
    this.currentFrame = 0;
    this.targetAngle = 0;
    Audio.playLand();
  }

  update(dt) {
    this.animTime += dt;
    this.stateTimer += dt;

    if (this.flashWhite > 0) {
      this.flashWhite = Math.max(0, this.flashWhite - dt * 4);
    }

    // Smooth angle interpolation
    this.facingAngle += (this.targetAngle - this.facingAngle) * Math.min(1, dt * 16);

    switch (this.state) {
      case PlayerState.IDLE: {
        // 20 idle frames cycling smoothly at ~14 FPS
        const fps = 14;
        this.currentFrame = Math.floor(this.animTime * fps) % 20;
        this.x = this.baseX;
        this.y = this.baseY;
        this.jumpArcY = 0;
        break;
      }

      case PlayerState.JUMP_AIR: {
        this.jumpProgress = Math.min(1, this.stateTimer / this.jumpDuration);

        // Parabolic arc height
        const peakHeight = 115;
        this.jumpArcY = -Math.sin(this.jumpProgress * Math.PI) * peakHeight;

        // Smooth ease-out quad for airborne motion
        const ease = 1 - Math.pow(1 - this.jumpProgress, 2);
        this.x = this.baseX + this.targetVisualOffsetX * (ease * 0.42);
        this.y = this.baseY + this.targetVisualOffsetY * (ease * 0.42);
        break;
      }

      case PlayerState.LANDING: {
        // Landing animation: 10 frames for Side View, 13 frames for Front View
        const totalFrames = this.isSideJump ? 10 : 13;
        const fps = 28;
        const frame = Math.floor(this.stateTimer * fps);

        if (frame >= totalFrames) {
          this.state = PlayerState.IDLE;
          this.animTime = 0;
          this.currentFrame = 0;
        } else {
          this.currentFrame = frame;
        }

        // Smoothly settle back to center
        this.x += (this.baseX - this.x) * Math.min(1, dt * 14);
        this.y += (this.baseY - this.y) * Math.min(1, dt * 14);
        this.jumpArcY = 0;
        break;
      }

      case PlayerState.FALLING: {
        // Fall into the water void: accelerates down, spins, and fades out
        this.fallY += dt * 600;
        this.fallScale = Math.max(0.08, 1 - this.stateTimer * 1.6);
        this.fallAlpha = Math.max(0, 1 - this.stateTimer * 2.2);
        this.fallRotation += dt * 8 * (this.dirX || 1);
        break;
      }

      case PlayerState.DEADLY_HIT: {
        // Bounces up shocked, then collapses
        this.fallY -= (1 - this.stateTimer * 3.5) * dt * 320;
        this.fallAlpha = Math.max(0, 1 - this.stateTimer * 1.8);
        this.fallRotation += dt * 12;
        break;
      }
    }
  }

  render(ctx) {
    let img = null;

    switch (this.state) {
      case PlayerState.IDLE: {
        const frameStr = String(this.currentFrame).padStart(2, '0');
        if (this.isSideView) {
          // Side View Idle
          img = Assets.get(`sv_idle_${frameStr}`) || Assets.get(`idle_${frameStr}`);
        } else {
          // Front View Idle
          img = Assets.get(`idle_${frameStr}`);
        }
        break;
      }

      case PlayerState.JUMP_AIR: {
        if (this.isSideJump) {
          // Side View Airborne Jump pose
          img = Assets.get('sv_jump_air');
        } else {
          // Front View Airborne Jump pose
          img = Assets.get('jump_air');
        }
        break;
      }

      case PlayerState.LANDING: {
        const frameStr = String(this.currentFrame).padStart(2, '0');
        if (this.isSideJump) {
          // Side View Landing
          img = Assets.get(`sv_jump_land_${frameStr}`) || Assets.get('sv_jump_air');
        } else {
          // Front View Landing
          img = Assets.get(`jump_land_${frameStr}`) || Assets.get('jump_air');
        }
        break;
      }

      case PlayerState.FALLING:
      case PlayerState.DEADLY_HIT: {
        img = this.isSideJump ? Assets.get('sv_jump_air') : Assets.get('jump_air');
        break;
      }

      default:
        img = Assets.get('idle_00');
    }

    if (!img) return;

    ctx.save();

    // Position + jump arc + defeat offsets
    const drawX = this.x;
    const drawY = this.y + this.jumpArcY + this.fallY;

    ctx.translate(drawX, drawY);

    // Alpha / fade
    ctx.globalAlpha = this.fallAlpha;

    // Facing direction flip & tilt rotation
    if (this.facingFlipX) {
      ctx.scale(-1, 1);
    }
    ctx.rotate(this.facingAngle + this.fallRotation);

    // Scaling (airborne squash & stretch or defeat shrink)
    let scaleX = 1;
    let scaleY = 1;

    if (this.state === PlayerState.JUMP_AIR) {
      // Squash at launch, stretch midair
      const stretch = Math.sin(this.jumpProgress * Math.PI) * 0.2;
      scaleX = 1 - stretch * 0.5;
      scaleY = 1 + stretch;
    } else if (this.state === PlayerState.LANDING) {
      // Squash on landing
      const settleProgress = Math.min(1, this.stateTimer / 0.25);
      const squash = Math.sin(settleProgress * Math.PI) * 0.18;
      scaleX = 1 + squash;
      scaleY = 1 - squash;
    } else if (this.state === PlayerState.FALLING || this.state === PlayerState.DEADLY_HIT) {
      scaleX = this.fallScale;
      scaleY = this.fallScale;
    }

    ctx.scale(scaleX, scaleY);

    // Dynamic water shadow on ground/water while jumping
    if (this.state === PlayerState.JUMP_AIR && this.jumpArcY < -10) {
      ctx.save();
      ctx.translate(0, -this.jumpArcY); // anchor to ground
      ctx.fillStyle = 'rgba(2, 28, 48, 0.45)';
      ctx.beginPath();
      const shadowW = this.width * 0.42 * (1 - Math.abs(this.jumpArcY) / 220);
      const shadowH = this.height * 0.18 * (1 - Math.abs(this.jumpArcY) / 220);
      ctx.ellipse(0, 24, Math.max(8, shadowW), Math.max(3, shadowH), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Frogie sprite centered
    ctx.drawImage(
      img,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );

    // White flash overlay when damaged
    if (this.flashWhite > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = `rgba(255, 60, 60, ${this.flashWhite * 0.7})`;
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      ctx.restore();
    }

    ctx.restore();
  }
}
