"use strict";

(function () {
    // Construct 3 Web Compatibility Checker
    function isSupported() {
        try {
            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            if (!ctx) return false;
            if (typeof window.AudioContext === "undefined" && typeof window.webkitAudioContext === "undefined") {
                console.warn("[Construct 3] Web Audio API is not supported in this browser.");
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    if (!isSupported()) {
        alert("Your browser does not support the technologies required to run this game. Please update your browser.");
    }
})();

