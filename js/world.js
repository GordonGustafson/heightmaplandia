var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true);

var PATH_TO_HEIGHTMAP = "perlin_noise.png";
var MAP_WIDTH = 500;
var MAP_HEIGHT = 500;
var MAP_SUBDIVISIONS = 50;
var MIN_HEIGHT_DISPLACEMENT = 0;
var MAX_HEIGHT_DISPLACEMENT = 25;
var MAKE_MESH_UPDATABLE = true;

var PLAYER_HEIGHT = 1;

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
    camera.ellipsoid = new BABYLON.Vector3(1, PLAYER_HEIGHT, 1);
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

function addHeightmappedGround(scene) {
    var ground = BABYLON.Mesh.CreateGroundFromHeightMap(
        "ground", PATH_TO_HEIGHTMAP, MAP_WIDTH, MAP_HEIGHT, MAP_SUBDIVISIONS,
        MIN_HEIGHT_DISPLACEMENT, MAX_HEIGHT_DISPLACEMENT, scene, MAKE_MESH_UPDATABLE);
    ground.checkCollisions = true;
    ground.position.y = 0;

    var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseTexture = new BABYLON.Texture(PATH_TO_HEIGHTMAP, scene);
    ground.material = groundMaterial;
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

function createSkybox(scene){
	// Skybox
	var skybox = BABYLON.Mesh.CreateBox("skyBox", 10000.0, scene);
	var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
	skyboxMaterial.backFaceCulling = false;
	skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("skybox/skybox", scene);
	skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
	skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
	skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
	skybox.material = skyboxMaterial;
}


function createScene() {
    var scene = initializeScene();

    var camera = addCamera(new BABYLON.Vector3(0, MAX_HEIGHT_DISPLACEMENT + PLAYER_HEIGHT, 0), scene);

    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = .5;

    addHeightmappedGround(scene);
    createSkybox(scene);

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
