export class Wall{
    constructor(game){
        this.game = game;
        
        this.wall_1 = document.getElementById("wall");
        this.dx = 100;
        this.dy = 360;
        this.dWidth = 40;
        this.dHeight = 40;
        this.count = 0;
        
    }

    update(){}
    draw(context){
        context.drawImage(this.wall_1, 0, this.dy, this.dWidth, this.dHeight);
        context.drawImage(this.wall_1, 40, this.dy, this.dWidth, this.dHeight);
        context.drawImage(this.wall_1, 80, this.dy, this.dWidth, this.dHeight);
        context.drawImage(this.wall_1, 120, this.dy, this.dWidth, this.dHeight);
        context.drawImage(this.wall_1, 160, this.dy, this.dWidth, this.dHeight);
        context.drawImage(this.wall_1, 200, this.dy, this.dWidth, this.dHeight);
    }
}