var direction = "";
var position_top = 0;
var position_left = 0;
var position_right = 0;
var position_bottom = 0;
const snake = [];
// any key
document.addEventListener("keydown", function (event) {
    direction = event.key;
    moveSnake();
}
);

function moveSnake() {
    console.log(direction);
}

$(()=>{
    setAutoPath();
})

const setAutoPath = () => {
    const box_main_height = $(".box_main").height();
    const box_main_width = $(".box_main").width();

    for (let i = 0; i < 18; i++) {
        $(".box_main").append(`<div class='row_${i} flex'></div>`);
        for (let j = 0; j < 18; j++) {
            const id = `box_${i}_${j}`;
            $(`.row_${i}`).append(`<div class='position_box position_box_color' id='${id}'></div>`);
        }
    }

    randomSankePosition();
    handleSnake();
    autoMoveSnake();
};


const randomSankePosition = () => {
    const random_i = Math.floor(Math.random() * 18) + 1;
    const random_j = Math.floor(Math.random() * 18) + 1;
    const id = `#box_${random_i}_${random_j}`;
    $(id).removeClass('position_box_color').addClass('box_food');
};

snake.push({ i: 5, j: 11 });
snake.push({ i: 5, j: 12 });
snake.push({ i: 5, j: 13 });

const handleSnake = () => {
    const length = snake.length;
    snake.forEach((snake, index) => {
        const id = `#box_${snake.i}_${snake.j}`;
        const prev_id = `#box_${snake.i}_${snake.j - 1}`;
        const lastindex = length - 1;
        if (index === 0) {
            $(id).removeClass().addClass('position_box box_head');
        } else if (index === lastindex) {
            // $(id).removeClass().addClass('position_box box_tail');
            $(id).removeClass().addClass('position_box position_box_color');
        }
        else {
            $(id).removeClass().addClass('position_box box_body');
        }
    });

    
};

const autoMoveSnake = () => {
    setInterval(() => {
        const head = snake[0];
        const tail = snake[snake.length - 1];

        snake.unshift({ i: head.i, j: head.j - 1 });
        snake.pop();
        handleSnake();

        // snake.pop();
        

    }, 2000);
};


