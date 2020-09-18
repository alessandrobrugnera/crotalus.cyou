class Snake {

    static LOCAL_PROPERTIES = ["peerjsConnection"];

    properties = {};
    cells = [];

    constructor() {

    }

    // Returns true only if this has the head inside snake.
    collidingWith(snake) {
        if (this.cells[0]) {
            for (let i = 0; i < snake.cells.length; i++) {
                if (snake.cells[i].pos.x === this.cells[0].pos.x && snake.cells[i].pos.y === this.cells[0].pos.y) {
                    return true;
                }
            }
        }
        return false;
    }

    initializeSnake(offsetX, offsetY) {
        Snake.initializeSnake(this, offsetX, offsetY);
        return this;
    }

    static initializeSnake(snake, offsetX, offsetY) {
        snake.properties = {direction: {x: 0, y: -1}};
        for (let i = 0; i < 5; i++) {
            snake.cells.push(new SnakeCell(0 + offsetX, i + offsetY));
        }
    }

    stringify() {
        let tmpEl = {properties: {}, cells: []};
        for (let lab in this.properties) {
            if (Snake.LOCAL_PROPERTIES.includes(lab)) continue;
            tmpEl.properties[lab] = this.properties[lab];
        }
        tmpEl.cells = SnakeCell.stringifyArray(this.cells);
        return tmpEl;
    }

    static stringifyArray(arr) {
        let toRet = [];
        for (let i = 0; i < arr.length; i++) {
            toRet.push(arr[i].stringify());
        }
        return toRet;
    }

}