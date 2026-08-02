import * as THREE from 'three';

// oh, hello
console.log('Horizons initialized.');

// variables, DOM
const sceneCanvas = document.getElementById('scene-canvas');
sceneCanvas.width = window.innerWidth;
sceneCanvas.height = window.innerHeight;
const aspectRatio = sceneCanvas.width / sceneCanvas.height;

// basic scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera (
  50,             // FOV (def: 45)
  aspectRatio,    // aspect ratio
  0.1,              // near plane (def: 0.1)
  2000,           // far plane (def: 2000)
);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.setSize(sceneCanvas.width, sceneCanvas.height);

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
camera.position.z = 5;

// animation loop
function animate(time) {
  // rotate the sun
  sun.rotation.x = time / 1000;

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

