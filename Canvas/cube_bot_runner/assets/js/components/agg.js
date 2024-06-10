export class Agg {
    constructor(game) {
        this.game = game;
        this.agg_1 = new Image();
        this.agg_1.src = './images/others/Eggs-01.png';
        this.agg_2 = new Image();
        this.agg_2.src = './images/others/Eggs-02.png';

        this.x = 700;
    }

    update(context) { 
        this.x -= 10;

        if(this.x < -100){
            this.x = 700;
        }
    }
    draw(context) { 
        context.drawImage(this.agg_1, this.x, 197, 100, 100);
        context.drawImage(this.agg_2, this.x, 197, 100, 100);
    }
}