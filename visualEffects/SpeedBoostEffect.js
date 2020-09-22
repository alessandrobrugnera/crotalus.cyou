class SpeedBoostEffect {
    static frames = [];
    static fr = 1;
    pos = {x: null, y: null};
    currFrame = 0;
    lastTime = 0;

    constructor(x, y, mill) {
        this.pos.x = x;
        this.pos.y = y;
        this.lastTime = mill;
    }

    draw() {
        if (this.currFrame >= SpeedBoostEffect.frames.length) return;
        image(SpeedBoostEffect.frames[this.currFrame], this.pos.x - 19, this.pos.y - 12, 38, 24);
    }

    nextFrame(mill) {
        if (mill - this.lastTime >= 1000 / SpeedBoostEffect.fr) {
            this.currFrame++;
            this.lastTime = mill;
        }
        if (this.currFrame < SpeedBoostEffect.frames.length) {
            return this.currFrame;
        }
        return null;
    }

    static loadFrames() {
        SpeedBoostEffect.frames.push(loadImage("images/SpeedBoostEffect/0.png"));
    }
}