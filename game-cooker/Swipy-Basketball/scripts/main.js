/**
 * Construct 3 Main Script
 * Initializes the C3Runtime with project data.
 */

window.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const canvas = document.getElementById('c3canvas');
  if (!canvas) {
    console.error("Canvas element #c3canvas not found.");
    return;
  }

  const defaultConfig = {
    project: {
      viewportWidth: 1080,
      viewportHeight: 1920,
      name: "Swipy Basketball",
      fullscreenMode: "letterbox-scale"
    }
  };

  // If running on file:// protocol or fetch blocked by CORS, initialize immediately with defaultConfig
  if (location.protocol === 'file:' || location.origin === 'null') {
    initEngine(canvas, defaultConfig);
  } else {
    fetch('data.json')
      .then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then(data => {
        initEngine(canvas, data);
      })
      .catch(err => {
        console.warn("Could not fetch data.json via network, using default config:", err);
        initEngine(canvas, defaultConfig);
      });
  }

  function initEngine(canvasElement, config) {
    if (window.C3Runtime) {
      const runtime = new window.C3Runtime(canvasElement, config);
      runtime.start();
      window.c3_runtime = runtime;
      console.log("[C3 Main] Construct 3 Runtime started successfully.");
    } else {
      console.error("[C3 Main] C3Runtime is not defined.");
    }
  }
});
