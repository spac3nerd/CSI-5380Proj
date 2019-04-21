/*
    Defines an instance of a game - it relies on a socket already being established and passed in at
    time of instantiation. The idea is to allow the ability to allow multiple instances of the game
    to run on the same screen,but under different canvases. This makes it easier to run automated tests
    as I wouldn't have to launch multiple browsers via CLI and pass in messy parameters via the URL.

 */

//Slightly archaic JS, but I like the extra control over the architecture
//I could have bundled everything with automation tools, but this is easier to set up

//constructor
//canvas - the target cavas element onto which to render
//socket - the established socket with which to communicate with the server
game = function(canvas, socket, token) {
    this.canvas = canvas;
    this.socket = socket;
    this.token = token;

    //init world objects to default
    this.scene = undefined;
    this.camera = undefined;
    this.renderer = undefined;
    this.backgroundMesh = undefined;
    this.redZone = undefined;
    this.intersectionPlane = undefined; //Using this as a dummy math object to calculate the intersection of the mouse position

    //contains all elements of a player tank - all player objects spawn off of it

    this.playerTank = undefined;
    this.otherPlayers = [];
};

game.prototype = {
    //set up an instance of the game
    init: function() {
        console.log("init");
        console.log(this.canvas);
        console.log(this.socket);
        this.configSocket();
        this.socket.emit('joinGame', {token: token});
    },

    configSocket: function() {
        let that = this;
        this.socket.on("playerStart", function(data) {
            console.log("playerStart");
            console.log(data);
            that.initScene(data);
        });
        this.socket.on("playerUpdate", function(data) {

        });
    },



    initScene: function(newPlayerData) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-55, 55, 55, -55, 1, 100); //create a fixed orthographic camera
        this.camera.position.set(0, 50, 0);
        this.camera.lookAt(new THREE.Vector3(0, 0 , 0));
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.canvas.append(this.renderer.domElement); //append renderer to DOM

        //set up the game field
        this.backgroundMesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 32), new THREE.MeshBasicMaterial( {color: 0xd1d1d1, side: THREE.DoubleSide} ));
        this.backgroundMesh.setRotationFromEuler(new THREE.Euler( 1.57, 0, 0, 'XYZ' )); //rotate to coincide with -Z axis into the screen
        this.redZone = new THREE.Mesh(new THREE.PlaneGeometry(110, 110, 32), new THREE.MeshBasicMaterial( {color: 0xff3535, side: THREE.DoubleSide} ));
        this.redZone.position.set(0, -10, 0); //set behind the main field
        this.redZone.setRotationFromEuler(new THREE.Euler( 1.57, 0, 0, 'XYZ' ));
        this.scene.add(this.backgroundMesh);
        this.scene.add(this.redZone);

        //not really part of the scene, just used to help with some math
        this.intersectionPlane = new THREE.Mesh(new THREE.PlaneGeometry(70, 70, 32, 32), new THREE.MeshBasicMaterial({color: 0x00FFFF, visible: true}));
        this.intersectionPlane.position.set(0, 11, 0);
        this.intersectionPlane.setRotationFromEuler(new THREE.Euler( 1.57, 0, 0, 'XYZ' ));
        //this.intersectionPlane.up.set(0, 1, 0);
        this.scene.add(this.intersectionPlane);

        //spawn player at the location given by the server
        this.playerTank = new game.tank();
        this.playerTank.body = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.MeshBasicMaterial({color: 0x1900ff}));
        this.playerTank.body.position.set(0, 0, 0);

        this.playerTank.turret = new THREE.Mesh(new THREE.SphereGeometry(1.25, 32, 32), new THREE.MeshBasicMaterial({color: 0xf6ff00}));
        this.playerTank.turret.position.set(0, 3, 0);
        this.playerTank.turret.up.set(0, 0, -1);

        let gunGeometry = new THREE.BoxGeometry(0.5, 0.5, 5);
        gunGeometry.translate(0, 0, 3);
        this.playerTank.gun = new THREE.Mesh(gunGeometry, new THREE.MeshBasicMaterial({color: 0x333333}));
        this.playerTank.gun.position.set(0, 5, 0);
        this.playerTank.gun.up.set(0, 0, -1);

        this.playerTank.turretGroup = new THREE.Group();
        this.playerTank.turretGroup.add(this.playerTank.turret);
        this.playerTank.turretGroup.add(this.playerTank.gun);
        this.playerTank.turretGroup.up.set(0, 0, -1);
        this.playerTank.turretGroup.position.set(0, 5, 0);


        this.playerTank.group = new THREE.Group();
        this.playerTank.group.add(this.playerTank.body);
        this.playerTank.group.add(this.playerTank.turretGroup);
        this.playerTank.group.position.set(newPlayerData.pos[0], newPlayerData.pos[1], newPlayerData.pos[2]);
        this.playerTank.group.up.set(0, 0, -1);

       // this.scene.add(this.playerTank.body);
       // this.scene.add(this.playerTank.turret);
        this.scene.add(this.playerTank.group);

        //add event listeners on the canvas container
        let that = this;
        this.canvas.onmousemove = function(e) {
            let raycaster = new THREE.Raycaster();
            let mousePosition = new THREE.Vector2(0, 0);
            //the position on the canvas element has to be mapped to the 3D world
            mousePosition.x = (e.clientX / that.canvas.clientWidth) * 2 - 1;
            mousePosition.y = -(e.clientY / that.canvas.clientHeight) * 2 + 1;
            raycaster.setFromCamera(mousePosition, that.camera);
            var intersections = raycaster.intersectObject(that.redZone);
            //there shouldn't be more than 1 intersection, but we'll just get the first element anyways
            if (intersections.length > 0) {
                //let intersectOnPlane = new THREE.Vector3(intersections[0].point.x, 5, intersections[0].point.z).normalize();
                //console.log(intersections[0].point);
                //let angle = that.playerTank.gun.up.angleTo(intersectOnPlane);
               // console.log(angle);
                //that.playerTank.gun.setRotationFromEuler(new THREE.Euler( 0, angle, 0, 'YXZ' ));
                //that.playerTank.gun.rotateOnAxis(new THREE.Vector3( 0, 1, 0), angle);
                //that.playerTank.setLookAt(intersections[0].point);
                //console.log(that.playerTank.gun.position);
                that.playerTank.setLookAt(new THREE.Vector3(intersections[0].point.x, 5, intersections[0].point.z));
                //that.playerTank.setLookAt(new THREE.Vector3(100, 5, 100));
               // that.playerTank.setLookAt(that.playerTank.body.position);

                /*
                let normal = new THREE.Vector3(0, 0 , -1);
                let intersectOnPlane = new THREE.Vector3(intersections[0].point.x, 0, intersections[0].point.z).normalize();
                let distance = that.playerTank.gun.position.clone().sub(intersectOnPlane);
                let finalDirection = distance.clone().normalize();
                let rotationAngle = Math.acos(normal.dot(finalDirection));
                let rotationAxis = normal.clone().cross(finalDirection).normalize();
                debugger;
                */



            }

           // console.log(that.playerTank.turretGroup.rotation);
        };

        this.render();
    },

    render: function() {
       // this.playerTank.turretGroup.updateMatrixWorld();
       // this.playerTank.group.updateMatrixWorld();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this));

    }

};