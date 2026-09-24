/**
 * Math & Physics Utilities for Construct 3 Engine
 */

const MathUtils = {
    lerp: (a, b, t) => a + (b - a) * t,
    clamp: (val, min, max) => Math.max(min, Math.min(max, val)),
    randRange: (min, max) => min + Math.random() * (max - min),
    randChoice: (arr) => arr[Math.floor(Math.random() * arr.length)],

    // Axis-Aligned Bounding Box Collision
    checkAABB: (r1, r2) => {
        return (
            r1.x < r2.x + r2.w &&
            r1.x + r1.w > r2.x &&
            r1.y < r2.y + r2.h &&
            r1.y + r1.h > r2.y
        );
    },

    // Circle - Rectangle Collision
    checkCircleRect: (cx, cy, radius, rx, ry, rw, rh) => {
        const testX = MathUtils.clamp(cx, rx, rx + rw);
        const testY = MathUtils.clamp(cy, ry, ry + rh);
        const distX = cx - testX;
        const distY = cy - testY;
        return (distX * distX + distY * distY) <= (radius * radius);
    },

    // Distance between 2 points
    dist: (x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
};

// Ensure roundRect cross-browser support
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
        if (typeof radii === 'number') radii = [radii, radii, radii, radii];
        if (!Array.isArray(radii)) radii = [0, 0, 0, 0];
        const r = radii[0] || 0;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

window.MathUtils = MathUtils;
