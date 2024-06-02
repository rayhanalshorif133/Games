export class PlayerHanlder {
    constructor(){
        this.keys = [];

        window.addEventListener('keydown', e => {
            this.keys.push(e.key);
            setTimeout(() => this.keys = [], 100);
        });
        
    }
}