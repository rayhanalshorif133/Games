export class Cloud {
    constructor(game) {
        this.game = game;
        this.cloud_1 = new Image();
        this.cloud_1.src = 'images/clouds/3.png';

        this.cloud_2 = new Image();
        this.cloud_2.src = 'images/clouds/2.png';

        this.setX_1 = 900;
        this.setX_2 = 1100;

        this.height_1 = 200;
        this.width_1 = 120;
        
        this.height_2 = 200;
        this.width_2 = 120;
    }

    update() {
        this.setX_1 -=10;
        this.setX_2 -=20;
        if(this.setX_1 < -180){
            this.setX_1 = 900;
            this.height_1 = this.GETRandom().height;
            this.width_1 = this.GETRandom().width;
        }
        
        if(this.setX_2 < -180){
            this.setX_2 = 900;
            this.height = this.GETRandom().height;
            this.width = this.GETRandom().width;
        }
        
    }

    draw(context) {
        context.drawImage(this.cloud_1, this.setX_1, 0, this.height_1, this.width_1);
        context.drawImage(this.cloud_2, this.setX_2, 0, this.height_2, this.width_2);
    }

    GETRandom(){
        const numbers = [{'height': 200, 'width':120}, {'height': 100, 'width': 80}];
        const randomNum = Math.floor(Math.random() * numbers.length);

        return numbers[randomNum];
    }

}