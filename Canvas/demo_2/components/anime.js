export class Anime {

    constructor(game) {
        this.game = game;
        this.x = 680;
        this.y = 320;
        this.width = 40;
        this.boxs = [
            {
                y: 360,
                bg_color: "green",
                height: 40,
            },
            {
                y: 320,
                bg_color: "blue",
                height: 80,
            },
            {
                y: 320,
                bg_color: "yellow",
                height: 210,
            }
        ];

        const randomIndex = Math.floor(Math.random() * this.boxs.length);
        this.box = this.boxs[randomIndex];
       

    }

    update(context) {
        this.x -= 10;
        if (this.x < -12) {
            const randomIndex = Math.floor(Math.random() * this.boxs.length);
            this.box = this.boxs[randomIndex];
            context.fillStyle = this.box.bg_color;
            context.fillRect(this.x, this.box.y, this.width, this.box.height)
            this.x = 690;
        }
    }
    draw(context) {
        context.fillStyle = this.box.bg_color;
        context.fillRect(this.x, this.box.y, this.width, this.box.height)
    }
}