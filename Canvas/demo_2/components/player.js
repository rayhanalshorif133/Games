export class Player{
    constructor(game) {
        this.game = game;
        this.box = document.getElementById('box');
        this.x = 0;
        this.y = this.game.height /2;
        this.width = 30;
        this.height = 30;
        this.speed = 0;
        this.maxSpeed = 10;
    }

    update(playerHanlder) {

        this.y += this.speed;

        if(playerHanlder.keys.includes('ArrowDown')) this.speed = this.maxSpeed;
        else if(playerHanlder.keys.includes('ArrowUp')) this.speed = -this.maxSpeed;
        else this.speed = 0;
    }
    draw(context) {
        context.fillStyle = 'red';
        context.fillRect(this.x, this.y, this.width, this.height)
    }
} 