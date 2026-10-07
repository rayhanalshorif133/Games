// Construct 3 build compatibility check
(function() {
    'use strict';
    var hasCanvas = !!window.CanvasRenderingContext2D;
    var hasAudio = !!(window.AudioContext || window.webkitAudioContext);
    var hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    window.C3_SUPPORT = {
        canvas: hasCanvas,
        audio: hasAudio,
        touch: hasTouch,
        isSupported: hasCanvas && hasAudio
    };

    if (!window.C3_SUPPORT.isSupported) {
        console.warn("Construct 3 Runtime: Limited browser multimedia features detected.");
    }
})();

