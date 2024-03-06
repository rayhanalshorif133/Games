var direction = "";
var position_top = 0;
var position_left = 0;
var position_right = 0;
var position_bottom = 0;
var snake = [];
var snake_path = [];
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

    randomSankeFood();
    handleSnake();
    autoMoveSnake();
};


const randomSankeFood = () => {
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
        const lastindex = length - 1;
        if (index === 0) {
            $(id).removeClass().addClass('position_box box_head');
        } else if (index === lastindex) {
            $(id).removeClass().addClass('position_box box_tail');
        }
        else {
            $(id).removeClass().addClass('position_box box_body');
        }
    });

    
};

const handleSnakePath = () => {
    snake_path.forEach((snake, index) => {
        const id = `#box_${snake.i}_${snake.j}`;
        $(id).removeClass().addClass('position_box position_box_color');
    });
};

const autoMoveSnake = () => {
    var position = 0; 
    setInterval(() => {
        snake.forEach((item, index) => {
            const id = `#box_${item.i}_${item.j}`;
            position = position + 10;
            $(id).css({
                transform: `translate(${position}px, 0px)`,
                transition: "all 2s"
            })
        });
    }, 250);
};


