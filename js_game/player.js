export class Player {
    constructor(game) {
        this.game = game;
        this.width = 100;
        this.height = 91.3;
        this.x = -100;
        this.y = this.game.height - this.height;
        this.player = document.getElementById('player');
       
    }
    update() {
        this.x = this.x + 1;
        if(this.x > 700){
            this.x = -100;
        }
    }
    draw(context) {
        context.fillStyle = 'red';

        context.drawImage(this.player, this.x, this.y, 80, 80 * this.player.height / this.player.width)


    }
}