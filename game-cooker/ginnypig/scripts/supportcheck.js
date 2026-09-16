/**
 * supportcheck.js - Construct 3 Device & Capability Detector
 */
(function () {
    const isWebGLSupported = (function () {
        try {
            const canvas = document.createElement("canvas");
            return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
        } catch (e) {
            return false;
        }
    })();

    const isAudioSupported = typeof AudioContext !== "undefined" || typeof webkitAudioContext !== "undefined";

    window.C3Support = {
        webgl: isWebGLSupported,
        audio: isAudioSupported,
        pointerEvents: !!window.PointerEvent,
        touch: ("ontouchstart" in window) || (navigator.maxTouchPoints > 0)
    };

    console.log("[Construct 3 Runtime] Platform Capabilities:", window.C3Support);
})();

