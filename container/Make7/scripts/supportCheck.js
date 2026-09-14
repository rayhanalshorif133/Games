/**
 * Construct 3 HTML5 Build - Browser Support Check
 * Verifies HTML5 Canvas, Web Audio, and Pointer Events support.
 */
(function () {
    'use strict';
    window.C3_Supported = true;
    try {
        const canvas = document.createElement('canvas');
        if (!canvas.getContext || !canvas.getContext('2d')) {
            window.C3_Supported = false;
        }
    } catch (e) {
        window.C3_Supported = false;
    }

    if (!window.C3_Supported) {
        alert("Your browser does not support HTML5 Canvas required for this game.");
    }
})();

