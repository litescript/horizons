import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
const bodies = {};
const meshes = {};

const bodyConfig = {
  Sun: {
    texture: 'textures/2k_sun.jpg',
    radius: 5,
    material: 'basic',
  },

  Mercury: {
    texture: 'textures/2k_mercury.jpg',
    radius: 0.8,
    material: 'standard',
  },

  Venus: {
    texture: 'textures/2k_venus.jpg',
    radius: 0.9,
    material: 'standard',
  },

  Earth: {
    texture: 'textures/2k_earth_daymap.jpg',
    radius: 1,
    material: 'standard',
  },

  Mars: {
    texture: 'textures/2k_mars.jpg',
    radius: 0.8,
    material: 'standard',
  },

  Jupiter: {
    texture: 'textures/2k_jupiter.jpg',
    radius: 3,
    material: 'standard',
  },

  Saturn: {
    texture: 'textures/2k_saturn.jpg',
    radius: 2,
    material: 'standard',
  },

  Uranus: {
    texture: 'textures/2k_uranus.jpg',
    radius: 2,
    material: 'standard',
  },

  Neptune: {
    texture: 'textures/2k_neptune.jpg',
    radius: 2,
    material: 'standard',
  },
}

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

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);
controls.update();

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const textureLoader = new THREE.TextureLoader();

async function createBodyMesh(body) {
  const config = bodyConfig[body.name];

  if (!config) {
    throw new Error(`Missing display config for ${body.name}`);
  }

  const texture = await textureLoader.loadAsync(config.texture);

  const geometry = new THREE.SphereGeometry(
    config.radius,
    40,
    30,
  );

  const material =
    config.material === 'basic'
      ? new THREE.MeshBasicMaterial({ map: texture })
      : new THREE.MeshStandardMaterial({ map: texture });

  const mesh = new THREE.Mesh(geometry, material);

  return mesh;
}

camera.position.z = 40;

function resizeScene() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);
}


function scalePosition(position) {
  const vector = new THREE.Vector3(
    position.x,
    position.z,
    position.y,
  );

  const distance = vector.length();

  if (distance === 0) {
    return vector;
  }

  const scaledDistance = Math.log1p(distance) * 50;

  return vector.normalize().multiplyScalar(scaledDistance);
}

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

async function initialize() {
  try {
    const { solarSystem, dsn } = await loadData();

    // buildSolarSystem(solarSystem);
    // buildDsnLinks(dsn);

    if (solarSystem && dsn) {
      for (const body of solarSystem.bodies) {
        bodies[body.name] = body;
        const mesh = await createBodyMesh(body);
        mesh.position.copy(scalePosition(body.position));

        meshes[body.name] = mesh;
        scene.add(mesh);
      }

      const celestialBodies = Object.values(bodies);
      const maxX = Math.max(...celestialBodies.map(b => Math.abs(b.position.x)));
      const maxY = Math.max(...celestialBodies.map(b => Math.abs(b.position.y)));
      const maxZ = Math.max(...celestialBodies.map(b => Math.abs(b.position.z)));
      const maxBoundary = Math.max(maxX, maxY, maxZ);
      console.log(maxBoundary);

      resizeScene();
      renderer.setAnimationLoop(animate);
    }
  } catch (error) {
    console.error('Could not initialize Horizons:', error);
  }
}

// animation loop
function animate(time=null) {
  // rotate the sun
  // sun.rotation.y = time / 5000;

  controls.update();
  renderer.render(scene, camera);
}

if (isDev) {
  splashScreen.style.display = 'none';
  sceneCanvas.style.display = 'block';
  sceneCanvas.style.zIndex = 1;
  sceneCanvas.style.visibility = 'visible';
}

window.addEventListener('resize', resizeScene);
initialize();
