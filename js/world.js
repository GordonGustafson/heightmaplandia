var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true);

var PATH_TO_HEIGHTMAP = "perlin_noise.png";
var MAP_WIDTH = 500;
var MAP_HEIGHT = 500;
var MAP_SUBDIVISIONS = 50;
var MIN_HEIGHT_DISPLACEMENT = 0;
var MAX_HEIGHT_DISPLACEMENT = 25;
var MAKE_MESH_UPDATABLE = true;
var BASE_SPEED = 1.1
var SPRINT_SPEED = 2
var HIGH_GRAVITY = new BABYLON.Vector3(0, -10, 0);
var NORMAL_GRAVITY = new BABYLON.Vector3(0, -0.3, 0);

var PLAYER_HEIGHT = 1;

function initializeScene() {
    var scene = new BABYLON.Scene(engine);
    // Apply gravity to the scene. Make sure the Y value is less than the camera speed.
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
    camera.speed = BASE_SPEED;

    setupAdditionalCameraControls(camera);
}

function setupAdditionalCameraControls(camera) {
    var LETTER_a_KEYCODE = 65;
    var LETTER_d_KEYCODE = 68;
    var LETTER_w_KEYCODE = 87;
    var LETTER_s_KEYCODE = 83;

    camera.keysUp.push(LETTER_w_KEYCODE);   // pressing w moves camera forward
    camera.keysDown.push(LETTER_s_KEYCODE); // pressing s moves camera backward
    camera.keysLeft.push(LETTER_a_KEYCODE);   // pressing a moves camera left
    camera.keysRight.push(LETTER_d_KEYCODE); // pressing d moves camera right
    
    //Capture mouse pointer:
    canvas.addEventListener("click", function(evt) {
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
        if (canvas.requestPointerLock) {
            canvas.requestPointerLock();
        }
    }, false);    
    
    //Sprint Functionality
    window.addEventListener("keydown", function(event){
        if (event.keyCode == 16) { scene.activeCamera.speed = SPRINT_SPEED };
        //if (event.keyCode == 86) {  moveMode = !moveMode };
    });
    window.addEventListener("keyup", function(event){
        if (event.keyCode == 16) {  scene.activeCamera.speed = BASE_SPEED };
    });
}

function addHeightmappedGround(scene) {
    var ground = BABYLON.Mesh.CreateGroundFromHeightMap(
        "ground", PATH_TO_HEIGHTMAP, MAP_WIDTH, MAP_HEIGHT, MAP_SUBDIVISIONS,
        MIN_HEIGHT_DISPLACEMENT, MAX_HEIGHT_DISPLACEMENT, scene, MAKE_MESH_UPDATABLE);
    ground.checkCollisions = true;
    ground.position.y = 0;

    var groundMaterial =
        new BABYLON.ShaderMaterial("ground", scene, { vertexElement: "groundVertexShader",
                                                      fragmentElement: "groundFragmentShader" },
            {
                attributes: ["position", "normal", "uv"],
                uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
            });

    function addTextureUniformToGround(pathToTexture, glslUniformName) {
        var texture = new BABYLON.Texture(pathToTexture, scene);
        texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
        texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        groundMaterial.setTexture(glslUniformName, texture);
    }

    addTextureUniformToGround("textures/rock.jpg", "rockSampler");
    addTextureUniformToGround("textures/grass.jpg", "grassSampler");
    addTextureUniformToGround("textures/snow.jpg", "snowSampler");

    groundMaterial.setFloat("MIN_TERRAIN_HEIGHT", MIN_HEIGHT_DISPLACEMENT);
    groundMaterial.setFloat("MAX_TERRAIN_HEIGHT", MAX_HEIGHT_DISPLACEMENT);

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


function createScene() {
    var scene = initializeScene();

    var camera = addCamera(new BABYLON.Vector3(0, MAX_HEIGHT_DISPLACEMENT + PLAYER_HEIGHT, 0), scene);

    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = .5;

    addHeightmappedGround(scene);

    return scene;
};


function displayPositionVector() {
    var pos = document.getElementById("pos");
    cPos = scene.activeCamera.position;
    pos.innerHTML = "X: " + cPos.x.toFixed(2) + "<br>Y: " + cPos.y.toFixed(2) + "<br>Z: " + cPos.z.toFixed(2);
}

function fixGravity(){
    if (scene.getMeshByName("ground").intersectsPoint(scene.activeCamera.position.subtract(new BABYLON.Vector3(0, 2, 0)))){
        scene.gravity = NORMAL_GRAVITY;
    } else {
        scene.gravity = HIGH_GRAVITY;
    }
}

var scene = createScene();

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    fixGravity();
    displayPositionVector();
    scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});
