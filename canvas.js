let canvas;
let server = undefined;
let client = undefined;

function setup() {
    canvas = createCanvas(innerWidth, innerHeight * 0.7)
        .parent('canvas-holder');
    windowResized();
}

function draw() {
    background(0);
    if (client) {
        for (let i = 0; i < client.snakes.length; i++) {
            for(let j = 0; j < client.snakes[i].cells.length; j++) {
                let tmpCell = client.snakes[i].cells[j];
                noStroke();
                fill(tmpCell.color[0], tmpCell.color[1], tmpCell.color[2]);
                rect(tmpCell.pos.x * width / client.dimensions.w, tmpCell.pos.y * height / client.dimensions.h, width / client.dimensions.w, height / client.dimensions.h);
            }
        }
    }
}

function windowResized() {
    let mn = 1;
    if (canvas.parent().id === "") {
        mn = min(innerWidth, innerHeight);
    } else {
        mn = min(canvas.parent().clientWidth, Math.floor(innerHeight * 0.7));
    }
    resizeCanvas(mn, mn);
}

function keyPressed() {
    if(keyCode === UP_ARROW) {
        client.sendDirection(0, -1);
    }
    if(keyCode === LEFT_ARROW) {
        client.sendDirection(-1, 0);
    }
    if(keyCode === DOWN_ARROW) {
        client.sendDirection(0, 1);
    }
    if(keyCode === RIGHT_ARROW) {
        client.sendDirection(1, 0);
    }
}