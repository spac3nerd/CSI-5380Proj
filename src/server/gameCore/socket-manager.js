var globalState = require("../gameCore/global-state");

var socket = undefined;

function setUpEvents() {
    if (socket !== undefined) {
        socket.on("connection", (socket) => {
            console.log("new Connection");
            socket.on("joinGame", (data) => {
                console.log("newGame");
                console.log(globalState.isTokenValid(data.token));
                if (globalState.isTokenValid(data.token)) {
                    globalState.addUser();
                    socket.emit("playerStart", {pos: [0, 1, 2]});
                }
            })
        });
    }
}

function emitState(state) {

}


function setSocket(newSocket) {
    socket = newSocket;
    setUpEvents();
}


module.exports = {
    setSocket: setSocket,
    emitState: emitState
};