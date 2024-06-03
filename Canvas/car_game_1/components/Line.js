export class Line {
    constructor(game) {
        this.game = game;
        this.line_runing_1 = 0;
        this.line_runing_2 = 150;
    }

    update(ctx) { 
        this.line_runing_1 += 10;
        this.line_runing_2 += 10;
        if(this.game.height == this.line_runing_1) this.line_runing_1 = -10
        if(this.game.height == this.line_runing_2) this.line_runing_2 = -50
    }
    draw(ctx) {
        ctx.fillStyle = '#FFFFFF';

        // left side Lines
        ctx.fillRect(100, this.line_runing_1, 10, 100);
        ctx.fillRect(100, this.line_runing_2, 10, 100);
        // ctx.fillRect(100, 300 + this.line_runing, 10, 100);


        // right side Lines
        // ctx.fillRect(200, 40 + this.line_runing, 10, 100);
        // ctx.fillRect(200, 190 + this.line_runing, 10, 100);
        // ctx.fillRect(200, 340 + this.line_runing, 10, 100);
    }
}