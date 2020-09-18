class SnakeCell {
    pos = {x: 0, y: 0};
    color = [255, 255, 255];

    constructor(x, y, color) {
        if (typeof x === "undefined" || typeof y === "undefined") {
            throw new Error("Coordinates needed!");
        }
        this.pos.x = x;
        this.pos.y = y;
        if (color) {
            this.color = color;
        }
    }

    stringify() {
        return {pos: this.pos, color: this.color};
    }

    static stringifyArray(arr) {
        let toRet = [];
        for (let i = 0; i < arr.length; i++) {
            toRet.push(arr[i].stringify());
        }
        return toRet;
    }
}