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
        }
    }

    runClassicSimulation() {
        let aliveSnakes = 0;
        for (let i = 0; i < this.snakes.length; i++) {
            if (!this.snakes[i].properties.dead) {
                aliveSnakes++;

                for (let j = this.snakes[i].cells.length - 1; j > 0; j--) {
                    this.snakes[i].cells[j].pos.x = this.snakes[i].cells[j - 1].pos.x;
                    this.snakes[i].cells[j].pos.y = this.snakes[i].cells[j - 1].pos.y;
                }
                if (this.snakes[i].cells[0]) {
                    this.snakes[i].cells[0].pos.x += this.snakes[i].properties.direction.x;
                    this.snakes[i].cells[0].pos.y += this.snakes[i].properties.direction.y;
                    this.snakes[i].cells[0].color = [255, 0, 0];

                    //TODO Adjust mechanism (now it bounces)
                    if (this.snakes[i].cells[0].pos.x > this.width || this.snakes[i].cells[0].pos.x < 0) {
                        this.snakes[i].properties.direction.x *= -1;
                        this.snakes[i].cells[0].pos.x += this.snakes[i].properties.direction.x * 2;
                    }
                    if (this.snakes[i].cells[0].pos.y > this.height || this.snakes[i].cells[0].pos.y < 0) {
                        this.snakes[i].properties.direction.y *= -1;
                        this.snakes[i].cells[0].pos.y += this.snakes[i].properties.direction.y * 2;
                    }
                    //END TODO

                    for (let j = 0; j < this.snakes.length; j++) {
                        if (i === j) continue;
                        if (this.snakes[i].isCollidingWith(this.snakes[j])) {
                            this.snakes[i].properties.dead = true;
                        }
                    }
                    if (this.snakes[i].isSelfColliding()) {
                        this.snakes[i].properties.dead = true;
                    }

                    for (let j = 0; j < this.things.length; j++) {
                        if (typeof this.things[j] === 'object' && this.things[j].constructor.name === 'ClassicFood') {
                            if (this.snakes[i].cells[0].pos.x === this.things[j].pos.x && this.snakes[i].cells[0].pos.y === this.things[j].pos.y) {
                                this.snakes[i].cells.push(new SnakeCell(null, null));
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
        let aliveSnakes = 0;
        for (let i = 0; i < this.snakes.length; i++) {
            if (!this.snakes[i].properties.dead) {
                aliveSnakes++;
                for (let j = this.snakes[i].cells.length - 1; j > 0; j--) {
                    this.snakes[i].cells[j].pos.x = this.snakes[i].cells[j - 1].pos.x;
                    this.snakes[i].cells[j].pos.y = this.snakes[i].cells[j - 1].pos.y;
                }
                if (this.snakes[i].cells[0]) {
                    this.snakes[i].cells[0].pos.x += this.snakes[i].properties.direction.x;
                    this.snakes[i].cells[0].pos.y += this.snakes[i].properties.direction.y;
                    this.snakes[i].cells[0].color = [255, 0, 0];

                    //TODO Adjust mechanism (now it bounces)
                    if (this.snakes[i].cells[0].pos.x > this.width || this.snakes[i].cells[0].pos.x < 0) {
                        this.snakes[i].properties.direction.x *= -1;
                        this.snakes[i].cells[0].pos.x += this.snakes[i].properties.direction.x * 2;
                    }
                    if (this.snakes[i].cells[0].pos.y > this.height || this.snakes[i].cells[0].pos.y < 0) {
                        this.snakes[i].properties.direction.y *= -1;
                        this.snakes[i].cells[0].pos.y += this.snakes[i].properties.direction.y * 2;
                    }
                    //END TODO
                    if (this.snakes[i].isSelfColliding()) {
                        this.snakes[i].properties.dead = true;
                    }

                    for (let j = 0; j < this.things.length; j++) {
                        if (typeof this.things[j] === 'object' && this.things[j].constructor.name === 'ClassicFood') {
                            if (this.snakes[i].cells[0].pos.x === this.things[j].pos.x && this.snakes[i].cells[0].pos.y === this.things[j].pos.y) {
                                this.snakes[i].cells.push(new SnakeCell(null, null));
                                this.things[j].properties.toBeRemoved = true;
                            }
                        }
                    }
                }
            }
        }

        if (aliveSnakes === 0) {
            // Kill simulation. Game ended
            clearInterval(this.simulationIntervalId);
            for (let i = 0; i < this.snakes.length; i++) {
                if (this.snakes[i].properties.dead) {
                    this.snakes[i].properties.peerjsConnection.send({event: "you-lost"});
                }
            }
        }

        this.clearThings();

        if (this.countThings("ClassicFood") < 1) {
            this.things.push(new ClassicFood(Server.random(0, this.width), Server.random(0, this.height)));
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
            for (let i = 0; i < t.snakes.length; i++) {
                t.snakes[i].properties.peerjsConnection.send({
                    dimensions: {w: t.width, h: t.height},
                    snakes: Snake.stringifyArray(t.snakes),
                    things: this.stringifyThings()
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

    static random(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    stringifyThings() {
        let toRet = [];
        for (let i = 0; i < this.things.length; i++) {
            toRet.push(this.things[i].stringify());
        }
        return toRet;
    }
}