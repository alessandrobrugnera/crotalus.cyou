class Server {
    static CLASSIC_MODE = 0;
    static ONE_HOT_MODE = 1;

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
        if (mode !== Server.CLASSIC_MODE && mode !== Server.ONE_HOT_MODE) {
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
        }
    }

    runClassicSimulation() {
        for (let i = 0; i < this.snakes.length; i++) {
            if (!this.snakes[i].properties.dead) {
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
                        if (this.snakes[i].collidingWith(this.snakes[j])) {
                            this.snakes[i].properties.dead = true;
                        }
                    }
                }
            }
        }
        this.simFrame++;
    }

    changeSimFrameRate(fr) {
        this.simFrameRate = fr;
        clearInterval(this.simulationIntervalId);
        let t = this;
        this.simulationIntervalId = setInterval(() => {t.runSimulation();}, 1000 / this.simFrameRate);
    }

    changePeerDispatchRate(fr) {
        this.peerDispatchRate = fr;
        clearInterval(this.peerDispatchInterval);
        let t = this;
        this.peerDispatchInterval = setInterval(() => {
            for (let i = 0; i < t.snakes.length; i++) {
                t.snakes[i].properties.peerjsConnection.send({
                    dimensions: {w: t.width, h: t.height},
                    snakes: Snake.stringifyArray(t.snakes)
                });
            }
        }, 1000 / this.peerDispatchRate);
    }

    static random(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }
}