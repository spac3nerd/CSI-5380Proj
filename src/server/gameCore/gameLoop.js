var three = require("three");
var socketManager = require("./socket-manager");

var playerTanks = {};
var lastUpdate = new Date();


//called for each update from clients
//note that the position is only set internally in the server
function updatePlayer(token, packet) {
    playerTanks[token].lookAt = packet.lookAt;
    playerTanks[token].movement = packet.movement;
}

function addTank(token) {
    playerTanks[token] = {};
}

function setInitialPlayerState(token, state) {
    playerTanks[token].lookAt = state.lookAt;
    playerTanks[token].movement = state.movement;
    playerTanks[token].obj = new three.Object3D();
    playerTanks[token].obj.position.set(state.position.x, state.position.y, state.position.z);
    playerTanks[token].obj.up = new three.Vector3(0, 0, -1);
}

function loopGame(sm) {
    let newTime = new Date();
    let delta = (newTime - lastUpdate) / 1000;
    lastUpdate = newTime;
    let socketManager = require("./socket-manager");

    let newState = {}; //create new object with player states
    //go through all players and update the location
    for (let k in playerTanks) {
        if (playerTanks[k].movement !== undefined) {
            let mV = new three.Vector3(playerTanks[k].movement.x, playerTanks[k].movement.y, playerTanks[k].movement.z).normalize(); //normalize this vector to prevent any shenanigans
            playerTanks[k].obj.translateX((mV.x * 10) * delta);
            playerTanks[k].obj.translateZ((mV.z * 10) * delta);

            newState[k] = {
                position: playerTanks[k].obj.position,
                lookAt: playerTanks[k].lookAt
            };
        }
    }

    socketManager.broadcast({
        players: newState
    });
}

//server-side render loop - 60 times a second - no need to implement any fancy pacing here
setInterval( function() {loopGame()}, 1000 / 60);


module.exports = {
    updatePlayer: updatePlayer,
    addTank: addTank,
    setInitialPlayerState: setInitialPlayerState
};
