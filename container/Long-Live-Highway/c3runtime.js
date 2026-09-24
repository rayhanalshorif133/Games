/**
 * Construct 3 HTML5 Runtime Simulator & Asset Orchestrator
 * Compatible with Construct 3 Project Exports & Engine Lifecycle
 */

(function () {
    "use strict";

    class C3Runtime {
        constructor() {
            this.canvas = null;
            this.game = null;
            this.assets = {
                images: {},
                totalToLoad: 0,
                loadedCount: 0
            };
            this.lastTime = performance.now();
            this.targetWidth = 1080;
            this.targetHeight = 1920;
        }

        init(canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                console.error("Canvas element not found:", canvasId);
                return;
            }

            this.canvas.width = this.targetWidth;
            this.canvas.height = this.targetHeight;

            this.setupResponsiveScaling();
            window.addEventListener("resize", () => this.setupResponsiveScaling());

            this.preloadAssets(() => {
                this.onAssetsLoaded();
            });
        }

        setupResponsiveScaling() {
            const container = document.getElementById("game-container");
            const w = window.innerWidth;
            const h = window.innerHeight;
            const targetRatio = this.targetWidth / this.targetHeight; // 1080 / 1920 = 0.5625
            const windowRatio = w / h;

            let finalW, finalH;
            if (windowRatio > targetRatio) {
                // Window is wider than target ratio: scale by height
                finalH = h;
                finalW = h * targetRatio;
            } else {
                // Window is taller than target ratio: scale by width
                finalW = w;
                finalH = w / targetRatio;
            }

            if (container) {
                container.style.width = `${Math.floor(finalW)}px`;
                container.style.height = `${Math.floor(finalH)}px`;
            }
        }

        preloadAssets(callback) {
            const assetList = [
                "car_red.png",
                "car_blue.png",
                "car_yellow.png",
                "car_truck.png",
                "car_police.png",
                "house_terracotta.png",
                "house_blue.png",
                "crops_field.png",
                "tree_large.png",
                "tree_medium.png",
                "bird_f1.png",
                "bird_f2.png",
                "bird_f3.png",
                "pickup_fuel.png",
                "pickup_coin.png",
                "pickup_nitro.png",
                "pickup_shield.png",
                "hazard_oil.png",
                "road_texture.png",
                "btn_brake.png",
                "btn_nitro.png",
                "hud_coin.png",
                "hud_fuel_icon.png",
                "hud_nitro_icon.png"
            ];

            this.assets.totalToLoad = assetList.length;

            const progressBar = document.getElementById("loading-progress");
            const loadingText = document.getElementById("loading-text");

            assetList.forEach((filename) => {
                const img = new Image();
                img.src = `images/${filename}`;
                img.onload = () => {
                    this.assets.images[filename] = img;
                    this.assets.loadedCount++;
                    const pct = Math.floor((this.assets.loadedCount / this.assets.totalToLoad) * 100);
                    if (progressBar) progressBar.style.width = `${pct}%`;
                    if (loadingText) loadingText.innerText = `Loading Assets: ${pct}%`;

                    if (this.assets.loadedCount >= this.assets.totalToLoad) {
                        setTimeout(callback, 200);
                    }
                };
                img.onerror = () => {
                    console.warn(`Failed to load asset: ${filename}`);
                    this.assets.loadedCount++;
                    if (this.assets.loadedCount >= this.assets.totalToLoad) {
                        setTimeout(callback, 200);
                    }
                };
            });
        }

        onAssetsLoaded() {
            const loader = document.getElementById("loading-screen");
            if (loader) {
                loader.style.opacity = "0";
                setTimeout(() => loader.style.display = "none", 400);
            }

            this.game = new Game(this.canvas, this.assets);
            this.lastTime = performance.now();
            requestAnimationFrame((time) => this.loop(time));
        }

        loop(currentTime) {
            const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
            this.lastTime = currentTime;

            if (this.game) {
                this.game.update(dt * 60);
                this.game.render();
            }

            requestAnimationFrame((time) => this.loop(time));
        }
    }

    window.c3runtime = new C3Runtime();
})();
