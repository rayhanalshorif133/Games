export class BackgroundImage{
    constructor(game){
        this.game = game;
        this.image = new Image();
        this.image.src = 'images/bg/create-grass.png';
    }

    update(){}
    draw(context){
        context.drawImage(this.image, 0,390, 100, 50);
    }
}