//defines a player object
game.tank = function() {
    function setLookAt(newLookAt) {
        debugger;
        this.lookAt = newLookAt;
        this.gun.lookAt(newLookAt);
        //this.turretGroup.updateMatrixWorld();
    }

    return {
        body: undefined,
        turret: undefined,
        gun: undefined,
        position: undefined,
        lookAt: undefined,
        linearVelocity: undefined,
        turretGroup: undefined, //turret will have its own group since lookAt only affects the gun/turret
        group: undefined, //threejs hierarchy of constituent parts,
        isAlive: false,
        setLookAt: setLookAt
    }
};
