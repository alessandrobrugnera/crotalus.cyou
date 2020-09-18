class MatchClient {
    snakes = [];
    dimensions = {w: 1, h: 1};
    peer = undefined;
    serverConn = undefined;

    constructor(serverId) {
        this.peer = new peerjs.Peer({secure: true, serialization: "json"});
        this.peer.on("open", () => {
            this.serverConn = this.peer.connect(serverId);
            this.serverConn.on('data', (dt) => {
                if (dt.snakes) {
                    this.snakes = dt.snakes;
                }
                if (dt.dimensions) {
                    this.dimensions = dt.dimensions;
                }
            });
        });
    }

    sendDirection(x, y) {
        if (this.serverConn && this.serverConn.open) {
            this.serverConn.send({direction: {x: x, y: y}});
        }
    }
}