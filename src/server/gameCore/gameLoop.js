let three = require("three");
let socketManager = require("./socket-manager");
let globalState = require("./global-state");
let crypto = require("crypto");

let playerTanks = {}; //tracks all player tanks
let shots = {}; //tracks all shots and their owner
let lastUpdate = new Date();


//called for each update from clients
//note that the position is only set internally in the server
function updatePlayer(token, packet) {
    playerTanks[token].lookAt = packet.lookAt;
    playerTanks[token].movement = packet.movement;
}

function addTank(token) {
    playerTanks[token] = {};
}

function shotTaken(token, lookAt) {
    //model the object in memory
    let bGeom = new three.Mesh(new three.SphereGeometry(0.5, 32, 32), new three.MeshBasicMaterial({color: 0x000000}));
    bGeom.position.set(playerTanks[token].obj.position.x, playerTanks[token].obj.position.y, playerTanks[token].obj.position.z);
    bGeom.up.set(0, 0, -1);
    //calculate the direction from the player position to the aim point
    let direction = new three.Vector3();
    let aLookAt = new three.Vector3(lookAt.x, lookAt.y, lookAt.z);
    let bLookAt = new three.Vector3(playerTanks[token].obj.position.x, playerTanks[token].obj.position.y, playerTanks[token].obj.position.z);
    direction.subVectors(aLookAt, bLookAt).normalize();

    shots[crypto.randomBytes(32).toString("hex")] = {
        owner: token,
        obj: bGeom,
        direction: direction
    };
}

function setInitialPlayerState(token, state) {
    playerTanks[token].lookAt = state.lookAt;
    playerTanks[token].movement = state.movement;
    playerTanks[token].obj = new three.Object3D();
    playerTanks[token].obj.position.set(state.position.x, state.position.y, state.position.z);
    playerTanks[token].obj.up = new three.Vector3(0, 0, -1);
    playerTanks[token].status = "A"; //A - Active, D - Destroyed
}

function loopGame(sm) {
    let newTime = new Date();
    let delta = (newTime - lastUpdate) / 1000;
    lastUpdate = newTime;
    let socketManager = require("./socket-manager");

    //create new object current player states
    let newPlayerState = {};
    //go through all players and update the location
    for (let k in playerTanks) {
        if (playerTanks[k].movement !== undefined) {
            let mV = new three.Vector3(playerTanks[k].movement.x, playerTanks[k].movement.y, playerTanks[k].movement.z).normalize(); //normalize this vector to prevent any shenanigans
            playerTanks[k].obj.translateX((mV.x * 45) * delta);
            playerTanks[k].obj.translateZ((mV.z * 45) * delta);

            newPlayerState[k] = {
                position: playerTanks[k].obj.position,
                lookAt: playerTanks[k].lookAt
            };
        }
    }

    let newBulletState = {};
    for (let n in shots) {
        shots[n].obj.translateX((shots[n].direction.x * 70) * delta);
        shots[n].obj.translateZ((shots[n].direction.z * 70) * delta);
        newBulletState[n] = {
            position: shots[n].obj.position,
        };
    }

    socketManager.broadcast({
        players: newPlayerState,
        bullets: newBulletState
    });
}

//server-side render loop - 60 times a second - no need to implement any fancy pacing here
setInterval( function() {loopGame()}, 1000 / 60);


module.exports = {
    updatePlayer: updatePlayer,
    addTank: addTank,
    setInitialPlayerState: setInitialPlayerState,
    shotTaken: shotTaken
};
