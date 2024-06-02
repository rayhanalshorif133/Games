export class Player{
    constructor(game) {
        this.game = game;
        this.box = document.getElementById('box');
        this.x = 0;
        this.y = this.game.height /2;
        this.width = 30;
        this.height = 30;
    }

    update(playerHanlder) {
        console.log(playerHanlder.keys)
        if(playerHanlder.keys == 'ArrowDown') this.y += 10;
        if(playerHanlder.keys == 'ArrowUp') this.y -= 10;
        // this.x += 10;
        // if(this.x == 700){
        //     this.x = 0;
        // }
    }
    draw(context) {
        context.fillStyle = 'red';
        context.fillRect(this.x, this.y, this.width, this.height)
    }
} 