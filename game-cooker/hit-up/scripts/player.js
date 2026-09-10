// scripts/player.js - King Human Player Class with Hammer Attacks & Gap Climbing
import { SpriteAnimation } from './sprites.js';

export class Player {
  constructor(game) {
    this.game = game;

    // Collision Box Dimensions (world coordinates)
    this.width = 54;
    this.height = 84;

    // Position & Velocity
    this.x = 540 - this.width / 2;
    this.y = 2800 - this.height;
    this.vx = 0;
    this.vy = 0;

    // Movement Constants - calibrated for effortless high jump to ceiling
    this.speed = 460;
    this.accel = 2400;
    this.friction = 2000;
    this.gravity = 1750;       // reduced for floaty, controllable jump
    this.jumpForce = -1120;     // high jump easily reaches the 350px ceiling & through gaps!
    this.maxFallSpeed = 1100;

    // States
    this.grounded = false;
    this.facingLeft = false;
    this.state = 'idle'; // idle, run, jump, fall, attack, hit, dead, door_in
    this.attackType = 'forward'; // 'forward', 'up', 'down'
    this.attackTimer = 0;
    this.attackDuration = 0.28;
    this.hasHitCurrentAttack = false;

    // Health & Stats (More generous for easier, fun gameplay)
    this.maxHealth = 5;        // 5 Hearts!
    this.health = 5;
    this.invulnerableTimer = 0;
    this.dead = false;
    this.doorEntered = false;

    // Animations (78x58 source frames)
    this.animScale = 2.4;
    this.spriteDrawWidth = 78 * this.animScale;   // ~187px
    this.spriteDrawHeight = 58 * this.animScale;  // ~139px

    this.anims = {
      idle: new SpriteAnimation('king_idle', 78, 58, 11, 10, true),
      run: new SpriteAnimation('king_run', 78, 58, 8, 12, true),
      jump: new SpriteAnimation('king_jump', 78, 58, 1, 1, true),
      fall: new SpriteAnimation('king_fall', 78, 58, 1, 1, true),
      ground: new SpriteAnimation('king_ground', 78, 58, 1, 1, true),
      attack: new SpriteAnimation('king_attack', 78, 58, 3, 14, false),
      hit: new SpriteAnimation('king_hit', 78, 58, 2, 8, false),
      dead: new SpriteAnimation('king_dead', 78, 58, 4, 6, false),
      door_in: new SpriteAnimation('king_door_in', 78, 58, 8, 8, false)
    };

    this.currentAnim = this.anims.idle;
  }

  reset(x, y) {
    this.x = x || (540 - this.width / 2);
    this.y = y || (2800 - this.height);
    this.vx = 0;
    this.vy = 0;
    this.health = this.maxHealth;
    this.dead = false;
    this.doorEntered = false;
    this.invulnerableTimer = 0;
    this.state = 'idle';
    this.currentAnim = this.anims.idle;
    this.currentAnim.reset();
  }

  setAnim(animKey) {
    if (this.anims[animKey] && this.currentAnim !== this.anims[animKey]) {
      this.currentAnim = this.anims[animKey];
      this.currentAnim.reset();
    }
  }

  // Trigger Hammer Attack
  attack(type = 'forward') {
    if (this.dead || this.doorEntered || this.state === 'attack' || this.state === 'hit') return;

    this.state = 'attack';
    this.attackType = type;
    this.attackTimer = this.attackDuration;
    this.hasHitCurrentAttack = false;
    this.setAnim('attack');
    this.game.audio.playHammer();

    // Check hit immediately and during swing
    this.checkHammerHit();
  }

  // Hammer Hitbox Collision against breakable blocks & enemies
  checkHammerHit() {
    if (this.hasHitCurrentAttack) return;

    let hitBox = { x: 0, y: 0, w: 0, h: 0 };

    if (this.attackType === 'up' || !this.grounded) {
      // In air or pressing Up, hammer sweeps across and high above player's head!
      hitBox = {
        x: this.x - 40,
        y: this.y - 95,
        w: this.width + 80,
        h: 120
      };
    } else if (this.attackType === 'down') {
      // Downward Ground Pound
      hitBox = {
        x: this.x - 20,
        y: this.y + this.height - 10,
        w: this.width + 40,
        h: 70
      };
    } else {
      // Forward Swing with generous reach
      const reach = 95;
      hitBox = {
        x: this.facingLeft ? (this.x - reach) : (this.x + this.width),
        y: this.y - 20,
        w: reach,
        h: this.height + 20
      };
    }

    let hitSomething = false;

    // 1. Check Breakable Blocks across all floors
    for (const f of this.game.world.floors) {
      // Only check floors near player
      if (Math.abs(f.y - this.y) > 300) continue;

      for (const b of f.blocks) {
        if (b.broken) continue;

        // AABB check between hitBox and block
        if (
          hitBox.x < b.x + b.width &&
          hitBox.x + hitBox.w > b.x &&
          hitBox.y < b.y + b.height &&
          hitBox.y + hitBox.h > b.y
        ) {
          this.game.world.hitBlock(b, 1);
          hitSomething = true;
          this.hasHitCurrentAttack = true;
          break;
        }
      }
      if (hitSomething) break;
    }

    // 2. Check Enemies (patrol pigs, repairer pigs, bombs, boss)
    for (const enemy of this.game.enemies) {
      if (enemy.dead) continue;

      if (
        hitBox.x < enemy.x + enemy.width &&
        hitBox.x + hitBox.w > enemy.x &&
        hitBox.y < enemy.y + enemy.height &&
        hitBox.y + hitBox.h > enemy.y
      ) {
        enemy.takeDamage(1, this.facingLeft ? -1 : 1);
        hitSomething = true;
        this.hasHitCurrentAttack = true;
        this.game.camera.shake(6, 0.2);
        this.game.particles.spawnSparks(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 10);
        break;
      }
    }
  }

  takeDamage(amount = 1, fromX = null, reason = 'Enemy Attack') {
    if (this.dead || this.doorEntered || this.invulnerableTimer > 0) return;

    this.health -= amount;
    this.invulnerableTimer = 2.0; // 2 seconds of invulnerability
    this.lastDamageReason = reason;

    // Trigger visual and sound feedback
    this.game.triggerDamageFlash();
    this.game.audio.playPlayerHurt();
    this.game.camera.shake(12, 0.35);

    // Big floating text directly above player clearly showing what hit them!
    this.game.particles.spawnText(`-1 ❤️ ${reason.toUpperCase()}`, this.x + this.width / 2, this.y - 40, '#ff3333', 34);
    this.game.particles.spawnDust(this.x + this.width / 2, this.y + this.height / 2, 12, 'rgba(255, 60, 60,');

    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
      this.state = 'dead';
      this.setAnim('dead');
      this.vy = -500; // death hop
      this.game.audio.playGameOver();
      this.game.onPlayerDeath(this.lastDamageReason);
    } else {
      this.state = 'hit';
      this.setAnim('hit');
      // Knockback
      const dir = (fromX !== null && fromX > this.x + this.width / 2) ? -1 : 1;
      this.vx = dir * 250;
      this.vy = -300;
    }
  }

  update(dt, input) {
    if (this.dead) {
      // Death fall physics
      this.vy += this.gravity * dt;
      this.y += this.vy * dt;
      this.currentAnim.update(dt);
      return;
    }

    if (this.doorEntered) {
      this.currentAnim.update(dt);
      return;
    }

    // Invulnerability timer
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Handle Attack State timer
    if (this.state === 'attack') {
      this.attackTimer -= dt;
      this.checkHammerHit();
      if (this.attackTimer <= 0) {
        this.state = this.grounded ? 'idle' : 'fall';
      }
    }

    // Handle Hit recovery
    if (this.state === 'hit') {
      if (this.currentAnim.finished) {
        this.state = this.grounded ? 'idle' : 'fall';
      }
    }

    // --- HORIZONTAL INPUT & MOVEMENT ---
    let moveDir = 0;
    if (input.left) moveDir -= 1;
    if (input.right) moveDir += 1;

    if (moveDir !== 0 && this.state !== 'hit') {
      this.vx = moveDir * this.speed;
      this.facingLeft = (moveDir < 0);
      if (this.state !== 'attack' && this.grounded) {
        this.state = 'run';
      }
    } else {
      // Apply friction
      if (this.vx > 0) {
        this.vx = Math.max(0, this.vx - this.friction * dt);
      } else if (this.vx < 0) {
        this.vx = Math.min(0, this.vx + this.friction * dt);
      }
      if (this.state !== 'attack' && this.state !== 'hit' && this.grounded) {
        this.state = 'idle';
      }
    }

    // --- JUMPING ---
    if (input.jump && this.grounded && this.state !== 'hit') {
      this.vy = this.jumpForce;
      this.grounded = false;
      this.game.audio.playJump();
      this.game.particles.spawnDust(this.x + this.width / 2, this.y + this.height, 5);
      if (this.state !== 'attack') {
        this.state = 'jump';
      }
    }

    // --- ATTACK TRIGGER ---
    if (input.attackJustPressed) {
      if (input.up) {
        this.attack('up');
      } else if (input.down && !this.grounded) {
        this.attack('down');
      } else {
        this.attack('forward');
      }
    } else if (input.upSmashJustPressed) {
      this.attack('up');
    }

    // --- APPLY GRAVITY ---
    this.vy += this.gravity * dt;
    if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;

    // --- MOVE X & WALL COLLISION ---
    this.x += this.vx * dt;

    // Clamp inside castle side walls
    const minX = this.game.world.leftWallWidth;
    const maxX = this.game.world.width - this.game.world.rightWallWidth - this.width;
    if (this.x < minX) {
      this.x = minX;
      this.vx = 0;
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx = 0;
    }

    // --- MOVE Y & VERTICAL / GAP COLLISION ---
    const prevY = this.y;
    this.y += this.vy * dt;

    this.grounded = false;
    const playerFeet = this.y + this.height;
    const prevFeet = prevY + this.height;

    // Check collisions against floors and blocks
    for (const f of this.game.world.floors) {
      // 1. Landing on solid ground floor
      if (f.isGround) {
        if (playerFeet >= f.y) {
          this.y = f.y - this.height;
          this.vy = 0;
          this.grounded = true;
          if (this.state !== 'attack' && this.state !== 'hit') {
            this.state = (this.vx !== 0) ? 'run' : 'idle';
          }
        }
        continue;
      }

      // 2. Landing on solid side ledges
      const onLeftLedge = (this.x + this.width > f.leftLedge.x && this.x < f.leftLedge.x + f.leftLedge.width);
      const onRightLedge = (this.x + this.width > f.rightLedge.x && this.x < f.rightLedge.x + f.rightLedge.width);

      if (onLeftLedge || onRightLedge) {
        // Landing from above
        if (this.vy >= 0 && prevFeet <= f.y + 16 && playerFeet >= f.y) {
          this.y = f.y - this.height;
          this.vy = 0;
          this.grounded = true;
          if (this.state !== 'attack' && this.state !== 'hit') {
            this.state = (this.vx !== 0) ? 'run' : 'idle';
          }
        }
        // Head bumping solid ledge from below
        else if (this.vy < 0 && prevY >= f.y + f.height - 10 && this.y <= f.y + f.height) {
          this.y = f.y + f.height;
          this.vy = 0;
        }
      }

      // 3. Middle breakable blocks vs Open Gaps
      for (const b of f.blocks) {
        const xOverlap = (this.x + this.width > b.x && this.x < b.x + b.width);
        if (!xOverlap) continue;

        if (!b.broken) {
          // Block is SOLID

          // Moving UPWARD: Jumping into breakable ceiling block SMASHES it open!
          if (this.vy < 0 && this.y <= b.y + b.height + 25 && prevY >= b.y) {
            this.game.world.hitBlock(b, 1);
            // Smashed! Player continues smoothly upward through newly opened gap!
            continue;
          }

          // Landing on top of unbroken block
          if (this.vy >= 0 && prevFeet <= b.y + 24 && playerFeet >= b.y) {
            this.y = b.y - this.height;
            this.vy = 0;
            this.grounded = true;
            if (this.state !== 'attack' && this.state !== 'hit') {
              this.state = (this.vx !== 0) ? 'run' : 'idle';
            }
          }
        } else {
          // Block is BROKEN GAP: King can jump UP or fall through freely!
        }
      }
    }

    // Safety ground clamp: King can NEVER fall below ground floor!
    if (this.y + this.height > this.game.world.groundY) {
      this.y = this.game.world.groundY - this.height;
      this.vy = 0;
      this.grounded = true;
    }

    // Set jumping / falling animations if airborne
    if (!this.grounded && this.state !== 'attack' && this.state !== 'hit') {
      this.state = (this.vy < 0) ? 'jump' : 'fall';
    }

    // Check Collectible Pickups (Diamonds)
    for (const d of this.game.world.diamonds) {
      if (d.collected) continue;
      if (
        this.x < d.x + d.width &&
        this.x + this.width > d.x - d.width / 2 &&
        this.y < d.y + d.height &&
        this.y + this.height > d.y - d.height / 2
      ) {
        d.collected = true;
        const pts = (d.type === 'big') ? 200 : 100;
        this.game.addScore(pts);
        this.game.addGem();
        this.game.audio.playGem();
        this.game.particles.spawnText(`+${pts}`, d.x, d.y - 15, '#4cd964', 28);
        this.game.particles.spawnDust(d.x, d.y, 4, 'rgba(100, 220, 255,');
      }
    }

    // Check Heart Pickups
    for (const h of this.game.world.hearts) {
      if (h.collected) continue;
      if (
        this.x < h.x + h.width &&
        this.x + this.width > h.x - h.width / 2 &&
        this.y < h.y + h.height &&
        this.y + this.height > h.y - h.height / 2
      ) {
        if (this.health < this.maxHealth) {
          h.collected = true;
          this.health = Math.min(this.maxHealth, this.health + 1);
          this.game.audio.playHeart();
          this.game.particles.spawnText('HEALED!', h.x, h.y - 15, '#ff3b30', 28);
          this.game.particles.spawnDust(h.x, h.y, 6, 'rgba(255, 120, 150,');
        }
      }
    }

    // Check Exit Door overlap on Top Floor
    if (this.game.world.exitDoor && !this.doorEntered) {
      const door = this.game.world.exitDoor;
      if (
        this.x + this.width > door.x + 20 &&
        this.x < door.x + door.width - 20 &&
        Math.abs(this.y + this.height - (door.y + door.height)) < 30
      ) {
        // Can enter door if enemies on top floor are cleared or King reaches it
        this.enterDoor();
      }
    }

    // Update active animation
    this.setAnim(this.state);
    this.currentAnim.update(dt);
  }

  enterDoor() {
    if (this.doorEntered) return;
    this.doorEntered = true;
    this.state = 'door_in';
    this.setAnim('door_in');
    this.vx = 0;
    this.vy = 0;
    this.game.world.exitDoor.state = 'opening';
    this.game.audio.playVictory();
    this.game.onStageCleared();
  }

  draw(ctx, assets, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    // Flashing when invulnerable
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 20) % 2 === 0) {
      return;
    }

    // Center the 78x58 sprite frame over the collision box
    // Character feet should align with this.y + this.height
    const drawX = screenX - (this.spriteDrawWidth - this.width) / 2;
    const drawY = screenY - (this.spriteDrawHeight - this.height) + 8;

    this.currentAnim.draw(
      ctx,
      assets,
      drawX,
      drawY,
      this.spriteDrawWidth,
      this.spriteDrawHeight,
      this.facingLeft
    );

    // If attacking upwards, draw animated hammer swing aura above
    if (this.state === 'attack' && this.attackType === 'up') {
      ctx.save();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(screenX + this.width / 2, screenY - 20, 45, Math.PI, 0);
      ctx.stroke();
      ctx.restore();
    }
  }
}

