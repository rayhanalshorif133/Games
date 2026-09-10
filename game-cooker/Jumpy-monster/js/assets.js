/**
 * assets.js - Preloader for all Frogie character animations (front view & side view),
 * platforms, and environment assets.
 */
export const Assets = {
  images: {},
  loaded: 0,
  total: 0,
  isReady: false,

  // List of all essential asset paths in images/new
  manifest: {
    // 1. Character Front/Standard View
    ...Array.from({ length: 20 }, (_, i) => {
      const idx = String(i).padStart(2, '0');
      return [`idle_${idx}`, `images/new/idle_${idx}.png`];
    }).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),

    ...Array.from({ length: 7 }, (_, i) => {
      return [`jump_prep_${i}`, `images/new/IdleToJump_${i}.png`];
    }).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),

    jump_air: 'images/new/Jump_0.png',

    ...Array.from({ length: 13 }, (_, i) => {
      const idx = String(i).padStart(2, '0');
      return [`jump_land_${idx}`, `images/new/JumpToIdle_${idx}.png`];
    }).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),

    ...Array.from({ length: 20 }, (_, i) => {
      const idx = String(i).padStart(2, '0');
      return [`moving_${idx}`, `images/new/Moving_${idx}.png`];
    }).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),

    // 2. Character Side View (SV) Animations (Left & Right Jumps)
    ...Array.from({ length: 20 }, (_, i) => {
      const idx = String(i).padStart(2, '0');
      return [`sv_idle_${idx}`, `images/new/SV_Idle_${idx}.png`];
    }).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),

    ...Array.from({ length: 10 }, (_, i) => {
      const idx = String(i).padStart(2, '0');
      return [`sv_jump_prep_${idx}`, `images/new/SV_IdleToJump_${idx}.png`];
    }).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),

    sv_jump_air: 'images/new/SV_Jump_0.png',

    ...Array.from({ length: 10 }, (_, i) => {
      const idx = String(i).padStart(2, '0');
      return [`sv_jump_land_${idx}`, `images/new/SV_JumpToIdle_${idx}.png`];
    }).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),

    // 3. Platforms
    wood_1: 'images/new/Wood01.png',
    wood_2: 'images/new/Wood02.png',
    wood_3: 'images/new/Wood03.png',
    pad: 'images/new/Frogie_CrossTheRoad_pad.png',

    // 4. Environment
    bg: 'images/new/Bg.png',
    water: 'images/new/Water.png',
    bush: 'images/new/Bush.png',
    tree: 'images/new/Tree.png',
    wall: 'images/new/Wall.png',
    floor: 'images/new/Floor.png',

    // 5. Collectibles / Trophies
    trophy_gold: 'images/new/GoldTrophy.png',
    trophy_silver: 'images/new/SilverTrophy.png',
    trophy_bronze: 'images/new/BronzeTrophy.png',
    accs_1: 'images/new/accs01.png',
    accs_2: 'images/new/accs02.png',
    accs_3: 'images/new/accs03.png',
    accs_4: 'images/new/accs04.png',

    // 6. UI
    logo: 'images/new/Logo.png',
    landing_bg: 'images/new/LandingScreenBg.png',
    btn_back: 'images/new/BackBtn.png',
    btn_box: 'images/new/BoxBtn.png'
  },

  /**
   * Preload all images and call onProgress / onComplete
   */
  loadAll(onProgress, onComplete) {
    const keys = Object.keys(this.manifest);
    this.total = keys.length;
    this.loaded = 0;

    if (this.total === 0) {
      this.isReady = true;
      if (onComplete) onComplete();
      return;
    }

    keys.forEach((key) => {
      const img = new Image();
      img.src = this.manifest[key];
      img.onload = () => {
        this.images[key] = img;
        this.loaded++;
        if (onProgress) onProgress(this.loaded, this.total);
        if (this.loaded === this.total) {
          this.isReady = true;
          if (onComplete) onComplete();
        }
      };
      img.onerror = () => {
        console.warn(`[Assets] Failed to load image: ${this.manifest[key]}`);
        this.loaded++;
        if (onProgress) onProgress(this.loaded, this.total);
        if (this.loaded === this.total) {
          this.isReady = true;
          if (onComplete) onComplete();
        }
      };
    });
  },

  get(key) {
    return this.images[key] || null;
  }
};
