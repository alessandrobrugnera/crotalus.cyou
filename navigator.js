document.addEventListener('DOMContentLoaded', () => {
    hide("join-insert-match-code");
    hide("host-choose-mode");
    hide("server-lobby-status");
    hide("host-connecting");

    const urlParams = new URLSearchParams(window.location.search);
    // Can be either host or join, not both
    if (urlParams.get("host") !== null) {
        if (urlParams.get("host") === "classic") {
            hostButtonPressed();
            classicGameHost();
        } else if (urlParams.get("host") === "onehot") {
            hostButtonPressed();
            oneHotGameHost();
        } else if (urlParams.get("host") === "single") {
            hostButtonPressed();
            singlePlayerGameHost();
        }
    } else if (urlParams.get("join") !== null) {
        joinButtonPressed();
        gbI("match-code-input").value = urlParams.get("join");
        gameJoin();
    }
});

function joinButtonPressed() {
    hide("join-host-match-buttons");
    show("join-insert-match-code");
}

function hostButtonPressed() {
    hide("join-host-match-buttons");
    show("host-choose-mode");
}

function classicGameHost() {
    createServer(Server.CLASSIC_MODE);
}

function singlePlayerGameHost() {
    createServer(Server.SINGLE_MODE);
}

function oneHotGameHost() {
    createServer(Server.ONE_HOT_MODE);
}

function createServer(mode) {
    hide("host-choose-mode");
    server = new Server(320, 180, mode);
    server.peer.on('open', ()  => {
        gbI("server-peer-id").innerText = server.peer.id;
        client = new MatchClient(server.peer.id);
        hide("host-connecting");
        show("server-lobby-status");
    });
    setInterval(() => {
        document.getElementById("server-player-count").innerText = server.snakes.length + "";
    }, 2000);
    show("host-connecting")
}

function startGame() {
    if (server) {
        server.startGame();
        server.changeSimFrameRate(15);
        server.changePeerDispatchRate(10);
        windowResized();
        hide("server-lobby-status");
    }
}

function gameJoin() {
    hide("join-insert-match-code");
    client = new MatchClient(gbI("match-code-input").value);
}

function fullscreenCanvas() {
    if (canvas) {
        canvas.parent(document.getElementsByTagName("body")[0]);
        document.getElementsByClassName("container")[0].style.display = "none";
        windowResized();
    }
}

function unfullscreenCanvas() {
    if (canvas) {
        canvas.parent(document.getElementById("canvas-holder"));
        document.getElementsByClassName("container")[0].style.display = "block";
        windowResized();
    }
}

function gbI(id) {
    return document.getElementById(id);
}

function hide(className) {
    let elements = document.getElementsByClassName(className);
    for (let i = 0; i < elements.length; i++) {
        elements[i].style.display = "none";
    }
}

function show(className) {
    let elements = document.getElementsByClassName(className);
    for (let i = 0; i < elements.length; i++) {
        elements[i].style.display = "block";
    }
}

function copyJoinLink() {
    navigator.clipboard.writeText(location.origin + location.pathname + '?join=' + gbI('server-peer-id').innerText).then(() => alert("LINK COPIED"));
}