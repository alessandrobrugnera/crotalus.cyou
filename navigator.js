document.addEventListener('DOMContentLoaded', () => {
    hide("join-insert-match-code");
    hide("host-choose-mode");
});

function joinButtonPressed() {
    hide("join-host-match-buttons");
    show("join-insert-match-code");
}

function hostButtonPressed() {
    hide("join-host-match-buttons");
    show("host-choose-mode");
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