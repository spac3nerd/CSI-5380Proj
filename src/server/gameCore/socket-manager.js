var globalState = require("../gameCore/global-state");
var gameLoop = require("./gameLoop");
var three = require("three");

var socket = undefined;
var broadcastChan = undefined;

function setUpEvents() {
    if (socket !== undefined) {
        socket.on("connection", (socket) => {
            broadcastChan = socket;
            console.log("new Connection");
            socket.on("joinGame", (data) => {
                console.log("newGame");
                console.log(globalState.isTokenValid(data.token));
                if (globalState.isTokenValid(data.token)) {
                    globalState.addUser();
                    gameLoop.addTank(data.token);
                    //set starting position on server
                    let startingPos = new three.Vector3(0, 0, -20);
                    gameLoop.setInitialPlayerState(data.token, {
                        movement: new three.Vector3(0, 0,0),
                        lookAt: new three.Vector3(0, 0,-50),
                        position: startingPos
                    });
                    socket.emit("playerStart", {
                        pos: startingPos,
                        movementVelocity: 10 //units per second
                    });
                }
            });

            socket.on("playerUpdate", (data) => {
                //check if the token is valid
                if (globalState.isTokenValid(data.token)) {
                    gameLoop.updatePlayer(data.token, data.tankState);
                }
            });
        });
    }
}

function broadcast(state) {

    if (broadcastChan !== undefined && globalState.getUserCount() > 0) {
        broadcastChan.broadcast.emit('tick', state);
        broadcastChan.emit('tick', state);
    }
}


function setSocket(newSocket) {
    socket = newSocket;
    setUpEvents();
}


module.exports = {
    setSocket: setSocket,
    broadcast: broadcast
};