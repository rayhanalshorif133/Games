/**
 * Construct 3 HTML5 Game Runtime Engine
 * Game: Square Shot (Ketchapp Style)
 * Layout Size: 1080 x 1920 (Portrait)
 */

"use strict";

(function (window) {
    // Sound & Web Audio System
    class AudioManager {
        constructor() {
            this.muted = localStorage.getItem("square_shot_muted") === "true";
            this.audioCtx = null;
            this.audioElements = {};
            this.initWebAudio();
            this.loadWavFiles();
        }

        initWebAudio() {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }

        ensureAudioContext() {
            if (this.audioCtx && this.audioCtx.state === "suspended") {
                this.audioCtx.resume();
            }
        }

        loadWavFiles() {
            const sounds = ["shoot", "wallhit", "collect", "gameover", "click"];
            sounds.forEach(name => {
                const audio = new Audio(`media/${name}.wav`);
                audio.preload = "auto";
                this.audioElements[name] = audio;
            });
        }

        toggleMute() {
            this.muted = !this.muted;
            localStorage.setItem("square_shot_muted", this.muted ? "true" : "false");
            return !this.muted;
        }

        play(name) {
            if (this.muted) return;
            this.ensureAudioContext();

            const audio = this.audioElements[name];
            if (audio) {
                try {
                    const clone = audio.cloneNode();
                    clone.volume = 0.8;
                    const p = clone.play();
                    if (p && p.catch) p.catch(() => this.synthesize(name));
                    return;
                } catch (e) {
                    this.synthesize(name);
                    return;
                }
            }
            this.synthesize(name);
        }

        synthesize(name) {
            if (!this.audioCtx || this.muted) return;
            const ctx = this.audioCtx;
            const now = ctx.currentTime;

            if (name === "shoot") {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(750, now);
                osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (name === "wallhit") {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(260, now);
                osc.frequency.exponentialRampToValueAtTime(60, now + 0.09);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.09);
            } else if (name === "collect") {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.setValueAtTime(1320, now + 0.08);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (name === "gameover") {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.45);
            } else if (name === "click") {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(1200, now);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.04);
            }
        }
    }

    // Particle System
    class ParticleSystem {
        constructor() {
            this.particles = [];
            this.trails = [];
        }

        createExplosion(x, y, count = 28) {
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
                const speed = 250 + Math.random() * 550;
                const size = 6 + Math.random() * 10;
                this.particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size,
                    alpha: 1.0,
                    decay: 0.8 + Math.random() * 0.6
                });
            }
        }

        createGemCollectSparks(x, y, count = 14) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 160 + Math.random() * 320;
                this.particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 4 + Math.random() * 7,
                    alpha: 1.0,
                    decay: 2.0 + Math.random() * 1.0
                });
            }
        }

        createWallImpact(x, y, wallNormalAngle) {
            for (let i = 0; i < 8; i++) {
                const spread = (Math.random() - 0.5) * Math.PI * 0.8;
                const angle = wallNormalAngle + spread;
                const speed = 100 + Math.random() * 220;
                this.particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 5,
                    alpha: 0.8,
                    decay: 2.5
                });
            }
        }

        addTrail(x, y) {
            this.trails.push({
                x,
                y,
                size: 10,
                alpha: 0.7
            });
        }

        update(dt) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= Math.pow(0.92, dt * 60);
                p.vy *= Math.pow(0.92, dt * 60);
                p.alpha -= p.decay * dt;
                if (p.alpha <= 0) {
                    this.particles.splice(i, 1);
                }
            }

            for (let i = this.trails.length - 1; i >= 0; i--) {
                const t = this.trails[i];
                t.alpha -= 3.4 * dt;
                t.size *= Math.pow(0.93, dt * 60);
                if (t.alpha <= 0 || t.size <= 0.5) {
                    this.trails.splice(i, 1);
                }
            }
        }

        draw(ctx) {
            ctx.save();
            for (const t of this.trails) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, t.alpha)})`;
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
                ctx.fill();
            }

            for (const p of this.particles) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, p.alpha)})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        clear() {
            this.particles = [];
            this.trails = [];
        }
    }

    // Main Construct 3 Runtime Game Engine
    class C3Runtime {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext("2d");

            // Dimensions: Layout Size 1080 x 1920
            this.layoutWidth = 1080;
            this.layoutHeight = 1920;

            // Audio & Particles
            this.audio = new AudioManager();
            this.particles = new ParticleSystem();

            // Images Cache
            this.images = {};
            this.loadImages();

            // Arena Geometry (Scale 1.5 from 720x1280 demo video)
            this.boxSize = 900;
            this.wallThickness = 38;
            this.boxX = (this.layoutWidth - this.boxSize) / 2; // 90
            this.boxY = 510; // Arena top position

            // Inner bounds
            this.innerMinX = this.boxX + this.wallThickness; // 128
            this.innerMaxX = this.boxX + this.boxSize - this.wallThickness; // 952
            this.innerMinY = this.boxY + this.wallThickness; // 548
            this.innerMaxY = this.boxY + this.boxSize - this.wallThickness; // 1372

            // Ball and Obstacle size
            this.ballRadius = 28;

            // Perimeter path coordinates for obstacles & player resting
            this.pathMinX = this.innerMinX + this.ballRadius; // 156
            this.pathMaxX = this.innerMaxX - this.ballRadius; // 924
            this.pathMinY = this.innerMinY + this.ballRadius; // 576
            this.pathMaxY = this.innerMaxY - this.ballRadius; // 1344

            this.perimeterLength = 2 * ((this.pathMaxX - this.pathMinX) + (this.pathMaxY - this.pathMinY)); // 3072px

            // Color Themes (matching demo.mp4 palette)
            this.themes = [
                { r: 46, g: 204, b: 113, hex: "#2ECC71" }, // Vibrant Green (0-9)
                { r: 231, g: 76, b: 60, hex: "#E74C3C" },   // Coral Red (10-14)
                { r: 59, g: 175, b: 214, hex: "#3BAFD6" },  // Vibrant Sky Blue / Cyan (15-19)
                { r: 155, g: 89, b: 182, hex: "#9B59B6" }, // Purple (20-24)
                { r: 230, g: 126, b: 34, hex: "#E67E22" }, // Orange (25-29)
                { r: 26, g: 188, b: 156, hex: "#1ABC9C" }  // Teal (30+)
            ];
            this.currentBg = { r: 46, g: 204, b: 113 };
            this.targetBg = { r: 46, g: 204, b: 113 };

            // Game State Machine: "START", "PLAYING", "GAMEOVER"
            this.state = "START";
            this.score = 0;
            this.bestScore = parseInt(localStorage.getItem("square_shot_best") || "0", 10);
            this.isNewBest = false;
            this.scorePop = 1.0;

            // Screen Shake
            this.shakeTimer = 0;
            this.shakeIntensity = 0;

            // Player State
            this.player = {
                x: (this.pathMinX + this.pathMaxX) / 2,
                y: this.pathMinY,
                vx: 0,
                vy: 0,
                isMoving: false,
                currentWall: "TOP", // "TOP", "BOTTOM", "LEFT", "RIGHT"
                aimAngle: Math.PI / 2,
                aimTimer: 0,
                aimSweepSpeed: 3.4,
                aimMaxSpread: 1.02 // ~58 degrees
            };

            // Aiming Arrow
            this.arrowLen = 52;
            this.arrowBase = 26;

            // Collectible Target (Diamond)
            this.target = {
                x: 540,
                y: 960,
                size: 42,
                pulse: 0
            };

            // Obstacles
            this.obstacles = [];
            this.baseObstacleSpeed = 440; // px/sec

            // Challenges
            this.challengesCompleted = parseInt(localStorage.getItem("square_shot_challenges") || "1", 10);
            this.totalChallenges = 3;

            // Buttons Hitboxes (for Game Over & UI matching demo.mp4)
            this.playBtnRect = { x: 100, y: 1170, w: 880, h: 180 };
            this.bottomBarButtons = [
                { id: "music", name: "MUSIC", x: 135, y: 1710, r: 65 },
                { id: "rate", name: "RATE", x: 338, y: 1710, r: 65 },
                { id: "share", name: "SHARE", x: 540, y: 1710, r: 65 },
                { id: "scores", name: "SCORES", x: 742, y: 1710, r: 65 },
                { id: "noads", name: "REMOVE ADS", x: 945, y: 1710, r: 65 }
            ];

            // Trail Timer
            this.trailTimer = 0;

            // Event Listeners
            this.bindEvents();

            // Initialize Game Elements
            this.resetGame(false);

            // Handle URL params for test/preview
            this.checkUrlParams();

            // Start Game Loop
            this.lastTime = performance.now();
            requestAnimationFrame(this.loop.bind(this));
        }

        checkUrlParams() {
            try {
                const params = new URLSearchParams(window.location.search);
                if (params.get("state") === "gameover") {
                    const testScore = parseInt(params.get("score") || "18", 10);
                    this.score = testScore;
                    this.bestScore = Math.max(testScore, this.bestScore || 18);
                    this.isNewBest = (this.score >= this.bestScore);
                    this.setThemeByScore(this.score);
                    this.currentBg = { ...this.targetBg };
                    this.state = "GAMEOVER";
                }
            } catch (e) {}
        }

        loadImages() {
            const list = [
                "player", "arrow", "obstacle", "target", "particle",
                "play_btn", "icon_music", "icon_music_off",
                "icon_rate", "icon_share", "icon_scores", "icon_noads"
            ];
            list.forEach(name => {
                const img = new Image();
                img.src = `images/${name}.png`;
                this.images[name] = img;
            });
        }

        bindEvents() {
            this.canvas.addEventListener("pointerdown", this.onPointerDown.bind(this));

            window.addEventListener("keydown", (e) => {
                if (e.code === "Space" || e.code === "Enter") {
                    e.preventDefault();
                    this.handleAction();
                }
            });
        }

        getLogicalCoordinates(e) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.layoutWidth / rect.width;
            const scaleY = this.layoutHeight / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        }

        onPointerDown(e) {
            e.preventDefault();
            this.audio.ensureAudioContext();
            const pos = this.getLogicalCoordinates(e);

            if (this.state === "START") {
                this.startGame();
                this.shoot();
            } else if (this.state === "PLAYING") {
                this.shoot();
            } else if (this.state === "GAMEOVER") {
                // Check Play Button
                if (pos.x >= this.playBtnRect.x && pos.x <= this.playBtnRect.x + this.playBtnRect.w &&
                    pos.y >= this.playBtnRect.y && pos.y <= this.playBtnRect.y + this.playBtnRect.h) {
                    this.audio.play("click");
                    this.resetGame(true);
                    return;
                }

                // Check Bottom Bar Icons
                for (const btn of this.bottomBarButtons) {
                    const dist = Math.hypot(pos.x - btn.x, pos.y - btn.y);
                    if (dist <= btn.r) {
                        this.handleBottomButton(btn.id);
                        return;
                    }
                }
            }
        }

        handleAction() {
            if (this.state === "START") {
                this.startGame();
                this.shoot();
            } else if (this.state === "PLAYING") {
                this.shoot();
            } else if (this.state === "GAMEOVER") {
                this.resetGame(true);
            }
        }

        handleBottomButton(id) {
            this.audio.play("click");
            if (id === "music") {
                const unmuted = this.audio.toggleMute();
                this.showToast(unmuted ? "Music & SFX Enabled" : "Music & SFX Muted");
            } else if (id === "rate") {
                this.showModal("Rate Square Shot", "Enjoying the game? Please rate us 5 stars on the app store!", "Rate 5 Stars");
            } else if (id === "share") {
                if (navigator.share) {
                    navigator.share({
                        title: "Square Shot",
                        text: `I just scored ${this.score} points in Square Shot! Can you beat my high score of ${this.bestScore}?`,
                        url: window.location.href
                    }).catch(() => {});
                } else {
                    navigator.clipboard.writeText(`I just scored ${this.score} in Square Shot! Beat my best: ${this.bestScore}!`);
                    this.showToast("Score copied to clipboard!");
                }
            } else if (id === "scores") {
                this.showModal("Leaderboard", `Local Rank #1\nYour Best Score: ${this.bestScore} Points\nChallenges: ${this.challengesCompleted}/${this.totalChallenges}`, "Awesome");
            } else if (id === "noads") {
                this.showToast("Ads Removed! VIP Clean Mode Active");
            }
        }

        showToast(msg) {
            const toast = document.getElementById("toast");
            if (!toast) return;
            toast.textContent = msg;
            toast.classList.add("show");
            clearTimeout(this.toastTimer);
            this.toastTimer = setTimeout(() => {
                toast.classList.remove("show");
            }, 2200);
        }

        showModal(title, text, btnText) {
            const backdrop = document.getElementById("modalBackdrop");
            const modalTitle = document.getElementById("modalTitle");
            const modalText = document.getElementById("modalText");
            const modalBtn = document.getElementById("modalBtn");
            if (!backdrop) return;
            modalTitle.textContent = title;
            modalText.innerText = text;
            modalBtn.textContent = btnText || "Close";
            backdrop.style.display = "flex";
            setTimeout(() => {
                const m = backdrop.querySelector(".c3-modal");
                if (m) m.classList.add("active");
            }, 10);
        }

        closeModal() {
            const backdrop = document.getElementById("modalBackdrop");
            if (!backdrop) return;
            const m = backdrop.querySelector(".c3-modal");
            if (m) m.classList.remove("active");
            setTimeout(() => {
                backdrop.style.display = "none";
            }, 180);
        }

        startGame() {
            this.state = "PLAYING";
        }

        resetGame(autoPlay = false) {
            this.score = 0;
            this.isNewBest = false;
            this.particles.clear();

            this.player.x = (this.pathMinX + this.pathMaxX) / 2;
            this.player.y = this.pathMinY;
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.isMoving = false;
            this.player.currentWall = "TOP";
            this.player.aimTimer = 0;

            this.setThemeByScore(0);
            this.currentBg = { ...this.targetBg };

            this.spawnTarget();
            this.setupObstacles();

            if (autoPlay) {
                this.state = "PLAYING";
            } else {
                this.state = "START";
            }
        }

        setupObstacles() {
            this.obstacles = [];
            const count = this.score >= 6 ? 2 : 1;
            for (let i = 0; i < count; i++) {
                const distOffset = i * (this.perimeterLength / count);
                this.obstacles.push({
                    dist: distOffset,
                    x: 0,
                    y: 0
                });
            }
            this.updateObstaclePositions();
        }

        getPerimeterPoint(dist) {
            let d = ((dist % this.perimeterLength) + this.perimeterLength) % this.perimeterLength;
            const w = this.pathMaxX - this.pathMinX; // 768
            const h = this.pathMaxY - this.pathMinY; // 768

            // Top Wall (Left to Right)
            if (d < w) {
                return { x: this.pathMinX + d, y: this.pathMinY };
            }
            d -= w;
            // Right Wall (Top to Bottom)
            if (d < h) {
                return { x: this.pathMaxX, y: this.pathMinY + d };
            }
            d -= h;
            // Bottom Wall (Right to Left)
            if (d < w) {
                return { x: this.pathMaxX - d, y: this.pathMaxY };
            }
            d -= w;
            // Left Wall (Bottom to Top)
            return { x: this.pathMinX, y: this.pathMaxY - d };
        }

        updateObstaclePositions() {
            for (const obs of this.obstacles) {
                const pos = this.getPerimeterPoint(obs.dist);
                obs.x = pos.x;
                obs.y = pos.y;
            }
        }

        spawnTarget() {
            const margin = 100;
            let tx, ty, dist;
            let tries = 0;
            do {
                tx = this.innerMinX + margin + Math.random() * (this.innerMaxX - this.innerMinX - 2 * margin);
                ty = this.innerMinY + margin + Math.random() * (this.innerMaxY - this.innerMinY - 2 * margin);
                dist = Math.hypot(tx - this.player.x, ty - this.player.y);
                tries++;
            } while (dist < 220 && tries < 50);

            this.target.x = tx;
            this.target.y = ty;
        }

        setThemeByScore(score) {
            let idx = 0;
            if (score >= 30) idx = 5;
            else if (score >= 25) idx = 4;
            else if (score >= 20) idx = 3;
            else if (score >= 15) idx = 2; // Sky Blue / Cyan (matching video score 15+)
            else if (score >= 10) idx = 1; // Coral Red (matching video score 10+)
            else idx = 0; // Green
            this.targetBg = this.themes[idx];
        }

        shoot() {
            if (this.player.isMoving) return;

            this.player.isMoving = true;
            const speed = 2100;
            this.player.vx = Math.cos(this.player.aimAngle) * speed;
            this.player.vy = Math.sin(this.player.aimAngle) * speed;

            this.audio.play("shoot");
        }

        triggerGameOver() {
            if (this.state === "GAMEOVER") return;

            this.state = "GAMEOVER";
            this.player.isMoving = false;

            this.particles.createExplosion(this.player.x, this.player.y, 28);

            this.shakeTimer = 0.35;
            this.shakeIntensity = 24;

            this.audio.play("gameover");

            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                this.isNewBest = true;
                localStorage.setItem("square_shot_best", this.bestScore.toString());
            } else {
                this.isNewBest = false;
            }

            if (this.score >= 10 && this.challengesCompleted < 2) {
                this.challengesCompleted = 2;
                localStorage.setItem("square_shot_challenges", "2");
            }
            if (this.score >= 20 && this.challengesCompleted < 3) {
                this.challengesCompleted = 3;
                localStorage.setItem("square_shot_challenges", "3");
            }
        }

        update(dt) {
            // Smooth background interpolation
            this.currentBg.r += (this.targetBg.r - this.currentBg.r) * dt * 2.5;
            this.currentBg.g += (this.targetBg.g - this.currentBg.g) * dt * 2.5;
            this.currentBg.b += (this.targetBg.b - this.currentBg.b) * dt * 2.5;

            // Score pop
            if (this.scorePop > 1.0) {
                this.scorePop = Math.max(1.0, this.scorePop - dt * 2.0);
            }

            // Screen Shake
            if (this.shakeTimer > 0) {
                this.shakeTimer -= dt;
                if (this.shakeTimer <= 0) this.shakeIntensity = 0;
            }

            // Target breathing pulse
            this.target.pulse += dt * 3.5;

            // Update Obstacles Movement
            if (this.state === "PLAYING" || this.state === "START") {
                const currentSpeed = this.baseObstacleSpeed + Math.min(this.score * 12, 320);
                for (const obs of this.obstacles) {
                    obs.dist += currentSpeed * dt;
                }
                this.updateObstaclePositions();
            }

            // Update Particles
            this.particles.update(dt);

            // Update Player
            if (this.state === "PLAYING" || this.state === "START") {
                if (!this.player.isMoving) {
                    this.player.aimTimer += dt * this.player.aimSweepSpeed;
                    const offset = Math.sin(this.player.aimTimer) * this.player.aimMaxSpread;

                    let base = 0;
                    if (this.player.currentWall === "TOP") base = Math.PI / 2;
                    else if (this.player.currentWall === "BOTTOM") base = -Math.PI / 2;
                    else if (this.player.currentWall === "LEFT") base = 0;
                    else if (this.player.currentWall === "RIGHT") base = Math.PI;

                    this.player.aimAngle = base + offset;

                    // Collision while resting on wall
                    for (const obs of this.obstacles) {
                        const dist = Math.hypot(this.player.x - obs.x, this.player.y - obs.y);
                        if (dist < this.ballRadius * 1.85) {
                            this.triggerGameOver();
                            return;
                        }
                    }
                } else {
                    // Player in flight
                    this.player.x += this.player.vx * dt;
                    this.player.y += this.player.vy * dt;

                    this.trailTimer += dt;
                    if (this.trailTimer >= 0.02) {
                        this.trailTimer = 0;
                        this.particles.addTrail(this.player.x, this.player.y);
                    }

                    // Collision with Target Gem
                    const distTarget = Math.hypot(this.player.x - this.target.x, this.player.y - this.target.y);
                    if (distTarget < this.ballRadius + this.target.size * 0.45) {
                        this.score++;
                        this.scorePop = 1.35;
                        this.particles.createGemCollectSparks(this.target.x, this.target.y, 14);
                        this.audio.play("collect");
                        this.setThemeByScore(this.score);
                        this.spawnTarget();

                        if (this.score >= 6 && this.obstacles.length === 1) {
                            this.setupObstacles();
                        }
                    }

                    // Collision with Obstacles during flight
                    for (const obs of this.obstacles) {
                        const distObs = Math.hypot(this.player.x - obs.x, this.player.y - obs.y);
                        if (distObs < this.ballRadius * 1.82) {
                            this.triggerGameOver();
                            return;
                        }
                    }

                    // Check Wall Collision
                    let hitWall = false;
                    let wallNormal = 0;

                    if (this.player.y <= this.pathMinY) {
                        this.player.y = this.pathMinY;
                        this.player.currentWall = "TOP";
                        wallNormal = Math.PI / 2;
                        hitWall = true;
                    } else if (this.player.y >= this.pathMaxY) {
                        this.player.y = this.pathMaxY;
                        this.player.currentWall = "BOTTOM";
                        wallNormal = -Math.PI / 2;
                        hitWall = true;
                    } else if (this.player.x <= this.pathMinX) {
                        this.player.x = this.pathMinX;
                        this.player.currentWall = "LEFT";
                        wallNormal = 0;
                        hitWall = true;
                    } else if (this.player.x >= this.pathMaxX) {
                        this.player.x = this.pathMaxX;
                        this.player.currentWall = "RIGHT";
                        wallNormal = Math.PI;
                        hitWall = true;
                    }

                    if (hitWall) {
                        this.player.isMoving = false;
                        this.player.vx = 0;
                        this.player.vy = 0;
                        this.player.aimTimer = 0;
                        this.audio.play("wallhit");
                        this.particles.createWallImpact(this.player.x, this.player.y, wallNormal);

                        for (const obs of this.obstacles) {
                            const dist = Math.hypot(this.player.x - obs.x, this.player.y - obs.y);
                            if (dist < this.ballRadius * 1.85) {
                                this.triggerGameOver();
                                return;
                            }
                        }
                    }
                }
            }
        }

        render() {
            const ctx = this.ctx;
            const bgHex = `rgb(${Math.round(this.currentBg.r)}, ${Math.round(this.currentBg.g)}, ${Math.round(this.currentBg.b)})`;

            ctx.setTransform(1, 0, 0, 1, 0, 0);

            if (this.shakeTimer > 0) {
                const ox = (Math.random() - 0.5) * this.shakeIntensity;
                const oy = (Math.random() - 0.5) * this.shakeIntensity;
                ctx.translate(ox, oy);
            }

            // Fill Background
            ctx.fillStyle = bgHex;
            ctx.fillRect(0, 0, this.layoutWidth, this.layoutHeight);

            // 1. Top Challenges Banner
            this.drawHeader(ctx);

            // 2. Score (During gameplay / Start)
            if (this.state === "PLAYING" || this.state === "START") {
                this.drawInGameScore(ctx);
            }

            // 3. Arena Box Frame
            if (this.state === "PLAYING" || this.state === "START") {
                this.drawArenaBox(ctx);
            }

            // 4. Collectible Target
            if (this.state === "PLAYING" || this.state === "START") {
                this.drawTarget(ctx);
            }

            // 5. Obstacles
            if (this.state === "PLAYING" || this.state === "START") {
                this.drawObstacles(ctx);
            }

            // 6. Player & Aim Arrow
            if (this.state === "PLAYING" || this.state === "START") {
                this.drawPlayer(ctx);
            }

            // 7. Particles & Trails
            this.particles.draw(ctx);

            // 8. Start Prompt
            if (this.state === "START") {
                this.drawStartPrompt(ctx);
            }

            // 9. Game Over Screen (Exact Ketchapp UI)
            if (this.state === "GAMEOVER") {
                this.drawGameOverScreen(ctx);
            }
        }

        drawHeader(ctx) {
            if (this.state === "GAMEOVER") {
                // Top Dark Bar
                ctx.fillStyle = "#161616";
                ctx.fillRect(0, 0, this.layoutWidth, 76);

                ctx.fillStyle = "#ffffff";
                ctx.font = "800 30px -apple-system, BlinkMacSystemFont, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(`CHALLENGES COMPLETED: ${this.challengesCompleted}/${this.totalChallenges}`, this.layoutWidth / 2, 38);

                // Dropdown triangle indicator
                ctx.beginPath();
                ctx.moveTo(this.layoutWidth / 2 - 14, 76);
                ctx.lineTo(this.layoutWidth / 2 + 14, 76);
                ctx.lineTo(this.layoutWidth / 2, 92);
                ctx.closePath();
                ctx.fillStyle = "#161616";
                ctx.fill();
            }
        }

        drawInGameScore(ctx) {
            ctx.save();
            ctx.translate(this.layoutWidth / 2, 280);
            ctx.scale(this.scorePop, this.scorePop);
            ctx.fillStyle = "#ffffff";
            ctx.font = "800 170px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.score.toString(), 0, 0);
            ctx.restore();
        }

        drawArenaBox(ctx) {
            // Draw Thick Outer Border
            ctx.fillStyle = "#161616";
            ctx.fillRect(this.boxX, this.boxY, this.boxSize, this.boxSize);

            // Center Interior
            const bgHex = `rgb(${Math.round(this.currentBg.r)}, ${Math.round(this.currentBg.g)}, ${Math.round(this.currentBg.b)})`;
            ctx.fillStyle = bgHex;
            ctx.fillRect(this.innerMinX, this.innerMinY, this.innerMaxX - this.innerMinX, this.innerMaxY - this.innerMinY);
        }

        drawTarget(ctx) {
            ctx.save();
            ctx.translate(this.target.x, this.target.y);
            ctx.rotate(Math.PI / 4);

            const s = this.target.size * (1.0 + Math.sin(this.target.pulse) * 0.06);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-s / 2, -s / 2, s, s);
            ctx.restore();
        }

        drawObstacles(ctx) {
            ctx.fillStyle = "#161616";
            for (const obs of this.obstacles) {
                ctx.beginPath();
                ctx.arc(obs.x, obs.y, this.ballRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        drawPlayer(ctx) {
            if (!this.player.isMoving) {
                ctx.save();
                ctx.translate(this.player.x, this.player.y);
                ctx.rotate(this.player.aimAngle);

                ctx.beginPath();
                const tipX = this.ballRadius + this.arrowLen;
                const baseX = this.ballRadius + 2;
                ctx.moveTo(tipX, 0);
                ctx.lineTo(baseX, -this.arrowBase / 2);
                ctx.lineTo(baseX, this.arrowBase / 2);
                ctx.closePath();

                ctx.fillStyle = "rgba(255, 255, 255, 0.48)";
                ctx.fill();
                ctx.restore();
            }

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(this.player.x, this.player.y, this.ballRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        drawStartPrompt(ctx) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
            ctx.font = "700 40px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("TAP TO SHOOT", this.layoutWidth / 2, 1530);
        }

        drawGameOverScreen(ctx) {
            // Final Score
            ctx.fillStyle = "#ffffff";
            ctx.font = "800 195px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.score.toString(), this.layoutWidth / 2, 600);

            // "BEST" Label
            ctx.fillStyle = "#161616";
            ctx.font = "800 56px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText("BEST", this.layoutWidth / 2, 750);

            // Best Score Number
            ctx.font = "800 84px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(this.bestScore.toString(), this.layoutWidth / 2, 840);

            // Two-tone Title: "GAME OVER!" or "NEW BEST!"
            const isNew = this.isNewBest;
            const word1 = isNew ? "NEW " : "GAME ";
            const word2 = isNew ? "BEST!" : "OVER!";

            ctx.font = "800 86px -apple-system, BlinkMacSystemFont, sans-serif";
            const w1 = ctx.measureText(word1).width;
            const w2 = ctx.measureText(word2).width;
            const totalW = w1 + w2;
            const startX = (this.layoutWidth - totalW) / 2;

            ctx.textAlign = "left";
            ctx.fillStyle = "#161616";
            ctx.fillText(word1, startX, 1000);

            ctx.fillStyle = "#ffffff";
            ctx.fillText(word2, startX + w1, 1000);

            // Play Button (Large Rounded Box with Play Triangle)
            const btn = this.playBtnRect;
            const r = 32;
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(btn.x, btn.y, btn.w, btn.h, r);
            ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
            ctx.fill();

            // Play Triangle
            const cx = btn.x + btn.w / 2;
            const cy = btn.y + btn.h / 2;
            const ts = 48;
            ctx.beginPath();
            ctx.moveTo(cx - ts * 0.6, cy - ts * 0.8);
            ctx.lineTo(cx + ts * 0.9, cy);
            ctx.lineTo(cx - ts * 0.6, cy + ts * 0.8);
            ctx.closePath();
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.restore();

            // Bottom Bar Icons (5 Icons)
            this.drawBottomBar(ctx);
        }

        drawBottomBar(ctx) {
            for (const btn of this.bottomBarButtons) {
                const imgKey = (btn.id === "music")
                    ? (this.audio.muted ? "icon_music_off" : "icon_music")
                    : `icon_${btn.id}`;

                const img = this.images[imgKey];
                const iconSize = 78;
                if (img && img.complete) {
                    ctx.drawImage(img, btn.x - iconSize / 2, btn.y - iconSize / 2, iconSize, iconSize);
                }

                ctx.fillStyle = "#161616";
                ctx.font = "800 24px -apple-system, BlinkMacSystemFont, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                let label = btn.name;
                if (btn.id === "music") label = this.audio.muted ? "MUSIC\nOFF" : "MUSIC\nON";

                const lines = label.split("\n");
                lines.forEach((line, i) => {
                    ctx.fillText(line, btn.x, btn.y + iconSize / 2 + 14 + i * 28);
                });
            }
        }

        loop(time) {
            const dt = Math.min((time - this.lastTime) / 1000, 0.1);
            this.lastTime = time;

            this.update(dt);
            this.render();

            requestAnimationFrame(this.loop.bind(this));
        }
    }

    window.C3Runtime = C3Runtime;

})(window);
