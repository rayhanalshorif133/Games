import { Player } from '../components/player.js';
import { PlayerHanlder } from '../components/playerHanlder.js';
import { Anime } from '../components/Anime.js';
import { Wall } from '../components/Wall.js';

window.addEventListener('load', function (e) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 700;
    canvas.height = 400;

    class Game {
        constructor(height, width) {
            this.height = height;
            this.width = width;
            this.player = new Player(this);
            this.playerHanlder = new PlayerHanlder(this);
            this.anime = new Anime(this);
            this.wall = new Wall(this);
        }

        update(context) {
            this.player.update(this.playerHanlder);
            this.anime.update(context);
        }
        draw(context) {
            this.player.draw(context);
            this.anime.draw(context);
            this.wall.draw(context);
        }
    }

    const game = new Game(canvas.height, canvas.width);


    let lastTime = 0;
    const delay = 1000 / 10; // 30 frames per second, adjust as needed

    function run(currentTime) {
        const deltaTime = currentTime - lastTime;

        if (deltaTime >= delay) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            game.update(ctx);
            game.draw(ctx);
            lastTime = currentTime;
        }
        requestAnimationFrame(run);
    }

    requestAnimationFrame(run);
});