class MatchClient {
    snakes = [];
    dimensions = {w: 1, h: 1};
    things = [];

    mySnakeIndex = -1;

    receivedEvents = [];

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
                if (dt.things) {
                    this.things = dt.things;
                }
                if (dt.event) {
                    if (typeof dt.eventData === "undefined") dt.eventData = {};
                    this.receivedEvents.push({name: dt.event, data: dt.eventData});
                }
                if (typeof dt.yourIndex !== 'undefined') {
                    this.mySnakeIndex = dt.yourIndex;
                }
            });
        });
        this.peer.on("error", (e) => {
            console.log(e);
            if (e.type === 'server-error') {
                alert("Game client error: " + e.message);
                alert("The page will now refresh! Sorry for the inconvenience");
                location.reload();
            }
        });
    }

    sendDirection(x, y) {
        if (this.serverConn && this.serverConn.open) {
            this.serverConn.send({direction: {x: x, y: y}});
        }
    }

    removeEvent(index) {
        if (this.receivedEvents[index])
            this.receivedEvents.splice(index, 1);
    }
}