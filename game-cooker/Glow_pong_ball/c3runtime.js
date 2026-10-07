/**
 * Construct 3 HTML5 Runtime Bootstrap
 * Project: Glow Air Hockey / Glow Pong Ball
 * Layout Dimensions: 1080 x 1920
 */

window.C3 = window.C3 || {};

C3.Runtime = {
    version: "r380",
    projectName: "Glow Pong Ball",
    layoutSize: {
        width: 1080,
        height: 1920
    },
    exportType: "html5",

    init: function () {
        console.log(`[Construct 3 Runtime] Initialized project "${this.projectName}" (Layout: ${this.layoutSize.width}x${this.layoutSize.height})`);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    C3.Runtime.init();
});

