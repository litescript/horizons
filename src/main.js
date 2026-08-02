import * as THREE from 'three';

///////////////////////////////////////////////////////////////////////
//    dev toggle //////////////////////////////////////////////////////
const isDev = true;
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

// oh, hello
console.log('Horizons initialized.');

// variables, DOM
const sceneCanvas = document.getElementById('scene-canvas');
const splashScreen = document.getElementById('splash');
sceneCanvas.width = window.innerWidth;
sceneCanvas.height = window.innerHeight;
const aspectRatio = sceneCanvas.width / sceneCanvas.height;

// basic scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera (
  50,             // FOV (def: 45)
  aspectRatio,    // aspect ratio
  0.1,            // near plane (def: 0.1)
  2000,           // far plane (def: 2000)
);
const renderer = new THREE.WebGLRenderer({
  canvas: sceneCanvas,
  antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// the sun
const sunGeometry = new THREE.SphereGeometry(
  15,   // radius (def: 1)
  32,   // widthSegments (def: 32)
  16,   // heightSegments (def: 16)
);
const sunMaterial = new THREE.MeshBasicMaterial({
  color: 0xff5500,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);

// paint the scene
scene.add(sun);
camera.position.z = 40;

function resizeScene() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);
}

window.addEventListener('resize', resizeScene);

// animation loop
function animate(time) {
  // rotate the sun
  sun.rotation.x = time / 1000;

  renderer.render(scene, camera);
}

if (isDev) {
  splashScreen.style.display = 'none';
  sceneCanvas.style.display = 'block';
  sceneCanvas.style.zIndex = 1;
  sceneCanvas.style.visibility = 'visible';
}

resizeScene();
renderer.setAnimationLoop(animate);

