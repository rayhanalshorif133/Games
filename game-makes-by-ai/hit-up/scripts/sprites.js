// scripts/sprites.js - Asset Preloader, Sprite Slicing & Animation Controller
export class AssetManager {
  constructor() {
    this.images = {};
    this.loaded = 0;
    this.total = 0;
  }

  loadImage(key, src) {
    this.total++;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.loaded++;
        this.images[key] = img;
        resolve(img);
      };
      img.onerror = () => {
        console.error('Failed to load image:', src);
        this.loaded++;
        resolve(null);
      };
      img.src = src;
    });
  }

  async loadAll(onProgress) {
    const assetList = [
      // King Human
      ['king_idle', 'assets/01-King Human/Idle (78x58).png'],
      ['king_run', 'assets/01-King Human/Run (78x58).png'],
      ['king_jump', 'assets/01-King Human/Jump (78x58).png'],
      ['king_fall', 'assets/01-King Human/Fall (78x58).png'],
      ['king_ground', 'assets/01-King Human/Ground (78x58).png'],
      ['king_attack', 'assets/01-King Human/Attack (78x58).png'],
      ['king_hit', 'assets/01-King Human/Hit (78x58).png'],
      ['king_dead', 'assets/01-King Human/Dead (78x58).png'],
      ['king_door_in', 'assets/01-King Human/Door In (78x58).png'],
      ['king_door_out', 'assets/01-King Human/Door Out (78x58).png'],

      // King Pig (Boss)
      ['king_pig_idle', 'assets/02-King Pig/Idle (38x28).png'],
      ['king_pig_run', 'assets/02-King Pig/Run (38x28).png'],
      ['king_pig_attack', 'assets/02-King Pig/Attack (38x28).png'],
      ['king_pig_hit', 'assets/02-King Pig/Hit (38x28).png'],
      ['king_pig_dead', 'assets/02-King Pig/Dead (38x28).png'],
      ['king_pig_jump', 'assets/02-King Pig/Jump (38x28).png'],
      ['king_pig_fall', 'assets/02-King Pig/Fall (38x28).png'],

      // Patrol Pig
      ['pig_idle', 'assets/03-Pig/Idle (34x28).png'],
      ['pig_run', 'assets/03-Pig/Run (34x28).png'],
      ['pig_attack', 'assets/03-Pig/Attack (34x28).png'],
      ['pig_hit', 'assets/03-Pig/Hit (34x28).png'],
      ['pig_dead', 'assets/03-Pig/Dead (34x28).png'],
      ['pig_jump', 'assets/03-Pig/Jump (34x28).png'],
      ['pig_fall', 'assets/03-Pig/Fall (34x28).png'],

      // Pig Throwing Box (Repairer Pig)
      ['pig_box_idle', 'assets/04-Pig Throwing a Box/Idle (26x30).png'],
      ['pig_box_picking', 'assets/04-Pig Throwing a Box/Picking Box (26x30).png'],
      ['pig_box_run', 'assets/04-Pig Throwing a Box/Run (26x30).png'],
      ['pig_box_throw', 'assets/04-Pig Throwing a Box/Throwing Box (26x30).png'],

      // Pig Throwing Bomb
      ['pig_bomb_idle', 'assets/05-Pig Thowing a Bomb/Idle (26x26).png'],
      ['pig_bomb_picking', 'assets/05-Pig Thowing a Bomb/Picking Bomb (26x26).png'],
      ['pig_bomb_run', 'assets/05-Pig Thowing a Bomb/Run (26x26).png'],
      ['pig_bomb_throw', 'assets/05-Pig Thowing a Bomb/Throwing Boom (26x26).png'],

      // Pig In Box
      ['pig_in_box_look', 'assets/06-Pig Hide in the Box/Looking Out (26x20).png'],
      ['pig_in_box_jump', 'assets/06-Pig Hide in the Box/Jump (26x20).png'],

      // Pig With Match & Cannon
      ['pig_match_light', 'assets/07-Pig With a Match/Lighting the Match (26x18).png'],
      ['pig_match_cannon', 'assets/07-Pig With a Match/Lighting the Cannon (26x18).png'],
      ['pig_match_on', 'assets/07-Pig With a Match/Match On (26x18).png'],
      ['cannon_idle', 'assets/10-Cannon/Idle.png'],
      ['cannon_shoot', 'assets/10-Cannon/Shoot (44x28).png'],
      ['cannon_ball', 'assets/10-Cannon/Cannon Ball.png'],

      // Box & Pieces
      ['box_idle', 'assets/08-Box/Idle.png'],
      ['box_hit', 'assets/08-Box/Hit.png'],
      ['box_piece_1', 'assets/08-Box/Box Pieces 1.png'],
      ['box_piece_2', 'assets/08-Box/Box Pieces 2.png'],
      ['box_piece_3', 'assets/08-Box/Box Pieces 3.png'],
      ['box_piece_4', 'assets/08-Box/Box Pieces 4.png'],

      // Bomb
      ['bomb_off', 'assets/09-Bomb/Bomb Off.png'],
      ['bomb_on', 'assets/09-Bomb/Bomb On (52x56).png'],
      ['bomb_boom', 'assets/09-Bomb/Boooooom (52x56).png'],

      // Door
      ['door_idle', 'assets/11-Door/Idle.png'],
      ['door_opening', 'assets/11-Door/Opening (46x56).png'],
      ['door_closing', 'assets/11-Door/Closiong (46x56).png'],

      // Live and Coins
      ['live_bar', 'assets/12-Live and Coins/Live Bar.png'],
      ['small_heart_idle', 'assets/12-Live and Coins/Small Heart Idle (18x14).png'],
      ['small_heart_hit', 'assets/12-Live and Coins/Small Heart Hit (18x14).png'],
      ['big_heart_idle', 'assets/12-Live and Coins/Big Heart Idle (18x14).png'],
      ['small_diamond', 'assets/12-Live and Coins/Small Diamond (18x14).png'],
      ['big_diamond_idle', 'assets/12-Live and Coins/Big Diamond Idle (18x14).png'],
      ['numbers', 'assets/12-Live and Coins/Numbers (6x8).png'],

      // Dialogues
      ['dialogue_alert_in', 'assets/13-Dialogue Boxes/!!! In (24x8).png'],
      ['dialogue_alert_out', 'assets/13-Dialogue Boxes/!!! Out (24x8).png'],
      ['dialogue_attack_in', 'assets/13-Dialogue Boxes/Attack In (24x8).png'],
      ['dialogue_boom_in', 'assets/13-Dialogue Boxes/Boom In (24x8).png'],
      ['dialogue_dead_in', 'assets/13-Dialogue Boxes/Dead In (24x8).png'],
      ['dialogue_wtf_in', 'assets/13-Dialogue Boxes/WTF In (24x8).png'],

      // TileSets
      ['terrain', 'assets/14-TileSets/Terrain (32x32).png'],
      ['decorations', 'assets/14-TileSets/Decorations (32x32).png']
    ];

    const promises = assetList.map(([key, src]) => {
      return this.loadImage(key, src).then(() => {
        if (onProgress) {
          onProgress(this.loaded / this.total);
        }
      });
    });

    await Promise.all(promises);
    return this.images;
  }

  getImage(key) {
    return this.images[key] || null;
  }
}

// Animation controller for sliced sprite sheets
export class SpriteAnimation {
  constructor(imageKey, frameWidth, frameHeight, frameCount, fps = 10, loop = true) {
    this.imageKey = imageKey;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameCount = frameCount;
    this.fps = fps;
    this.loop = loop;
    this.currentFrame = 0;
    this.timer = 0;
    this.finished = false;
  }

  reset() {
    this.currentFrame = 0;
    this.timer = 0;
    this.finished = false;
  }

  update(dt) {
    if (this.finished && !this.loop) return;

    this.timer += dt;
    const interval = 1 / this.fps;

    while (this.timer >= interval) {
      this.timer -= interval;
      if (this.currentFrame < this.frameCount - 1) {
        this.currentFrame++;
      } else {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.finished = true;
          break;
        }
      }
    }
  }

  draw(ctx, assets, x, y, width, height, flipX = false, alpha = 1.0) {
    const img = assets.getImage(this.imageKey);
    if (!img) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    const sx = this.currentFrame * this.frameWidth;
    const sy = 0;

    if (flipX) {
      ctx.translate(x + width, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, this.frameWidth, this.frameHeight, 0, 0, width, height);
    } else {
      ctx.drawImage(img, sx, sy, this.frameWidth, this.frameHeight, x, y, width, height);
    }

    ctx.restore();
  }
}

