var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true);
var createScene = function () {

    var scene = new BABYLON.Scene(engine);

    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 1, 0), scene);

    //Lighting
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = .5;

    //Sphere Setup
    var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
    sphere.checkCollisions = true;
    sphere.position.y = 1;
    sphere.position.x = 3;
    sphere.position.z = 5;
    //Ground Setup
    var ground = BABYLON.Mesh.CreateGround("ground1", 50, 50, 3, scene);
    ground.checkCollisions = true;
    //Ramp Setup
    var ramp = BABYLON.Mesh.CreateBox("box", 3, scene);
    ramp.position.x = -3
    ramp.position.z = 5;
    ramp.position.y = .5;
    ramp.scaling.x = .5;
    ramp.scaling.y = 2;
    ramp.rotation.z = Math.PI / 3;
    ramp.checkCollisions = true;

    //Set gravity to the scene -make sure the Y value is less than camera speed
    scene.gravity = new BABYLON.Vector3(0, -0.05, 0);

    // Enable Collisions
    scene.collisionsEnabled = true;

    //Set the ellipsoid around the camera (e.g. your player's size)
    camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);

    //Then apply collisions and gravity to the active camera and set speed
    camera.checkCollisions = true;
    camera.applyGravity = true;
    camera.speed = .3;


    //Set which meshes are collidable
    ground.checkCollisions = true;
    sphere.checkCollisions = true;
    ramp.checkCollisions = true;

    //Camera Controls
    camera.keysUp.push(87); // W
    camera.keysDown.push(83); // S
    camera.attachControl(canvas, false);

    return scene;

};

var scene = createScene();

//Camera Rotations and Turning Listeners
var aDown = false; //Indicator for rotating left
var dDown = false; //Indicator for rotating right
window.addEventListener("keydown", function(event){
    if (event.keyCode == 65) { aDown = true; };
    if (event.keyCode == 68) { dDown = true; };
});
window.addEventListener("keyup", function(event){
    if (event.keyCode == 65) { aDown = false; };
    if (event.keyCode == 68) { dDown = false; };
});

//Jump Listener
/*window.addEventListener("keypress", function(event){
  if (event.keyCode == 32) { scene.activeCamera.position.y += 1 };
  });*/

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    if (aDown) {  scene.activeCamera.cameraRotation.y -= .0025; }
    if (dDown) {  scene.activeCamera.cameraRotation.y += .0025; }
    var pos = document.getElementById("pos");
    cPos = scene.activeCamera.position;
    pos.innerHTML = "X: " + cPos.x.toFixed(2) + "<br>Y: " + cPos.y.toFixed(2) + "<br>Z: " + cPos.z.toFixed(2);
    scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});
