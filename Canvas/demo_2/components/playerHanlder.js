export class PlayerHanlder {
    constructor(){
        this.keys = [];

        window.addEventListener('keydown', e => {
            if((e.key == 'ArrowDown' || e.key == 'ArrowUp') && !this.keys.length){
                this.keys.push(e.key);
            }
        });

        window.addEventListener('keyup', e => {
            if((e.key == 'ArrowDown' || e.key == 'ArrowUp') && this.keys.length){
               this.keys.pop();
            }
        });
        
    }
}