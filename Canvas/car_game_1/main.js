import {Line} from './components/Line.js';

window.addEventListener('load', function(e) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 300;
    canvas.height = 450;

    class Game{
        constructor(height,width){
            this.height = height;
            this.width = width;
            this.line = new Line(this);
        }

        update(){
            this.line.update();
        }
        draw(ctx){
            this.line.draw(ctx);
        }
    }

    const game = new Game(canvas.height,canvas.width);

    var fps = 10;
    function animate(){
        
        // make delay

        setTimeout(function(){ //throttle requestAnimationFrame to 20fps
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            game.update(ctx);
            game.draw(ctx);
            requestAnimationFrame(animate)
        }, 1000/fps)


    }

    animate();
});