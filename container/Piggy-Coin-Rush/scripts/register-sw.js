/**
 * register-sw.js - Construct 3 Service Worker Registration
 */
(function () {
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./sw.js").then(registration => {
                console.log("[Construct 3] ServiceWorker registered:", registration.scope);
            }).catch(err => {
                // Ignore local file/dev warnings
            });
        });
    }
})();

