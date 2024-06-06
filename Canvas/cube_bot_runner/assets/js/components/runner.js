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
        context.drawImage(this.image, 10,390, 100, 50);
    }

    setImage() {
        this.counter += 1;
        this.image.src = `images/cube-man/03_run/${this.counter}.png`;
        if(this.counter > 11){
            this.counter = 0;
        }
    }
}