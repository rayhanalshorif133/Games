(function() {
    'use strict';
    function isSupported() {
        try {
            var canvas = document.createElement('canvas');
            return !!(window.AudioContext || window.webkitAudioContext) && !!(canvas.getContext && canvas.getContext('2d'));
        } catch (e) {
            return false;
        }
    }
    if (!isSupported()) {
        alert('Your browser does not support the modern HTML5 Canvas or Web Audio features required to run this game.');
    }
})();
