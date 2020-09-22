class SimpleExplosion{
    static frames = [];
    static fr = 10;
    pos = {x: null, y: null};
    currFrame = 0;
    lastTime = 0;

    constructor(x, y, mill) {
        this.pos.x = x;
        this.pos.y = y;
        this.lastTime = mill;
    }

    draw() {
        if (this.currFrame >= SimpleExplosion.frames.length) return;
        image(SimpleExplosion.frames[this.currFrame], this.pos.x - 20, this.pos.y - 20, 40, 40);
    }

    nextFrame(mill) {
        if (mill - this.lastTime >= 1000 / SimpleExplosion.fr) {
            this.currFrame++;
            this.lastTime = mill;
        }
        if (this.currFrame < SimpleExplosion.frames.length) {
            return this.currFrame;
        }
        return null;
    }

    static loadFrames() {
        SimpleExplosion.frames.push(loadImage("images/SimpleExplosion/0.png"));
        SimpleExplosion.frames.push(loadImage("images/SimpleExplosion/1.png"));
        SimpleExplosion.frames.push(loadImage("images/SimpleExplosion/2.png"));
        SimpleExplosion.frames.push(loadImage("images/SimpleExplosion/3.png"));
        SimpleExplosion.frames.push(loadImage("images/SimpleExplosion/4.png"));
    }
}