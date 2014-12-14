var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true);
var scene;
var ground;
var water;
var skybox;

var PATH_TO_HEIGHTMAP = "heightmaps/edgefall.png";
var MAP_WIDTH = 2048;           // corresponds to x coordinate of map
var MAP_HEIGHT = 2048;          // corresponds to z coordinate of map
var MAP_SUBDIVISIONS = 150;
var MIN_HEIGHT_DISPLACEMENT = -35;
var MAX_HEIGHT_DISPLACEMENT = 35;
var MIN_SPAWN_ALTITUDE = 30;
var MAKE_MESH_UPDATABLE = true;
var BASE_SPEED = .5
var SPRINT_SPEED = 3
var NORMAL_GRAVITY = new BABYLON.Vector3(0, -0.06, 0);
var PLAYER_HEIGHT = 1;
var WATER_LEVEL = 0;  // cannot be changed as long as we use createGround to make the water
var NUMBER_OF_HINTBOXES = 20;

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

    var numberOfEachTreeToPlace = 40;
    var numberOfTreeMeshes = 10;

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

    // go from [1, numberOfTreeMeshes] since that's how the images are numbered
    for (var i = 1; i <= numberOfTreeMeshes; i++) {
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
    ground.backFaceCulling = false;

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
    skybox = BABYLON.Mesh.CreateBox("skyBox", 10000.0, scene);
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
    waterMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.3);
    waterMaterial.reflectionTexture = new BABYLON.MirrorTexture("mirror", 512, scene, true); //Create a mirror texture
    waterMaterial.reflectionTexture.mirrorPlane = new BABYLON.Plane(0, -1.0, 0, -10.0);
    waterMaterial.reflectionTexture.renderList = [skybox];
    waterMaterial.reflectionTexture.level = 0.4;//Select the level (0.0 > 1.0) of the reflection
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

function placeTreasureAt(treasureLocation) {
    var treasureLoadCallback = function (meshesJustLoaded) {
        treasureBox = meshesJustLoaded[0];
        treasureLid = meshesJustLoaded[1];

        var treasureMaterial = new BABYLON.StandardMaterial("treasureMaterial", scene);
        treasureMaterial.diffuseTexture = new BABYLON.Texture("textures/treasureMaterial.png", scene);
        treasureMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

        treasureBox.material = treasureMaterial;
        treasureLid.material = treasureMaterial;

        treasureBox.position = treasureLocation;
        treasureBox.refreshBoundingInfo();
        treasureBox.checkCollisions = true;
        // don't apply gravity to treasure so it doesn't slide to bottom of lake!
    }

    BABYLON.SceneLoader.ImportMesh("", "blender/", "treasure_chest.babylon", scene, treasureLoadCallback);

    window.addEventListener("click", function (evt) {
        var pickResult = scene.pick(evt.clientX, evt.clientY);
        if (pickResult.pickedMesh === treasureBox || pickResult.pickedMesh === treasureLid) {
            treasureBox.isVisible = false;
            treasureLid.isVisible = false;
            document.getElementById("win").innerHTML = "YOU WIN!";
        }
    });
}

function placeHintboxAt(hintboxLocation, destination) {
    /* Place a hintbox at hintboxLocation that will fly towards destination */

    var hintboxSideLength = 50;
    var hintbox = BABYLON.Mesh.CreateBox("hintbox", hintboxSideLength, scene);
    hintbox.position = hintboxLocation;
    hintbox.checkCollisions = true;
    // don't apply gravity to hintbox so it doesn't slide to bottom of lake!

    function animateHintboxAndParticleSystem(hintbox) {
        var animationKeys = [{ frame: 0,   value: hintbox.position },
                             { frame: 200, value: destination}];

        var animationFPS = 30;
        var hintboxAnimation = new BABYLON.Animation("hintbox_flying", "position", animationFPS,
                                                 BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                                                 BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE);
        hintboxAnimation.setKeys(animationKeys);
        hintbox.animations.push(hintboxAnimation);
        scene.beginAnimation(hintbox, 0, 200, true);

        var particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
        particleSystem.particleTexture = new BABYLON.Texture("textures/flare.png", scene);
        particleSystem.emitter = hintbox;
        particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
        particleSystem.color1 = new BABYLON.Color4(0.9, 0.6, 0.3, 1.0);
        particleSystem.color2 = new BABYLON.Color4(0.4, 0.3, 0.3, 1.0);
        particleSystem.colorDead = new BABYLON.Color4(0.1, 0.1, 0.0, 0.0);
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.5;
        particleSystem.minLifeTime = 1.0;
        particleSystem.maxLifeTime = 3.0;
        particleSystem.emitRate = 1500;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, -30, 0);
        particleSystem.direction1 = new BABYLON.Vector3(destination.x - hintbox.position.x,
                                                        8,
                                                        destination.z - hintbox.position.z);
        particleSystem.minAngularSpeed = 0;
        particleSystem.maxAngularSpeed = Math.PI;
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 3;
        particleSystem.updateSpeed = 0.005;

        particleSystem.start();
    }

    window.addEventListener("click", function (evt) {
        var pickResult = scene.pick(evt.clientX, evt.clientY);
        if (pickResult.pickedMesh === hintbox) {
            animateHintboxAndParticleSystem(hintbox);
        }
    });
}


function createScene() {
    scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;

    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(5000, 5000, -300), scene);
    light.intensity = .5;

    addHeightmappedGround();
    createSkybox();
    createWater();
    playAudio();

    scene.gravity = NORMAL_GRAVITY;

    var treasureLocation;

    var placeTreasure = function() {
        // we can't invoke getRandomPositionAbove until the scene is ready,
        // so use the first callback to determine treasureLocation
        treasureLocation = getRandomPositionAbove(WATER_LEVEL);
        placeTreasureAt(treasureLocation);
    };

    var placeAllHintBoxes = function() {
        for (var i = 0; i < NUMBER_OF_HINTBOXES; i++) {
            placeHintboxAt(getRandomPositionAbove(WATER_LEVEL), treasureLocation);
        }
    };

    var displayReadyToBegin = function() {
        document.getElementById("loadingcontent").innerHTML = "Click Anywhere to Begin";
        document.getElementById("loading").addEventListener("click", function(evt) {
            document.getElementById("loading").style.display = "none";
        }, false);
    };

    var displayPositionVector = function() {
        cameraPosition = scene.activeCamera.position;
        document.getElementById("positionX").innerHTML = cameraPosition.x.toFixed(2);
        document.getElementById("positionY").innerHTML = cameraPosition.y.toFixed(2);
        document.getElementById("positionZ").innerHTML = cameraPosition.z.toFixed(2);
    }

    var startRenderLoop = function() {
        engine.runRenderLoop(function () {
            scene.render();
            displayPositionVector();
        });
    }

    scene.executeWhenReady(placeTreasure);
    scene.executeWhenReady(placeAllHintBoxes);
    scene.executeWhenReady(addCameraAtRandomPosition);
    scene.executeWhenReady(startLoadingTrees);
    scene.executeWhenReady(displayReadyToBegin);
    scene.executeWhenReady(startRenderLoop);
}


createScene();

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});
