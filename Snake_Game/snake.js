var direction = "";
var position_top = 0;
var position_left = 0;
var position_right = 0;
var position_bottom = 0;
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

    for (let i = 1; i <= 18; i++) {
        $(".box_main").append(`<div class='row_${i} flex'></div>`);
        for (let j = 1; j <= 18; j++) {
            const id = `box_${i}_${j}`;
            $(`.row_${i}`).append(`<div class='position_box position_box_color' id='${id}'></div>`);
        }
    }

    randomSankePosition();
};


const randomSankePosition = () => {
    const random_i = Math.floor(Math.random() * 18) + 1;
    const random_j = Math.floor(Math.random() * 18) + 1;
    const id = `#box_${random_i}_${random_j}`;
    $(id).removeClass('position_box_color').addClass('box_food');
};


