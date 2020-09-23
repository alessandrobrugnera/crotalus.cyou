class SnakeBot {
    directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    client = undefined;

    constructor(serverId) {
        this.client = new MatchClient(serverId);
        let t = this;
        setInterval(() => {
            if (!t.client) return;
            if (client.serverMode === Server.CLASSIC_MODE) {
                t.goToClosestFood();
            } else if (client.serverMode === Server.ONE_HOT_MODE && t.client.mySnakeIndex !== -1) {
                if (t.client.snakes[t.client.mySnakeIndex].properties.isHot) {
                    t.goToClosestSnake();
                } else {
                    t.goToClosestFood();
                }
            }
            // let dir = this.directions[Server.random(0, 3)];
            // t.client.sendDirection(dir[0], dir[1]);
        }, 5);
        setInterval(() => {
            t.client.serverConn.send({snakeName: "BOT"});
        }, 5000);
    }

    goToClosestSnake() {
        if (this.client && this.client.things && this.client.mySnakeIndex !== -1 && this.client.snakes[this.client.mySnakeIndex].cells.length > 0) {
            let closestSnake = null;
            let closestDist = Infinity;
            let mySnake = this.client.snakes[this.client.mySnakeIndex];
            let myHead = mySnake.cells[0];
            for (let i = 0; i < this.client.snakes.length; i++) {
                if (i === this.client.mySnakeIndex) continue;
                if (this.client.snakes[i].cells[1] && !this.client.snakes[i].properties.dead) {
                    let dist = Math.pow(this.client.snakes[i].cells[1].pos.x - myHead.pos.x, 2) + Math.pow(this.client.snakes[i].cells[1].pos.y - myHead.pos.y, 2);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestSnake = this.client.snakes[i].cells[1];
                    }
                }
            }
            if (closestSnake !== null) {
                this.goToPos(closestSnake.pos);
            }
        }
    }

    goToClosestFood() {
        if (this.client && this.client.things && this.client.mySnakeIndex !== -1 && this.client.snakes[this.client.mySnakeIndex].cells.length > 0) {
            let closestFood = null;
            let closestDist = Infinity;
            let mySnake = this.client.snakes[this.client.mySnakeIndex];
            let myHead = mySnake.cells[0];
            for (let i = 0; i < this.client.things.length; i++) {
                if (this.client.things[i].type === "ClassicFood") {
                    let dist = Math.pow(this.client.things[i].pos.x - myHead.pos.x, 2) + Math.pow(this.client.things[i].pos.y - myHead.pos.y, 2);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestFood = this.client.things[i];
                    }
                }
            }
            if (closestFood !== null) {
                this.goToPos(closestFood.pos);
            }
        }
    }

    goToPos(pos) {
        if (!(this.client && this.client.things && this.client.mySnakeIndex !== -1 && this.client.snakes[this.client.mySnakeIndex].cells.length > 0)) {
            return;
        }
        let mySnake = this.client.snakes[this.client.mySnakeIndex];
        let myHead = mySnake.cells[0];
        let followCord = -1;
        if (pos.x !== myHead.pos.x && pos.y !== myHead.pos.y) {
            followCord = Math.floor(Math.random() * 2);
        } else if (pos.x !== myHead.pos.x) {
            followCord = 0;
        } else if (pos.y !== myHead.pos.y) {
            followCord = 1;
        }
        if (followCord === 0) {
            if (pos.x < myHead.pos.x) {
                if (this.client.lastSentDir.x !== -1)
                    this.client.sendDirection(-1, 0);
            } else if (pos.x > myHead.pos.x) {
                if (this.client.lastSentDir.x !== 1)
                    this.client.sendDirection(1, 0);
            }
        }
        if (followCord === 1) {
            if (pos.y < myHead.pos.y) {
                if (this.client.lastSentDir.y !== -1)
                    this.client.sendDirection(0, -1);
            } else if (pos.y > myHead.pos.y) {
                if (this.client.lastSentDir.y !== 1)
                    this.client.sendDirection(0, 1);
            }
        }
    }
}