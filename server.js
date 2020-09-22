class Server {
    static CLASSIC_MODE = 0;
    static ONE_HOT_MODE = 1;
    static SINGLE_MODE = 2;

    static IN_LOBBY = 0;
    static IN_GAME = 1;
    static GAME_ENDED = 2;

    simFrameRate = 1;
    peerDispatchRate = 1;

    width = 0;
    height = 0;
    snakes = [];
    things = [];
    properties = {};
    peer = undefined;
    mode = -1;
    gameState = -1;
    simulationIntervalId = -1;
    peerDispatchInterval = -1;

    constructor(width, height, mode) {
        if (mode !== Server.CLASSIC_MODE && mode !== Server.ONE_HOT_MODE && mode !== Server.SINGLE_MODE) {
            throw new Error("Invalid server mode specified");
        }
        if (width <= 0 || height <= 0) {
            throw new Error("Bad grid dimensions!");
        }

        this.peer = new peerjs.Peer({secure: true, serialization: "json"});

        this.width = width;
        this.height = height;

        this.mode = mode;

        this.gameState = Server.IN_LOBBY;

        this.peer.on('open', () => {
            this.peer.on("connection", (conn) => {
                if (this.gameState === Server.IN_LOBBY) {
                    this.snakes.push(
                        (new Snake()).initializeSnake(
                            Server.random(0, this.width),
                            Server.random(0, this.height)
                        ));
                    this.snakes[this.snakes.length - 1].properties.peerjsConnection = conn;
                    this.snakes[this.snakes.length - 1].properties.dead = false;
                } else {
                    conn.send({error: {message: "Game already started."}});
                    conn.close();
                }
            });
        });
        this.peer.on("error", (e) => {
            if (e.type === 'server-error') {
                alert("Game server error: " + e.message);
                alert("The page will now refresh! Sorry for the inconvenience");
                location.reload();
            }
        });

        this.changePeerDispatchRate(this.peerDispatchRate);
    }

    startGame() {
        if (this.gameState !== Server.IN_LOBBY) {
            return;
        }
        this.gameState = Server.IN_GAME;

        for (let i = 0; i < this.snakes.length; i++) {
            if (this.mode === Server.CLASSIC_MODE) {
                this.snakes[i].properties.peerjsConnection.on("data", (dt) => {
                    if (dt.direction) {
                        dt.direction.x = Math.floor(dt.direction.x);
                        dt.direction.y = Math.floor(dt.direction.y);
                        if (Math.abs(dt.direction.x + dt.direction.y) === 1) {
                            // TODO Two rapid changes will do the same as a single reverse action : (
                            if (this.snakes[i].properties.direction.x !== -dt.direction.x && this.snakes[i].properties.direction.y !== -dt.direction.y) {
                                this.snakes[i].properties.direction = dt.direction;
                            }
                        }
                    }
                });
            } else if (this.mode === Server.SINGLE_MODE) {
                this.snakes[i].properties.peerjsConnection.on("data", (dt) => {
                    if (dt.direction) {
                        dt.direction.x = Math.floor(dt.direction.x);
                        dt.direction.y = Math.floor(dt.direction.y);
                        if (Math.abs(dt.direction.x + dt.direction.y) === 1) {
                            this.snakes[i].properties.direction = dt.direction;
                        }
                    }
                });
            } else if (this.mode === Server.ONE_HOT_MODE) {
                this.snakes[i].properties.peerjsConnection.on("data", (dt) => {
                    if (dt.direction) {
                        dt.direction.x = Math.floor(dt.direction.x);
                        dt.direction.y = Math.floor(dt.direction.y);
                        if (Math.abs(dt.direction.x + dt.direction.y) === 1) {
                            // TODO Two rapid changes will do the same as a single reverse action : (
                            if (this.snakes[i].properties.direction.x !== -dt.direction.x && this.snakes[i].properties.direction.y !== -dt.direction.y) {
                                this.snakes[i].properties.direction = dt.direction;
                            }
                        }
                    }
                });
            }
        }

        // Actually it starts the physic engine
        this.changeSimFrameRate(this.simFrameRate);
    }

    simFrame = 0;

    runSimulation() {
        if (this.mode === Server.CLASSIC_MODE) {
            this.runClassicSimulation();
        } else if (this.mode === Server.SINGLE_MODE) {
            this.runSinglePlayerSimulation();
        } else if (this.mode === Server.ONE_HOT_MODE) {
            this.runOneHotSimulation();
        }
    }

    runClassicSimulation() {
        let aliveSnakes = 0;
        for (let i = 0; i < this.snakes.length; i++) {
            let currSnake = this.snakes[i];
            if (!currSnake.properties.dead) {
                aliveSnakes++;

                for (let j = currSnake.cells.length - 1; j > 0; j--) {
                    currSnake.cells[j].pos.x = currSnake.cells[j - 1].pos.x;
                    currSnake.cells[j].pos.y = currSnake.cells[j - 1].pos.y;
                }
                let snakeHead = currSnake.cells[0];
                if (snakeHead) {
                    snakeHead.pos.x += currSnake.properties.direction.x;
                    snakeHead.pos.y += currSnake.properties.direction.y;
                    snakeHead.color = Colors.RED;

                    currSnake.edgeBounce(this.width, this.height);

                    for (let j = 0; j < this.snakes.length; j++) {
                        if (i === j) continue;
                        if (currSnake.isCollidingWith(this.snakes[j])) {
                            currSnake.properties.dead = true;
                        }
                    }
                    if (currSnake.isSelfColliding()) {
                        currSnake.properties.dead = true;
                    }

                    for (let j = 0; j < this.things.length; j++) {
                        if (typeof this.things[j] !== 'object') continue;
                        if (this.things[j].constructor.name === 'ClassicFood') {
                            if (Server.posEq(snakeHead.pos, this.things[j].pos)) {
                                currSnake.cells.push(new SnakeCell(null, null));
                                this.things[j].properties.toBeRemoved = true;
                            }
                        }
                    }
                }
            }
        }

        if (aliveSnakes === 1) {
            // Kill simulation. Game ended
            clearInterval(this.simulationIntervalId);
            this.gameState = Server.GAME_ENDED;
            for (let i = 0; i < this.snakes.length; i++) {
                if (!this.snakes[i].properties.dead) {
                    this.snakes[i].properties.peerjsConnection.send({event: "you-won"});
                } else {
                    this.snakes[i].properties.peerjsConnection.send({event: "you-lost"});
                }
            }
        }

        this.clearThings();

        if (this.countThings("ClassicFood") < Math.ceil(this.snakes.length / 2)) {
            this.things.push(new ClassicFood(Server.random(0, this.width), Server.random(0, this.height)));
        }
        this.simFrame++;
    }

    runSinglePlayerSimulation() {
        if (this.snakes[0]) {
            let snake = this.snakes[0];
            if (!snake.properties.dead) {
                for (let j = snake.cells.length - 1; j > 0; j--) {
                    snake.cells[j].pos.x = snake.cells[j - 1].pos.x;
                    snake.cells[j].pos.y = snake.cells[j - 1].pos.y;
                }
                if (snake.cells[0]) {
                    let head = snake.cells[0];
                    head.pos.x += snake.properties.direction.x;
                    head.pos.y += snake.properties.direction.y;
                    head.color = Colors.RED;

                    snake.edgeTeleport(this.width, this.height);

                    for (let j = 0; j < this.things.length; j++) {
                        if (typeof this.things[j] === 'object' && this.things[j].constructor.name === 'ClassicFood') {
                            if (Server.posEq(head.pos, this.things[j].pos)) {
                                snake.cells.push(new SnakeCell(null, null));
                                this.things[j].properties.toBeRemoved = true;
                            }
                        }
                    }
                }
                if (snake.isSelfColliding()) {
                    snake.properties.dead = true;
                }
            } else {
                clearInterval(this.simulationIntervalId);
                snake.properties.peerjsConnection.send({event: "you-lost"});
            }
        }

        this.clearThings();

        if (this.countThings("ClassicFood") < 1) {
            this.things.push(new ClassicFood(Server.random(0, this.width), Server.random(0, this.height)));
        }
        this.simFrame++;
    }

    runOneHotSimulation() {
        let aliveSnakes = 0;
        for (let i = 0; i < this.snakes.length; i++) {
            let currSnake = this.snakes[i];
            if (typeof currSnake.properties.speedBoost === "undefined") {
                currSnake.properties.speedBoost = 1;
            }
            for (let j = 0; j < currSnake.cells.length; j++) {
                if (currSnake.properties.dead) {
                    currSnake.cells[j].color = Colors.BLUE;
                } else if (currSnake.properties.isHot) {
                    currSnake.cells[j].color = Colors.RED;
                } else {
                    currSnake.cells[j].color = Colors.WHITE;
                }
            }
            if (!currSnake.properties.dead) {
                aliveSnakes++;

                for (let j = currSnake.cells.length - 1; j > 0; j--) {
                    currSnake.cells[j].pos.x = currSnake.cells[j - 1].pos.x;
                    currSnake.cells[j].pos.y = currSnake.cells[j - 1].pos.y;
                }

                let snakeHead = currSnake.cells[0];
                if (snakeHead) {
                    snakeHead.pos.x += currSnake.properties.direction.x * currSnake.properties.speedBoost;
                    snakeHead.pos.y += currSnake.properties.direction.y * currSnake.properties.speedBoost;
                    snakeHead.color = Colors.RED;

                    currSnake.edgeTeleport(this.width, this.height);

                    for (let j = 0; j < this.things.length; j++) {
                        if (typeof this.things[j] !== "object") continue;
                        if (this.things[j].constructor.name === 'ClassicFood') {
                            if (Server.posEq(snakeHead.pos, this.things[j].pos)) {
                                currSnake.cells.push(new SnakeCell(null, null));
                                this.things[j].properties.toBeRemoved = true;
                            }
                        } else if (this.things[j].constructor.name === 'SpeedBooster') {
                            if (Server.posEq(snakeHead.pos, this.things[j].pos)) {
                                currSnake.properties.speedBoost = 2;
                                currSnake.properties.speedBoostDeadline = this.elapsedTime() + 4;
                                this.things[j].properties.toBeRemoved = true;
                            }
                        }
                    }
                }
                if (currSnake.properties.isHot) {
                    for (let j = 0; j < this.snakes.length; j++) {
                        if (i === j) continue;
                        if (currSnake.isCollidingWith(this.snakes[j]) && !this.snakes[j].properties.dead) {
                            currSnake.properties.isHot = false;
                            this.snakes[j].properties.isHot = true;
                        }
                    }
                }
                if (currSnake.properties.speedBoostDeadline < this.elapsedTime()) {
                    currSnake.properties.speedBoost = 1;
                }
            }
        }

        if (!this.properties.checkHotsDone && Math.floor(this.elapsedTime()) % 10 === 0) {
            for (let j = 0; j < this.snakes.length; j++) {
                if (this.snakes[j].properties.isHot) {
                    this.snakes[j].properties.isHot = false;
                    this.snakes[j].properties.dead = true;
                    this.broadcastEvent("explosion", this.snakes[j].cells[0].pos);
                }
            }
            if (aliveSnakes !== 0) {
                let t = this;
                setTimeout(() => {
                    let newHotIndex = Server.random(0, t.snakes.length - 1);
                    while (t.snakes[newHotIndex].properties.dead) {
                        newHotIndex = Server.random(0, t.snakes.length - 1);
                    }
                    t.snakes[newHotIndex].properties.isHot = true;
                }, 1000);
            }
            this.properties.checkHotsDone = true;
        } else if (Math.floor(this.elapsedTime()) % 10 === 1) {
            this.properties.checkHotsDone = false;
        }

        if (aliveSnakes === 1) {
            // Kill simulation. Game ended
            clearInterval(this.simulationIntervalId);
            this.gameState = Server.GAME_ENDED;
            for (let i = 0; i < this.snakes.length; i++) {
                if (!this.snakes[i].properties.dead) {
                    this.snakes[i].properties.peerjsConnection.send({event: "you-won"});
                } else {
                    this.snakes[i].properties.peerjsConnection.send({event: "you-lost"});
                }
            }
        }

        this.clearThings();

        if (this.countThings("ClassicFood") < Math.ceil(this.snakes.length / 2)) {
            this.things.push(new ClassicFood(Server.random(0, this.width), Server.random(0, this.height)));
        }
        if (this.countThings("SpeedBooster") < 1) {
            this.things.push(new SpeedBooster(Server.random(0, this.width), Server.random(0, this.height)));
        }
        this.simFrame++;
    }

    changeSimFrameRate(fr) {
        this.simFrameRate = fr;
        clearInterval(this.simulationIntervalId);
        let t = this;
        this.simulationIntervalId = setInterval(() => {
            t.runSimulation();
        }, 1000 / this.simFrameRate);
    }

    changePeerDispatchRate(fr) {
        this.peerDispatchRate = fr;
        clearInterval(this.peerDispatchInterval);
        let t = this;
        this.peerDispatchInterval = setInterval(() => {
            let snks = Snake.stringifyArray(t.snakes)
            for (let i = 0; i < t.snakes.length; i++) {
                t.snakes[i].properties.peerjsConnection.send({
                    dimensions: {w: t.width, h: t.height},
                    snakes: snks,
                    things: t.stringifyThings(),
                    yourIndex: i
                });
            }
        }, 1000 / this.peerDispatchRate);
    }

    countThings(type) {
        let count = 0;
        for (let i = 0; i < this.things.length; i++) {
            if (this.things[i].constructor.name === type) {
                count++;
            }
        }
        return count;
    }

    clearThings() {
        for (let i = 0; i < this.things.length; i++) {
            if (this.things[i].properties.toBeRemoved) {
                this.things.splice(i, 1);
                i--;
            }
        }
    }

    broadcastEvent(eventName, eventData) {
        for (let i = 0; i < this.snakes.length; i++) {
            this.snakes[i].properties.peerjsConnection.send({event: eventName, eventData: eventData});
        }
    }

    static random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static posEq(pos1, pos2) {
        if (!pos1 || !pos2) {
            return false;
        }
        if (typeof pos1.x !== "undefined" && typeof pos2.x !== "undefined") {
            if (pos1.x !== pos2.x) {
                return false;
            }
        }
        if (typeof pos1.y !== "undefined" && typeof pos2.y !== "undefined") {
            if (pos1.y !== pos2.y) {
                return false;
            }
        }
        if (typeof pos1.z !== "undefined" && typeof pos2.z !== "undefined") {
            if (pos1.z !== pos2.z) {
                return false;
            }
        }
        return true;
    }

    elapsedTime() {
        return this.simFrame / this.simFrameRate;
    }

    stringifyThings() {
        let toRet = [];
        for (let i = 0; i < this.things.length; i++) {
            toRet.push(this.things[i].stringify());
        }
        return toRet;
    }
}