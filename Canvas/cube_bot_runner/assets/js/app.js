import {Runner} from './components/runner.js';
import {BackgroundImage} from './components/bg_image.js';




window.addEventListener('load', function(e) {
    const canvas = document.getElementById('canvas');
    const frameRate = 70;
    const ctx = canvas.getContext('2d');

    canvas.height = 320;
    canvas.width = 720;




    class Game{
        constructor(height, width) {
            this.height = height;
            this.width = width;
            this.bgImage = new BackgroundImage(this);
            this.runner = new Runner(this);
        }

        update(){
            this.runner.update();
        }
        draw(context){
            this.runner.draw(context);
            // this.bgImage.draw(context);
        }
    }

    const game = new Game(canvas.height, canvas.width);

    function run(){
        ctx.clearRect(0, 0, canvas.height, canvas.width);
        game.update();
        game.draw(ctx);
        setTimeout(function(){requestAnimationFrame(run)}, frameRate);
    }

    run();
});
