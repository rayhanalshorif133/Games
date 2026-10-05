'use strict';
(function() {
    function isSupported() {
        try {
            return !!(window.HTMLCanvasElement && window.CanvasRenderingContext2D && window.AudioContext || window.webkitAudioContext);
        } catch (e) {
            return false;
        }
    }
    if (!isSupported()) {
        alert('Your browser does not support the modern web features required for this game.');
    }
})();
