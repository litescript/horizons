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
const sunLoader = new THREE.TextureLoader();
const sunTexture = await sunLoader.loadAsync(
  'textures/2k_sun.jpg'
);
const sunGeometry = new THREE.SphereGeometry(
  5,   // radius (def: 1)
  40,   // widthSegments (def: 32)
  30,   // heightSegments (def: 16)
);
const sunMaterial = new THREE.MeshBasicMaterial({
  map: sunTexture,
  //  color: 0xff5500,
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

async function loadData() {
  const [solarResponse, dsnResponse] = await Promise.all([
    fetch('/api/solarsystem.json'),
    fetch('/api/dsn.json'),
  ]);

  if (!solarResponse.ok) {
    throw new Error(`Solar system request failed: ${solarResponse.status}`);
  }

  if (!dsnResponse.ok) {
    throw new Error(`Solar system request failed: ${dsnResponse.status}`);
  }

  const [solarSystem, dsn] = await Promise.all([
    solarResponse.json(),
    dsnResponse.json(),
  ]);

  return { solarSystem, dsn };
}

const bodies = {};

async function initialize() {
  try {
    const { solarSystem, dsn } = await loadData();

    // buildSolarSystem(solarSystem);
    // buildDsnLinks(dsn);

    resizeScene();
    renderer.setAnimationLoop(animate);
    if (solarSystem && dsn) {
      console.log('Ladies and gentlemen, we got em:');
      console.log('Solar System:', solarSystem);
      console.log('DSN:', dsn);

      for (const body of solarSystem.bodies) {
        bodies[body.name] = body;
      }
      console.log(bodies);
    }
  } catch (error) {
    console.error('Could not initialize Horizons:', error);
  }
}

// animation loop
function animate(time) {
  // rotate the sun
  sun.rotation.y = time / 5000;

  renderer.render(scene, camera);
}

if (isDev) {
  splashScreen.style.display = 'none';
  sceneCanvas.style.display = 'block';
  sceneCanvas.style.zIndex = 1;
  sceneCanvas.style.visibility = 'visible';
}

initialize();
