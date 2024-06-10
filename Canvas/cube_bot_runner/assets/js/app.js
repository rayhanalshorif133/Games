import {Runner} from './components/runner.js';
import {BackgroundImage} from './components/bg_image.js';
import {Cloud} from './components/cloud.js';
import {Agg} from './components/agg.js';




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
            this.cloud = new Cloud(this);
            this.agg = new Agg(this);
        }

        update(){
            this.runner.update();
            this.cloud.update();
            this.agg.update();
        }
        draw(context){
            this.bgImage.draw(context);
            this.cloud.draw(context);
            this.agg.draw(context);
            this.runner.draw(context);
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
