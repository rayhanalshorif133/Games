export class Anime{
    constructor(game){
        this.game = game;
        this.x = 680;
        this.y = 320;
        this.width = 40;
        this.height = 80;
    }

    update(){
        this.x -= 10;
    }
    draw(context){
        context.fillStyle = 'green';
        context.fillRect(this.x, this.y, this.width, this.height)
    }
}