/**
 * Construct 3 HTML5 Game Bootstrapper & Main Entry Point
 * Initializes systems, handles 1080x1920 portrait letterboxing, and boots the runtime loop.
 */

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('c3canvas');
  const overlay = document.getElementById('ui-overlay');
  const loader = document.getElementById('c3-loader');
  const loaderBar = document.querySelector('.loader-bar');
  const muteBtn = document.getElementById('btn-mute');
  const pauseBtn = document.getElementById('btn-pause');

  // 1. Establish internal logical resolution (Portrait 1080 x 1920)
  canvas.width = 1080;
  canvas.height = 1920;

  // 2. Responsive Aspect Ratio Letterboxing (1080:1920 -> 9:16)
  function resizeCanvas() {
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const targetAspect = 1080 / 1920; // 0.5625
    const windowAspect = windowW / windowH;

    let displayW, displayH, offsetX, offsetY;

    if (windowAspect < targetAspect) {
      // Window is taller than 9:16 -> fit to width
      displayW = windowW;
      displayH = windowW / targetAspect;
      offsetX = 0;
      offsetY = (windowH - displayH) / 2;
    } else {
      // Window is wider than 9:16 -> fit to height
      displayH = windowH;
      displayW = windowH * targetAspect;
      offsetX = (windowW - displayW) / 2;
      offsetY = 0;
    }

    // Apply exact CSS pixel dimensions
    canvas.style.width = `${Math.floor(displayW)}px`;
    canvas.style.height = `${Math.floor(displayH)}px`;
    canvas.style.left = `${Math.floor(offsetX)}px`;
    canvas.style.top = `${Math.floor(offsetY)}px`;

    if (overlay) {
      overlay.style.width = `${Math.floor(displayW)}px`;
      overlay.style.height = `${Math.floor(displayH)}px`;
      overlay.style.left = `${Math.floor(offsetX)}px`;
      overlay.style.top = `${Math.floor(offsetY)}px`;
    }
  }

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 150);
  });
  resizeCanvas();

  // 3. Initialize Game Engine Subsystems
  const runtime = new C3Runtime(canvas);
  const world = new World(runtime);
  const player = new Player(runtime);
  const obstacleManager = new ObstacleManager(runtime);
  const collectibleManager = new CollectibleManager(runtime);
  const ui = new UIController(runtime);

  runtime.setSubsystems(world, player, obstacleManager, collectibleManager, ui);

  // 4. Mute Button & Audio Toggle
  if (muteBtn) {
    const updateMuteIcon = () => {
      muteBtn.textContent = window.soundEngine.isMuted ? '🔇' : '🔊';
    };
    updateMuteIcon();

    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.soundEngine.toggleMute();
      updateMuteIcon();
    });

    muteBtn.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      window.soundEngine.toggleMute();
      updateMuteIcon();
    }, { passive: false });
  }

  // 5. Pause Button
  if (pauseBtn) {
    const handlePause = (e) => {
      e.stopPropagation();
      runtime.pauseGame();
    };
    pauseBtn.addEventListener('click', handlePause);
    pauseBtn.addEventListener('touchstart', handlePause, { passive: false });
  }

  // 6. User gesture to unlock Web Audio on first interaction
  const unlockAudio = () => {
    if (window.soundEngine) {
      window.soundEngine.resumeContext();
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);

  // 7. Simulated Construct 3 Export Splash Loader
  let progress = 0;
  const loadInterval = setInterval(() => {
    progress += 25;
    if (loaderBar) loaderBar.style.width = `${progress}%`;

    if (progress >= 100) {
      clearInterval(loadInterval);
      setTimeout(() => {
        if (loader) loader.classList.add('hidden');
        // Start engine tick loop
        runtime.start();
      }, 350);
    }
  }, 100);
});

