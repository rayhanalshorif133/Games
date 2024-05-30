export class InputHandler{
    constructor(game){
        this.game = game;
        this.keys = [];
        window.addEventListener("keydown", event => {
            console.log(event.key)
            if(event.key == "ArrowDown"){
                this.game.player.y += 5;
            }
            else if(event.key == "ArrowUp"){
                this.game.player.y -= 5;
            }
            else if(event.key == "ArrowRight"){
                this.game.player.x += 5;
            }else{
                this.game.player.x -= 5;
            }
        });
    }
    update(){

    }
    draw(){

    }
} 