/**
 * Construct 3 Runtime Compatibility Wrapper
 * Implements Construct 3 export interfaces and runtime bindings
 */

'use strict';

window.C3 = window.C3 || {};

window.C3_Runtime = {
    version: "r380",
    name: "Ball Slide",
    layoutSize: {
        width: 1080,
        height: 1920
    },
    isReady: true,
    runOnStartup: function(callback) {
        if (document.readyState === "complete" || document.readyState === "interactive") {
            setTimeout(callback, 0);
        } else {
            document.addEventListener("DOMContentLoaded", callback);
        }
    }
};

// Export to window for Construct 3 scripts
window.runOnStartup = window.C3_Runtime.runOnStartup;

