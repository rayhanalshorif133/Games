const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const canvas_height = canvas.height = 600;
const canvas_width = canvas.width = 600;

const playerImage = new Image();
playerImage.src = 'shadow_dog.png';
const spriteWidth = 575;
const spriteHeight = 523;
let frameX = 0;
let frameY = 3;
let gameFrame = 0;
const straggerFrames = 5;
let countOfFrames = 6;

function animate(){
    
    ctx.clearRect(0, 0, canvas_width, canvas_height);
    // ctx.drawImage(image, sx,sy,sw,sh,dx,dy,dw,dh);
    ctx.drawImage(playerImage, frameX * spriteWidth, frameY * spriteHeight,spriteWidth,spriteHeight,0,0,spriteWidth, spriteHeight);

    if(gameFrame % straggerFrames == 0){
        frameX < countOfFrames? frameX++ : frameX = 0;
    }


    gameFrame++;
    requestAnimationFrame(animate);

}






$("#option").on("change", function(){
    const value = $(this).val();
    frameY = value;
    if(value == 3){
        countOfFrames = 8 
    }
    else if(value == 4){
        countOfFrames = 10 
    }
    else if(value == 5){
        countOfFrames = 4
    }
    else if(value == 6){
        countOfFrames = 6
    }
    else if(value == 7){
        countOfFrames = 6
    }
    else if(value == 8){
        countOfFrames = 11
    } else if(value == 9){
        countOfFrames = 3
    }
    else{
        countOfFrames = 6
    }
});

animate();