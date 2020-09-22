class SnakeBot {
    directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    client = undefined;
    constructor(serverId) {
        this.client = new MatchClient(serverId);
        let t = this;
        setInterval(() => {
            let dir = this.directions[Server.random(0, 3)];
            t.client.sendDirection(dir[0], dir[1]);
        }, 500);
    }
}