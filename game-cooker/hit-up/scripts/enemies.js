// scripts/enemies.js - Repairer Pigs, Patrol Pigs, Bombers, Cannons, and Boss Pig
import { SpriteAnimation } from './sprites.js';

// ==========================================
// 1. REPAIRER PIG (PIG THROWING A BOX)
// ==========================================
export class RepairerPig {
  constructor(game, floorIndex, x) {
    this.game = game;
    this.floorIndex = floorIndex;
    this.type = 'repairer';

    this.width = 46;
    this.height = 56;
    this.x = x;
    this.y = 0; // will snap to floor
    this.vx = 0;
    this.vy = 0;

    this.speed = 100;
    this.runSpeed = 150;
    this.facingLeft = false;
    this.grounded = false;

    // States: 'patrol', 'alert', 'fetch', 'carry', 'repairing', 'hit', 'dead'
    this.state = 'patrol';
    this.targetGap = null;
    this.patrolDir = 1;
    this.patrolTimer = 2.0;

    this.health = 1; // 1 Hit to defeat!
    this.dead = false;
    this.actionTimer = 0;

    // Animations (26x30 source)
    this.scale = 2.2;
    this.drawW = 26 * this.scale;
    this.drawH = 30 * this.scale;

    this.anims = {
      idle: new SpriteAnimation('pig_box_idle', 26, 30, 9, 10, true),
      picking: new SpriteAnimation('pig_box_picking', 26, 30, 5, 8, false),
      run: new SpriteAnimation('pig_box_run', 26, 30, 6, 12, true),
      throwing: new SpriteAnimation('pig_box_throw', 26, 30, 5, 8, false),
      hit: new SpriteAnimation('pig_hit', 34, 28, 2, 8, false),
      dead: new SpriteAnimation('pig_dead', 34, 28, 4, 6, false)
    };
    this.currentAnim = this.anims.idle;

    this.snapToFloor();
  }

  snapToFloor() {
    const f = this.game.world.floors[this.floorIndex];
    if (f) {
      this.y = f.y - this.height;
    }
  }

  takeDamage(amount = 1, dir = 1) {
    if (this.dead) return;
    this.health -= amount;
    this.game.audio.playPigHit();

    if (this.health <= 0) {
      this.dead = true;
      this.state = 'dead';
      this.currentAnim = this.anims.dead;
      this.currentAnim.reset();
      this.game.audio.playPigDead();
      this.game.addScore(150);
      this.game.world.spawnDiamond(this.x + this.width / 2, this.y - 20, 'big');
      this.game.particles.spawnDialogue('dialogue_dead_in', this, 1.2);
      this.game.particles.spawnBoxBreak(this.x + this.width / 2, this.y, 4);
    } else {
      this.state = 'hit';
      this.currentAnim = this.anims.hit;
      this.currentAnim.reset();
      this.actionTimer = 0.35;
      this.vx = dir * 200;
      this.vy = -180;
      this.game.particles.spawnDialogue('dialogue_wtf_in', this, 0.9);
      // Drop box if carrying
      if (this.targetGap) {
        this.targetGap = null;
      }
    }
  }

  update(dt) {
    if (this.dead) {
      this.currentAnim.update(dt);
      return;
    }

    const floor = this.game.world.floors[this.floorIndex];
    if (!floor) return;

    // Check for broken gaps on this floor
    if (this.state === 'patrol' || this.state === 'idle') {
      const gaps = this.game.world.getFloorGaps(this.floorIndex);
      if (gaps.length > 0) {
        // Pick closest broken gap
        let closestGap = null;
        let minDist = Infinity;
        for (const g of gaps) {
          const d = Math.abs(g.x + g.width / 2 - (this.x + this.width / 2));
          if (d < minDist) {
            minDist = d;
            closestGap = g;
          }
        }

        if (closestGap) {
          this.targetGap = closestGap;
          this.state = 'alert';
          this.actionTimer = 3.5; // Gives player 3.5 whole seconds to jump through!
          this.vx = 0;
          this.game.particles.spawnDialogue('dialogue_alert_in', this, 2.0);
        }
      }
    }

    // State machine logic
    if (this.state === 'alert') {
      this.actionTimer -= dt;
      if (this.actionTimer <= 0) {
        // Start picking box
        this.state = 'fetch';
        this.currentAnim = this.anims.picking;
        this.currentAnim.reset();
      }
    } else if (this.state === 'fetch') {
      if (this.currentAnim.finished) {
        // Now carrying box to gap
        this.state = 'carry';
        this.currentAnim = this.anims.run;
      }
    } else if (this.state === 'carry') {
      if (!this.targetGap || !this.targetGap.broken) {
        // Gap was already fixed or invalid
        this.state = 'patrol';
        this.currentAnim = this.anims.run;
        this.targetGap = null;
      } else {
        const gapTargetX = this.targetGap.x + this.targetGap.width / 2;
        const myCenterX = this.x + this.width / 2;
        const diff = gapTargetX - myCenterX;

        if (Math.abs(diff) < 24) {
          // Reached the hole! Begin throwing / repairing box
          this.state = 'repairing';
          this.vx = 0;
          this.currentAnim = this.anims.throwing;
          this.currentAnim.reset();
        } else {
          // Run toward gap
          this.patrolDir = (diff > 0) ? 1 : -1;
          this.facingLeft = (this.patrolDir < 0);
          this.vx = this.patrolDir * this.runSpeed;
        }
      }
    } else if (this.state === 'repairing') {
      if (this.currentAnim.finished) {
        // Place box and reseal gap!
        if (this.targetGap && this.targetGap.broken) {
          this.game.world.repairBlock(this.targetGap);
        }
        this.targetGap = null;
        this.state = 'patrol';
        this.currentAnim = this.anims.idle;
        this.patrolTimer = 1.0;
      }
    } else if (this.state === 'patrol') {
      this.patrolTimer -= dt;
      if (this.patrolTimer <= 0) {
        this.patrolTimer = 2.0 + Math.random() * 2;
        this.patrolDir *= -1;
      }

      this.facingLeft = (this.patrolDir < 0);
      this.vx = this.patrolDir * this.speed;
      this.currentAnim = this.anims.run;
    } else if (this.state === 'hit') {
      this.actionTimer -= dt;
      if (this.actionTimer <= 0) {
        this.state = 'patrol';
        this.currentAnim = this.anims.idle;
      }
    }

    // Apply movement & floor bounds
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Gravity
    if (this.y < floor.y - this.height) {
      this.vy += 1800 * dt;
    } else {
      this.y = floor.y - this.height;
      this.vy = 0;
    }

    // Turn around at castle walls or ledge ends if patrolling
    const minX = this.game.world.leftWallWidth + 20;
    const maxX = this.game.world.width - this.game.world.rightWallWidth - this.width - 20;

    if (this.x < minX) {
      this.x = minX;
      this.patrolDir = 1;
    } else if (this.x > maxX) {
      this.x = maxX;
      this.patrolDir = -1;
    }

    this.currentAnim.update(dt);
  }

  draw(ctx, assets, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    if (screenY < -100 || screenY > camera.height + 100) return;

    const drawX = screenX - (this.drawW - this.width) / 2;
    const drawY = screenY - (this.drawH - this.height) + 4;

    this.currentAnim.draw(
      ctx,
      assets,
      drawX,
      drawY,
      this.drawW,
      this.drawH,
      this.facingLeft
    );
  }
}

// ==========================================
// 2. PATROL PIG (ATTACKER)
// ==========================================
export class PatrolPig {
  constructor(game, floorIndex, x) {
    this.game = game;
    this.floorIndex = floorIndex;
    this.type = 'patrol';

    this.width = 46;
    this.height = 54;
    this.x = x;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;

    this.speed = 100;
    this.chargeSpeed = 160;
    this.facingLeft = false;
    this.patrolDir = 1;

    this.state = 'patrol'; // patrol, charge, attack, hit, dead
    this.attackCooldown = 0;
    this.actionTimer = 0;
    this.health = 1; // 1 hit to defeat!
    this.dead = false;

    // Animations (34x28 source)
    this.scale = 2.2;
    this.drawW = 34 * this.scale;
    this.drawH = 28 * this.scale;

    this.anims = {
      idle: new SpriteAnimation('pig_idle', 34, 28, 11, 10, true),
      run: new SpriteAnimation('pig_run', 34, 28, 6, 11, true),
      attack: new SpriteAnimation('pig_attack', 34, 28, 5, 12, false),
      hit: new SpriteAnimation('pig_hit', 34, 28, 2, 8, false),
      dead: new SpriteAnimation('pig_dead', 34, 28, 4, 6, false)
    };
    this.currentAnim = this.anims.run;

    this.snapToFloor();
  }

  snapToFloor() {
    const f = this.game.world.floors[this.floorIndex];
    if (f) {
      this.y = f.y - this.height;
    }
  }

  takeDamage(amount = 1, dir = 1) {
    if (this.dead) return;
    this.health -= amount;
    this.game.audio.playPigHit();

    if (this.health <= 0) {
      this.dead = true;
      this.state = 'dead';
      this.currentAnim = this.anims.dead;
      this.currentAnim.reset();
      this.game.audio.playPigDead();
      this.game.addScore(100);
      this.game.world.spawnDiamond(this.x + this.width / 2, this.y - 15, 'small');
      this.game.particles.spawnDialogue('dialogue_dead_in', this, 1.0);
    } else {
      this.state = 'hit';
      this.currentAnim = this.anims.hit;
      this.currentAnim.reset();
      this.actionTimer = 0.3;
      this.vx = dir * 220;
      this.vy = -160;
      this.game.particles.spawnDialogue('dialogue_wtf_in', this, 0.8);
    }
  }

  update(dt) {
    if (this.dead) {
      this.currentAnim.update(dt);
      return;
    }

    const floor = this.game.world.floors[this.floorIndex];
    if (!floor) return;

    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    const player = this.game.player;
    const sameFloor = Math.abs((player.y + player.height) - (this.y + this.height)) < 40;
    const distToPlayer = Math.abs((player.x + player.width / 2) - (this.x + this.width / 2));

    if (this.state === 'patrol') {
      if (sameFloor && distToPlayer < 260 && this.attackCooldown <= 0) {
        // Spot player, charge!
        this.state = 'charge';
        this.patrolDir = (player.x > this.x) ? 1 : -1;
        this.facingLeft = (this.patrolDir < 0);
        this.game.particles.spawnDialogue('dialogue_attack_in', this, 0.8);
      } else {
        this.vx = this.patrolDir * this.speed;
        this.facingLeft = (this.patrolDir < 0);
        this.currentAnim = this.anims.run;
      }
    } else if (this.state === 'charge') {
      this.patrolDir = (player.x > this.x) ? 1 : -1;
      this.facingLeft = (this.patrolDir < 0);
      this.vx = this.patrolDir * this.chargeSpeed;
      this.currentAnim = this.anims.run;

      if (!sameFloor || distToPlayer > 350) {
        this.state = 'patrol';
      } else if (distToPlayer < 65) {
        // Strike player!
        this.state = 'attack';
        this.currentAnim = this.anims.attack;
        this.currentAnim.reset();
        this.hasDealtDamageInAttack = false;
        this.vx = 0;
      }
    } else if (this.state === 'attack') {
      if (this.currentAnim.currentFrame === 2 && !this.hasDealtDamageInAttack && distToPlayer < 75 && sameFloor) {
        this.hasDealtDamageInAttack = true;
        player.takeDamage(1, this.x + this.width / 2, 'Patrol Pig');
      }
      if (this.currentAnim.finished) {
        this.state = 'patrol';
        this.attackCooldown = 2.5;
        this.currentAnim = this.anims.idle;
      }
    } else if (this.state === 'hit') {
      this.actionTimer -= dt;
      if (this.actionTimer <= 0) {
        this.state = 'patrol';
        this.currentAnim = this.anims.run;
      }
    }

    // Apply movement
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y < floor.y - this.height) {
      this.vy += 1800 * dt;
    } else {
      this.y = floor.y - this.height;
      this.vy = 0;
    }

    // Boundaries
    const minX = this.game.world.leftWallWidth + 15;
    const maxX = this.game.world.width - this.game.world.rightWallWidth - this.width - 15;

    if (this.x < minX) {
      this.x = minX;
      this.patrolDir = 1;
    } else if (this.x > maxX) {
      this.x = maxX;
      this.patrolDir = -1;
    }

    this.currentAnim.update(dt);
  }

  draw(ctx, assets, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    if (screenY < -100 || screenY > camera.height + 100) return;

    const drawX = screenX - (this.drawW - this.width) / 2;
    const drawY = screenY - (this.drawH - this.height) + 4;

    this.currentAnim.draw(
      ctx,
      assets,
      drawX,
      drawY,
      this.drawW,
      this.drawH,
      this.facingLeft
    );
  }
}

// ==========================================
// 3. BOMBER PIG & THROWN BOMB
// ==========================================
export class BomberPig {
  constructor(game, floorIndex, x) {
    this.game = game;
    this.floorIndex = floorIndex;
    this.type = 'bomber';

    this.width = 46;
    this.height = 54;
    this.x = x;
    this.y = 0;
    this.facingLeft = true;

    this.throwCooldown = 6.0;
    this.state = 'idle'; // idle, picking, throwing, dead
    this.health = 1; // 1 Hit to defeat!
    this.dead = false;

    this.scale = 2.2;
    this.drawW = 26 * this.scale;
    this.drawH = 26 * this.scale;

    this.anims = {
      idle: new SpriteAnimation('pig_bomb_idle', 26, 26, 10, 10, true),
      picking: new SpriteAnimation('pig_bomb_picking', 26, 26, 4, 8, false),
      run: new SpriteAnimation('pig_bomb_run', 26, 26, 6, 10, true),
      throwing: new SpriteAnimation('pig_bomb_throw', 26, 26, 5, 8, false),
      hit: new SpriteAnimation('pig_hit', 34, 28, 2, 8, false),
      dead: new SpriteAnimation('pig_dead', 34, 28, 4, 6, false)
    };
    this.currentAnim = this.anims.idle;

    this.snapToFloor();
  }

  snapToFloor() {
    const f = this.game.world.floors[this.floorIndex];
    if (f) {
      this.y = f.y - this.height;
    }
  }

  takeDamage(amount = 1, dir = 1) {
    if (this.dead) return;
    this.health -= amount;
    this.game.audio.playPigHit();

    if (this.health <= 0) {
      this.dead = true;
      this.state = 'dead';
      this.currentAnim = this.anims.dead;
      this.currentAnim.reset();
      this.game.audio.playPigDead();
      this.game.addScore(180);
      this.game.world.spawnDiamond(this.x + this.width / 2, this.y - 20, 'big');
      this.game.particles.spawnDialogue('dialogue_dead_in', this, 1.0);
    } else {
      this.state = 'hit';
      this.currentAnim = this.anims.hit;
      this.currentAnim.reset();
    }
  }

  update(dt) {
    if (this.dead) {
      this.currentAnim.update(dt);
      return;
    }

    const player = this.game.player;
    this.facingLeft = (player.x < this.x);

    this.throwCooldown -= dt;

    if (this.throwCooldown <= 0 && this.state === 'idle') {
      this.state = 'picking';
      this.currentAnim = this.anims.picking;
      this.currentAnim.reset();
    } else if (this.state === 'picking') {
      if (this.currentAnim.finished) {
        this.state = 'throwing';
        this.currentAnim = this.anims.throwing;
        this.currentAnim.reset();
      }
    } else if (this.state === 'throwing') {
      if (this.currentAnim.currentFrame === 3 && !this.bombSpawned) {
        this.bombSpawned = true;
        // Toss bomb towards player
        const bombVx = (this.facingLeft ? -1 : 1) * (180 + Math.random() * 80);
        const bombVy = -280;
        this.game.spawnBomb(this.x + (this.facingLeft ? -20 : 40), this.y - 10, bombVx, bombVy);
      }
      if (this.currentAnim.finished) {
        this.state = 'idle';
        this.bombSpawned = false;
        this.throwCooldown = 6.0 + Math.random() * 2;
        this.currentAnim = this.anims.idle;
      }
    }

    this.currentAnim.update(dt);
  }

  draw(ctx, assets, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    if (screenY < -100 || screenY > camera.height + 100) return;

    const drawX = screenX - (this.drawW - this.width) / 2;
    const drawY = screenY - (this.drawH - this.height) + 4;

    this.currentAnim.draw(
      ctx,
      assets,
      drawX,
      drawY,
      this.drawW,
      this.drawH,
      this.facingLeft
    );
  }
}

// Active Bomb Entity
export class Bomb {
  constructor(game, x, y, vx, vy) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = 42;
    this.height = 42;
    this.gravity = 1400;

    this.timer = 3.5; // explodes after 3.5s (plenty of time to react)
    this.exploded = false;
    this.explosionRadius = 85;

    // Animations (52x56 source)
    this.animScale = 1.4;
    this.drawW = 52 * this.animScale;
    this.drawH = 56 * this.animScale;

    this.anims = {
      on: new SpriteAnimation('bomb_on', 52, 56, 4, 10, true),
      boom: new SpriteAnimation('bomb_boom', 52, 56, 6, 14, false)
    };
    this.currentAnim = this.anims.on;
  }

  // Deflect bomb with hammer swing
  deflect(dirX) {
    this.vx = dirX * 550;
    this.vy = -450;
    this.game.audio.playHammer();
    this.game.particles.spawnSparks(this.x + this.width / 2, this.y + this.height / 2, 10);
    this.game.particles.spawnText('DEFLECTED!', this.x, this.y - 20, '#ffd700', 26);
  }

  explode() {
    if (this.exploded) return;
    this.exploded = true;
    this.currentAnim = this.anims.boom;
    this.currentAnim.reset();
    this.game.audio.playExplosion();
    this.game.camera.shake(14, 0.4);
    this.game.particles.spawnDust(this.x + this.width / 2, this.y + this.height / 2, 12, 'rgba(255, 140, 50,');

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Damage player if in blast radius
    const player = this.game.player;
    const playerDist = Math.hypot((player.x + player.width / 2) - centerX, (player.y + player.height / 2) - centerY);
    if (playerDist < this.explosionRadius) {
      player.takeDamage(1, centerX, 'Bomb Explosion');
    }

    // Damage enemies in blast radius
    for (const enemy of this.game.enemies) {
      if (enemy === this || enemy.dead) continue;
      const enemyDist = Math.hypot((enemy.x + enemy.width / 2) - centerX, (enemy.y + enemy.height / 2) - centerY);
      if (enemyDist < this.explosionRadius) {
        enemy.takeDamage(2, centerX < enemy.x ? 1 : -1);
      }
    }

    // Break blocks in blast radius
    for (const f of this.game.world.floors) {
      for (const b of f.blocks) {
        if (b.broken) continue;
        const bDist = Math.hypot((b.x + b.width / 2) - centerX, (b.y + b.height / 2) - centerY);
        if (bDist < this.explosionRadius * 0.8) {
          this.game.world.hitBlock(b, 2);
        }
      }
    }
  }

  update(dt) {
    if (this.exploded) {
      this.currentAnim.update(dt);
      return;
    }

    this.timer -= dt;
    if (this.timer <= 0) {
      this.explode();
      return;
    }

    // Physics
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Floor bounce
    for (const f of this.game.world.floors) {
      if (this.y + this.height >= f.y && this.y + this.height <= f.y + 30) {
        this.y = f.y - this.height;
        this.vy = -this.vy * 0.55;
        this.vx *= 0.8;
      }
    }

    // Wall bounce
    if (this.x < this.game.world.leftWallWidth) {
      this.x = this.game.world.leftWallWidth;
      this.vx = -this.vx * 0.7;
    } else if (this.x + this.width > this.game.world.width - this.game.world.rightWallWidth) {
      this.x = this.game.world.width - this.game.world.rightWallWidth - this.width;
      this.vx = -this.vx * 0.7;
    }

    this.currentAnim.update(dt);
  }

  draw(ctx, assets, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    if (screenY < -100 || screenY > camera.height + 100) return;

    // Draw prominent warning above ticking bomb!
    if (!this.exploded) {
      const pulse = Math.sin(Date.now() * 0.012) > 0;
      ctx.save();
      ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = pulse ? '#ff3b30' : '#ffcc00';
      ctx.fillText(`⚠️ BOMB! ${Math.ceil(this.timer)}s`, screenX + this.width / 2, screenY - 14);
      ctx.restore();
    }

    const drawX = screenX - (this.drawW - this.width) / 2;
    const drawY = screenY - (this.drawH - this.height) + 4;

    this.currentAnim.draw(
      ctx,
      assets,
      drawX,
      drawY,
      this.drawW,
      this.drawH,
      false
    );
  }
}

// ==========================================
// 4. CANNON HAZARD & PIG WITH A MATCH
// ==========================================
export class CannonHazard {
  constructor(game, floorIndex, x, facingLeft = true) {
    this.game = game;
    this.floorIndex = floorIndex;
    this.type = 'cannon';

    this.width = 70;
    this.height = 46;
    this.x = x;
    this.y = 0;
    this.facingLeft = facingLeft;

    this.timer = 4.0;
    this.state = 'idle'; // idle, lighting, shoot
    this.scale = 2.0;

    this.anims = {
      cannon_idle: new SpriteAnimation('cannon_idle', 44, 28, 1, 1, true),
      cannon_shoot: new SpriteAnimation('cannon_shoot', 44, 28, 4, 12, false),
      pig_match: new SpriteAnimation('pig_match_cannon', 26, 18, 3, 8, false)
    };

    this.snapToFloor();
  }

  snapToFloor() {
    const f = this.game.world.floors[this.floorIndex];
    if (f) {
      this.y = f.y - this.height;
    }
  }

  takeDamage() {
    // Cannon is sturdy, but can be deflected
  }

  update(dt) {
    this.timer -= dt;

    if (this.timer <= 0.8 && this.state === 'idle') {
      this.state = 'lighting';
      this.anims.pig_match.reset();
    }

    if (this.timer <= 0) {
      this.state = 'shoot';
      this.timer = 5.0 + Math.random() * 2;
      this.anims.cannon_shoot.reset();
      this.game.audio.playCannon();
      this.game.camera.shake(6, 0.2);

      // Fire cannonball
      const ballVx = this.facingLeft ? -450 : 450;
      this.game.spawnCannonBall(this.x + (this.facingLeft ? -20 : 60), this.y + 10, ballVx);
    }

    if (this.state === 'shoot' && this.anims.cannon_shoot.finished) {
      this.state = 'idle';
    }

    this.anims.cannon_shoot.update(dt);
    this.anims.pig_match.update(dt);
  }

  draw(ctx, assets, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    // Draw Pig with Match standing behind cannon
    const pigX = this.facingLeft ? (screenX + 50) : (screenX - 45);
    this.anims.pig_match.draw(ctx, assets, pigX, screenY + 6, 26 * 2.0, 18 * 2.0, this.facingLeft);

    // Draw Cannon
    const cannonAnim = (this.state === 'shoot') ? this.anims.cannon_shoot : this.anims.cannon_idle;
    cannonAnim.draw(ctx, assets, screenX, screenY, 44 * this.scale, 28 * this.scale, this.facingLeft);
  }
}

// Flying CannonBall Projectile
export class CannonBall {
  constructor(game, x, y, vx) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.width = 30;
    this.height = 30;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;

    // Check collision with player
    const player = this.game.player;
    if (
      this.x < player.x + player.width &&
      this.x + this.width > player.x &&
      this.y < player.y + player.height &&
      this.y + this.height > player.y
    ) {
      player.takeDamage(1, this.x, 'Cannonball Shot');
      this.dead = true;
    }

    // Walls
    if (
      this.x < this.game.world.leftWallWidth ||
      this.x > this.game.world.width - this.game.world.rightWallWidth
    ) {
      this.dead = true;
      this.game.particles.spawnSparks(this.x, this.y, 6);
    }
  }

  draw(ctx, assets, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    const img = assets.getImage('cannon_ball');
    if (img) {
      ctx.drawImage(img, screenX, screenY, this.width, this.height);
    }
  }
}

// ==========================================
// 5. BOSS KING PIG (TOP FLOOR GUARDIAN)
// ==========================================
export class KingPig {
  constructor(game, floorIndex, x) {
    this.game = game;
    this.floorIndex = floorIndex;
    this.type = 'king_pig';

    this.width = 68;
    this.height = 72;
    this.x = x;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;

    this.speed = 120;
    this.facingLeft = true;
    this.health = 3; // 3 hits to defeat!
    this.maxHealth = 3;
    this.dead = false;
    this.state = 'idle'; // idle, run, attack, jump, hit, dead
    this.actionTimer = 2.0;

    // Animations (38x28 source)
    this.scale = 2.7;
    this.drawW = 38 * this.scale;
    this.drawH = 28 * this.scale;

    this.anims = {
      idle: new SpriteAnimation('king_pig_idle', 38, 28, 12, 10, true),
      run: new SpriteAnimation('king_pig_run', 38, 28, 6, 10, true),
      attack: new SpriteAnimation('king_pig_attack', 38, 28, 5, 10, false),
      hit: new SpriteAnimation('king_pig_hit', 38, 28, 2, 8, false),
      dead: new SpriteAnimation('king_pig_dead', 38, 28, 4, 6, false)
    };
    this.currentAnim = this.anims.idle;

    this.snapToFloor();
  }

  snapToFloor() {
    const f = this.game.world.floors[this.floorIndex];
    if (f) {
      this.y = f.y - this.height;
    }
  }

  takeDamage(amount = 1, dir = 1) {
    if (this.dead) return;
    this.health -= amount;
    this.game.audio.playPigHit();
    this.game.camera.shake(12, 0.3);

    if (this.health <= 0) {
      this.dead = true;
      this.state = 'dead';
      this.currentAnim = this.anims.dead;
      this.currentAnim.reset();
      this.game.audio.playPigDead();
      this.game.addScore(1000);
      // Burst big diamonds & hearts!
      for (let i = 0; i < 4; i++) {
        this.game.world.spawnDiamond(this.x + i * 20, this.y - 30, 'big');
      }
      this.game.world.spawnHeart(this.x + 30, this.y - 30);
      this.game.particles.spawnDialogue('dialogue_dead_in', this, 1.5);
      this.game.particles.spawnText('BOSS DEFEATED!', this.x, this.y - 50, '#ffcc00', 36);
    } else {
      this.state = 'hit';
      this.currentAnim = this.anims.hit;
      this.currentAnim.reset();
      this.actionTimer = 0.4;
      this.vx = dir * 250;
      this.game.particles.spawnDialogue('dialogue_wtf_in', this, 0.8);
    }
  }

  update(dt) {
    if (this.dead) {
      this.currentAnim.update(dt);
      return;
    }

    const floor = this.game.world.floors[this.floorIndex];
    if (!floor) return;

    const player = this.game.player;
    this.facingLeft = (player.x < this.x);
    const distToPlayer = Math.abs((player.x + player.width / 2) - (this.x + this.width / 2));

    this.actionTimer -= dt;

    if (this.state === 'idle') {
      if (this.actionTimer <= 0) {
        this.actionTimer = 2.0;
        this.state = 'run';
        this.currentAnim = this.anims.run;
      }
    } else if (this.state === 'run') {
      this.vx = (this.facingLeft ? -1 : 1) * this.speed;
      if (distToPlayer < 90) {
        this.state = 'attack';
        this.currentAnim = this.anims.attack;
        this.currentAnim.reset();
        this.hasDealtDamageInAttack = false;
        this.vx = 0;
      } else if (this.actionTimer <= 0) {
        this.state = 'idle';
        this.actionTimer = 1.5;
        this.currentAnim = this.anims.idle;
      }
    } else if (this.state === 'attack') {
      if (this.currentAnim.currentFrame === 2 && !this.hasDealtDamageInAttack && distToPlayer < 95) {
        this.hasDealtDamageInAttack = true;
        player.takeDamage(1, this.x + this.width / 2, 'Boss King Pig');
      }
      if (this.currentAnim.finished) {
        this.state = 'idle';
        this.actionTimer = 2.0;
        this.currentAnim = this.anims.idle;
      }
    } else if (this.state === 'hit') {
      if (this.actionTimer <= 0) {
        this.state = 'run';
        this.currentAnim = this.anims.run;
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y < floor.y - this.height) {
      this.vy += 1800 * dt;
    } else {
      this.y = floor.y - this.height;
      this.vy = 0;
    }

    // Bounds on throne floor
    const minX = this.game.world.leftWallWidth + 20;
    const maxX = this.game.world.width - this.game.world.rightWallWidth - this.width - 20;
    if (this.x < minX) this.x = minX;
    if (this.x > maxX) this.x = maxX;

    this.currentAnim.update(dt);
  }

  draw(ctx, assets, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    if (screenY < -100 || screenY > camera.height + 100) return;

    // Draw Boss HP bar
    ctx.save();
    ctx.fillStyle = '#222';
    ctx.fillRect(screenX, screenY - 24, this.width, 10);
    const hpRatio = Math.max(0, this.health / this.maxHealth);
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(screenX + 1, screenY - 23, (this.width - 2) * hpRatio, 8);
    ctx.restore();

    const drawX = screenX - (this.drawW - this.width) / 2;
    const drawY = screenY - (this.drawH - this.height) + 6;

    this.currentAnim.draw(
      ctx,
      assets,
      drawX,
      drawY,
      this.drawW,
      this.drawH,
      this.facingLeft
    );
  }
}

