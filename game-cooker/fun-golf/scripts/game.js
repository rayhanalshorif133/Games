// Fun Golf - Core Game Logic & State Manager
// Layout: 1080 x 1920

class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.audio = new AudioManager();
        this.physics = new PhysicsWorld(this);
        this.renderer = new GameRenderer(canvas, this);
        this.input = new InputHandler(this, canvas);

        this.currentLevelIndex = 2; // Default to Level 2 (as seen in demo.mp4)
        this.currentFloorIndex = 1;
        this.strokes = 0;
        this.state = 'PLAYING'; // 'PLAYING', 'LEVEL_WON', 'LEVEL_SELECT'

        this.particles = [];
        this.confetti = [];

        this.ball = null;
        this.aim = {
            power: 0,
            direction: 1, // 1 = right, -1 = left
            angleRad: 0.35, // default ~20 deg
            angleDeg: 20
        };

        this.chargeTimer = 0;
        this.isSwinging = false;
        this.swingProgress = 0;
        this.lastTime = performance.now();

        this.loadLevel(this.currentLevelIndex);
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    loadLevel(levelIndex) {
        const data = LEVELS_DATA.find(l => l.levelNumber === levelIndex) || LEVELS_DATA[0];
        this.currentLevelData = data;
        this.currentLevelIndex = data.levelNumber;
        this.currentFloorIndex = 1;
        this.strokes = 0;
        this.state = 'PLAYING';
        this.particles = [];
        this.confetti = [];

        const firstFloor = data.floors[0];
        const ballRadius = 20;

        this.ball = {
            x: firstFloor.ballStartX || 240,
            y: firstFloor.y - ballRadius,
            radius: ballRadius,
            vx: 0,
            vy: 0,
            rotation: 0,
            isGrounded: true,
            state: 'IDLE' // 'IDLE', 'CHARGING', 'SWINGING', 'IN_FLIGHT', 'FALLING_THROUGH_HOLE', 'LANDING'
        };

        this.updateAimForCurrentFloor();
    }

    restartLevel() {
        this.loadLevel(this.currentLevelIndex);
    }

    nextLevel() {
        const nextIdx = (this.currentLevelIndex % LEVELS_DATA.length) + 1;
        this.loadLevel(nextIdx);
    }

    getCurrentFloor() {
        if (!this.currentLevelData || !this.currentLevelData.floors) return null;
        return this.currentLevelData.floors.find(f => f.index === this.currentFloorIndex);
    }

    getFloorByIndex(idx) {
        if (!this.currentLevelData || !this.currentLevelData.floors) return null;
        return this.currentLevelData.floors.find(f => f.index === idx);
    }

    updateAimForCurrentFloor() {
        const floor = this.getCurrentFloor();
        if (!floor || !this.ball) return;

        // Determine direction towards hole
        this.aim.direction = (floor.holeX > this.ball.x) ? 1 : -1;

        // Determine ideal launch angle
        const idealDeg = floor.idealAngleDeg || (floor.obstacle ? 50 : 18);
        this.aim.angleDeg = idealDeg;
        this.aim.angleRad = idealDeg * Math.PI / 180;
        this.aim.power = 0.2;
    }

    startCharging(x, y) {
        if (!this.ball || this.ball.state !== 'IDLE') return;

        this.ball.state = 'CHARGING';
        this.chargeTimer = 0;
        this.aim.power = 0.2;
        this.updateAimForCurrentFloor();
    }

    updateAimPosition(x, y) {
        if (!this.ball || this.ball.state !== 'CHARGING') return;

        // Player drag can subtly fine-tune launch angle
        const dx = (x - this.ball.x) * this.aim.direction;
        const dy = -(y - this.ball.y);

        if (dx > 20 && dy > 10) {
            const angle = Math.atan2(dy, dx);
            // Clamp angle between 12 deg and 75 deg
            const clamped = Math.max(0.2, Math.min(1.3, angle));
            this.aim.angleRad = clamped;
            this.aim.angleDeg = clamped * 180 / Math.PI;
        }
    }

    releaseShot() {
        if (!this.ball || this.ball.state !== 'CHARGING') return;

        // Begin swing animation
        this.ball.state = 'SWINGING';
        this.isSwinging = true;
        this.swingProgress = 0;
        this.audio.playSwing();
    }

    executeShotLaunch() {
        const ball = this.ball;
        const power = this.aim.power;
        const angle = this.aim.angleRad;
        const direction = this.aim.direction;

        // Calculate launch speed (min 420, max 1380 px/s)
        const speed = 400 + power * 980;
        ball.vx = speed * Math.cos(angle) * direction;
        ball.vy = -speed * Math.sin(angle);
        ball.isGrounded = false;
        ball.state = 'IN_FLIGHT';

        this.strokes++;

        // Sound & Dust VFX
        this.audio.playHit(power);
        this.spawnParticles(ball.x, ball.y, 'dust', 10);
    }

    spawnParticles(x, y, type = 'dust', count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (type === 'sparkle') ? (60 + Math.random() * 180) : (40 + Math.random() * 120);

            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - ((type === 'sparkle') ? 80 : 20),
                size: (type === 'sparkle') ? (18 + Math.random() * 16) : (24 + Math.random() * 20),
                life: 1.0,
                maxLife: 0.45 + Math.random() * 0.4,
                rotation: Math.random() * Math.PI * 2,
                type: type,
                color: (type === 'sparkle') ? '#FFE033' : '#FFFFFF'
            });
        }
    }

    spawnConfetti() {
        const colors = ['#FF2A6D', '#05D9E8', '#FFDE17', '#75E016', '#FF7A00', '#FFFFFF'];
        for (let i = 0; i < 90; i++) {
            this.confetti.push({
                x: Math.random() * 1080,
                y: -40 - Math.random() * 300,
                w: 12 + Math.random() * 12,
                h: 8 + Math.random() * 10,
                vx: (Math.random() - 0.5) * 180,
                vy: 180 + Math.random() * 260,
                angle: Math.random() * Math.PI * 2,
                vAngle: (Math.random() - 0.5) * 6,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }

    onLevelComplete() {
        this.state = 'LEVEL_WON';
        this.audio.playVictory();
        this.spawnConfetti();
    }

    update(dt) {
        // 1. Update charging power oscillation
        if (this.ball && this.ball.state === 'CHARGING') {
            this.chargeTimer += dt;
            // Oscillate smoothly from 0.2 to 1.0
            this.aim.power = 0.2 + 0.8 * (0.5 - 0.5 * Math.cos(this.chargeTimer * 5.2));
        }

        // 2. Update swing animation
        if (this.ball && this.ball.state === 'SWINGING') {
            this.swingProgress += dt * 14; // rapid forward stroke (~0.07s)
            if (this.swingProgress >= 1.0) {
                this.swingProgress = 1.0;
                this.executeShotLaunch();
            }
        }

        // 3. Update physics
        this.physics.update(dt);

        // 4. Update ball rolling rotation
        if (this.ball && (this.ball.state === 'IN_FLIGHT' || this.ball.state === 'LANDING')) {
            this.ball.rotation += (this.ball.vx / this.ball.radius) * dt;
        }

        // 5. When ball settles to IDLE on a new floor, auto-aim for next shot
        if (this.ball && this.ball.state === 'IDLE' && this.ball.currentFloor !== this.currentFloorIndex) {
            this.ball.currentFloor = this.currentFloorIndex;
            this.updateAimForCurrentFloor();
        }

        // 6. Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // 7. Update confetti
        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const c = this.confetti[i];
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.angle += c.vAngle * dt;
            if (c.y > 1940) {
                this.confetti.splice(i, 1);
            }
        }
    }

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.update(dt);
        this.renderer.render();

        requestAnimationFrame(this.loop);
    }
}

window.GameEngine = GameEngine;
