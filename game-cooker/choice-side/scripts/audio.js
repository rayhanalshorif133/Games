/**
 * Audio Engine for Choice Side
 * Handles sound effects and looping background music with Web Audio API & HTML5 Audio
 */

'use strict';

class SoundController {
    constructor() {
        this.muted = localStorage.getItem('choice_side_muted') === 'true';
        this.ctx = null;
        this.sounds = {};
        this.bgm = null;
        this.initialized = false;
        
        this.soundFiles = {
            jump: 'media/jump.wav',
            slice: 'media/slice.wav',
            hit: 'media/hit.wav',
            heart: 'media/heart.wav',
            gameover: 'media/gameover.wav',
            click: 'media/click.wav'
        };
    }

    init() {
        if (this.initialized) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }

        // Preload sound effects using HTML5 Audio
        for (const [key, path] of Object.entries(this.soundFiles)) {
            const audio = new Audio();
            audio.src = path;
            audio.preload = 'auto';
            this.sounds[key] = audio;
        }

        // Preload BGM
        this.bgm = new Audio();
        this.bgm.src = 'media/bgm.wav';
        this.bgm.loop = true;
        this.bgm.volume = 0.55;
        this.bgm.preload = 'auto';

        this.initialized = true;
    }

    unlock() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (!this.muted && this.bgm && this.bgm.paused) {
            this.playBGM();
        }
    }

    play(name) {
        if (this.muted) return;
        this.unlock();

        const s = this.sounds[name];
        if (s) {
            try {
                // Clone or reset to allow fast overlapping triggers
                const clone = s.cloneNode();
                clone.volume = name === 'slice' ? 0.9 : (name === 'hit' ? 1.0 : 0.7);
                clone.play().catch(() => {});
            } catch (e) {}
        }
    }

    playBGM() {
        if (this.muted || !this.bgm) return;
        try {
            this.bgm.currentTime = 0;
            this.bgm.play().catch(() => {});
        } catch (e) {}
    }

    stopBGM() {
        if (this.bgm) {
            try {
                this.bgm.pause();
                this.bgm.currentTime = 0;
            } catch (e) {}
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('choice_side_muted', this.muted);

        if (this.muted) {
            if (this.bgm) this.bgm.pause();
        } else {
            this.playBGM();
        }

        return this.muted;
    }
}

window.SoundController = SoundController;

