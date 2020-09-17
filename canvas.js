let canvas;

function setup() {
    canvas = createCanvas(innerWidth, innerHeight * 0.7)
        .parent('canvas-holder');
    windowResized();
}

function draw() {
    background(0);
}

function windowResized() {
    resizeCanvas(canvas.parent().clientWidth, Math.floor(innerHeight * 0.7));
}