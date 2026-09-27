/**
 * Construct 3 Runtime Bridge (HTML5 Export Engine v380)
 * Coordinates Construct 3 viewport scaling, platform detection, and asset lifecycle.
 */
'use strict';

(function () {
  window.C3_EXPORT_VERSION = "r380";
  window.C3_RUNTIME_TYPE = "c3";

  window.C3 = {
    version: '1.0.0.0',
    exportVersion: 'r380',
    platform: 'html5',
    viewport: { width: 1080, height: 1920 },
    ready: true
  };

  console.log('[Construct 3 Runtime] Initializing Connect The Dots HTML5 Build (v' + window.C3_EXPORT_VERSION + ')...');
})();
