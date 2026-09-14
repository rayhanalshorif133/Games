/**
 * Construct 3 HTML5 Build - Main Entrypoint (scripts/main.js)
 * Bootstraps viewport scaling, event listeners, and runtime instantiation.
 */
'use strict';

function resizePortraitViewport() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;

    const scaleX = vw / 1080;
    const scaleY = vh / 1920;
    const scale = Math.min(scaleX, scaleY);

    container.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

window.addEventListener('resize', resizePortraitViewport);
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resizePortraitViewport);
}
window.addEventListener('orientationchange', () => {
    setTimeout(resizePortraitViewport, 150);
});

window.addEventListener('load', () => {
    resizePortraitViewport();
    if (typeof Make7GamePortrait !== 'undefined') {
        window.game = new Make7GamePortrait();
    }
});

