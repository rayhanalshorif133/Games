/**
 * audio.js - Web Audio API Sound Engine
 * Zero external audio dependencies; pure procedural audio synthesizer
 * with warm, cheerful arcade chimes, bounces, and fanfares.
 */

const SoundEngine = (function () {
    let ctx = null;
    let isMuted = false;
    let bgmInterval = null;

    function getContext() {
        if (!ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                ctx = new AudioContext();
            }
        }
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    }

    // Initialize on first user touch/interaction
    function init() {
        getContext();
    }

    function toggleMute() {
        isMuted = !isMuted;
        return isMuted;
    }

    function setMuted(muted) {
        isMuted = !!muted;
    }

    function isAudioMuted() {
        return isMuted;
    }

    /**
     * Play coin spawn / drop sound
     */
    function playCoinDrop() {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;

        const now = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    /**
     * Play bouncy collision clink (pitch depends on impact speed)
     */
    function playBounce(intensity = 1) {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;

        const now = c.currentTime;
        const baseFreq = 520 + Math.min(intensity * 120, 600) + (Math.random() * 60 - 30);

        const osc = c.createOscillator();
        const osc2 = c.createOscillator();
        const gain = c.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.08);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseFreq * 1.5, now);

        const vol = Math.min(0.28, 0.1 + intensity * 0.1);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(c.destination);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.1);
        osc2.stop(now + 0.1);
    }

    /**
     * Play metallic bumper bounce
     */
    function playMetallicBumper() {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;

        const now = c.currentTime;
        const osc = c.createOscillator();
        const osc2 = c.createOscillator();
        const gain = c.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(740, now);
        osc.frequency.exponentialRampToValueAtTime(1480, now + 0.06);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1100, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(c.destination);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.14);
        osc2.stop(now + 0.14);
    }

    /**
     * Piggy Bank coin reception chime (cheerful multi-tone ding!)
     */
    function playPiggyCollect() {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;

        const now = c.currentTime;
        const notes = [1046.5, 1318.5, 1567.98]; // C6, E6, G6

        notes.forEach((freq, idx) => {
            const osc = c.createOscillator();
            const gain = c.createGain();
            const noteStart = now + idx * 0.04;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.2, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.28);

            osc.connect(gain);
            gain.connect(c.destination);

            osc.start(noteStart);
            osc.stop(noteStart + 0.28);
        });
    }

    /**
     * Slider or Rotator drag ratchet / tick
     */
    function playRatchet() {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;

        const now = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + Math.random() * 80, now);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start(now);
        osc.stop(now + 0.03);
    }

    /**
     * Victory fanfare
     */
    function playLevelWin() {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;

        const now = c.currentTime;
        // Fanfare notes: C5, E5, G5, C6
        const fanfare = [
            { f: 523.25, d: 0.12, t: 0.0 },
            { f: 659.25, d: 0.12, t: 0.12 },
            { f: 783.99, d: 0.14, t: 0.24 },
            { f: 1046.50, d: 0.45, t: 0.38 }
        ];

        fanfare.forEach(item => {
            const osc = c.createOscillator();
            const gain = c.createGain();
            const startTime = now + item.t;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(item.f, startTime);

            gain.gain.setValueAtTime(0.22, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + item.d);

            osc.connect(gain);
            gain.connect(c.destination);

            osc.start(startTime);
            osc.stop(startTime + item.d);
        });
    }

    /**
     * Game Over gentle descending chime
     */
    function playGameOver() {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;

        const now = c.currentTime;
        const notes = [
            { f: 587.33, t: 0.0, d: 0.2 },
            { f: 523.25, t: 0.2, d: 0.2 },
            { f: 440.00, t: 0.4, d: 0.2 },
            { f: 349.23, t: 0.6, d: 0.4 }
        ];

        notes.forEach(item => {
            const osc = c.createOscillator();
            const gain = c.createGain();
            const startTime = now + item.t;

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(item.f, startTime);

            gain.gain.setValueAtTime(0.15, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + item.d);

            osc.connect(gain);
            gain.connect(c.destination);

            osc.start(startTime);
            osc.stop(startTime + item.d);
        });
    }

    /**
     * Musical Plinko Peg Chime (Pentatonic scale: C5, D5, E5, G5, A5, C6)
     */
    function playPegChime(noteIndex = 0) {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;

        const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
        const freq = scale[noteIndex % scale.length];
        const now = c.currentTime;

        const osc = c.createOscillator();
        const gain = c.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start(now);
        osc.stop(now + 0.18);
    }

    /**
     * Multiplier gate pass sound (Futuristic upward chirp)
     */
    function playMultiplier() {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;

        const now = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.15);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start(now);
        osc.stop(now + 0.22);
    }

    /**
     * Star Coin Sparkle Chime (High brilliant arpeggio)
     */
    function playStarChime() {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;

        const now = c.currentTime;
        const notes = [1318.5, 1567.98, 2093.0]; // E6, G6, C7
        notes.forEach((freq, idx) => {
            const osc = c.createOscillator();
            const gain = c.createGain();
            const t = now + idx * 0.05;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

            osc.connect(gain);
            gain.connect(c.destination);

            osc.start(t);
            osc.stop(t + 0.25);
        });
    }

    /**
     * Power-Up Activation Chord
     */
    function playPowerUp() {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;

        const now = c.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = c.createOscillator();
            const gain = c.createGain();
            const t = now + idx * 0.06;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.22, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            osc.connect(gain);
            gain.connect(c.destination);

            osc.start(t);
            osc.stop(t + 0.35);
        });
    }

    /**
     * Bomb Explosion (Heavy impact noise & low boom)
     */
    function playBombExplosion() {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;

        const now = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    /**
     * Piggy Hurt Squeak
     */
    function playHurt() {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;

        const now = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.linearRampToValueAtTime(220, now + 0.18);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    /**
     * Button click sound
     */
    function playButtonClick() {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;

        const now = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    return {
        init,
        toggleMute,
        setMuted,
        isAudioMuted,
        playCoinDrop,
        playBounce,
        playMetallicBumper,
        playPiggyCollect,
        playRatchet,
        playLevelWin,
        playGameOver,
        playButtonClick,
        playPegChime,
        playMultiplier,
        playStarChime,
        playPowerUp,
        playBombExplosion,
        playHurt
    };
})();

if (typeof window !== 'undefined') {
    window.SoundEngine = SoundEngine;
}
