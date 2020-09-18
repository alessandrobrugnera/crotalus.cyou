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
    let finalW = 1, finalH = 1;
    if (client && client.dimensions) {
        let matchAspectRatio = client.dimensions.w / client.dimensions.h;
        let a, b;
        if (canvas.parent().id === "") {
            a = innerWidth;
            b = innerHeight;
        } else {
            a = canvas.parent().clientWidth;
            b = Math.floor(innerHeight * 0.85);
        }
        let screenAspectRatio = a / b;
        if (matchAspectRatio >= 1) {
            finalH = b;
            finalW = finalH * matchAspectRatio;
        } else {
            finalW = a;
            finalH = finalW / matchAspectRatio;
        }
        if (finalW > a) {
            finalH *= a/finalW;
            finalW = a;
        } else if (finalH > b) {
            finalW *= b/finalW;
            finalH = b;
        }
    } else {
        let mn = 1;
        if (canvas.parent().id === "") {
            mn = min(innerWidth, innerHeight);
        } else {
            mn = min(canvas.parent().clientWidth, Math.floor(innerHeight * 0.85));
        }
        finalW = finalH = mn;
    }
    resizeCanvas(Math.floor(finalW), Math.floor(finalH));
}

function mouseClicked() {
    if (mouseX > width - 10 && mouseX <= width && mouseY < 10 && mouseY >= 0) {
        if (canvas.parent().id === "") {
            unfullscreenCanvas();
        } else {
            fullscreenCanvas();
        }
    }
    let coeffM = height / width;
    let biggerThanMX = mouseY > coeffM * mouseX;
    let biggerThanHmMX = mouseY > height - coeffM * mouseX;
    if (biggerThanMX && biggerThanHmMX) { // This is DOWN
        client.sendDirection(0, 1);
    } else if (biggerThanMX && !biggerThanHmMX) { // This is LEFT
        client.sendDirection(-1, 0);
    } else if (!biggerThanMX && !biggerThanHmMX) { // This is UP
        client.sendDirection(0, -1);
    } else if (!biggerThanMX && biggerThanHmMX) { // This is RIGHT
        client.sendDirection(1, 0);
    }
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