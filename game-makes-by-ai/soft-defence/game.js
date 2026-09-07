/**
 * CIRCLE DEFENSE - Mobile-First (1080x1920) Infinite World Survival Shooter
 * Background: #6D6987
 * Features:
 * - 1080x1920 Virtual Resolution with responsive touch & mouse scaling
 * - Infinite world movement with smooth follow camera
 * - 3 Player Lives with Extra Life drops
 * - Power-Ups: Extra Life (❤️), Rapid Fire (🔥), Hyper Speed (⚡), Mega Nuke (💥), Energy Shield (🛡️)
 * - Enemy-based scoring: Minion (+5), Orc (+10), Bat (+15), Brute (+20)
 * - Beautiful visual destruction effects: Shockwaves, particles, smoke, floating popups, decals
 * - 3 Weapons: Pistol, Rifle, Shotgun
 * - Web Audio procedural sound synthesizer
 */

(function () {
  'use strict';

  // --- VIRTUAL RESOLUTION (1080 x 1920 PORTRAIT) ---
  const V_WIDTH = 1080;
  const V_HEIGHT = 1920;

  const CANVAS = document.getElementById('gameCanvas');
  const CTX = CANVAS.getContext('2d');
  CANVAS.width = V_WIDTH;
  CANVAS.height = V_HEIGHT;

  // --- SOUND SYNTHESIZER ---
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playPistol() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.11);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.11);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    }

    playRifle() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(780, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.08);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    }

    playShotgun() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.28);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.28);

      const bufSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.35, t);
      nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      noise.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(t);
    }

    playHit() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    }

    playExplosion(isLarge = false) {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const dur = isLarge ? 0.6 : 0.35;
      const bufSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isLarge ? 500 : 750, t);
      filter.frequency.exponentialRampToValueAtTime(60, t + dur);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isLarge ? 0.5 : 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(t);
    }

    playPowerup() {
      if (this.muted || !this.ctx) return;
      this.init();
      const notes = [330, 440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        const t = this.ctx.currentTime + i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    }

    playLife() {
      if (this.muted || !this.ctx) return;
      this.init();
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, i) => {
        const t = this.ctx.currentTime + i * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.22);
      });
    }

    playNuke() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      // High rising siren into huge boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.linearRampToValueAtTime(800, t + 0.2);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.9);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.9);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.9);
      this.playExplosion(true);
    }

    playShieldBreak() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.2);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }

    playPlayerHurt() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.setValueAtTime(100, t + 0.1);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    }

    playWave() {
      if (this.muted || !this.ctx) return;
      this.init();
      const notes = [261.63, 329.63, 392.0, 523.25];
      notes.forEach((freq, i) => {
        const t = this.ctx.currentTime + i * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      });
    }

    playGameOver() {
      if (this.muted || !this.ctx) return;
      this.init();
      const notes = [330, 293, 261, 196];
      notes.forEach((freq, i) => {
        const t = this.ctx.currentTime + i * 0.16;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    }

    playSMG() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(850, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.05);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    }

    playAR() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.09);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    }

    playPlasma() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(260, t + 0.16);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    }

    playGatling() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.06);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    }

    playSniper() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);

      const bufSize = Math.floor(this.ctx.sampleRate * 0.28);
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.2));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.4, t);
      nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
      noise.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(t);
    }

    playWeaponPickup() {
      if (this.muted || !this.ctx) return;
      this.init();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const t = this.ctx.currentTime + i * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    }

    playSwitch() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, t);
      osc.frequency.setValueAtTime(950, t + 0.05);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  }

  const SOUNDS = new SoundFX();

  // --- WEAPONS CONFIG ---
  const WEAPONS = {
    1: {
      name: 'BLASTER PISTOL',
      shortName: 'PISTOL',
      key: 'weapon_pistol',
      bulletSprite: 'bullet_orb_red',
      cooldown: 250,
      damage: 28,
      speed: 18,
      spread: 0,
      pellets: 1,
      knockback: 5,
      bulletColor: '#ffe600',
      bulletSize: 7,
      sound: () => SOUNDS.playPistol(),
    },
    2: {
      name: 'RAPID RIFLE',
      shortName: 'RIFLE',
      key: 'weapon_rifle',
      bulletSprite: 'bullet_pulse_blue',
      cooldown: 95,
      damage: 15,
      speed: 21,
      spread: 0.1,
      pellets: 1,
      knockback: 3,
      bulletColor: '#00f7ff',
      bulletSize: 6,
      sound: () => SOUNDS.playRifle(),
    },
    3: {
      name: 'HEAVY SHOTGUN',
      shortName: 'SHOTGUN',
      key: 'weapon_shotgun',
      bulletSprite: 'bullet_pellet_gold',
      cooldown: 600,
      damage: 20,
      speed: 16,
      spread: 0.38,
      pellets: 6,
      knockback: 12,
      bulletColor: '#ff5e00',
      bulletSize: 8,
      sound: () => SOUNDS.playShotgun(),
    },
    4: {
      name: 'TACTICAL SMG',
      shortName: 'SMG',
      key: 'weapon_smg',
      bulletSprite: 'bullet_pulse_cyan',
      cooldown: 65,
      damage: 28,
      speed: 24,
      spread: 0.12,
      pellets: 1,
      knockback: 4,
      bulletColor: '#38bdf8',
      bulletSize: 6,
      sound: () => SOUNDS.playSMG(),
    },
    5: {
      name: 'COMMANDO AR',
      shortName: 'COMMANDO',
      key: 'weapon_ar_launcher',
      bulletSprite: 'bullet_pellet_gold',
      cooldown: 110,
      damage: 48,
      speed: 25,
      spread: 0.06,
      pellets: 1,
      knockback: 7,
      bulletColor: '#fb923c',
      bulletSize: 8,
      hasGrenades: true,
      sound: () => SOUNDS.playAR(),
    },
    6: {
      name: 'PLASMA BLASTER',
      shortName: 'PLASMA',
      key: 'weapon_plasma',
      bulletSprite: 'bullet_plasma',
      cooldown: 180,
      damage: 85,
      speed: 21,
      spread: 0,
      pellets: 1,
      knockback: 10,
      bulletColor: '#60a5fa',
      bulletSize: 14,
      pierce: 4,
      sound: () => SOUNDS.playPlasma(),
    },
    7: {
      name: 'GATLING CANNON',
      shortName: 'GATLING',
      key: 'weapon_gatling',
      bulletSprite: 'bullet_dart_gold',
      cooldown: 55,
      damage: 42,
      speed: 26,
      spread: 0.18,
      pellets: 2,
      knockback: 8,
      bulletColor: '#facc15',
      bulletSize: 7,
      screenShake: 2.5,
      sound: () => SOUNDS.playGatling(),
    },
    8: {
      name: 'AM-SNIPER',
      shortName: 'SNIPER',
      key: 'weapon_sniper',
      bulletSprite: 'bullet_laser',
      cooldown: 750,
      damage: 260,
      speed: 40,
      spread: 0,
      pellets: 1,
      knockback: 25,
      bulletColor: '#f43f5e',
      bulletSize: 11,
      pierce: 99,
      screenShake: 6,
      sound: () => SOUNDS.playSniper(),
    },
  };

  // --- ENEMY CONFIG (5 / 10 / 15 / 20 SCORES) ---
  const ENEMY_TYPES = {
    1: {
      name: 'PURPLE MINION',
      walkKey: 'enemy1_walk',
      hitKey: 'enemy1_hit',
      deathKey: 'enemy1_death',
      hp: 30,
      speed: 2.8,
      radius: 30,
      score: 5, // Requirement: 5 pts
      scale: 0.65,
      color: '#c084fc',
      shockRadius: 60,
    },
    2: {
      name: 'GREEN ORC',
      walkKey: 'enemy2_walk',
      hitKey: 'enemy2_hit',
      deathKey: 'enemy2_death',
      hp: 70,
      speed: 2.1,
      radius: 34,
      score: 10, // Requirement: 10 pts
      scale: 0.7,
      color: '#4ade80',
      shockRadius: 80,
    },
    3: {
      name: 'FLYING BAT',
      walkKey: 'enemy3_fly',
      hitKey: null,
      deathKey: null,
      hp: 45,
      speed: 3.4,
      radius: 30,
      score: 15, // Requirement: 15 pts
      scale: 0.72,
      flying: true,
      color: '#facc15',
      shockRadius: 75,
    },
    4: {
      name: 'RED BRUTE',
      walkKey: 'enemy4_walk',
      hitKey: 'enemy4_hit',
      deathKey: 'enemy4_death',
      hp: 200,
      speed: 1.4,
      radius: 46,
      score: 20, // Requirement: 20 pts
      scale: 0.9,
      color: '#ef4444',
      shockRadius: 130,
    },
  };

  // --- POWER-UP DEFINITIONS ---
  const POWERUP_TYPES = {
    LIFE: {
      id: 'LIFE',
      icon: '❤️',
      name: 'EXTRA LIFE',
      color: '#ff2a4b',
      duration: 0, // instant
      desc: '+1 Life Recovered!',
    },
    RAPID: {
      id: 'RAPID',
      icon: '🔥',
      name: 'RAPID FIRE',
      color: '#f97316',
      duration: 10,
      desc: 'Rapid Fire & Triple Stream!',
    },
    SPEED: {
      id: 'SPEED',
      icon: '⚡',
      name: 'HYPER SPEED',
      color: '#38bdf8',
      duration: 10,
      desc: '+60% Movement Velocity!',
    },
    NUKE: {
      id: 'NUKE',
      icon: '💥',
      name: 'MEGA NUKE',
      color: '#eab308',
      duration: 0, // instant
      desc: 'Screen Enemies Obliterated!',
    },
    SHIELD: {
      id: 'SHIELD',
      icon: '🛡️',
      name: 'AEGIS SHIELD',
      color: '#818cf8',
      duration: 20,
      desc: 'Absorbs 1 Deadly Hit!',
    },
  };

  // --- ASSET LOADER ---
  const IMAGES = {};
  const MANIFEST = {
    frameSizes: {
      player_idle: { width: 128, height: 145 },
      player_walk: { width: 128, height: 145 },
      player_hit: { width: 128, height: 145 },
      player_death: { width: 128, height: 145 },
      enemy1_walk: { width: 128, height: 145 },
      enemy1_hit: { width: 128, height: 145 },
      enemy1_death: { width: 128, height: 145 },
      enemy2_walk: { width: 128, height: 145 },
      enemy2_hit: { width: 128, height: 145 },
      enemy2_death: { width: 128, height: 145 },
      enemy3_fly: { width: 140, height: 126 },
      enemy4_walk: { width: 128, height: 145 },
      enemy4_hit: { width: 128, height: 145 },
      enemy4_death: { width: 128, height: 145 },
      weapon_pistol: { width: 64, height: 34 },
      weapon_rifle: { width: 90, height: 44 },
      weapon_shotgun: { width: 90, height: 27 },
      weapon_gatling: { width: 110, height: 49 },
      weapon_plasma: { width: 75, height: 44 },
      weapon_sniper: { width: 125, height: 35 },
      weapon_smg: { width: 85, height: 31 },
      weapon_ar_launcher: { width: 95, height: 41 },
    },
  };

  function loadAssets() {
    const files = [
      'player_idle',
      'player_walk',
      'player_hit',
      'player_death',
      'enemy1_walk',
      'enemy1_hit',
      'enemy1_death',
      'enemy2_walk',
      'enemy2_hit',
      'enemy2_death',
      'enemy3_fly',
      'enemy4_walk',
      'enemy4_hit',
      'enemy4_death',
      'weapon_pistol',
      'weapon_rifle',
      'weapon_shotgun',
      'weapon_gatling',
      'weapon_plasma',
      'weapon_sniper',
      'weapon_smg',
      'weapon_ar_launcher',
      'bullet_orb_red',
      'bullet_laser',
      'bullet_pulse_cyan',
      'bullet_pulse_blue',
      'bullet_pellet_gold',
      'bullet_plasma',
      'bullet_rocket',
      'bullet_dart_gold',
      'bullet_heavy_dart',
      'prop_rock_large',
      'prop_rock_medium',
      'prop_broken_metal',
      'prop_water_puddle',
      'prop_rock_small',
      'prop_rock_cluster',
      'defense_ring',
      'crosshair',
      'muzzle_flash',
      'smoke',
      'shadow',
    ];

    let loadedCount = 0;
    return new Promise((resolve) => {
      files.forEach((name) => {
        const img = new Image();
        img.src = `assets/${name}.png`;
        img.onload = () => {
          IMAGES[name] = img;
          loadedCount++;
          if (loadedCount === files.length) resolve();
        };
        img.onerror = () => {
          console.warn(`Asset not found: ${name}.png`);
          loadedCount++;
          if (loadedCount === files.length) resolve();
        };
      });
    });
  }

  // --- VIRTUAL COORDINATE CONVERSION ---
  function getCanvasCoords(e) {
    const rect = CANVAS.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * V_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * V_HEIGHT;
    return { x, y };
  }

  // --- PROGRESSIVE WEAPON UNLOCK TIERS BY WAVE ---
  // Player starts with 1 (Blaster Pistol). Upgraded weapons appear in field as waves advance!
  const WAVE_WEAPON_TIERS = {
    2: 2,  // Wave 2  -> Rapid Rifle
    4: 3,  // Wave 4  -> Heavy Shotgun
    6: 4,  // Wave 6  -> Tactical SMG
    8: 5,  // Wave 8  -> Commando AR
    10: 6, // Wave 10 -> Plasma Blaster
    12: 7, // Wave 12 -> Devastator Gatling Cannon
    14: 8, // Wave 14 -> Anti-Material Sniper
  };

  // --- PROCEDURAL ENVIRONMENT PROPS (ROCKS, METAL BARRICADES, PUDDLES) ---
  const PROP_CHUNK_SIZE = 640;
  const PROP_TYPES = [
    { key: 'prop_rock_large', scale: 0.45, isObstacle: true, obstacleRadius: 62, shadowRadius: 75, shadowY: 28 },
    { key: 'prop_rock_medium', scale: 0.50, isObstacle: true, obstacleRadius: 44, shadowRadius: 50, shadowY: 20 },
    { key: 'prop_broken_metal', scale: 0.45, isObstacle: true, obstacleRadius: 48, shadowRadius: 54, shadowY: 18 },
    { key: 'prop_water_puddle', scale: 0.55, isPuddle: true, isObstacle: false, shadowRadius: 0, shadowY: 0 },
    { key: 'prop_rock_cluster', scale: 0.52, isObstacle: false, shadowRadius: 30, shadowY: 14 },
    { key: 'prop_rock_small', scale: 0.50, isObstacle: false, shadowRadius: 20, shadowY: 10 },
  ];

  const chunkPropsCache = new Map();
  function getPropsForChunk(cx, cy) {
    const chunkKey = `${cx},${cy}`;
    if (chunkPropsCache.has(chunkKey)) {
      return chunkPropsCache.get(chunkKey);
    }
    if (chunkPropsCache.size > 250) {
      chunkPropsCache.clear();
    }

    let seed = ((cx * 73856093) ^ (cy * 19349663)) >>> 0;
    function rand() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed >>> 0) / 4294967296;
    }

    const count = Math.floor(rand() * 3) + 1;
    const items = [];
    for (let i = 0; i < count; i++) {
      const typeIdx = Math.floor(rand() * PROP_TYPES.length);
      const propDef = PROP_TYPES[typeIdx];
      const relX = 60 + rand() * (PROP_CHUNK_SIZE - 120);
      const relY = 60 + rand() * (PROP_CHUNK_SIZE - 120);
      const wx = cx * PROP_CHUNK_SIZE + relX;
      const wy = cy * PROP_CHUNK_SIZE + relY;

      if (Math.hypot(wx, wy) < 260) continue;

      const flipH = rand() > 0.5;
      const rot = (rand() - 0.5) * 0.25;
      items.push({
        ...propDef,
        x: wx,
        y: wy,
        flipH,
        rot,
      });
    }

    chunkPropsCache.set(chunkKey, items);
    return items;
  }

  // --- GAME STATE VARIABLES ---
  let gameState = 'START';
  let score = 0;
  let highScore = parseInt(localStorage.getItem('circle_def_high') || '0', 10);
  let kills = 0;
  let wave = 1;
  let waveTimer = 0;
  let waveBanner = { text: 'WAVE 1 - GET READY!', timer: 140 };
  let survivalTime = 0;
  let screenShake = 0;
  let currentWeaponId = 1;
  let unlockedWeapons = [1]; // Start with only 1 weapon in hand!

  // Active Power-ups state
  const activePowerups = {
    RAPID: 0,
    SPEED: 0,
    SHIELD: false,
  };

  // Follow Camera (World offset)
  const camera = {
    x: 0,
    y: 0,
  };

  // Player (in Infinite World Coordinates)
  const player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    baseSpeed: 5.5,
    radius: 32,
    lives: 3,
    invincibleTimer: 0,
    facingLeft: false,
    animState: 'idle',
    animFrame: 0,
    animTick: 0,
    lastShotTime: 0,
    muzzleFlash: null,
    dead: false,
    trailTimer: 0,
  };

  // Ghost trail for Speed Boost
  let playerGhostTrails = [];

  // Entities Collections (World coordinates)
  let enemies = [];
  let bullets = [];
  let particles = [];
  let shockwaves = [];
  let drops = [];
  let floatTexts = [];
  let groundDecals = [];

  let spawnInterval = 1300;
  let lastSpawnTime = 0;

  // Input States (Virtual screen coordinates 1080x1920)
  const keys = {};
  const mouse = {
    x: V_WIDTH / 2,
    y: V_HEIGHT / 2,
    down: false,
    isDesktopDown: false,
    lastActive: 0,
  };

  // Mobile Virtual Joystick (Left Thumb Movement)
  const joystick = {
    active: false,
    touchId: null,
    originX: 220,
    originY: V_HEIGHT - 360,
    curX: 220,
    curY: V_HEIGHT - 360,
    dx: 0,
    dy: 0,
    distance: 0,
    angle: 0,
    maxRadius: 85,
    deadZone: 10,
    alpha: 0,
  };

  // Mobile Aim & Fire Controller (Right Thumb)
  const aimControl = {
    active: false,
    isDragging: false,
    touchId: null,
    originX: V_WIDTH - 220,
    originY: V_HEIGHT - 360,
    curX: V_WIDTH - 220,
    curY: V_HEIGHT - 360,
    angle: 0,
  };

  // Auto-Fire & Smart Target Lock States
  let autoFireEnabled = localStorage.getItem('circle_def_autofire') !== 'false';
  let lockedEnemy = null;
  let lockReticleTick = 0;

  function getTouchVirtualCoords(touch) {
    const rect = CANVAS.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * V_WIDTH;
    const y = ((touch.clientY - rect.top) / rect.height) * V_HEIGHT;
    return { x, y };
  }

  function getNearestEnemy() {
    let nearest = null;
    let minDist = 1500;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    }
    return nearest;
  }

  function cycleWeapon() {
    if (!unlockedWeapons || unlockedWeapons.length <= 1) return;
    const idx = unlockedWeapons.indexOf(currentWeaponId);
    const nextIdx = (idx + 1) % unlockedWeapons.length;
    selectWeapon(unlockedWeapons[nextIdx]);
  }

  function cycleWeaponPrev() {
    if (!unlockedWeapons || unlockedWeapons.length <= 1) return;
    const idx = unlockedWeapons.indexOf(currentWeaponId);
    const prevIdx = (idx - 1 + unlockedWeapons.length) % unlockedWeapons.length;
    selectWeapon(unlockedWeapons[prevIdx]);
  }

  function toggleAutoFire() {
    autoFireEnabled = !autoFireEnabled;
    localStorage.setItem('circle_def_autofire', autoFireEnabled);
    updateAutoFireUI();
    if (SOUNDS && SOUNDS.playSwitch) SOUNDS.playSwitch();
    addFloatText(
      player.x,
      player.y - 80,
      autoFireEnabled ? 'AUTO FIRE ON' : 'MANUAL FIRE',
      autoFireEnabled ? '#4ade80' : '#f87171',
      24
    );
  }

  function updateAutoFireUI() {
    const btn = document.getElementById('autoFireBtn');
    const text = document.getElementById('autoFireText');
    if (btn && text) {
      if (autoFireEnabled) {
        btn.classList.add('active');
        text.innerText = 'AUTO: ON';
      } else {
        btn.classList.remove('active');
        text.innerText = 'AUTO: OFF';
      }
    }
  }

  // --- INPUT LISTENERS ---
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    const keyNum = parseInt(e.key, 10);
    if (!isNaN(keyNum) && unlockedWeapons.includes(keyNum)) {
      selectWeapon(keyNum);
    }
    if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
    if (e.code === 'KeyF') toggleAutoFire();
    if (e.code === 'KeyQ') cycleWeaponPrev();
    if (e.code === 'KeyE') cycleWeapon();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Desktop Mouse Inputs
  CANVAS.addEventListener('mousemove', (e) => {
    const p = getCanvasCoords(e);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.lastActive = performance.now();
  });

  CANVAS.addEventListener('mousedown', (e) => {
    SOUNDS.init();
    if (e.button === 0) {
      const p = getCanvasCoords(e);
      mouse.x = p.x;
      mouse.y = p.y;
      mouse.down = true;
      mouse.isDesktopDown = true;
      mouse.lastActive = performance.now();
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      mouse.isDesktopDown = false;
      if (!aimControl.active && !autoFireEnabled) {
        mouse.down = false;
      }
    }
  });

  window.addEventListener('wheel', (e) => {
    if (e.deltaY > 0) {
      cycleWeapon();
    } else if (e.deltaY < 0) {
      cycleWeaponPrev();
    }
  });

  // Mobile Touch System (Dedicated Left Joystick & Right Combat/Aim Zone)
  CANVAS.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      SOUNDS.init();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const p = getTouchVirtualCoords(t);

        // LEFT HALF OF SCREEN (x < V_WIDTH * 0.52) -> Dynamic Movement Joystick
        if (p.x < V_WIDTH * 0.52) {
          if (joystick.touchId === null) {
            joystick.touchId = t.identifier;
            joystick.active = true;
            joystick.originX = p.x;
            joystick.originY = p.y;
            joystick.curX = p.x;
            joystick.curY = p.y;
            joystick.distance = 0;
            joystick.dx = 0;
            joystick.dy = 0;
            joystick.alpha = 1;
          }
        } else {
          // RIGHT HALF OF SCREEN -> Aim & Fire Zone
          if (aimControl.touchId === null) {
            aimControl.touchId = t.identifier;
            aimControl.active = true;
            aimControl.isDragging = false;
            aimControl.originX = p.x;
            aimControl.originY = p.y;
            aimControl.curX = p.x;
            aimControl.curY = p.y;
            aimControl.angle = Math.atan2(
              p.y - (player.y - camera.y),
              p.x - (player.x - camera.x)
            );
            mouse.x = p.x;
            mouse.y = p.y;
            mouse.down = true;

            const fireBtn = document.getElementById('fireBtn');
            if (fireBtn) fireBtn.classList.add('pressed');
          }
        }
      }
    },
    { passive: false }
  );

  CANVAS.addEventListener(
    'touchmove',
    (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const p = getTouchVirtualCoords(t);

        // Update Left Movement Joystick
        if (t.identifier === joystick.touchId) {
          joystick.curX = p.x;
          joystick.curY = p.y;
          const diffX = p.x - joystick.originX;
          const diffY = p.y - joystick.originY;
          const dist = Math.hypot(diffX, diffY);
          joystick.distance = dist;
          joystick.angle = Math.atan2(diffY, diffX);

          if (dist > joystick.deadZone) {
            const speedRatio = Math.min(
              1.0,
              (dist - joystick.deadZone) / (joystick.maxRadius - joystick.deadZone)
            );
            joystick.dx = Math.cos(joystick.angle) * speedRatio;
            joystick.dy = Math.sin(joystick.angle) * speedRatio;

            // Floating anchor: keeps joystick under thumb during large swipes
            if (dist > joystick.maxRadius) {
              const excess = dist - joystick.maxRadius;
              joystick.originX += Math.cos(joystick.angle) * excess;
              joystick.originY += Math.sin(joystick.angle) * excess;
            }
          } else {
            joystick.dx = 0;
            joystick.dy = 0;
          }
        }

        // Update Right Aim / Fire Controller
        if (t.identifier === aimControl.touchId) {
          aimControl.curX = p.x;
          aimControl.curY = p.y;
          const adx = p.x - aimControl.originX;
          const ady = p.y - aimControl.originY;
          const adist = Math.hypot(adx, ady);

          if (adist > 22) {
            aimControl.isDragging = true;
            aimControl.angle = Math.atan2(ady, adx);
            // Point aim in 360 drag direction
            const screenPx = player.x - camera.x;
            const screenPy = player.y - camera.y;
            mouse.x = screenPx + Math.cos(aimControl.angle) * 550;
            mouse.y = screenPy + Math.sin(aimControl.angle) * 550;
            mouse.down = true;
          } else {
            // Slight touch: direct tap aim
            mouse.x = p.x;
            mouse.y = p.y;
            mouse.down = true;
          }
        }
      }
    },
    { passive: false }
  );

  const onTouchEnd = (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === joystick.touchId) {
        joystick.active = false;
        joystick.touchId = null;
        joystick.dx = 0;
        joystick.dy = 0;
        joystick.distance = 0;
      }
      if (t.identifier === aimControl.touchId) {
        aimControl.active = false;
        aimControl.isDragging = false;
        aimControl.touchId = null;
        if (!mouse.isDesktopDown && !autoFireEnabled) {
          mouse.down = false;
        }
        const fireBtn = document.getElementById('fireBtn');
        if (fireBtn) fireBtn.classList.remove('pressed');
      }
    }
    if (e.touches.length === 0) {
      joystick.active = false;
      joystick.touchId = null;
      joystick.dx = 0;
      joystick.dy = 0;
      joystick.distance = 0;
      aimControl.active = false;
      aimControl.isDragging = false;
      aimControl.touchId = null;
      if (!mouse.isDesktopDown && !autoFireEnabled) {
        mouse.down = false;
      }
      const fireBtn = document.getElementById('fireBtn');
      if (fireBtn) fireBtn.classList.remove('pressed');
    }
  };
  CANVAS.addEventListener('touchend', onTouchEnd);
  CANVAS.addEventListener('touchcancel', onTouchEnd);

  // --- GAME RESET & WEAPONS ---
  function resetGame() {
    score = 0;
    kills = 0;
    wave = 1;
    waveTimer = 0;
    waveBanner = { text: 'WAVE 1 - GET READY!', timer: 140 };
    survivalTime = 0;
    screenShake = 0;

    activePowerups.RAPID = 0;
    activePowerups.SPEED = 0;
    activePowerups.SHIELD = false;

    joystick.active = false;
    joystick.touchId = null;
    joystick.dx = 0;
    joystick.dy = 0;
    joystick.distance = 0;

    aimControl.active = false;
    aimControl.isDragging = false;
    aimControl.touchId = null;

    lockedEnemy = null;
    mouse.down = false;
    mouse.isDesktopDown = false;
    updateAutoFireUI();

    player.x = 0;
    player.y = 0;
    player.vx = 0;
    player.vy = 0;
    player.lives = 3;
    player.invincibleTimer = 0;
    player.facingLeft = false;
    player.animState = 'idle';
    player.animFrame = 0;
    player.animTick = 0;
    player.dead = false;
    player.muzzleFlash = null;
    player.trailTimer = 0;

    camera.x = player.x - V_WIDTH / 2;
    camera.y = player.y - V_HEIGHT / 2;

    unlockedWeapons = [1];
    currentWeaponId = 1;
    renderWeaponsDock();
    updateWeaponUI();

    enemies = [];
    bullets = [];
    particles = [];
    shockwaves = [];
    drops = [];
    floatTexts = [];
    groundDecals = [];
    playerGhostTrails = [];

    spawnInterval = 1300;
    lastSpawnTime = Date.now();
    gameState = 'PLAYING';
    SOUNDS.playWave();
    updateHUD();
    updatePowerupTray();
  }

  function selectWeapon(id) {
    if (currentWeaponId !== id && WEAPONS[id]) {
      currentWeaponId = id;
      SOUNDS.playSwitch();
      updateWeaponUI();
      addFloatText(player.x, player.y - 60, WEAPONS[id].name, '#38bdf8', 22);
    }
  }

  function togglePause() {
    if (gameState === 'PLAYING') {
      gameState = 'PAUSED';
      document.getElementById('pauseOverlay').classList.remove('hidden');
    } else if (gameState === 'PAUSED') {
      gameState = 'PLAYING';
      document.getElementById('pauseOverlay').classList.add('hidden');
    }
  }

  // --- FLOATING TEXT ---
  function addFloatText(x, y, text, color = '#ffffff', fontSize = 24) {
    floatTexts.push({
      x,
      y,
      text,
      color,
      fontSize,
      alpha: 1.0,
      scale: 1.4,
      vy: -1.8,
      life: 55,
    });
  }

  // --- BEAUTIFUL PARTICLES & DESTRUCTION FX ---
  function createShockwave(x, y, color, maxRadius = 90) {
    shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius,
      color,
      alpha: 1.0,
      lineWidth: 8,
    });
  }

  function createSparks(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 6 + 3,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.02,
      });
    }
  }

  function createEnemyDeathFX(x, y, proto) {
    // 1. Expanding Color Shockwave
    createShockwave(x, y, proto.color, proto.shockRadius);

    // 2. High Density Sparks
    createSparks(x, y, 22, proto.color);
    createSparks(x, y, 12, '#ffffff');

    // 3. Smoke Puffs
    for (let i = 0; i < (proto.radius > 40 ? 3 : 1); i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.8 - Math.random() * 0.8,
        isSmoke: true,
        size: 45,
        maxSize: 110,
        alpha: 0.95,
        decay: 0.02,
        rotation: Math.random() * Math.PI * 2,
      });
    }

    // 4. Ground Decal / Splatter (lasts 6 seconds)
    groundDecals.push({
      x,
      y,
      radius: proto.radius * 0.9,
      color: proto.color,
      alpha: 0.55,
      life: 360,
    });
  }

  function spawnFieldWeaponDrop(weaponId) {
    if (!WEAPONS[weaponId]) return;
    const angle = Math.random() * Math.PI * 2;
    const dist = 320 + Math.random() * 140;
    const dropX = player.x + Math.cos(angle) * dist;
    const dropY = player.y + Math.sin(angle) * dist;
    drops.push({
      x: dropX,
      y: dropY,
      type: 'WEAPON',
      weaponId: weaponId,
      bounceTick: Math.random() * Math.PI * 2,
      life: 3600, // 60s
    });
    createShockwave(dropX, dropY, '#facc15', 220);
    createSparks(dropX, dropY, 40, '#facc15');
    addFloatText(dropX, dropY - 60, `${WEAPONS[weaponId].name} DISCOVERED! 🌟`, '#facc15', 30);
  }

  // --- WEAPON & POWER-UP DROP SYSTEM ---
  function checkEnemyDrop(x, y, enemy) {
    // 1. Check for Weapon Drops from Enemies according to progressive wave tiers
    const maxTier = wave >= 14 ? 8 : (wave >= 12 ? 7 : (wave >= 10 ? 6 : (wave >= 8 ? 5 : (wave >= 6 ? 4 : (wave >= 4 ? 3 : (wave >= 2 ? 2 : 1))))));
    const availableLocked = [];
    for (let id = 2; id <= maxTier; id++) {
      if (!unlockedWeapons.includes(id)) {
        availableLocked.push(id);
      }
    }

    if (availableLocked.length > 0) {
      let shouldDropWeapon = false;
      if (enemy.typeId === 4) { // RED BRUTE
        // In Wave 11+, 100% guaranteed drop! In Wave 5-10, 60% chance; earlier waves 40%.
        if (wave >= 11 || Math.random() < 0.60) {
          shouldDropWeapon = true;
        }
      } else if (enemy.typeId === 2) { // GREEN ORC
        // 45% chance in Wave 2+
        if (Math.random() < 0.45) {
          shouldDropWeapon = true;
        }
      } else {
        // Minion / Bat: 12% chance if player still only has starter pistol in wave 2+
        if (unlockedWeapons.length === 1 && wave >= 2 && Math.random() < 0.12) {
          shouldDropWeapon = true;
        }
      }

      if (shouldDropWeapon) {
        const pickedWeaponId = availableLocked[Math.floor(Math.random() * availableLocked.length)];
        drops.push({
          x,
          y,
          type: 'WEAPON',
          weaponId: pickedWeaponId,
          bounceTick: Math.random() * Math.PI * 2,
          life: 2400, // 40 seconds on ground
        });
        createShockwave(x, y, '#facc15', 180);
        createSparks(x, y, 35, '#facc15');
        addFloatText(x, y - 60, 'UPGRADED WEAPON DROPPED! ⭐', '#facc15', 28);
        return;
      }
    }

    // 2. Regular Power-Up Drop
    checkDropPowerup(x, y);
  }

  function checkDropPowerup(x, y) {
    // 24% chance to drop a powerup
    if (Math.random() > 0.24) return;

    const roll = Math.random();
    let typeKey = 'RAPID';
    if (player.lives < 3 && roll < 0.35) {
      typeKey = 'LIFE'; // Higher chance if hurt
    } else if (roll < 0.2) {
      typeKey = 'LIFE';
    } else if (roll < 0.45) {
      typeKey = 'RAPID';
    } else if (roll < 0.68) {
      typeKey = 'SPEED';
    } else if (roll < 0.86) {
      typeKey = 'SHIELD';
    } else {
      typeKey = 'NUKE';
    }

    const info = POWERUP_TYPES[typeKey];
    drops.push({
      x,
      y,
      type: typeKey,
      info,
      bounceTick: Math.random() * 10,
      life: 900, // 15 seconds on ground
    });
  }

  function collectPowerup(drop) {
    if (drop.type === 'WEAPON') {
      const wId = drop.weaponId;
      const wp = WEAPONS[wId];
      SOUNDS.playWeaponPickup();

      if (!unlockedWeapons.includes(wId)) {
        unlockedWeapons.push(wId);
        unlockedWeapons.sort((a, b) => a - b);
      }
      selectWeapon(wId);
      renderWeaponsDock();

      screenShake = 10;
      createShockwave(drop.x, drop.y, '#facc15', 180);
      createSparks(drop.x, drop.y, 40, '#facc15');
      createSparks(drop.x, drop.y, 20, '#ffffff');
      addFloatText(player.x, player.y - 80, `UNLOCKED: ${wp.name}! 🌟`, '#facc15', 30);
      return;
    }

    const info = drop.info;
    SOUNDS.playPowerup();

    if (drop.type === 'LIFE') {
      SOUNDS.playLife();
      if (player.lives < 3) {
        player.lives++;
        addFloatText(player.x, player.y - 70, '+1 EXTRA LIFE! ❤️', '#ff2a4b', 32);
      } else {
        score += 50;
        addFloatText(player.x, player.y - 70, 'FULL LIFE! +50 PTS ❤️', '#ff2a4b', 28);
      }
      updateHUD();
    } else if (drop.type === 'NUKE') {
      SOUNDS.playNuke();
      screenShake = 24;
      createShockwave(player.x, player.y, '#eab308', 900);
      addFloatText(player.x, player.y - 70, 'TACTICAL NUKE! 💥', '#eab308', 36);

      // Kill all visible enemies
      const camLeft = camera.x - 100;
      const camRight = camera.x + V_WIDTH + 100;
      const camTop = camera.y - 100;
      const camBottom = camera.y + V_HEIGHT + 100;

      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.x >= camLeft && e.x <= camRight && e.y >= camTop && e.y <= camBottom) {
          const proto = ENEMY_TYPES[e.typeId];
          kills++;
          score += proto.score;
          addFloatText(e.x, e.y - 30, `+${proto.score}`, proto.color, 26);
          createEnemyDeathFX(e.x, e.y, proto);
          checkEnemyDrop(e.x, e.y, e);
          enemies.splice(i, 1);
        }
      }
      updateHUD();
    } else if (drop.type === 'SHIELD') {
      activePowerups.SHIELD = true;
      addFloatText(player.x, player.y - 70, 'AEGIS SHIELD ACTIVATED! 🛡️', '#818cf8', 30);
    } else {
      activePowerups[drop.type] = info.duration;
      addFloatText(player.x, player.y - 70, `${info.name}! ${info.icon}`, info.color, 30);
    }

    createSparks(drop.x, drop.y, 25, info.color);
    updatePowerupTray();
  }

  function updatePowerupTray() {
    const tray = document.getElementById('powerupsTray');
    if (!tray) return;
    tray.innerHTML = '';

    // Rapid Fire
    if (activePowerups.RAPID > 0) {
      const pill = createPill('🔥 RAPID TRIPLE FIRE', activePowerups.RAPID / 10, '#f97316');
      tray.appendChild(pill);
    }
    // Speed Boost
    if (activePowerups.SPEED > 0) {
      const pill = createPill('⚡ HYPER SPEED', activePowerups.SPEED / 10, '#38bdf8');
      tray.appendChild(pill);
    }
    // Shield
    if (activePowerups.SHIELD) {
      const pill = createPill('🛡️ AEGIS SHIELD READY', 1.0, '#818cf8');
      tray.appendChild(pill);
    }
  }

  function createPill(title, pct, color) {
    const div = document.createElement('div');
    div.className = 'powerup-pill';
    div.innerHTML = `
      <span>${title}</span>
      <div class="powerup-bar">
        <div class="powerup-bar-fill" style="width:${Math.round(pct * 100)}%; background:${color};"></div>
      </div>
    `;
    return div;
  }

  // --- WEAPON SHOOTING ---
  function shootWeapon() {
    const now = Date.now();
    const wp = WEAPONS[currentWeaponId];
    if (!wp) return;
    const isRapid = activePowerups.RAPID > 0;
    const cooldown = isRapid ? wp.cooldown * 0.55 : wp.cooldown;

    if (now - player.lastShotTime < cooldown) return;
    player.lastShotTime = now;
    wp.sound();

    // Aim position in World Coordinates
    const worldAimX = mouse.x + camera.x;
    const worldAimY = mouse.y + camera.y;

    const dx = worldAimX - player.x;
    const dy = worldAimY - player.y;
    const baseAngle = Math.atan2(dy, dx);

    const barrelDist = 48;
    const muzzleX = player.x + Math.cos(baseAngle) * barrelDist;
    const muzzleY = player.y + Math.sin(baseAngle) * barrelDist;

    player.muzzleFlash = {
      x: muzzleX,
      y: muzzleY,
      angle: baseAngle,
      timer: 4,
    };

    // Recoil & screen shake
    const recoilForce = wp.pellets > 1 ? 2.8 : (wp.knockback ? Math.min(wp.knockback * 0.14, 3.5) : 1.0);
    player.vx -= Math.cos(baseAngle) * recoilForce;
    player.vy -= Math.sin(baseAngle) * recoilForce;

    if (wp.screenShake) {
      screenShake = Math.max(screenShake, wp.screenShake);
    } else if (wp.pellets > 1) {
      screenShake = Math.max(screenShake, 6);
    }

    // Commando AR grenade tracking (every 3rd shot launches explosive rocket grenade)
    player.shotCount = (player.shotCount || 0) + 1;
    const isGrenade = wp.hasGrenades && (player.shotCount % 3 === 0);

    // Number of streams
    const streamOffsets = isRapid ? [-0.14, 0, 0.14] : [0];

    // Perpendicular offsets for dual-barrel Gatling Cannon
    const perpX = -Math.sin(baseAngle);
    const perpY = Math.cos(baseAngle);

    streamOffsets.forEach((streamAngle) => {
      for (let p = 0; p < wp.pellets; p++) {
        let angle = baseAngle + streamAngle;
        if (wp.spread > 0) {
          angle += (Math.random() - 0.5) * wp.spread;
        }

        let spawnX = muzzleX;
        let spawnY = muzzleY;
        if (wp.pellets === 2) {
          const sign = p === 0 ? 1 : -1;
          spawnX += perpX * 9 * sign;
          spawnY += perpY * 9 * sign;
        }

        const isExplosiveRound = isGrenade && p === 0;
        const bulletDmg = isExplosiveRound ? wp.damage * 2.2 : (isRapid ? wp.damage * 1.2 : wp.damage);
        const bulletColor = isExplosiveRound ? '#ea580c' : (isRapid ? '#ff3b30' : wp.bulletColor);
        const bulletSize = isExplosiveRound ? 13 : (isRapid ? wp.bulletSize + 2 : wp.bulletSize);
        const bulletSprite = isExplosiveRound ? 'bullet_rocket' : (wp.bulletSprite || 'bullet_orb_red');

        bullets.push({
          x: spawnX,
          y: spawnY,
          vx: Math.cos(angle) * (isExplosiveRound ? wp.speed * 0.85 : wp.speed),
          vy: Math.sin(angle) * (isExplosiveRound ? wp.speed * 0.85 : wp.speed),
          damage: bulletDmg,
          color: bulletColor,
          size: bulletSize,
          sprite: bulletSprite,
          knockback: isExplosiveRound ? 18 : wp.knockback,
          life: 90,
          pierce: isExplosiveRound ? 0 : (wp.pierce || 0),
          isExplosive: isExplosiveRound,
          isPlasma: wp.key === 'weapon_plasma',
          isSniper: wp.key === 'weapon_sniper',
          blastRadius: 150,
          hitEnemies: new Set(),
        });
      }
    });

    if (isGrenade) {
      addFloatText(muzzleX, muzzleY - 24, '🚀 GRENADE!', '#fb923c', 20);
    }
  }

  // --- ENEMY SPAWNING AROUND CAMERA ---
  function spawnEnemy() {
    const margin = 120;
    const camLeft = camera.x - margin;
    const camRight = camera.x + V_WIDTH + margin;
    const camTop = camera.y - margin;
    const camBottom = camera.y + V_HEIGHT + margin;

    let sx = 0;
    let sy = 0;
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) {
      sx = camLeft + Math.random() * (camRight - camLeft);
      sy = camTop;
    } else if (edge === 1) {
      sx = camRight;
      sy = camTop + Math.random() * (camBottom - camTop);
    } else if (edge === 2) {
      sx = camLeft + Math.random() * (camRight - camLeft);
      sy = camBottom;
    } else {
      sx = camLeft;
      sy = camTop + Math.random() * (camBottom - camTop);
    }

    let typeId = 1;
    const rand = Math.random();
    if (wave >= 11) {
      // Wave 11+: High tier big enemy onslaught (Red Brutes & Orcs drop legendary weapons!)
      if (rand < 0.38) {
        typeId = 4; // Red Brute (20 pts)
      } else if (rand < 0.68) {
        typeId = 2; // Green Orc (10 pts)
      } else if (rand < 0.88) {
        typeId = 3; // Flying Bat (15 pts)
      } else {
        typeId = 1; // Purple Minion (5 pts)
      }
    } else if (wave >= 4 && rand < 0.22) {
      typeId = 4; // Red Brute (20 pts)
    } else if (wave >= 3 && rand < 0.42) {
      typeId = 3; // Flying Bat (15 pts)
    } else if (wave >= 2 && rand < 0.65) {
      typeId = 2; // Green Orc (10 pts)
    } else {
      typeId = 1; // Purple Minion (5 pts)
    }

    const proto = ENEMY_TYPES[typeId];
    const hpBonus = (wave - 1) * 7;
    const speedBonus = Math.min((wave - 1) * 0.1, 1.4);

    enemies.push({
      typeId,
      x: sx,
      y: sy,
      hp: proto.hp + hpBonus,
      maxHp: proto.hp + hpBonus,
      speed: proto.speed + speedBonus,
      radius: proto.radius,
      score: proto.score,
      scale: proto.scale,
      flying: !!proto.flying,
      color: proto.color,
      animFrame: 0,
      animTick: 0,
      hitTimer: 0,
      facingLeft: false,
      waveOffset: Math.random() * Math.PI * 2,
    });
  }

  // --- PLAYER HURT & 3 LIVES ---
  function hurtPlayer() {
    if (player.invincibleTimer > 0 || player.dead) return;

    // Shield Absorb
    if (activePowerups.SHIELD) {
      activePowerups.SHIELD = false;
      SOUNDS.playShieldBreak();
      screenShake = 10;
      createShockwave(player.x, player.y, '#818cf8', 140);
      addFloatText(player.x, player.y - 70, 'SHIELD BROKEN! 🛡️', '#818cf8', 28);
      player.invincibleTimer = 45;
      updatePowerupTray();

      // Repel enemies
      enemies.forEach((e) => {
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 220) {
          e.x += (dx / dist) * 120;
          e.y += (dy / dist) * 120;
        }
      });
      return;
    }

    player.lives--;
    player.invincibleTimer = 90; // ~1.5s invulnerable
    player.animState = 'hit';
    player.animFrame = 0;
    screenShake = 16;
    SOUNDS.playPlayerHurt();
    updateHUD();

    // Shockwave knockback
    enemies.forEach((e) => {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 240) {
        e.x += (dx / dist) * 110;
        e.y += (dy / dist) * 110;
      }
    });

    createSparks(player.x, player.y, 30, '#ef4444');

    if (player.lives <= 0) {
      player.dead = true;
      player.animState = 'death';
      player.animFrame = 0;
      SOUNDS.playGameOver();
      setTimeout(() => {
        gameOver();
      }, 1500);
    }
  }

  function gameOver() {
    gameState = 'GAMEOVER';
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('circle_def_high', highScore);
    }

    const min = Math.floor(survivalTime / 60);
    const sec = Math.floor(survivalTime % 60);
    const timeStr = `${min}:${sec < 10 ? '0' : ''}${sec}`;

    document.getElementById('finalScore').innerText = score.toLocaleString();
    document.getElementById('finalHighScore').innerText = highScore.toLocaleString();
    document.getElementById('finalKills').innerText = kills;
    document.getElementById('finalWave').innerText = wave;
    document.getElementById('finalTime').innerText = timeStr;
    document.getElementById('gameOverOverlay').classList.remove('hidden');
  }

  // --- UPDATE LOOP ---
  function update(dt) {
    if (gameState !== 'PLAYING') {
      if (gameState === 'GAMEOVER' && player.dead) {
        player.animTick++;
        if (player.animTick % 6 === 0 && player.animFrame < 9) {
          player.animFrame++;
        }
      }
      return;
    }

    survivalTime += dt;

    // Wave Progression
    waveTimer += dt;
    if (waveTimer > 28) {
      waveTimer = 0;
      wave++;
      const tierWeaponId = WAVE_WEAPON_TIERS[wave];
      if (tierWeaponId && !unlockedWeapons.includes(tierWeaponId)) {
        spawnFieldWeaponDrop(tierWeaponId);
        waveBanner = { text: `WAVE ${wave} - NEW WEAPON DROPPED: ${WEAPONS[tierWeaponId].name}! ⭐`, timer: 200 };
      } else if (wave === 11) {
        waveBanner = { text: 'WAVE 11 - LEGENDARY WEAPONS UNLEASHED! ⭐', timer: 180 };
      } else {
        waveBanner = { text: `WAVE ${wave} - DANGER SURGE!`, timer: 140 };
      }
      spawnInterval = Math.max(340, 1300 - (wave - 1) * 105);
      SOUNDS.playWave();
      addFloatText(player.x, player.y - 120, `WAVE ${wave}!`, '#fbbf24', 36);
      updateHUD();
    }
    if (waveBanner.timer > 0) waveBanner.timer--;

    // Update active power-ups
    let trayNeedsUpdate = false;
    if (activePowerups.RAPID > 0) {
      activePowerups.RAPID -= dt;
      if (activePowerups.RAPID <= 0) {
        activePowerups.RAPID = 0;
        trayNeedsUpdate = true;
      }
    }
    if (activePowerups.SPEED > 0) {
      activePowerups.SPEED -= dt;
      if (activePowerups.SPEED <= 0) {
        activePowerups.SPEED = 0;
        trayNeedsUpdate = true;
      }
    }
    if (trayNeedsUpdate || activePowerups.RAPID > 0 || activePowerups.SPEED > 0) {
      updatePowerupTray();
    }

    // Screen Shake decay
    if (screenShake > 0) {
      screenShake *= 0.88;
      if (screenShake < 0.2) screenShake = 0;
    }

    // Update Smart Nearest Enemy
    lockedEnemy = getNearestEnemy();
    lockReticleTick += dt * 4;

    // Movement Inputs (WASD + Virtual Joystick)
    let mx = 0;
    let my = 0;
    if (keys['KeyW'] || keys['ArrowUp']) my -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) my += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) mx += 1;

    if (joystick.active && joystick.distance > joystick.deadZone) {
      mx += joystick.dx;
      my += joystick.dy;
    }

    const moveDist = Math.hypot(mx, my);
    const speedMultiplier = activePowerups.SPEED > 0 ? 1.6 : 1.0;

    if (moveDist > 0 && !player.dead) {
      const norm = Math.min(1.0, moveDist);
      player.vx += (mx / moveDist) * norm * (player.baseSpeed * speedMultiplier) * 0.28;
      player.vy += (my / moveDist) * norm * (player.baseSpeed * speedMultiplier) * 0.28;
      if (player.animState !== 'hit' && player.animState !== 'death') {
        player.animState = 'walk';
      }

      // Ghost trail for Speed Boost
      if (activePowerups.SPEED > 0) {
        player.trailTimer++;
        if (player.trailTimer % 3 === 0) {
          playerGhostTrails.push({
            x: player.x,
            y: player.y,
            frame: player.animFrame,
            facingLeft: player.facingLeft,
            alpha: 0.7,
          });
        }
      }
    } else {
      if (player.animState !== 'hit' && player.animState !== 'death') {
        player.animState = 'idle';
      }
    }

    // Player Friction & Physics (NO BOUNDARY - INFINITE MOVEMENT)
    player.vx *= 0.82;
    player.vy *= 0.82;
    player.x += player.vx;
    player.y += player.vy;

    // Soft collision against Environment Rock/Barricade Obstacles
    const pChunkX = Math.floor(player.x / PROP_CHUNK_SIZE);
    const pChunkY = Math.floor(player.y / PROP_CHUNK_SIZE);
    for (let cx = pChunkX - 1; cx <= pChunkX + 1; cx++) {
      for (let cy = pChunkY - 1; cy <= pChunkY + 1; cy++) {
        const cProps = getPropsForChunk(cx, cy);
        for (let i = 0; i < cProps.length; i++) {
          const pr = cProps[i];
          if (!pr.isObstacle) continue;
          const dx = player.x - pr.x;
          const dy = player.y - (pr.y + (pr.shadowY || 0) * 0.4);
          const dist = Math.hypot(dx, dy);
          const minDist = pr.obstacleRadius + player.radius * 0.6;
          if (dist < minDist && dist > 0.001) {
            const push = (minDist - dist) * 0.4;
            player.x += (dx / dist) * push;
            player.y += (dy / dist) * push;
          }
        }
      }
    }

    // Follow Camera (smooth lerp toward player)
    const targetCamX = player.x - V_WIDTH / 2;
    const targetCamY = player.y - V_HEIGHT / 2;
    camera.x += (targetCamX - camera.x) * 0.12;
    camera.y += (targetCamY - camera.y) * 0.12;

    // --- AIMING & SHOOTING LOGIC ---
    let shouldShoot = false;
    const screenPx = player.x - camera.x;
    const screenPy = player.y - camera.y;

    if (aimControl.isDragging) {
      // Manual 360 Aim Joystick Mode
      mouse.x = screenPx + Math.cos(aimControl.angle) * 550;
      mouse.y = screenPy + Math.sin(aimControl.angle) * 550;
      shouldShoot = true;
    } else if (aimControl.active) {
      // Fire Button tapped/held without drag -> Auto-Aim at nearest enemy
      if (lockedEnemy) {
        const aimAngle = Math.atan2(lockedEnemy.y - player.y, lockedEnemy.x - player.x);
        mouse.x = screenPx + Math.cos(aimAngle) * 550;
        mouse.y = screenPy + Math.sin(aimAngle) * 550;
      } else {
        const fallbackAngle = player.facingLeft ? Math.PI : 0;
        mouse.x = screenPx + Math.cos(fallbackAngle) * 550;
        mouse.y = screenPy + Math.sin(fallbackAngle) * 550;
      }
      shouldShoot = true;
    } else if (mouse.isDesktopDown) {
      // Desktop mouse click/drag
      shouldShoot = true;
    } else if (autoFireEnabled && lockedEnemy && !player.dead) {
      // Automatic Fire Mode toward nearest enemy
      const aimAngle = Math.atan2(lockedEnemy.y - player.y, lockedEnemy.x - player.x);
      mouse.x = screenPx + Math.cos(aimAngle) * 550;
      mouse.y = screenPy + Math.sin(aimAngle) * 550;
      shouldShoot = true;
    }

    // Facing Direction
    const worldAimX = mouse.x + camera.x;
    if (worldAimX < player.x) {
      player.facingLeft = true;
    } else {
      player.facingLeft = false;
    }

    // Invincibility Timer
    if (player.invincibleTimer > 0) {
      player.invincibleTimer--;
      if (player.invincibleTimer === 0 && player.animState === 'hit') {
        player.animState = 'idle';
      }
    }

    // Player Animation
    player.animTick++;
    if (player.animTick % 5 === 0) {
      const count =
        player.animState === 'idle'
          ? 6
          : player.animState === 'walk'
          ? 8
          : player.animState === 'hit'
          ? 3
          : 10;
      player.animFrame = (player.animFrame + 1) % count;
    }

    // Active Shooting
    if (shouldShoot && !player.dead) {
      shootWeapon();
    }

    if (player.muzzleFlash) {
      player.muzzleFlash.timer--;
      if (player.muzzleFlash.timer <= 0) player.muzzleFlash = null;
    }

    // Update Ghost Trails
    for (let i = playerGhostTrails.length - 1; i >= 0; i--) {
      const tr = playerGhostTrails[i];
      tr.alpha -= 0.05;
      if (tr.alpha <= 0) playerGhostTrails.splice(i, 1);
    }

    // Update Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      // Visual tracers for sniper, plasma, and explosive rounds
      if (b.isSniper && Math.random() < 0.4) {
        particles.push({
          x: b.x,
          y: b.y,
          vx: 0,
          vy: 0,
          color: '#f43f5e',
          size: 3.5,
          alpha: 0.8,
          decay: 0.08,
        });
      } else if (b.isPlasma && Math.random() < 0.45) {
        particles.push({
          x: b.x + (Math.random() - 0.5) * 6,
          y: b.y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          color: '#60a5fa',
          size: 6,
          alpha: 0.85,
          decay: 0.07,
        });
      } else if (b.isExplosive && Math.random() < 0.5) {
        particles.push({
          x: b.x,
          y: b.y,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          color: '#fb923c',
          size: 5,
          alpha: 0.75,
          decay: 0.06,
        });
      }

      let bulletDead = false;

      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (b.hitEnemies && b.hitEnemies.has(e)) continue;

        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < e.radius + b.size) {
          if (!b.hitEnemies) b.hitEnemies = new Set();
          b.hitEnemies.add(e);

          if (b.isExplosive) {
            // Detonate explosive rocket grenade
            createShockwave(b.x, b.y, '#f97316', b.blastRadius || 150);
            createSparks(b.x, b.y, 25, '#fb923c');
            createSparks(b.x, b.y, 15, '#ffffff');
            SOUNDS.playExplosion(false);
            screenShake = Math.max(screenShake, 8);

            enemies.forEach((splashE) => {
              const sDist = Math.hypot(splashE.x - b.x, splashE.y - b.y);
              const maxR = b.blastRadius || 150;
              if (sDist < maxR) {
                const splashDmg = b.damage * (1 - sDist / (maxR * 1.15));
                splashE.hp -= splashDmg;
                splashE.hitTimer = 6;
                addFloatText(splashE.x + (Math.random() - 0.5) * 15, splashE.y - 20, `${Math.round(splashDmg)}`, '#fb923c', 22);
              }
            });

            bulletDead = true;
            break;
          }

          // Direct Hit
          e.hp -= b.damage;
          e.hitTimer = 6;
          SOUNDS.playHit();

          const bAngle = Math.atan2(b.vy, b.vx);
          e.x += Math.cos(bAngle) * b.knockback;
          e.y += Math.sin(bAngle) * b.knockback;

          createSparks(b.x, b.y, 5, e.color);
          addFloatText(e.x + (Math.random() - 0.5) * 20, e.y - 18, `${Math.round(b.damage)}`, '#fef08a', 20);

          if (b.pierce && b.pierce > 0) {
            b.pierce--;
            // Piercing round penetrates through
          } else {
            bulletDead = true;
            break;
          }
        }
      }

      // Check for destroyed enemies
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (e.hp <= 0) {
          const proto = ENEMY_TYPES[e.typeId];
          SOUNDS.playExplosion(proto.radius > 40);
          kills++;

          const earned = proto.score;
          score += earned;
          addFloatText(e.x, e.y - 35, `+${earned}`, proto.color, 32);

          createEnemyDeathFX(e.x, e.y, proto);
          checkEnemyDrop(e.x, e.y, e);

          if (score > highScore) {
            highScore = score;
            localStorage.setItem('circle_def_high', highScore);
          }
          updateHUD();
          enemies.splice(j, 1);
        }
      }

      if (bulletDead || b.life <= 0) {
        bullets.splice(i, 1);
      }
    }

    // Spawning Enemies outside viewport
    const now = Date.now();
    if (now - lastSpawnTime > spawnInterval) {
      lastSpawnTime = now;
      spawnEnemy();
    }

    // Update Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      const edx = player.x - e.x;
      const edy = player.y - e.y;
      let moveAngle = Math.atan2(edy, edx);

      if (e.flying) {
        e.waveOffset += 0.08;
        moveAngle += Math.sin(e.waveOffset) * 0.5;
      }

      e.x += Math.cos(moveAngle) * e.speed;
      e.y += Math.sin(moveAngle) * e.speed;
      e.facingLeft = edx < 0;

      if (e.hitTimer > 0) e.hitTimer--;

      e.animTick++;
      if (e.animTick % 6 === 0) {
        const frameLimit = e.flying ? 6 : 8;
        e.animFrame = (e.animFrame + 1) % frameLimit;
      }

      // Enemy Player Collision
      if (!player.dead) {
        const pDist = Math.hypot(e.x - player.x, e.y - player.y);
        if (pDist < e.radius + player.radius) {
          hurtPlayer();
        }
      }
    }

    // Update Collectible Drops
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.bounceTick += 0.08;
      d.life--;

      // Magnetic attraction to player when close
      const pDist = Math.hypot(d.x - player.x, d.y - player.y);
      if (pDist < 160) {
        d.x += ((player.x - d.x) / pDist) * 7;
        d.y += ((player.y - d.y) / pDist) * 7;
      }

      if (pDist < player.radius + 28) {
        collectPowerup(d);
        drops.splice(i, 1);
        continue;
      }

      if (d.life <= 0) {
        drops.splice(i, 1);
      }
    }

    // Update Shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.18 + 4;
      sw.alpha -= 0.035;
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        shockwaves.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.isSmoke) {
        p.size += 1.2;
        p.rotation += 0.02;
      }
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    // Update Floating Text
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const ft = floatTexts[i];
      ft.y += ft.vy;
      ft.scale = Math.max(1.0, ft.scale - 0.02);
      ft.life--;
      ft.alpha = ft.life / 55;
      if (ft.life <= 0) {
        floatTexts.splice(i, 1);
      }
    }

    // Update Ground Decals
    for (let i = groundDecals.length - 1; i >= 0; i--) {
      const gd = groundDecals[i];
      gd.life--;
      if (gd.life < 60) {
        gd.alpha = (gd.life / 60) * 0.55;
      }
      if (gd.life <= 0) {
        groundDecals.splice(i, 1);
      }
    }
  }

  // --- RENDER PIPELINE ---
  function render() {
    CTX.save();

    // Screen Shake
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake * 4;
      const shakeY = (Math.random() - 0.5) * screenShake * 4;
      CTX.translate(shakeX, shakeY);
    }

    // Atmospheric Battlefield Ground (Warm apocalyptic rose/crimson radial gradient matching demo_ui.png)
    const bgGrad = CTX.createRadialGradient(
      V_WIDTH / 2,
      V_HEIGHT / 2,
      100,
      V_WIDTH / 2,
      V_HEIGHT / 2,
      V_HEIGHT * 0.72
    );
    bgGrad.addColorStop(0, '#865b6c');
    bgGrad.addColorStop(0.55, '#684555');
    bgGrad.addColorStop(1, '#472d3b');
    CTX.fillStyle = bgGrad;
    CTX.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // WORLD SPACE RENDERING (Translated by Camera)
    CTX.save();
    CTX.translate(-camera.x, -camera.y);

    // Ancient Defense Runes scattered across the infinite world
    const runeSpacing = 1600;
    const minRuneX = Math.floor((camera.x - 200) / runeSpacing) * runeSpacing;
    const maxRuneX = Math.ceil((camera.x + V_WIDTH + 200) / runeSpacing) * runeSpacing;
    const minRuneY = Math.floor((camera.y - 200) / runeSpacing) * runeSpacing;
    const maxRuneY = Math.ceil((camera.y + V_HEIGHT + 200) / runeSpacing) * runeSpacing;

    if (IMAGES['defense_ring']) {
      for (let rx = minRuneX; rx <= maxRuneX; rx += runeSpacing) {
        for (let ry = minRuneY; ry <= maxRuneY; ry += runeSpacing) {
          CTX.save();
          CTX.globalAlpha = 0.22 + Math.sin(Date.now() * 0.002 + rx) * 0.06;
          const rSize = 560;
          CTX.drawImage(IMAGES['defense_ring'], rx - rSize / 2, ry - rSize / 2, rSize, rSize);
          CTX.restore();
        }
      }
    }

    // Visible Chunks Bounds for Props
    const minPropChunkX = Math.floor((camera.x - 180) / PROP_CHUNK_SIZE);
    const maxPropChunkX = Math.floor((camera.x + V_WIDTH + 180) / PROP_CHUNK_SIZE);
    const minPropChunkY = Math.floor((camera.y - 180) / PROP_CHUNK_SIZE);
    const maxPropChunkY = Math.floor((camera.y + V_HEIGHT + 180) / PROP_CHUNK_SIZE);

    // Render Ground Water Puddles (drawn on ground)
    for (let cx = minPropChunkX; cx <= maxPropChunkX; cx++) {
      for (let cy = minPropChunkY; cy <= maxPropChunkY; cy++) {
        const cProps = getPropsForChunk(cx, cy);
        for (let i = 0; i < cProps.length; i++) {
          const pr = cProps[i];
          if (!pr.isPuddle) continue;
          const img = IMAGES[pr.key];
          if (!img) continue;
          CTX.save();
          CTX.translate(pr.x, pr.y);
          if (pr.flipH) CTX.scale(-1, 1);
          CTX.rotate(pr.rot);
          CTX.globalAlpha = 0.75;
          const pw = img.width * pr.scale;
          const ph = img.height * pr.scale;
          CTX.drawImage(img, -pw / 2, -ph / 2, pw, ph);
          CTX.restore();
        }
      }
    }

    // Ground Decals / Splatter
    groundDecals.forEach((gd) => {
      CTX.save();
      CTX.globalAlpha = gd.alpha;
      CTX.fillStyle = gd.color;
      CTX.beginPath();
      CTX.arc(gd.x, gd.y, gd.radius, 0, Math.PI * 2);
      CTX.fill();
      CTX.restore();
    });

    // Environment Prop Shadows (Rocks, Barricades, Clusters)
    for (let cx = minPropChunkX; cx <= maxPropChunkX; cx++) {
      for (let cy = minPropChunkY; cy <= maxPropChunkY; cy++) {
        const cProps = getPropsForChunk(cx, cy);
        for (let i = 0; i < cProps.length; i++) {
          const pr = cProps[i];
          if (pr.isPuddle || pr.shadowRadius <= 0) continue;
          drawShadow(pr.x, pr.y + pr.shadowY, pr.shadowRadius);
        }
      }
    }

    // Shadows
    enemies.forEach((e) => {
      drawShadow(e.x, e.y + e.radius * 0.85, e.radius * 1.3);
    });
    drawShadow(player.x, player.y + 26, 42);

    // Environment Props (Rocks, Metal Barricades, Clusters)
    for (let cx = minPropChunkX; cx <= maxPropChunkX; cx++) {
      for (let cy = minPropChunkY; cy <= maxPropChunkY; cy++) {
        const cProps = getPropsForChunk(cx, cy);
        for (let i = 0; i < cProps.length; i++) {
          const pr = cProps[i];
          if (pr.isPuddle) continue;
          const img = IMAGES[pr.key];
          if (!img) continue;
          CTX.save();
          CTX.translate(pr.x, pr.y);
          if (pr.flipH) CTX.scale(-1, 1);
          CTX.rotate(pr.rot);
          const pw = img.width * pr.scale;
          const ph = img.height * pr.scale;
          CTX.drawImage(img, -pw / 2, -ph / 2, pw, ph);
          CTX.restore();
        }
      }
    }

    // Speed Ghost Trails
    playerGhostTrails.forEach((tr) => {
      CTX.save();
      CTX.globalAlpha = tr.alpha * 0.4;
      CTX.filter = 'brightness(2.0) drop-shadow(0 0 10px #38bdf8)';
      drawSpriteFrame('player_walk', tr.frame, tr.x, tr.y, tr.facingLeft, 0.65);
      CTX.restore();
    });

    // Collectible Drops
    drops.forEach((d) => {
      const bob = Math.sin(d.bounceTick * 2.2) * 8;
      CTX.save();

      if (d.type === 'WEAPON') {
        const wp = WEAPONS[d.weaponId];
        const img = IMAGES[wp ? wp.key : ''];

        // Drop Shadow
        drawShadow(d.x, d.y + 22, 34);

        // Golden beacon aura
        const auraRadius = 38 + Math.sin(d.bounceTick * 3) * 5;
        const grad = CTX.createRadialGradient(d.x, d.y + bob, 4, d.x, d.y + bob, auraRadius);
        grad.addColorStop(0, 'rgba(250, 204, 21, 0.85)');
        grad.addColorStop(0.5, 'rgba(251, 146, 60, 0.4)');
        grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        CTX.fillStyle = grad;
        CTX.beginPath();
        CTX.arc(d.x, d.y + bob, auraRadius, 0, Math.PI * 2);
        CTX.fill();

        // Outer rotating halo ring
        CTX.strokeStyle = '#facc15';
        CTX.lineWidth = 2.5;
        CTX.shadowColor = '#facc15';
        CTX.shadowBlur = 14;
        CTX.beginPath();
        CTX.ellipse(d.x, d.y + bob, 34, 16, d.bounceTick * 1.5, 0, Math.PI * 2);
        CTX.stroke();

        // 3D Spinning Weapon Sprite
        if (img) {
          CTX.save();
          CTX.translate(d.x, d.y + bob);
          const spinScaleX = Math.cos(d.bounceTick * 2.2) * 0.75;
          CTX.scale(spinScaleX, 0.75);
          CTX.shadowColor = '#facc15';
          CTX.shadowBlur = 16;
          CTX.drawImage(img, -img.width / 2, -img.height / 2);
          CTX.restore();
        }

        // Floating name tag badge
        if (wp) {
          CTX.font = '800 18px Rajdhani, sans-serif';
          CTX.textAlign = 'center';
          CTX.fillStyle = '#fef08a';
          CTX.shadowColor = '#000000';
          CTX.shadowBlur = 8;
          CTX.fillText(`⭐ ${wp.name} ⭐`, d.x, d.y + bob - 36);
        }

        // Sparkles rising
        if (Math.random() < 0.15) {
          particles.push({
            x: d.x + (Math.random() - 0.5) * 36,
            y: d.y + bob + (Math.random() - 0.5) * 12,
            vx: (Math.random() - 0.5) * 1,
            vy: -1.2 - Math.random() * 1.5,
            color: '#facc15',
            size: Math.random() * 4 + 2,
            alpha: 1.0,
            decay: 0.04,
          });
        }
      } else {
        // Drop Shadow
        drawShadow(d.x, d.y + 18, 22);

        // Glowing aura
        CTX.fillStyle = d.info.color;
        CTX.shadowColor = d.info.color;
        CTX.shadowBlur = 18;
        CTX.beginPath();
        CTX.arc(d.x, d.y + bob, 26, 0, Math.PI * 2);
        CTX.fill();

        // Border ring
        CTX.strokeStyle = '#ffffff';
        CTX.lineWidth = 3;
        CTX.stroke();

        // Icon
        CTX.font = '24px Rajdhani, sans-serif';
        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        CTX.fillText(d.info.icon, d.x, d.y + bob);
      }

      CTX.restore();
    });

    // Enemies Rendering
    enemies.forEach((e) => {
      const proto = ENEMY_TYPES[e.typeId];
      let sheetKey = proto.walkKey;
      if (e.hitTimer > 0 && proto.hitKey) {
        sheetKey = proto.hitKey;
      }

      CTX.save();
      if (e.hitTimer > 0) {
        CTX.filter = 'brightness(2.2)';
      }
      drawSpriteFrame(sheetKey, e.animFrame, e.x, e.y, e.facingLeft, e.scale);
      CTX.restore();

      // Health Bar if damaged
      if (e.hp < e.maxHp) {
        const barW = 44;
        const barH = 6;
        const hpPct = Math.max(0, e.hp / e.maxHp);
        CTX.fillStyle = 'rgba(0,0,0,0.65)';
        CTX.fillRect(e.x - barW / 2, e.y - e.radius - 16, barW, barH);
        CTX.fillStyle = e.color;
        CTX.fillRect(e.x - barW / 2, e.y - e.radius - 16, barW * hpPct, barH);
      }
    });

    // Player Rendering
    if (!player.dead || player.animState === 'death') {
      CTX.save();
      if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 4) % 2 === 0) {
        CTX.globalAlpha = 0.4;
      }
      drawSpriteFrame(`player_${player.animState}`, player.animFrame, player.x, player.y, player.facingLeft, 0.65);
      CTX.restore();

      // Weapon
      if (!player.dead) {
        drawWeapon();
      }

      // Energy Shield Bubble
      if (activePowerups.SHIELD && !player.dead) {
        CTX.save();
        CTX.strokeStyle = '#818cf8';
        CTX.shadowColor = '#818cf8';
        CTX.shadowBlur = 20;
        CTX.lineWidth = 4;
        CTX.beginPath();
        CTX.arc(player.x, player.y, player.radius + 18, 0, Math.PI * 2);
        CTX.stroke();

        CTX.fillStyle = 'rgba(129, 140, 248, 0.16)';
        CTX.fill();
        CTX.restore();
      }
    }

    // Bullets (Sprite-based rendering with glow)
    bullets.forEach((b) => {
      CTX.save();
      CTX.translate(b.x, b.y);
      const bAngle = Math.atan2(b.vy, b.vx);
      CTX.rotate(bAngle);

      const spriteImg = IMAGES[b.sprite];
      if (spriteImg) {
        CTX.shadowColor = b.color;
        CTX.shadowBlur = 14;

        let bw = b.size * 3.4;
        let bh = b.size * 2.2;
        if (b.isSniper || b.sprite === 'bullet_laser') {
          bw = 64;
          bh = 18;
        } else if (b.isPlasma || b.sprite === 'bullet_plasma') {
          bw = 38;
          bh = 30;
        } else if (b.isExplosive || b.sprite === 'bullet_rocket') {
          bw = 46;
          bh = 22;
        } else if (b.sprite === 'bullet_dart_gold' || b.sprite === 'bullet_heavy_dart') {
          bw = 36;
          bh = 16;
        } else if (b.sprite === 'bullet_orb_red' || b.sprite === 'bullet_pellet_gold') {
          bw = b.size * 2.5;
          bh = b.size * 2.5;
        }
        CTX.drawImage(spriteImg, -bw / 2, -bh / 2, bw, bh);
      } else {
        CTX.fillStyle = b.color;
        CTX.shadowColor = b.color;
        CTX.shadowBlur = 12;
        CTX.beginPath();
        CTX.arc(0, 0, b.size, 0, Math.PI * 2);
        CTX.fill();
      }
      CTX.restore();
    });

    // Shockwaves (Expanding rings)
    shockwaves.forEach((sw) => {
      CTX.save();
      CTX.globalAlpha = Math.max(0, sw.alpha);
      CTX.strokeStyle = sw.color;
      CTX.shadowColor = sw.color;
      CTX.shadowBlur = 16;
      CTX.lineWidth = sw.lineWidth;
      CTX.beginPath();
      CTX.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      CTX.stroke();
      CTX.restore();
    });

    // Particles & Smoke
    particles.forEach((p) => {
      CTX.save();
      CTX.globalAlpha = Math.max(0, p.alpha);
      if (p.isSmoke && IMAGES['smoke']) {
        CTX.translate(p.x, p.y);
        CTX.rotate(p.rotation);
        CTX.drawImage(IMAGES['smoke'], -p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        CTX.fillStyle = p.color;
        CTX.shadowColor = p.color;
        CTX.shadowBlur = 6;
        CTX.beginPath();
        CTX.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        CTX.fill();
      }
      CTX.restore();
    });

    // Floating Text (World Space)
    floatTexts.forEach((ft) => {
      CTX.save();
      CTX.font = `800 ${ft.fontSize}px Rajdhani, sans-serif`;
      CTX.fillStyle = ft.color;
      CTX.globalAlpha = Math.max(0, ft.alpha);
      CTX.textAlign = 'center';
      CTX.shadowColor = '#000000';
      CTX.shadowBlur = 8;
      CTX.fillText(ft.text, ft.x, ft.y);
      CTX.restore();
    });

    // Smart Target Lock Reticle on nearest enemy (World Space)
    if (lockedEnemy && lockedEnemy.hp > 0 && (autoFireEnabled || aimControl.active || mouse.down)) {
      CTX.save();
      CTX.translate(lockedEnemy.x, lockedEnemy.y);
      CTX.rotate(lockReticleTick);

      const rSize = lockedEnemy.radius + 18;
      const cornerLen = 14;

      CTX.strokeStyle = '#4ade80';
      CTX.lineWidth = 3;
      CTX.shadowColor = '#4ade80';
      CTX.shadowBlur = 12;

      // 4 Corner Brackets
      CTX.beginPath();
      // Top-Left
      CTX.moveTo(-rSize, -rSize + cornerLen);
      CTX.lineTo(-rSize, -rSize);
      CTX.lineTo(-rSize + cornerLen, -rSize);
      // Top-Right
      CTX.moveTo(rSize - cornerLen, -rSize);
      CTX.lineTo(rSize, -rSize);
      CTX.lineTo(rSize, -rSize + cornerLen);
      // Bottom-Right
      CTX.moveTo(rSize, rSize - cornerLen);
      CTX.lineTo(rSize, rSize);
      CTX.lineTo(rSize - cornerLen, rSize);
      // Bottom-Left
      CTX.moveTo(-rSize + cornerLen, rSize);
      CTX.lineTo(-rSize, rSize);
      CTX.lineTo(-rSize, rSize - cornerLen);
      CTX.stroke();

      // Center lock diamond/dot
      CTX.fillStyle = 'rgba(74, 222, 128, 0.7)';
      CTX.beginPath();
      CTX.arc(0, 0, 4, 0, Math.PI * 2);
      CTX.fill();

      CTX.restore();
    }

    CTX.restore(); // End of World Space

    // SCREEN SPACE RENDERING (Fixed on Screen)

    // Damage Red Screen Vignette
    if (player.invincibleTimer > 0) {
      CTX.save();
      const dmgAlpha = (player.invincibleTimer / 90) * 0.45;
      const grad = CTX.createRadialGradient(
        V_WIDTH / 2,
        V_HEIGHT / 2,
        V_WIDTH * 0.25,
        V_WIDTH / 2,
        V_HEIGHT / 2,
        V_WIDTH * 0.75
      );
      grad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      grad.addColorStop(1, `rgba(239, 68, 68, ${dmgAlpha})`);
      CTX.fillStyle = grad;
      CTX.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      CTX.restore();
    }

    // Dynamic Movement Joystick (Left Thumb)
    if (joystick.active) {
      CTX.save();
      const ox = joystick.originX;
      const oy = joystick.originY;
      const maxR = joystick.maxRadius;
      const kDist = Math.min(joystick.distance, maxR);
      const kx = ox + (joystick.distance > 0 ? Math.cos(joystick.angle) * kDist : 0);
      const ky = oy + (joystick.distance > 0 ? Math.sin(joystick.angle) * kDist : 0);

      // Outer glowing base ring
      CTX.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      CTX.lineWidth = 4;
      CTX.beginPath();
      CTX.arc(ox, oy, maxR, 0, Math.PI * 2);
      CTX.stroke();

      // Inner faint grid / guide circle
      CTX.fillStyle = 'rgba(15, 23, 42, 0.45)';
      CTX.beginPath();
      CTX.arc(ox, oy, maxR, 0, Math.PI * 2);
      CTX.fill();

      // 4 Cardinal Direction notches
      CTX.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      CTX.lineWidth = 3;
      [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].forEach((a) => {
        CTX.beginPath();
        CTX.moveTo(ox + Math.cos(a) * (maxR - 10), oy + Math.sin(a) * (maxR - 10));
        CTX.lineTo(ox + Math.cos(a) * (maxR + 4), oy + Math.sin(a) * (maxR + 4));
        CTX.stroke();
      });

      // Direction stick line
      if (kDist > 6) {
        CTX.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        CTX.lineWidth = 6;
        CTX.lineCap = 'round';
        CTX.beginPath();
        CTX.moveTo(ox, oy);
        CTX.lineTo(kx, ky);
        CTX.stroke();
      }

      // Moving thumb knob
      CTX.fillStyle = 'rgba(56, 189, 248, 0.88)';
      CTX.shadowColor = '#38bdf8';
      CTX.shadowBlur = 18;
      CTX.beginPath();
      CTX.arc(kx, ky, 34, 0, Math.PI * 2);
      CTX.fill();

      // Inner knob core
      CTX.fillStyle = '#ffffff';
      CTX.beginPath();
      CTX.arc(kx, ky, 12, 0, Math.PI * 2);
      CTX.fill();

      CTX.restore();
    } else if (gameState === 'PLAYING') {
      // Idle joystick hint watermark in bottom-left
      CTX.save();
      const hintX = 220;
      const hintY = V_HEIGHT - 360;
      CTX.globalAlpha = 0.2;
      CTX.strokeStyle = '#38bdf8';
      CTX.lineWidth = 3;
      CTX.beginPath();
      CTX.arc(hintX, hintY, 70, 0, Math.PI * 2);
      CTX.stroke();

      CTX.fillStyle = '#38bdf8';
      CTX.beginPath();
      CTX.arc(hintX, hintY, 24, 0, Math.PI * 2);
      CTX.fill();

      CTX.font = '700 22px Rajdhani, sans-serif';
      CTX.textAlign = 'center';
      CTX.fillText('MOVE', hintX, hintY + 110);
      CTX.restore();
    }

    // Manual Aim Laser Beam (when dragging right stick)
    if (aimControl.isDragging) {
      CTX.save();
      const screenPx = player.x - camera.x;
      const screenPy = player.y - camera.y;
      const laserLen = 800;
      const lx = screenPx + Math.cos(aimControl.angle) * laserLen;
      const ly = screenPy + Math.sin(aimControl.angle) * laserLen;

      CTX.strokeStyle = 'rgba(239, 68, 68, 0.75)';
      CTX.lineWidth = 3;
      CTX.setLineDash([14, 8]);
      CTX.shadowColor = '#ef4444';
      CTX.shadowBlur = 12;
      CTX.beginPath();
      CTX.moveTo(screenPx, screenPy);
      CTX.lineTo(lx, ly);
      CTX.stroke();

      CTX.restore();
    }

    // Tactical Crosshair (follows aim / mouse)
    if (IMAGES['crosshair'] && (mouse.down || aimControl.isDragging || mouse.isDesktopDown)) {
      CTX.save();
      CTX.drawImage(IMAGES['crosshair'], mouse.x - 28, mouse.y - 28, 56, 56);
      CTX.restore();
    }

    // Wave Banner Notification
    if (waveBanner.timer > 0) {
      CTX.save();
      const alpha = Math.min(1, waveBanner.timer / 30);
      CTX.globalAlpha = alpha;
      CTX.font = '800 48px Rajdhani, sans-serif';
      CTX.fillStyle = '#ffedd5';
      CTX.shadowColor = '#f59e0b';
      CTX.shadowBlur = 22;
      CTX.textAlign = 'center';
      CTX.fillText(waveBanner.text, V_WIDTH / 2, V_HEIGHT * 0.26);
      CTX.restore();
    }

    CTX.restore();
  }

  // --- SPRITE HELPERS ---
  function drawShadow(x, y, radius) {
    if (IMAGES['shadow']) {
      CTX.save();
      CTX.globalAlpha = 0.45;
      CTX.drawImage(IMAGES['shadow'], x - radius, y - radius * 0.4, radius * 2, radius * 0.8);
      CTX.restore();
    }
  }

  function drawSpriteFrame(sheetKey, frameIdx, x, y, flipH = false, scale = 0.65) {
    const img = IMAGES[sheetKey];
    if (!img) return;

    const frameSize = MANIFEST.frameSizes[sheetKey] || { width: 128, height: 145 };
    const fw = frameSize.width;
    const fh = frameSize.height;
    const sx = frameIdx * fw;
    const dw = fw * scale;
    const dh = fh * scale;

    CTX.save();
    CTX.translate(x, y);
    if (flipH) CTX.scale(-1, 1);
    CTX.drawImage(img, sx, 0, fw, fh, -dw / 2, -dh / 2, dw, dh);
    CTX.restore();
  }

  function drawWeapon() {
    const wp = WEAPONS[currentWeaponId];
    const img = IMAGES[wp.key];
    if (!img) return;

    const worldAimX = mouse.x + camera.x;
    const worldAimY = mouse.y + camera.y;
    const dx = worldAimX - player.x;
    const dy = worldAimY - player.y;
    const angle = Math.atan2(dy, dx);
    const flipV = dx < 0;

    CTX.save();
    CTX.translate(player.x, player.y + 6);
    CTX.rotate(angle);
    if (flipV) CTX.scale(1, -1);

    const scale = 0.6;
    const dw = img.width * scale;
    const dh = img.height * scale;

    CTX.drawImage(img, 12, -dh / 2, dw, dh);

    if (player.muzzleFlash && IMAGES['muzzle_flash']) {
      CTX.save();
      CTX.drawImage(IMAGES['muzzle_flash'], 12 + dw - 10, -dh / 2 - 10, 44, 32);
      CTX.restore();
    }

    CTX.restore();
  }

  // --- UI UPDATES ---
  function updateHUD() {
    const scoreEl = document.getElementById('scoreDisplay');
    if (scoreEl) scoreEl.innerText = score.toLocaleString();

    const waveEl = document.getElementById('waveDisplay');
    if (waveEl) waveEl.innerText = `W${wave}`;

    // 3 Compact Hearts
    const heartsContainer = document.getElementById('heartsContainer');
    if (heartsContainer) {
      heartsContainer.innerHTML = '';
      for (let i = 1; i <= 3; i++) {
        const heart = document.createElement('span');
        heart.className = `heart-icon ${i <= player.lives ? 'alive' : 'lost'}`;
        heart.innerHTML = '❤️';
        heartsContainer.appendChild(heart);
      }
    }

    // Glowing Health Bar Fill (matching demo_ui.png)
    const healthBarFill = document.getElementById('healthBarFill');
    if (healthBarFill) {
      const pct = Math.max(0, Math.min(100, (player.lives / 3) * 100));
      healthBarFill.style.width = `${pct}%`;
    }
  }

  function renderWeaponsDock() {
    const container = document.querySelector('.weapons-container');
    if (!container) return;
    container.innerHTML = '';

    unlockedWeapons.forEach((id) => {
      const wp = WEAPONS[id];
      if (!wp) return;
      const btn = document.createElement('div');
      btn.id = `wpBtn${id}`;
      btn.className = `weapon-btn${id === currentWeaponId ? ' active' : ''}`;
      btn.title = `${wp.name} [${id}]`;
      btn.innerHTML = `
        <span class="weapon-key">[${id}]</span>
        <img src="assets/${wp.key}.png" alt="${wp.shortName || wp.name}">
        <span class="weapon-name">${wp.shortName || wp.name}</span>
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectWeapon(id);
      });
      btn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        selectWeapon(id);
      }, { passive: true });
      btn.addEventListener('touchend', (e) => {
        e.stopPropagation();
      }, { passive: true });
      container.appendChild(btn);
    });

    // Slider arrows visibility (>3 weapons)
    const slideLeftBtn = document.getElementById('wpSlideLeft');
    const slideRightBtn = document.getElementById('wpSlideRight');
    if (slideLeftBtn && slideRightBtn) {
      if (unlockedWeapons.length > 3) {
        slideLeftBtn.classList.remove('hidden');
        slideRightBtn.classList.remove('hidden');
      } else {
        slideLeftBtn.classList.add('hidden');
        slideRightBtn.classList.add('hidden');
      }
    }

    const quickName = document.getElementById('quickSwitchName');
    if (quickName && WEAPONS[currentWeaponId]) {
      quickName.innerText = WEAPONS[currentWeaponId].shortName || WEAPONS[currentWeaponId].name;
    }
  }

  function updateWeaponUI() {
    unlockedWeapons.forEach((id) => {
      const btn = document.getElementById(`wpBtn${id}`);
      if (btn) {
        if (id === currentWeaponId) {
          btn.classList.add('active');
          btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          btn.classList.remove('active');
        }
      }
    });

    const quickName = document.getElementById('quickSwitchName');
    if (quickName && WEAPONS[currentWeaponId]) {
      quickName.innerText = WEAPONS[currentWeaponId].shortName || WEAPONS[currentWeaponId].name;
    }
  }

  // --- MAIN GAME LOOP ---
  let lastTime = performance.now();
  function mainLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    update(dt);
    render();

    requestAnimationFrame(mainLoop);
  }

  // --- EXPOSURES & INITIALIZATION ---
  window.selectWeapon = selectWeapon;
  window.cycleWeapon = cycleWeapon;
  window.toggleAutoFire = toggleAutoFire;
  window.togglePause = togglePause;

  document.getElementById('startBtn').addEventListener('click', () => {
    SOUNDS.init();
    document.getElementById('startOverlay').classList.add('hidden');
    resetGame();
  });

  document.getElementById('restartBtn').addEventListener('click', () => {
    document.getElementById('gameOverOverlay').classList.add('hidden');
    resetGame();
  });

  document.getElementById('resumeBtn').addEventListener('click', () => {
    togglePause();
  });

  document.getElementById('pauseRestartBtn').addEventListener('click', () => {
    document.getElementById('pauseOverlay').classList.add('hidden');
    resetGame();
  });

  // Quit buttons
  const closeBtn = document.getElementById('closeBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        document.getElementById('quitOverlay').classList.remove('hidden');
      }
    });
  }

  const cancelQuitBtn = document.getElementById('cancelQuitBtn');
  if (cancelQuitBtn) {
    cancelQuitBtn.addEventListener('click', () => {
      document.getElementById('quitOverlay').classList.add('hidden');
      gameState = 'PLAYING';
    });
  }

  const confirmQuitBtn = document.getElementById('confirmQuitBtn');
  if (confirmQuitBtn) {
    confirmQuitBtn.addEventListener('click', () => {
      document.getElementById('quitOverlay').classList.add('hidden');
      gameState = 'START';
      document.getElementById('startOverlay').classList.remove('hidden');
    });
  }

  const pauseQuitBtn = document.getElementById('pauseQuitBtn');
  if (pauseQuitBtn) {
    pauseQuitBtn.addEventListener('click', () => {
      document.getElementById('pauseOverlay').classList.add('hidden');
      gameState = 'START';
      document.getElementById('startOverlay').classList.remove('hidden');
    });
  }

  // Pause Button (Top-Left Bar)
  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePause();
    });
  }

  document.getElementById('muteBtn').addEventListener('click', () => {
    SOUNDS.muted = !SOUNDS.muted;
    document.getElementById('muteBtn').innerText = SOUNDS.muted ? '🔇' : '🔊';
  });

  // Quick Weapon Switch button
  const quickSwitchBtn = document.getElementById('quickSwitchBtn');
  if (quickSwitchBtn) {
    quickSwitchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cycleWeapon();
    });
  }

  // Auto-Fire toggle button
  const autoFireBtn = document.getElementById('autoFireBtn');
  if (autoFireBtn) {
    autoFireBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAutoFire();
    });
  }

  // Fire Action Button (Mobile Right Thumb)
  const fireBtn = document.getElementById('fireBtn');
  if (fireBtn) {
    const startFire = (e) => {
      e.preventDefault();
      e.stopPropagation();
      SOUNDS.init();
      fireBtn.classList.add('pressed');
      aimControl.active = true;
      if (e.changedTouches && e.changedTouches.length > 0) {
        aimControl.touchId = e.changedTouches[0].identifier;
      }
      mouse.down = true;
    };

    const stopFire = (e) => {
      e.preventDefault();
      e.stopPropagation();
      fireBtn.classList.remove('pressed');
      aimControl.active = false;
      aimControl.isDragging = false;
      aimControl.touchId = null;
      if (!mouse.isDesktopDown && !autoFireEnabled) {
        mouse.down = false;
      }
    };

    fireBtn.addEventListener('touchstart', startFire, { passive: false });
    fireBtn.addEventListener('touchend', stopFire, { passive: false });
    fireBtn.addEventListener('touchcancel', stopFire, { passive: false });
    fireBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      SOUNDS.init();
      fireBtn.classList.add('pressed');
      aimControl.active = true;
      mouse.down = true;
    });
    window.addEventListener('mouseup', () => {
      if (fireBtn.classList.contains('pressed')) {
        fireBtn.classList.remove('pressed');
        aimControl.active = false;
        if (!mouse.isDesktopDown && !autoFireEnabled) {
          mouse.down = false;
        }
      }
    });
  }

  // Weapon Collection Slider Navigation Arrows
  const slideLeftBtn = document.getElementById('wpSlideLeft');
  const slideRightBtn = document.getElementById('wpSlideRight');
  const weaponsContainer = document.getElementById('weaponsContainer');
  if (slideLeftBtn && weaponsContainer) {
    slideLeftBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      weaponsContainer.scrollBy({ left: -140, behavior: 'smooth' });
    });
    slideLeftBtn.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      weaponsContainer.scrollBy({ left: -140, behavior: 'smooth' });
    }, { passive: true });
  }
  if (slideRightBtn && weaponsContainer) {
    slideRightBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      weaponsContainer.scrollBy({ left: 140, behavior: 'smooth' });
    });
    slideRightBtn.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      weaponsContainer.scrollBy({ left: 140, behavior: 'smooth' });
    }, { passive: true });
  }

  // Stop touch propagation on HUD buttons
  document.querySelectorAll('.hud-btn, .weapon-btn, .action-btn, .hud-action-pill, .fire-action-btn, .slider-arrow').forEach((el) => {
    el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    el.addEventListener('touchend', (e) => e.stopPropagation(), { passive: true });
  });

  loadAssets().then(() => {
    updateHUD();
    renderWeaponsDock();
    updateWeaponUI();
    updateAutoFireUI();
    document.getElementById('startOverlay').classList.remove('hidden');
    requestAnimationFrame(mainLoop);
  });
})();
