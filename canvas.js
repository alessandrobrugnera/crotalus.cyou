let canvas;
let server = undefined;
let client = undefined;

let images = {};
let visualEffets = [];
function preload() {
    SimpleExplosion.loadFrames();
    images.fs = loadImage("images/fs.jpg");
}

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
                if (i === client.mySnakeIndex && j === 0) {
                    fill(tmpCell.color[0], tmpCell.color[1], tmpCell.color[2], 80);
                    text("YOU", tmpCell.pos.x * width / client.dimensions.w, tmpCell.pos.y * height / client.dimensions.h);
                }
                fill(tmpCell.color[0], tmpCell.color[1], tmpCell.color[2]);
                rect(tmpCell.pos.x * width / client.dimensions.w, tmpCell.pos.y * height / client.dimensions.h, width / client.dimensions.w, height / client.dimensions.h);
            }
        }
        for (let i = 0; i < client.things.length; i++) {
            let tmpThing = client.things[i];
            if (tmpThing.type === "ClassicFood") {
                noStroke();
                fill(0, 255, 0);
            } else if (tmpThing.type === "SpeedBooster") {
                noStroke();
                fill(0, 0, 255);
            }
            rect(tmpThing.pos.x * width / client.dimensions.w, tmpThing.pos.y * height / client.dimensions.h, width / client.dimensions.w, height / client.dimensions.h);
        }
        for (let i = 0; i < client.receivedEvents.length; i++) {
            let eve = client.receivedEvents[i];
            if (typeof eve !== "object") continue;
            if (eve.name === "explosion") {
                visualEffets.push(new SimpleExplosion(eve.data.x * width / client.dimensions.w, eve.data.y * height / client.dimensions.h, millis()));
                client.removeEvent(i--);
            } else if (eve.name === "you-won") {
                noLoop();
                alert("YOU WON!");
            } else if (eve.name === "you-lost") {
                noLoop();
                alert("YOU LOST : (");
            }
        }
        for (let i = 0; i < visualEffets.length; i++) {
            visualEffets[i].draw();
            if (visualEffets[i].nextFrame(millis()) === null) {
                visualEffets.splice(i, 1);
                i--;
            }
        }
    }
    image(images.fs, width - 10, 0);
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

function openFullscreen() {
    let elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
    }
}

/* Close fullscreen */
function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
    }
}

function mouseClicked() {
    if (mouseX > width - 10 && mouseX <= width && mouseY < 10 && mouseY >= 0) {
        toggleCanvasFullscreen();
        return;
    }
    if (client) {
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
}

function toggleCanvasFullscreen() {
    if (canvas.parent().id === "") {
        unfullscreenCanvas();
        closeFullscreen();
    } else {
        fullscreenCanvas();
        openFullscreen();
    }
}

function keyPressed() {
    if(keyCode === UP_ARROW || keyCode === 87) {  // W
        client.sendDirection(0, -1);
    }
    if(keyCode === LEFT_ARROW || keyCode === 65) { // A
        client.sendDirection(-1, 0);
    }
    if(keyCode === DOWN_ARROW || keyCode === 83) { // S
        client.sendDirection(0, 1);
    }
    if(keyCode === RIGHT_ARROW || keyCode === 68) { // D
        client.sendDirection(1, 0);
    }
    if (keyCode === 70) { // F
        toggleCanvasFullscreen();
    }
}