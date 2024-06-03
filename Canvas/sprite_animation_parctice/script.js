const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const canvas_height = canvas.height = 600;
const canvas_width = canvas.width = 600;

const playerImage = new Image();
playerImage.src = 'shadow_dog.png';
const spriteWidth = 575;
const spriteHeight = 523;
let frameX = 0;
let frameY = 5;
let gameFrame = 0;
const straggerFrames = 5;

function animate(){
    
    ctx.clearRect(0, 0, canvas_width, canvas_height);
    // ctx.drawImage(image, sx,sy,sw,sh,dx,dy,dw,dh);
    ctx.drawImage(playerImage, frameX * spriteWidth, frameY * spriteHeight,spriteWidth,spriteHeight,0,0,spriteWidth, spriteHeight);

    if(gameFrame % straggerFrames == 0){
        frameX < 4? frameX++ : frameX = 0;
    }


    gameFrame++;
    requestAnimationFrame(animate);

}

animate();