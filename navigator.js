document.addEventListener('DOMContentLoaded', () => {
    hide("join-insert-match-code");
    hide("host-choose-mode");
    hide("server-lobby-status");
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
    hide("host-choose-mode");
    server = new Server(250, 250, Server.CLASSIC_MODE);
    server.peer.on('open', ()  => {
        client = new MatchClient(server.peer.id);
    });
    setInterval(() => {
        document.getElementById("server-player-count").innerText = server.snakes.length + "";
    }, 2000);
    show("server-lobby-status");
}

function startGame() {
    if (server) {
        server.startGame();
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