class SpeedBooster {
    pos = {x: 0, y: 0}
    properties = {}

    constructor(x, y) {
        this.pos.x = x;
        this.pos.y = y;
    }

    stringify() {
        return {type: this.constructor.name, pos: this.pos, properties: this.properties};
    }
}