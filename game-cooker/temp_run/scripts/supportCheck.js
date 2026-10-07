'use strict';
// Construct 3 Support Check Script
window.C3_IsSupported = (function() {
    try {
        var canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) || canvas.getContext('2d'));
    } catch (e) {
        return false;
    }
})();

if (!window.C3_IsSupported) {
    alert('Your browser does not support HTML5 Canvas or WebGL required to run this game.');
}

