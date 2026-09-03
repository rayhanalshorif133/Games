// Neon Pong X - System Support & Feature Check (Construct 3 style)
(function () {
    'use strict';

    window.C3_Support = {
        canvas: !!window.CanvasRenderingContext2D,
        webgl: (function () {
            try {
                var c = document.createElement('canvas');
                return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
            } catch (e) {
                return false;
            }
        })(),
        webAudio: !!(window.AudioContext || window.webkitAudioContext),
        touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        pointerEvents: !!window.PointerEvent
    };

    if (!window.C3_Support.canvas) {
        alert("Your browser does not support HTML5 Canvas. Please update to a modern browser to play Neon Pong X.");
    }
})();

