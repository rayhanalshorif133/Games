var direction = "";

console.log("Hello World");

$(document).on('keyup',function(e){
    if(e.keyCode == 37){
        if(direction != 'right'){
            direction = 'left';
        }
    }else if(e.keyCode == 38){
        if(direction != 'down'){
            direction = 'up';
        }
    }else if(e.keyCode == 39){
        if(direction != 'left'){
            direction = 'right';
        }
    }else if(e.keyCode == 40){
        if(direction != 'up'){
            direction = 'down';
        }
    }

    console.log(direction)
});