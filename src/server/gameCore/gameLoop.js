let three = require("three");
let socketManager = require("./socket-manager");
let globalState = require("./global-state");
let crypto = require("crypto");

let playerTanks = {}; //tracks all player tanks
let shots = {}; //tracks all shots and their owner
let lastUpdate = new Date();

//game rules - should really be a separate config
//note that xmin is defined as being to the left, zMin being at the bottom
//also note, -Z axis points to the top
let bounds = {
    xSpan: 100,
    zSpan: 100,
    xMin: -50,
    xMax: 50,
    zMax: -50,
    zMin: 50
};

let bulletVelocity = 70;
let movementVelocity = 45;


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

//returns a random spawn position on the game map
function generateSpawnPosition() {
    let x = Math.floor(Math.random() * (bounds.xSpan - 10)) - Math.abs(bounds.xMin);
    let z = Math.floor(Math.random() * (bounds.zSpan - 10)) - Math.abs(bounds.zMin);
    let y = 5;

    return new three.Vector3(x, y, z);
}

function checkOutOfBounds() {
    for (let k in playerTanks) {
        if (playerTanks[k].obj.position.x < -47.5 || playerTanks[k].obj.position.x > 47.5 || playerTanks[k].obj.position.z < -47.5 || playerTanks[k].obj.position.z > 47.5) {
            let spawnPos = generateSpawnPosition();
            playerTanks[k].obj.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
            globalState.decrementScore(k);
        }
    }
}

function setInitialPlayerState(token, state, name) {
    playerTanks[token].lookAt = state.lookAt;
    playerTanks[token].movement = state.movement;
    //playerTanks[token].obj = new three.Object3D();
    //replaced simple 3D obj with mesh to allow for collision check
    playerTanks[token].obj = new three.Mesh(new three.BoxGeometry(5, 5, 5), new three.MeshBasicMaterial({color: 0x57f92a}));
    playerTanks[token].obj.position.set(state.position.x, state.position.y, state.position.z);
    playerTanks[token].obj.up = new three.Vector3(0, 0, -1);
    playerTanks[token].status = "A"; //A - Active, D - Destroyed
    playerTanks[token].name = name;
}

function loopGame() {
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
            playerTanks[k].obj.translateX((mV.x * movementVelocity) * delta);
            playerTanks[k].obj.translateZ((mV.z * movementVelocity) * delta);
            newPlayerState[k] = {
                position: playerTanks[k].obj.position,
                lookAt: playerTanks[k].lookAt,
                name: playerTanks[k].name
            };
        }
    }

    let newBulletState = {};
    for (let n in shots) {
        shots[n].obj.translateX((shots[n].direction.x * bulletVelocity) * delta);
        shots[n].obj.translateZ((shots[n].direction.z * bulletVelocity) * delta);
        newBulletState[n] = {
            position: shots[n].obj.position,
        };
    }

    checkOutOfBounds();

    socketManager.broadcast({
        players: newPlayerState,
        bullets: newBulletState,
        score: globalState.getScore()
    });
}

//server-side render loop - 60 times a second - no need to implement any fancy pacing here
setInterval( function() {loopGame()}, 1000 / 60);


module.exports = {
    updatePlayer: updatePlayer,
    addTank: addTank,
    setInitialPlayerState: setInitialPlayerState,
    shotTaken: shotTaken,
    generateSpawnPosition: generateSpawnPosition
};
