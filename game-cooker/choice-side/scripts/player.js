/**
 * Player Controller for Choice Side
 * Handles Horned Ninja physics, wall climbing, aerial somersault, slicing collision, and animations
 */

'use strict';

class Player {
    constructor(assets, sound, particles) {
        this.assets = assets;
        this.sound = sound;
        this.particles = particles;

        // Constants
        this.LEFT_WALL_X = 115;
        this.RIGHT_WALL_X = 965;
        this.BASE_Y = 1380; // Character vertical position (bottom ~70% of 1920 layout)
        this.JUMP_DURATION = 0.40; // Quick, snappy, athletic leap

        this.reset();
    }

    reset() {
        this.state = 'CLIMBING'; // 'CLIMBING', 'JUMPING', 'DEAD'
        this.side = 'left';      // 'left' or 'right'
        this.x = this.LEFT_WALL_X;
        this.y = this.BASE_Y;
        
        // Jump state
        this.jumpProgress = 0;
        this.startX = this.LEFT_WALL_X;
        this.targetX = this.RIGHT_WALL_X;
        this.jumpAngle = 0;

        // Animation timers
        this.climbAnimTimer = 0;
        this.climbFrame = 0;

        // Health & Invulnerability
        this.lives = 3;
        this.invulnerableTimer = 0;

        // Sliced apples count
        this.applesSliced = 0;
    }

    jump() {
        if (this.state === 'DEAD') return;

        // Initiate wall-to-wall acrobatic jump
        this.state = 'JUMPING';
        this.startX = this.x;
        this.targetX = (this.side === 'left') ? this.RIGHT_WALL_X : this.LEFT_WALL_X;
        this.jumpProgress = 0;
        this.jumpAngle = 0;

        // Play jump whoosh
        this.sound.play('jump');

        // Add slash trail
        this.particles.addSlashArc(this.startX, this.y, this.targetX, this.y);
    }

    takeDamage() {
        if (this.invulnerableTimer > 0 || this.state === 'DEAD') return false;

        this.lives--;
        this.invulnerableTimer = 1.6; // 1.6s grace period

        // SFX & Vfx
        this.sound.play('hit');
        this.particles.shake(28, 0.35);
        this.particles.flashRed(0.65);
        this.particles.addHitSparks(this.x, this.y);

        if (this.lives <= 0) {
            this.state = 'DEAD';
            this.sound.play('gameover');
            return true; // Game Over triggered
        }

        return false;
    }

    heal() {
        if (this.lives < 3) {
            this.lives++;
        }
        this.sound.play('heart');
        this.particles.addHeartCollectEffect(this.x, this.y);
    }

    update(dt, scrollSpeed) {
        // Invulnerability timer countdown
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
        }

        // State Machine
        if (this.state === 'CLIMBING') {
            // Climbing running animation on wall
            this.x = (this.side === 'left') ? this.LEFT_WALL_X : this.RIGHT_WALL_X;
            this.y = this.BASE_Y;

            this.climbAnimTimer += dt * (scrollSpeed / 70);
            if (this.climbAnimTimer >= 1.0) {
                this.climbAnimTimer = 0;
                this.climbFrame = 1 - this.climbFrame;
                // Emit running dust at feet
                this.particles.addFootDust(this.x, this.y + 70, this.side === 'right');
            }

        } else if (this.state === 'JUMPING') {
            // Mid-air somersault leap
            this.jumpProgress += dt / this.JUMP_DURATION;

            // Parabolic flight arc
            const t = Math.min(1.0, this.jumpProgress);
            // Smooth ease in-out horizontal movement
            const easeT = 0.5 - 0.5 * Math.cos(t * Math.PI);
            this.x = this.startX + (this.targetX - this.startX) * easeT;
            // Slight parabolic upward peak
            const arcY = -Math.sin(t * Math.PI) * 75;
            this.y = this.BASE_Y + arcY;

            // Somersault flip rotation (360 degrees)
            const rotDir = (this.targetX > this.startX) ? 1 : -1;
            this.jumpAngle += rotDir * (Math.PI * 2 / this.JUMP_DURATION) * dt;

            // Land on opposite wall
            if (this.jumpProgress >= 1.0) {
                this.state = 'CLIMBING';
                this.side = (this.targetX === this.RIGHT_WALL_X) ? 'right' : 'left';
                this.x = this.targetX;
                this.y = this.BASE_Y;
                this.jumpAngle = 0;
                this.climbFrame = 0;

                // Wall landing dust puff
                this.particles.addFootDust(this.x, this.y + 60, this.side === 'right');
                this.particles.addFootDust(this.x, this.y + 30, this.side === 'right');
            }

        } else if (this.state === 'DEAD') {
            // Fall downwards off screen
            this.y += 1400 * dt;
        }
    }

    checkCollisions(obstacles) {
        if (this.state === 'DEAD') return false;

        const playerRadius = 65;

        // 1. Check Hazards (Saws, Boulders, Fireballs)
        for (let i = 0; i < obstacles.hazards.length; i++) {
            const h = obstacles.hazards[i];

            if (h.type === 'saw') {
                // Saw is mounted on wall: only hits if player is on the same wall and within vertical range
                if (this.state === 'CLIMBING' && this.side === h.side) {
                    const distY = Math.abs(this.y - h.y);
                    if (distY < 85) {
                        return this.takeDamage();
                    }
                }
            } else {
                // Circle-circle collision for Boulders and Fireballs
                const dx = this.x - h.x;
                const dy = this.y - h.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < playerRadius + h.radius) {
                    return this.takeDamage();
                }
            }
        }

        // 2. Check Collectibles (Apples & Hearts)
        for (let i = obstacles.items.length - 1; i >= 0; i--) {
            const it = obstacles.items[i];
            const dx = this.x - it.x;
            const dy = this.y - (it.y + it.bobY);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < playerRadius + it.radius) {
                if (it.type === 'apple') {
                    // Fruit Ninja style slicing effect!
                    this.applesSliced++;
                    this.sound.play('slice');
                    this.particles.addAppleSliceEffect(
                        it.x, it.y, it.color,
                        this.assets.appleSliceLeft, this.assets.appleSliceRight
                    );
                    obstacles.items.splice(i, 1);
                } else if (it.type === 'heart') {
                    this.heal();
                    obstacles.items.splice(i, 1);
                }
            }
        }

        return false;
    }

    draw(ctx) {
        if (this.state === 'DEAD' && this.y > 2100) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Blinking flicker during invulnerability
        if (this.invulnerableTimer > 0) {
            const blink = Math.sin(this.invulnerableTimer * 28);
            ctx.globalAlpha = blink > 0 ? 0.35 : 0.95;
        }

        if (this.state === 'CLIMBING') {
            // Facing inwards towards canyon
            const isRight = this.side === 'right';
            if (isRight) {
                ctx.scale(-1, 1); // Flip horizontally for right cliff
            }

            // Pick climbing animation frame
            const sprite = (this.climbFrame === 0) ? this.assets.playerClimb0 : this.assets.playerClimb1;
            if (sprite && sprite.complete) {
                // Draw hero centered
                ctx.drawImage(sprite, -90, -90, 180, 180);
            }

        } else if (this.state === 'JUMPING') {
            // Somersault flip rotation
            ctx.rotate(this.jumpAngle);
            const sprite = this.assets.playerJump;
            if (sprite && sprite.complete) {
                ctx.drawImage(sprite, -90, -90, 180, 180);
            }

        } else if (this.state === 'DEAD') {
            // Defeated hurt pose
            const sprite = this.assets.playerHurt || this.assets.playerClimb0;
            if (sprite && sprite.complete) {
                ctx.drawImage(sprite, -90, -90, 180, 180);
            }
        }

        ctx.restore();
    }
}

window.Player = Player;

