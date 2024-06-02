window.addEventListener('load', function(e) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 700;
    canvas.height = 400;
    

    class Game {
        constructor(height, width){
            this.height = height;
            this.width = width;
        }

        update(){
            console.log('Updating')
        }

        draw(){
            console.log("draw");
        }
    }


    const game = new Game(canvas.width, canvas.height);
    
    function animate(){
        game.update();
        game.draw(ctx);

        requestAnimationFrame(animate);
    }

    animate();

});