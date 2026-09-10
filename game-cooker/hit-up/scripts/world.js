// scripts/world.js - Vertical Tower, Destructible Ceiling/Floor Blocks, and Collectibles
export class World {
  constructor(game) {
    this.game = game;
    this.width = 1080;
    this.totalHeight = 3200;
    this.floorCount = 6;
    this.floorHeight = 350; // distance between floors (easy to jump & reach)
    this.groundY = 2500;    // Y coordinate of the bottom floor

    this.leftWallWidth = 120;
    this.rightWallWidth = 120;
    this.playableWidth = this.width - this.leftWallWidth - this.rightWallWidth; // 840px

    this.floors = [];
    this.diamonds = [];
    this.hearts = [];
    this.exitDoor = null;
    this.decorations = [];
  }

  buildLevel(stage = 1) {
    this.floors = [];
    this.diamonds = [];
    this.hearts = [];
    this.decorations = [];

    // Bottom floor (ground)
    const groundFloor = {
      index: 0,
      y: this.groundY,
      height: 64,
      isGround: true,
      blocks: [], // Ground is unbreakable solid
      leftLedge: { x: this.leftWallWidth, width: this.playableWidth, y: this.groundY, height: 64 }
    };
    this.floors.push(groundFloor);

    // Build intermediate floors
    for (let i = 1; i <= this.floorCount; i++) {
      const floorY = this.groundY - i * this.floorHeight;
      const isTopFloor = (i === this.floorCount);

      const blockWidth = 90;
      const blockHeight = 54;
      const ledgeWidth = 135;

      const floor = {
        index: i,
        y: floorY,
        height: blockHeight,
        isTopFloor: isTopFloor,
        leftLedge: {
          x: this.leftWallWidth,
          y: floorY,
          width: ledgeWidth,
          height: blockHeight
        },
        rightLedge: {
          x: this.width - this.rightWallWidth - ledgeWidth,
          y: floorY,
          width: ledgeWidth,
          height: blockHeight
        },
        blocks: []
      };

      // In top floor, keep floor solid for throne room, or have breakable blocks
      const blockStartX = this.leftWallWidth + ledgeWidth;
      const breakableSpan = this.playableWidth - ledgeWidth * 2; // 840 - 270 = 570
      const numBlocks = Math.floor(breakableSpan / blockWidth);
      const remainingMargin = (breakableSpan - numBlocks * blockWidth) / 2;

      for (let b = 0; b < numBlocks; b++) {
        floor.blocks.push({
          floorIndex: i,
          blockIndex: b,
          x: blockStartX + remainingMargin + b * blockWidth,
          y: floorY,
          width: blockWidth,
          height: blockHeight,
          hp: 1, // BREAKS IN 1 HIT!
          maxHp: 1,
          broken: false,
          shakeTimer: 0,
          hitFlash: 0
        });
      }

      this.floors.push(floor);

      // Add decorations (banners, windows, torches) on walls
      this.decorations.push({
        type: 'torch',
        x: this.leftWallWidth + 30,
        y: floorY - 140
      });
      this.decorations.push({
        type: 'banner',
        x: this.width - this.rightWallWidth - 70,
        y: floorY - 180
      });
      if (i % 2 === 0) {
        this.decorations.push({
          type: 'window',
          x: 540 - 48,
          y: floorY - 260
        });
      }
    }

    // Royal Exit Door on Top Floor
    const topFloor = this.floors[this.floors.length - 1];
    this.exitDoor = {
      x: 540 - 55,
      y: topFloor.y - 134,
      width: 110,
      height: 134,
      state: 'idle', // 'idle', 'opening', 'open'
      animTimer: 0
    };

    // Spawn some initial collectibles on ledges
    for (let i = 1; i <= this.floorCount; i++) {
      const f = this.floors[i];
      if (Math.random() > 0.3) {
        this.spawnDiamond(f.leftLedge.x + 40, f.y - 45, Math.random() > 0.6 ? 'big' : 'small');
      }
      if (Math.random() > 0.3) {
        this.spawnDiamond(f.rightLedge.x + 50, f.y - 45, Math.random() > 0.6 ? 'big' : 'small');
      }
      if (i === 3 || i === 5) {
        this.spawnHeart(540, f.y - 45);
      }
    }
  }

  // Breakable block hit handler
  hitBlock(block, damage = 1, hammerHitX = null) {
    if (block.broken) return false;

    block.hp -= damage;
    block.shakeTimer = 0.2;
    block.hitFlash = 0.15;

    if (block.hp <= 0) {
      block.broken = true;
      block.hp = 0;

      // Spawn particles
      this.game.particles.spawnBoxBreak(block.x + block.width / 2, block.y + block.height / 2, 10);
      this.game.particles.spawnSparks(block.x + block.width / 2, block.y + block.height / 2, 12);
      this.game.particles.spawnText('+50 SMASH!', block.x + block.width / 2, block.y - 20, '#ffcc00', 30);
      this.game.audio.playWallBreak();
      this.game.addScore(50);
      this.game.camera.shake(8, 0.25);

      // Chance to drop diamond or heart
      if (Math.random() < 0.4) {
        this.spawnDiamond(block.x + block.width / 2, block.y - 30, Math.random() < 0.3 ? 'big' : 'small');
      } else if (Math.random() < 0.1) {
        this.spawnHeart(block.x + block.width / 2, block.y - 30);
      }

      return true; // was broken
    } else {
      // Just cracked
      this.game.particles.spawnSparks(block.x + block.width / 2, block.y + block.height / 2, 6);
      this.game.audio.playHammer();
      this.game.camera.shake(4, 0.15);
      return false;
    }
  }

  // Repair a broken block (called by RepairerPig)
  repairBlock(block) {
    if (!block.broken) return;
    block.broken = false;
    block.hp = block.maxHp;
    block.hitFlash = 0.25;

    // Safety: If player is standing inside this block when repaired, pop player safely onto top!
    const player = this.game.player;
    if (
      player.x + player.width > block.x &&
      player.x < block.x + block.width &&
      player.y + player.height > block.y &&
      player.y < block.y + block.height
    ) {
      player.y = block.y - player.height;
      player.vy = 0;
      player.grounded = true;
    }

    this.game.particles.spawnDust(block.x + block.width / 2, block.y + block.height / 2, 8, 'rgba(230, 210, 180,');
    this.game.particles.spawnText('REPAIRED!', block.x + block.width / 2, block.y - 25, '#4cd964', 28);
    this.game.audio.playRepair();
  }

  // Get active broken gaps on a specific floor
  getFloorGaps(floorIndex) {
    const floor = this.floors[floorIndex];
    if (!floor || !floor.blocks) return [];
    return floor.blocks.filter(b => b.broken);
  }

  // Spawns
  spawnDiamond(x, y, type = 'small') {
    this.diamonds.push({
      x: x,
      y: y,
      type: type,
      width: 36,
      height: 28,
      baseY: y,
      animTimer: Math.random() * 2,
      collected: false
    });
  }

  spawnHeart(x, y) {
    this.hearts.push({
      x: x,
      y: y,
      width: 36,
      height: 28,
      baseY: y,
      animTimer: Math.random() * 2,
      collected: false
    });
  }

  update(dt) {
    // Update blocks shake / flash
    for (const f of this.floors) {
      for (const b of f.blocks) {
        if (b.shakeTimer > 0) b.shakeTimer -= dt;
        if (b.hitFlash > 0) b.hitFlash -= dt;
      }
    }

    // Update diamonds bobbing
    for (let i = this.diamonds.length - 1; i >= 0; i--) {
      const d = this.diamonds[i];
      d.animTimer += dt * 4;
      d.y = d.baseY + Math.sin(d.animTimer) * 6;
      if (d.collected) {
        this.diamonds.splice(i, 1);
      }
    }

    // Update hearts bobbing
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const h = this.hearts[i];
      h.animTimer += dt * 4;
      h.y = h.baseY + Math.sin(h.animTimer) * 6;
      if (h.collected) {
        this.hearts.splice(i, 1);
      }
    }

    // Update door animation if opening
    if (this.exitDoor && this.exitDoor.state === 'opening') {
      this.exitDoor.animTimer += dt * 10;
      if (this.exitDoor.animTimer >= 5) {
        this.exitDoor.state = 'open';
      }
    }
  }

  // Draw tower walls, floors, blocks, door, and decorations
  draw(ctx, assets, camera) {
    const terrainImg = assets.getImage('terrain');
    const decorImg = assets.getImage('decorations');
    const boxIdleImg = assets.getImage('box_idle');
    const boxHitImg = assets.getImage('box_hit');

    // 1. Draw castle backdrop background
    const bgTileSize = 64;
    const startRow = Math.max(0, Math.floor(camera.y / bgTileSize));
    const endRow = Math.ceil((camera.y + camera.height) / bgTileSize);

    ctx.save();
    // Dark castle brick pattern
    ctx.fillStyle = '#1e1a2b';
    ctx.fillRect(0, 0, camera.width, camera.height);

    // Subtle castle brick lines
    ctx.strokeStyle = '#272238';
    ctx.lineWidth = 2;
    for (let r = startRow; r <= endRow; r++) {
      const y = r * bgTileSize - camera.y;
      ctx.beginPath();
      ctx.moveTo(this.leftWallWidth, y);
      ctx.lineTo(this.width - this.rightWallWidth, y);
      ctx.stroke();

      const offset = (r % 2) * (bgTileSize / 2);
      for (let x = this.leftWallWidth + offset; x < this.width - this.rightWallWidth; x += bgTileSize) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + bgTileSize);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 2. Draw decorations
    for (const dec of this.decorations) {
      const sy = dec.y - camera.y;
      if (sy < -100 || sy > camera.height + 100) continue;
      if (dec.type === 'torch') {
        // Draw torch with glowing animated flame
        ctx.save();
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(dec.x - 4, sy + 10, 8, 24);
        const flicker = Math.sin(Date.now() * 0.01 + dec.x) * 3;
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(dec.x, sy + 8 + flicker, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffff55';
        ctx.beginPath();
        ctx.arc(dec.x, sy + 8 + flicker, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (dec.type === 'banner') {
        ctx.save();
        ctx.fillStyle = '#8e1b24';
        ctx.fillRect(dec.x, sy, 36, 64);
        ctx.fillStyle = '#f5c542';
        ctx.fillRect(dec.x + 14, sy + 10, 8, 30);
        ctx.fillRect(dec.x + 6, sy + 20, 24, 8);
        ctx.restore();
      } else if (dec.type === 'window') {
        ctx.save();
        ctx.fillStyle = '#0f1423';
        ctx.fillRect(dec.x, sy, 96, 120);
        ctx.strokeStyle = '#5a546b';
        ctx.lineWidth = 6;
        ctx.strokeRect(dec.x, sy, 96, 120);
        // Window crossbars
        ctx.beginPath();
        ctx.moveTo(dec.x + 48, sy);
        ctx.lineTo(dec.x + 48, sy + 120);
        ctx.moveTo(dec.x, sy + 60);
        ctx.lineTo(dec.x + 96, sy + 60);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Draw Left and Right Castle Border Walls
    const wallTileH = 64;
    for (let r = startRow; r <= endRow; r++) {
      const y = r * wallTileH - camera.y;

      // Left Wall
      ctx.fillStyle = '#3f3851';
      ctx.fillRect(0, y, this.leftWallWidth, wallTileH);
      ctx.fillStyle = '#544b6b';
      ctx.fillRect(this.leftWallWidth - 16, y, 16, wallTileH);

      // Right Wall
      ctx.fillStyle = '#3f3851';
      ctx.fillRect(this.width - this.rightWallWidth, y, this.rightWallWidth, wallTileH);
      ctx.fillStyle = '#2f283d';
      ctx.fillRect(this.width - this.rightWallWidth, y, 16, wallTileH);
    }

    // 4. Draw Floors and Blocks
    for (const f of this.floors) {
      const sy = f.y - camera.y;
      if (sy < -150 || sy > camera.height + 150) continue;

      if (f.isGround) {
        // Ground floor solid base
        ctx.fillStyle = '#4c425c';
        ctx.fillRect(this.leftWallWidth, sy, this.playableWidth, f.height + 400);
        // Top stone trim
        ctx.fillStyle = '#7a6e8f';
        ctx.fillRect(this.leftWallWidth, sy, this.playableWidth, 12);
        continue;
      }

      // Left ledge (solid stone support)
      ctx.fillStyle = '#4c425c';
      ctx.fillRect(f.leftLedge.x, sy, f.leftLedge.width, f.leftLedge.height);
      ctx.fillStyle = '#7a6e8f';
      ctx.fillRect(f.leftLedge.x, sy, f.leftLedge.width, 10);

      // Right ledge (solid stone support)
      ctx.fillStyle = '#4c425c';
      ctx.fillRect(f.rightLedge.x, sy, f.rightLedge.width, f.rightLedge.height);
      ctx.fillStyle = '#7a6e8f';
      ctx.fillRect(f.rightLedge.x, sy, f.rightLedge.width, 10);

      // Draw Breakable Wall Blocks
      for (const b of f.blocks) {
        if (b.broken) continue; // Gap is open!

        let drawX = b.x;
        let drawY = b.y - camera.y;

        if (b.shakeTimer > 0) {
          drawX += (Math.random() * 8 - 4);
          drawY += (Math.random() * 8 - 4);
        }

        // Draw Box sprite scaled to block size
        const img = (b.hitFlash > 0 && boxHitImg) ? boxHitImg : boxIdleImg;
        if (img) {
          ctx.save();
          ctx.drawImage(img, drawX, drawY, b.width, b.height);

          // If damaged (HP == 1), draw crack effect
          if (b.hp === 1) {
            ctx.strokeStyle = '#1b1410';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(drawX + b.width * 0.3, drawY + 4);
            ctx.lineTo(drawX + b.width * 0.5, drawY + b.height * 0.5);
            ctx.lineTo(drawX + b.width * 0.4, drawY + b.height - 4);
            ctx.moveTo(drawX + b.width * 0.5, drawY + b.height * 0.5);
            ctx.lineTo(drawX + b.width * 0.75, drawY + b.height * 0.7);
            ctx.stroke();
          }
          ctx.restore();
        } else {
          // Fallback wooden block rendering
          ctx.fillStyle = '#9b663b';
          ctx.fillRect(drawX, drawY, b.width, b.height);
          ctx.strokeStyle = '#5a371c';
          ctx.lineWidth = 4;
          ctx.strokeRect(drawX, drawY, b.width, b.height);
        }
      }
    }

    // 5. Draw Royal Exit Door on Top Floor
    if (this.exitDoor) {
      const doorScreenX = this.exitDoor.x;
      const doorScreenY = this.exitDoor.y - camera.y;

      let doorImg = assets.getImage('door_idle');
      if (this.exitDoor.state === 'opening') {
        doorImg = assets.getImage('door_opening');
      } else if (this.exitDoor.state === 'open') {
        doorImg = assets.getImage('door_opening'); // last frame
      }

      if (doorImg) {
        ctx.save();
        if (this.exitDoor.state === 'opening') {
          const frame = Math.min(4, Math.floor(this.exitDoor.animTimer));
          const frameW = 46;
          ctx.drawImage(doorImg, frame * frameW, 0, frameW, 56, doorScreenX, doorScreenY, this.exitDoor.width, this.exitDoor.height);
        } else if (this.exitDoor.state === 'open') {
          // Draw fully open door frame
          const frameW = 46;
          ctx.drawImage(doorImg, 4 * frameW, 0, frameW, 56, doorScreenX, doorScreenY, this.exitDoor.width, this.exitDoor.height);
        } else {
          ctx.drawImage(doorImg, 0, 0, 46, 56, doorScreenX, doorScreenY, this.exitDoor.width, this.exitDoor.height);
        }
        ctx.restore();
      }
    }

    // 6. Draw Diamonds
    for (const d of this.diamonds) {
      const sx = d.x;
      const sy = d.y - camera.y;
      if (sy < -60 || sy > camera.height + 60) continue;

      const imgKey = d.type === 'big' ? 'big_diamond_idle' : 'small_diamond';
      const img = assets.getImage(imgKey);
      if (img) {
        const frameW = 18;
        const frameIdx = Math.floor(d.animTimer * 2) % (d.type === 'big' ? 10 : 8);
        ctx.drawImage(img, frameIdx * frameW, 0, frameW, 14, sx - d.width / 2, sy - d.height / 2, d.width, d.height);
      }
    }

    // 7. Draw Hearts
    for (const h of this.hearts) {
      const sx = h.x;
      const sy = h.y - camera.y;
      if (sy < -60 || sy > camera.height + 60) continue;

      const img = assets.getImage('big_heart_idle');
      if (img) {
        const frameW = 18;
        const frameIdx = Math.floor(h.animTimer * 2) % 8;
        ctx.drawImage(img, frameIdx * frameW, 0, frameW, 14, sx - h.width / 2, sy - h.height / 2, h.width, h.height);
      }
    }
  }
}

