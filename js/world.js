var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true);

var MAP_WIDTH = 50;
var MAP_HEIGHT = 50;
var MAP_SUBDIVISIONS = 3;

function initializeScene() {
    var scene = new BABYLON.Scene(engine);
    // Apply gravity to the scene. Make sure the Y value is less than the camera speed.
    scene.gravity = new BABYLON.Vector3(0, -0.05, 0);
    scene.collisionsEnabled = true;

    return scene;
}

function addCamera(initialLocation, scene) {
    var camera = new BABYLON.FreeCamera("camera", initialLocation, scene);
    camera.applyGravity = true;
    camera.checkCollisions = true;
    // ellipsoid around camera that determines player collisions
    camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);
    // attach camera to global canvas and prevent other sources from handling its javascript events
    camera.attachControl(canvas, false);
    // how fast your player can move. Must be greater than downward gravity.
    camera.speed = .3;

    setupAdditionalCameraControls(camera);
}

function setupAdditionalCameraControls(camera) {
    var LETTER_a_KEYCODE = 65;
    var LETTER_d_KEYCODE = 68;
    var LETTER_w_KEYCODE = 87;
    var LETTER_s_KEYCODE = 83;

    camera.keysUp.push(LETTER_w_KEYCODE);   // pressing w moves camera forward
    camera.keysDown.push(LETTER_s_KEYCODE); // pressing s moves camera backward

    var rotateCameraLeft  = false;
    var rotateCameraRight = false;
    window.addEventListener("keydown", function(event){
        if (event.keyCode === LETTER_a_KEYCODE) { rotateCameraLeft  = true; }
        if (event.keyCode === LETTER_d_KEYCODE) { rotateCameraRight = true; }
    });
    window.addEventListener("keyup", function(event){
        if (event.keyCode === LETTER_a_KEYCODE) { rotateCameraLeft  = false; }
        if (event.keyCode === LETTER_d_KEYCODE) { rotateCameraRight = false; }
    });

    processCameraControlEvents = function() {
        if (rotateCameraLeft)  { scene.activeCamera.cameraRotation.y -= .0025; }
        if (rotateCameraRight) { scene.activeCamera.cameraRotation.y += .0025; }
    };
}

function addGround(scene) {
    var ground = BABYLON.Mesh.CreateGround("ground", MAP_WIDTH, MAP_HEIGHT, MAP_SUBDIVISIONS, scene);
    ground.checkCollisions = true;
    return ground;
}

function addSphereAtLocation(initialLocation, scene) {
    var NUMBER_OF_SUBDIVISIONS = 16;
    var RADIUS = 2;
    // The main purpose of mesh names is to retrieve them with scene.getMeshByName("sphere").
    // Since we don't plan on using it at the moment, all the spheres can have the same name.
    var sphere = BABYLON.Mesh.CreateSphere("sphere", NUMBER_OF_SUBDIVISIONS, RADIUS, scene);
    sphere.position = initialLocation;
    sphere.applyGravity = true;
    sphere.checkCollisions = true;
}


function createScene() {
    var scene = initializeScene();

    var camera = addCamera(new BABYLON.Vector3(0, 1, 0), scene);

    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = .5;

    addGround(scene);

    addSphereAtLocation(new BABYLON.Vector3(3, 1, 5), scene);

    var ramp = BABYLON.Mesh.CreateBox("box", 3, scene);
    ramp.position.x = -3
    ramp.position.z = 5;
    ramp.position.y = .5;
    ramp.scaling.x = .5;
    ramp.scaling.y = 2;
    ramp.rotation.z = Math.PI / 3;
    ramp.checkCollisions = true;

    return scene;
};


function displayPositionVector() {
    var pos = document.getElementById("pos");
    cPos = scene.activeCamera.position;
    pos.innerHTML = "X: " + cPos.x.toFixed(2) + "<br>Y: " + cPos.y.toFixed(2) + "<br>Z: " + cPos.z.toFixed(2);
}

var scene = createScene();
var processCameraControlEvents;  // event handler variable set in setupAdditionalCameraControls

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    processCameraControlEvents();
    displayPositionVector();
    scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});
