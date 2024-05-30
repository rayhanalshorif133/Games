import {Player} from './player.js';
import {InputHandler} from './input.js';

window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas_1');
    const ctx = canvas.getContext('2d');
    const GET_PALYER = document.getElementById('player');
    var number = 0;
    var src = '';

    canvas.width = 700;
    canvas.height = 400;

    class Game {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.player = new Player(this);
            this.player = new SETWALL_1(this);
            this.input = new InputHandler(this);
        }

        update() {
            this.player.update();
        }
        draw(context) {
            this.player.draw(context);
        }
    }


    const game = new Game(canvas.width,canvas.height);

    function animate(){
        ctx.clearRect(0,0,canvas.width,canvas.height);

        if(number == 14){
            number = 0;
        }
        number++;
        src = `./images/star_bug_sprites/${number}.png`;
        GET_PALYER.setAttribute('src',src);
        

        game.update();
        game.draw(ctx);
        requestAnimationFrame(animate);
    }

    animate();

});