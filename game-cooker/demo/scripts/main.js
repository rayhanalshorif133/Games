/**
 * Construct 3 Main Bootstrap
 * Initializes canvas, scaling, and C3Runtime engine
 */

"use strict";

window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("c3canvas");
    const container = document.getElementById("canvas-container");

    const DESIGN_WIDTH = 1080;
    const DESIGN_HEIGHT = 1920;

    // Set internal canvas resolution
    canvas.width = DESIGN_WIDTH;
    canvas.height = DESIGN_HEIGHT;

    // Responsive scaling function (Letterbox-Scale)
    function resizeCanvas() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const scaleX = windowWidth / DESIGN_WIDTH;
        const scaleY = windowHeight / DESIGN_HEIGHT;
        const scale = Math.min(scaleX, scaleY);

        const displayWidth = Math.round(DESIGN_WIDTH * scale);
        const displayHeight = Math.round(DESIGN_HEIGHT * scale);

        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
    }

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", resizeCanvas);
    resizeCanvas();

    // Prevent default touch gestures (pinch-zoom, scrolling)
    document.addEventListener("touchmove", (e) => {
        if (e.scale !== 1) e.preventDefault();
    }, { passive: false });

    // Initialize Construct 3 Game Runtime
    const runtime = new window.C3Runtime(canvas);
    window.c3runtime = runtime;

    // Modal Close Helper
    const modalBtn = document.getElementById("modalBtn");
    if (modalBtn) {
        modalBtn.addEventListener("click", () => {
            runtime.closeModal();
        });
    }
});

