class Snake {

    static LOCAL_PROPERTIES = ["peerjsConnection"];

    properties = {};
    cells = [];

    constructor() {

    }

    // Returns true only if this has the head inside snake.
    isCollidingWith(snake) {
        if (this.cells[0]) {
            for (let i = 0; i < snake.cells.length; i++) {
                if (snake.cells[i].pos.x === this.cells[0].pos.x && snake.cells[i].pos.y === this.cells[0].pos.y) {
                    return true;
                }
            }
        }
        return false;
    }

    isSelfColliding() {
        if (this.cells[0]) {
            for (let i = 1; i < this.cells.length; i++) {
                if (this.cells[i].pos.x === this.cells[0].pos.x && this.cells[i].pos.y === this.cells[0].pos.y) {
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

    edgeTeleport(width, height) {
        if (this.cells[0]) {
            let snakeHead = this.cells[0];
            if (snakeHead.pos.x < 0) {
                snakeHead.pos.x = width - 1;
            }
            if (snakeHead.pos.x >= width) {
                snakeHead.pos.x = 0;
            }
            if (snakeHead.pos.y < 0) {
                snakeHead.pos.y = height - 1;
            }
            if (snakeHead.pos.y >= height) {
                snakeHead.pos.y = 0;
            }
        }
    }

    edgeBounce(width, height) {
        if (this.cells[0]) {
            let snakeHead = this.cells[0];
            //TODO Adjust mechanism (now it bounces)
            if (snakeHead.pos.x > width || snakeHead.pos.x < 0) {
                this.properties.direction.x *= -1;
                snakeHead.pos.x += this.properties.direction.x * 2;
            }
            if (snakeHead.pos.y > height || snakeHead.pos.y < 0) {
                this.properties.direction.y *= -1;
                snakeHead.pos.y += this.properties.direction.y * 2;
            }
            //END TODO
        }
    }
}