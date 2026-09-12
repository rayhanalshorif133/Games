/**
 * physics.js - 2D Physics Math & Collision Engine
 * Handles gravity, capsule collision resolution, restitution, friction,
 * sub-stepping for tunneling prevention, and impulse transfer.
 */

const Physics = (function () {
    const GRAVITY = 2100; // px/s^2
    const AIR_RESISTANCE = 0.999;
    const SUB_STEPS = 4; // Sub-steps per frame for continuous collision accuracy

    /**
     * Vector dot product
     */
    function dot(x1, y1, x2, y2) {
        return x1 * x2 + y1 * y2;
    }

    /**
     * Distance between two points
     */
    function dist(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }

    /**
     * Closest point on line segment (x1, y1) -> (x2, y2) to point (px, py)
     */
    function closestPointOnSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;

        if (lenSq === 0) {
            return { x: x1, y: y1, t: 0 };
        }

        let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));

        return {
            x: x1 + t * dx,
            y: y1 + t * dy,
            t: t
        };
    }

    /**
     * Check and resolve collision between a Circle (Coin) and a Capsule (Slider/Rotator)
     * Capsule is defined by segment (x1, y1) to (x2, y2) with radius 'capRadius'
     * @returns {Object|null} Collision info if hit, else null
     */
    function resolveCircleCapsule(coin, x1, y1, x2, y2, capRadius, restitution = 0.82, friction = 0.98) {
        const totalRadius = coin.radius + capRadius;
        const closest = closestPointOnSegment(coin.x, coin.y, x1, y1, x2, y2);

        const dx = coin.x - closest.x;
        const dy = coin.y - closest.y;
        const distance = Math.hypot(dx, dy);

        if (distance < totalRadius) {
            let nx = 0;
            let ny = -1;

            if (distance > 0.0001) {
                nx = dx / distance;
                ny = dy / distance;
            } else {
                // If centers coincide, push up
                nx = 0;
                ny = -1;
            }

            // Separate coin so it's not penetrating
            const penetration = totalRadius - distance;
            coin.x += nx * penetration;
            coin.y += ny * penetration;

            // Dot product of velocity and normal
            const vn = dot(coin.vx, coin.vy, nx, ny);

            // Only bounce if moving toward the surface
            if (vn < 0) {
                // Normal impulse
                const impulse = -(1 + restitution) * vn;
                coin.vx += nx * impulse;
                coin.vy += ny * impulse;

                // Tangential friction
                const tx = -ny;
                const ty = nx;
                const vt = dot(coin.vx, coin.vy, tx, ty);
                const vtFriction = vt * friction;

                coin.vx = nx * dot(coin.vx, coin.vy, nx, ny) + tx * vtFriction;
                coin.vy = ny * dot(coin.vx, coin.vy, nx, ny) + ty * vtFriction;

                return {
                    hit: true,
                    hitX: closest.x + nx * capRadius,
                    hitY: closest.y + ny * capRadius,
                    nx: nx,
                    ny: ny,
                    impactSpeed: Math.abs(vn)
                };
            }
        }
        return null;
    }

    /**
     * Resolve Circle vs Circle (e.g. Ring Bumper)
     */
    function resolveCircleCircle(coin, bx, by, bumperRadius, restitution = 0.9) {
        const totalRadius = coin.radius + bumperRadius;
        const dx = coin.x - bx;
        const dy = coin.y - by;
        const distance = Math.hypot(dx, dy);

        if (distance < totalRadius) {
            let nx = 0;
            let ny = -1;
            if (distance > 0.0001) {
                nx = dx / distance;
                ny = dy / distance;
            }

            const penetration = totalRadius - distance;
            coin.x += nx * penetration;
            coin.y += ny * penetration;

            const vn = dot(coin.vx, coin.vy, nx, ny);
            if (vn < 0) {
                const impulse = -(1 + restitution) * vn;
                coin.vx += nx * impulse;
                coin.vy += ny * impulse;

                return {
                    hit: true,
                    hitX: bx + nx * bumperRadius,
                    hitY: by + ny * bumperRadius,
                    nx: nx,
                    ny: ny,
                    impactSpeed: Math.abs(vn)
                };
            }
        }
        return null;
    }

    /**
     * Update physics for a coin
     */
    function updateCoin(coin, dt) {
        // Sub-stepping for smooth physics & anti-tunneling
        const subDt = dt / SUB_STEPS;

        for (let step = 0; step < SUB_STEPS; step++) {
            // Apply gravity
            coin.vy += GRAVITY * subDt;

            // Apply air drag
            coin.vx *= Math.pow(AIR_RESISTANCE, subDt * 60);
            coin.vy *= Math.pow(AIR_RESISTANCE, subDt * 60);

            // Update position
            coin.x += coin.vx * subDt;
            coin.y += coin.vy * subDt;

            // Spin coin based on velocity
            coin.rotation += (coin.vx * 0.005 + 0.05) * (subDt * 60);

            // Wall bounce (left & right screen edges)
            const margin = coin.radius + 10;
            if (coin.x < margin) {
                coin.x = margin;
                coin.vx = Math.abs(coin.vx) * 0.7;
            } else if (coin.x > 1080 - margin) {
                coin.x = 1080 - margin;
                coin.vx = -Math.abs(coin.vx) * 0.7;
            }
        }
    }

    return {
        GRAVITY,
        SUB_STEPS,
        dist,
        dot,
        closestPointOnSegment,
        resolveCircleCapsule,
        resolveCircleCircle,
        updateCoin
    };
})();

if (typeof window !== 'undefined') {
    window.Physics = Physics;
}
