// Construct 3 Hardware & Capability Support Check
(function() {
  'use strict';
  
  window.C3_Supported = true;
  
  // Check Canvas 2D Support
  var canvas = document.createElement('canvas');
  if (!canvas || !canvas.getContext || !canvas.getContext('2d')) {
    window.C3_Supported = false;
    alert("Canvas 2D is not supported by your browser. Please update your browser.");
  }
  
  // Check Web Audio Support
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!window.AudioContext) {
    console.warn("Web Audio API not supported. Falling back to silent mode.");
  }
  
  window.devicePixelRatio = window.devicePixelRatio || 1;
})();
