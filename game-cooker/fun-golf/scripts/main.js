// Fun Golf - Construct 3 Startup & Main Orchestrator

runOnStartup(async runtime => {
    console.log("Construct 3 Fun Golf Runtime Initialized. Layout: 1080 x 1920");

    const canvas = document.getElementById("c3canvas");
    if (!canvas) {
        console.error("Canvas element #c3canvas not found");
        return;
    }

    // Set internal render resolution to exact 1080 x 1920
    canvas.width = 1080;
    canvas.height = 1920;

    // Launch Game Engine
    window.gameEngine = new GameEngine(canvas);
});
