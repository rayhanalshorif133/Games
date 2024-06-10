export class Runner {
    constructor(game) {
        this.game = game;
        this.image = new Image();
        this.image.src = 'images/cube-man/03_run/0.png';
        this.counter = 0;
    }

    update() {
        this.setImage();
    }

    draw(context) {
        context.drawImage(this.image, 0, 150, 200, 120);
    }

    setImage() {
        this.image.src = `images/cube-man/03_run/${this.counter}.png`;
        this.counter += 1;
        if (this.counter > 10) {
            this.counter = 0;
        }
    }
}