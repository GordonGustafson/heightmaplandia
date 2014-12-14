var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true);
var scene;
var ground;
var water;

var PATH_TO_HEIGHTMAP = "heightmaps/blur.png";
var MAP_WIDTH = 2048;           // corresponds to x coordinate of map
var MAP_HEIGHT = 2048;          // corresponds to z coordinate of map
var MAP_SUBDIVISIONS = 128;
var MIN_HEIGHT_DISPLACEMENT = -35;
var MAX_HEIGHT_DISPLACEMENT = 60;
var MIN_SPAWN_ALTITUDE = 30;
var MAKE_MESH_UPDATABLE = true;
var BASE_SPEED = .5
var SPRINT_SPEED = 3
var NORMAL_GRAVITY = new BABYLON.Vector3(0, -0.06, 0);
var PLAYER_HEIGHT = 1;
var WATER_LEVEL = 0;  // cannot be changed as long as we use createGround to make the water

function initializeScene() {
    var scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    return scene;
}

function getGroundHeight(x, z){
    var downRay = new BABYLON.Ray(new BABYLON.Vector3(x, MAX_HEIGHT_DISPLACEMENT + 1, z),
                                  new BABYLON.Vector3(0, -1, 0));
    var info = ground.intersects(downRay, false);
    return info.pickedPoint.y;
}

function getRandomPositionOnGround() {
     // Returns a random integer between min (inclusive) and max (inclusive)
     // Using Math.round() will give you a non-uniform distribution!
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    var MAP_MIN_X = -MAP_WIDTH /2;
    var MAP_MAX_X =  MAP_WIDTH /2;
    var MAP_MIN_Z = -MAP_HEIGHT/2;
    var MAP_MAX_Z =  MAP_HEIGHT/2;

    var x = getRandomInt(MAP_MIN_X, MAP_MAX_X);
    var z = getRandomInt(MAP_MIN_Z, MAP_MAX_Z);

    return new BABYLON.Vector3(x, getGroundHeight(x, z), z);
}

function getRandomPositionAbove(minimumAltitude) {
    var randomPosition = getRandomPositionOnGround();
    while (randomPosition.y < minimumAltitude) {
        randomPosition = getRandomPositionOnGround();
    }
    return randomPosition;
}

function startLoadingTrees(){
    var treeMaterial = new BABYLON.StandardMaterial("material",scene);
    treeMaterial.ambientTexture = new BABYLON.Texture("textures/tree.jpg",scene);

    var numberOfTreeMeshes = 10;
    var numberOfEachTreeToPlace = 40;

    for (var i = 1; i <= numberOfTreeMeshes; i++) {
        var treeLoadCallback = function (meshesJustLoaded) {
            var tree = meshesJustLoaded[0];
            for (var i = 0; i < numberOfEachTreeToPlace; i++) {
                var treePosition = getRandomPositionOnGround();
                if (treePosition.y > WATER_LEVEL) {
                    var treeToPlace = tree.clone();
                    treeToPlace.position = treePosition;
                    treeToPlace.refreshBoundingInfo();
                    treeToPlace.checkCollisions = true;
                    treeToPlace.material = treeMaterial;
                } else {
                    // Skip any trees we would've placed below the water level.
                    // This approximates a constant density of trees rather than
                    // a constant number of them.
                }
            }
            tree.dispose();  // dispose original trees so they aren't rendered at origin
        };

        var pathToTreeMesh = "tree" + i + ".babylon";
        BABYLON.SceneLoader.ImportMesh("", "blender/", pathToTreeMesh, scene, treeLoadCallback);
    }
}

function addCameraAtRandomPosition() {
    // I don't know the math behind why this is 2 * PLAYER_HEIGHT, but
    // using PLAYER_HEIGHT will spawn you 'waist-deep' in the ground.
    var playerHeightVector =  new BABYLON.Vector3(0, 2 * PLAYER_HEIGHT, 0);
    var initialPosition = getRandomPositionAbove(MIN_SPAWN_ALTITUDE).add(playerHeightVector);
    var camera = new BABYLON.FreeCamera("camera", initialPosition, scene);
    camera.applyGravity = true;
    camera.checkCollisions = true;
    // point the camera toward the origin looking level with the horizon
    camera.setTarget(new BABYLON.Vector3(0, initialPosition.y, 0));
    // ellipsoid around camera that determines player collisions
    camera.ellipsoid = new BABYLON.Vector3(1, PLAYER_HEIGHT, 1);
    // attach camera to global canvas and prevent other sources from handling its javascript events
    camera.attachControl(canvas, false);
    // how fast your player can move when not sprinting. Must be greater than downward gravity.
    camera.speed = BASE_SPEED;

    setupAdditionalCameraControls(camera);
}

function setupAdditionalCameraControls(camera) {
    var LETTER_a_KEYCODE = 65;
    var LETTER_d_KEYCODE = 68;
    var LETTER_w_KEYCODE = 87;
    var LETTER_s_KEYCODE = 83;

    camera.keysUp.push(LETTER_w_KEYCODE);    // w moves forward
    camera.keysDown.push(LETTER_s_KEYCODE);  // s moves backward
    camera.keysLeft.push(LETTER_a_KEYCODE);  // a moves left
    camera.keysRight.push(LETTER_d_KEYCODE); // d moves right

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
    });
    window.addEventListener("keyup", function(event){
        if (event.keyCode == 16) {  scene.activeCamera.speed = BASE_SPEED };
    });
}

function addHeightmappedGround() {
    ground = BABYLON.Mesh.CreateGroundFromHeightMap(
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
    ground.refreshBoundingInfo();
    return ground;
}

function createSkybox(){
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 10000.0, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("skybox/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
}

function createWater(){
    WATER_SUBDIVISIONS = 1;     // no sense in adding more since it's a flat plane
    water = BABYLON.Mesh.CreateGround("water", MAP_WIDTH, MAP_HEIGHT,
                                      WATER_SUBDIVISIONS, scene, MAKE_MESH_UPDATABLE);
    var waterMaterial = new BABYLON.StandardMaterial("waterMaterial", scene);
    waterMaterial.backFaceCulling = false;
    waterMaterial.diffuseTexture = new BABYLON.Texture("skybox/skybox_py.jpg", scene);
    water.material = waterMaterial;
}

function playAudio() {
    var audio  = document.createElement('audio');
    audio.src = "audio/song.mp3"
    audio.addEventListener('ended', function() {
        this.currentTime = 0;
        this.play();
    }, false);
    audio.play();
}

function startRenderLoop() {
    engine.runRenderLoop(function () {
        scene.render();
        displayPositionVector();
    });
}

function createScene() {
    scene = initializeScene();

    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(5000, 5000, 0), scene);
    light.intensity = .5;
    addHeightmappedGround();
    createSkybox();
    createWater();
    playAudio();

    scene.gravity = NORMAL_GRAVITY;

    var displayReadyToBegin = function() {
        document.getElementById("loadingcontent").innerHTML = "Click Anywhere to Begin";
        document.getElementById("loading").addEventListener("click", function(evt) {
            document.getElementById("loading").style.display = "none";
        }, false);
    }

    scene.executeWhenReady(addCameraAtRandomPosition);
    scene.executeWhenReady(startLoadingTrees);
    scene.executeWhenReady(displayReadyToBegin);
    scene.executeWhenReady(startRenderLoop);
}


function displayPositionVector() {
    cameraPosition = scene.activeCamera.position;
    document.getElementById("positionX").innerHTML = cameraPosition.x.toFixed(2);
    document.getElementById("positionY").innerHTML = cameraPosition.y.toFixed(2);
    document.getElementById("positionZ").innerHTML = cameraPosition.z.toFixed(2);
}

function fixGravity(){
    var p = scene.activeCamera.position;
    if (Math.abs((p.y - getGroundHeight(p.x,p.z))) > 3){
        scene.activeCamera.position.y -= 0.02;
    } else {
        scene.gravity = NORMAL_GRAVITY;
    }
}

createScene();

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});
