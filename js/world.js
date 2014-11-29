var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true);
var scene;
var ground;
var water;

var PATH_TO_HEIGHTMAP = "heightmaps/3.jpg";
var MAP_WIDTH = 2048;
var MAP_HEIGHT = 2048;
var MAP_SUBDIVISIONS = 128;
var MIN_HEIGHT_DISPLACEMENT = -25;
var MAX_HEIGHT_DISPLACEMENT = 60;
var MAKE_MESH_UPDATABLE = true;
var BASE_SPEED = .5
var SPRINT_SPEED = 3
var NORMAL_GRAVITY = new BABYLON.Vector3(0, -0.06, 0);
var PLAYER_HEIGHT = 1;

var audio  = document.createElement('audio');
audio.src = "audio/song.mp3"
audio.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
}, false);

function initializeScene() {
    var scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    return scene;
}

function addTree(x,y,z,tree) {
    tree.position = new BABYLON.Vector3(x,y-1,z);
    tree.refreshBoundingInfo();
    tree.checkCollisions = true;
}

function buildTrees(){

     // Returns a random integer between min (inclusive) and max (inclusive)
     // Using Math.round() will give you a non-uniform distribution!
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    var mat = new BABYLON.StandardMaterial("material",scene);
    mat.ambientTexture = new BABYLON.Texture("textures/tree.jpg",scene);
    var trees = [];
    BABYLON.SceneLoader.ImportMesh("", "blender/", "tree1.babylon", scene, function (tree1) {
        trees[0]=tree1[0];
        BABYLON.SceneLoader.ImportMesh("", "blender/", "tree2.babylon", scene, function (tree2) {
            trees[1]=tree2[0];
            BABYLON.SceneLoader.ImportMesh("", "blender/", "tree3.babylon", scene, function (tree3) {
                trees[2]=tree3[0];
                BABYLON.SceneLoader.ImportMesh("", "blender/", "tree4.babylon", scene, function (tree4) {
                    trees[3]=tree4[0];
                    BABYLON.SceneLoader.ImportMesh("", "blender/", "tree5.babylon", scene, function (tree5) {
                        trees[4]=tree5[0];
                        BABYLON.SceneLoader.ImportMesh("", "blender/", "tree6.babylon", scene, function (tree6) {
                            trees[5]=tree6[0];
                            BABYLON.SceneLoader.ImportMesh("", "blender/", "tree7.babylon", scene, function (tree7) {
                                trees[6]=tree7[0];
                                BABYLON.SceneLoader.ImportMesh("", "blender/", "tree8.babylon", scene, function (tree8) {
                                    trees[7]=tree8[0];
                                    BABYLON.SceneLoader.ImportMesh("", "blender/", "tree9.babylon", scene, function (tree9) {
                                        trees[8]=tree9[0];
                                        BABYLON.SceneLoader.ImportMesh("", "blender/", "tree10.babylon", scene, function (tree10) {
                                            trees[9]=tree10[0];
                                            for (var z = (-MAP_HEIGHT/2) + 26; z < MAP_HEIGHT/2 - 26; z += 50) {
                                                 for (var x = (-MAP_WIDTH/2) + 26; x < MAP_WIDTH/2 -26; x += 50) {
                                                    var i = getRandomInt(-20,20);
                                                    var j = getRandomInt(-20,20);
                                                    var y = getGroundHeight(x+i,z+j);
                                                    var t = getRandomInt(0,9);
                                                    var tree = trees[t];
                                                    tree.material = mat;
                                                    if (y > 1) { addTree(x+i,y,z+j,tree.clone()); }
                                                }
                                            }
                                            for (var k = 0; k < 10; k++){
                                                trees[k].dispose();
                                            }
                                            audio.play();
                                            document.getElementById("loadingcontent").innerHTML = "Click Anywhere to Begin";
                                            document.getElementById("loading").addEventListener("click", function(evt) {
                                                document.getElementById("loading").style.display = "none";
                                            }, false);
                                       });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

function getGroundHeight(x, z){
    var downRay = new BABYLON.Ray(new BABYLON.Vector3(x, MAX_HEIGHT_DISPLACEMENT + 1, z),
                                  new BABYLON.Vector3(0, -1, 0));
    var info = ground.intersects(downRay, false);
    return info.pickedPoint.y;
}

function addCamera(initialLocation) {
    var camera = new BABYLON.FreeCamera("camera", initialLocation, scene);
    camera.applyGravity = true;
    camera.checkCollisions = true;
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
    water = BABYLON.Mesh.CreateGround("water", MAP_WIDTH, MAP_HEIGHT, 1, scene, false);
    var waterMaterial = new BABYLON.StandardMaterial("waterMaterial", scene);
    waterMaterial.backFaceCulling = false;
    waterMaterial.diffuseTexture = new BABYLON.Texture("skybox/skybox_py.jpg", scene);
    water.material = waterMaterial;
}


function createScene() {
    scene = initializeScene();

    addCamera(new BABYLON.Vector3(0, MAX_HEIGHT_DISPLACEMENT + PLAYER_HEIGHT, 0));

    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(5000, 5000, 0), scene);
    light.intensity = .5;
    addHeightmappedGround();
    createWater();
    createSkybox();
};


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

var initialized = false;
// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    if(!initialized && scene.isReady()){
        buildTrees(scene);
        initialized = true;
    }
    scene.render();
    if(initialized){fixGravity();}
    displayPositionVector();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});
