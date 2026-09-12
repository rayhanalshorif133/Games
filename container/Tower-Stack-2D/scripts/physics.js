/**
 * scripts/physics.js - Construct 3 Style Physics & Math Subsystem
 * Manages tower sway harmonics, spring-damper relaxation,
 * landing tolerance resolution, and camera vertical tracking.
 */

const GamePhysics = (function () {
    // Dimension Constants
    const CANVAS_W = 1080;
    const CANVAS_H = 1920;
    const BLOCK_W = 160;
    const BLOCK_H = 160;
    const TARGET_SCREEN_TOP_Y = 1260;
    const SCREEN_DROP_Y = 620;
    const GROUND_Y = 1906; // 1920 - 14px black ground line

    // Tolerance thresholds
    const PERFECT_SNAP_THRESHOLD = 14;
    const MAX_LAND_TOLERANCE = 115; // ~72% of block width
    const DROP_GRAVITY = 6800; // px/s^2 for snappy arcade drop feel

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function lerp(start, end, t) {
        return start + (end - start) * t;
    }

    /**
     * Determine drop outcome relative to the top block
     * @param {number} activeX Dropping block center-left X
     * @param {number} topBlockX Top stack block center-left X
     * @returns {Object} Outcome: 'PERFECT' | 'GOOD' | 'MISS', diffX, tilt, landedX
     */
    function evaluateLanding(activeX, topBlockX) {
        const diffX = activeX - topBlockX;
        const absDiff = Math.abs(diffX);

        if (absDiff <= PERFECT_SNAP_THRESHOLD) {
            return {
                type: 'PERFECT',
                diffX: 0,
                tilt: 0,
                landedX: topBlockX,
                offsetFraction: 0
            };
        }

        if (absDiff <= MAX_LAND_TOLERANCE) {
            // Good landing with slight tilt and spring wobble
            const offsetFraction = diffX / BLOCK_W;
            const tilt = offsetFraction * 0.13; // Slight tilt in radians
            return {
                type: 'GOOD',
                diffX: diffX,
                tilt: tilt,
                landedX: activeX,
                offsetFraction: offsetFraction
            };
        }

        // Missed stack completely
        return {
            type: 'MISS',
            diffX: diffX,
            tilt: Math.sign(diffX || 1) * 0.45,
            landedX: activeX,
            offsetFraction: diffX / BLOCK_W
        };
    }

    /**
     * Smoothly track camera towards top block
     */
    function updateCamera(currentCameraY, targetCameraY, dt) {
        const t = 1 - Math.exp(-9.0 * dt);
        return lerp(currentCameraY, targetCameraY, t);
    }

    return {
        CANVAS_W,
        CANVAS_H,
        BLOCK_W,
        BLOCK_H,
        TARGET_SCREEN_TOP_Y,
        SCREEN_DROP_Y,
        GROUND_Y,
        PERFECT_SNAP_THRESHOLD,
        MAX_LAND_TOLERANCE,
        DROP_GRAVITY,
        clamp,
        lerp,
        evaluateLanding,
        updateCamera
    };
})();

if (typeof window !== 'undefined') {
    window.GamePhysics = GamePhysics;
}

