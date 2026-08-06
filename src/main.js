import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// oh, hello
console.log('Horizons initialized.');

// variables, DOM
const sceneCanvas = document.getElementById('scene-canvas');
const splashScreen = document.getElementById('splash');
const underConstruction = document.getElementById('under-construction');
sceneCanvas.width = window.innerWidth;
sceneCanvas.height = window.innerHeight;
const aspectRatio = sceneCanvas.width / sceneCanvas.height;
const bodies = {};
const meshes = {};
const orbits = {};
const scaleFactor = 50;

// BIG DEFINED CONSTANTS!! ---------------------------------
const ORBITAL_ELEMENTS = {
  // a = semi-major axis, e = eccentricity, i = inclination,
  // O = longitude of ascending node, w = argument of perihelion
  Mercury: { a: 0.3871, e: 0.2056, i: 7.005, O: 48.331, w: 29.124 },
  Venus:   { a: 0.7233, e: 0.0068, i: 3.395, O: 76.680, w: 54.884 },
  Earth:   { a: 1.0000, e: 0.0167, i: 0.000, O: 0.000,  w: 102.947 },
  Mars:    { a: 1.5237, e: 0.0934, i: 1.850, O: 49.578, w: 286.502 },
  Jupiter: { a: 5.2028, e: 0.0484, i: 1.303, O: 100.464,w: 273.867 },
  Saturn:  { a: 9.5388, e: 0.0541, i: 2.489, O: 113.666,w: 339.392 },
  Uranus:  { a: 19.1914,e: 0.0473, i: 0.773, O: 74.006, w: 98.999 },
  Neptune: { a: 30.0611,e: 0.0086, i: 1.770, O: 131.784,w: 276.340 }
};

const bodyConfig = {
  Sun: {
    texture: 'textures/2k_sun.jpg',
    radius: 5,
    material: 'basic',
    materialOptions: {
      emissive: 0xffffff,
      emissiveIntensity: 5.5,
      emissiveMap: true,
    },
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
// ---------------------------------------------------------

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

const ambientLight = new THREE.AmbientLight(0x223344, 0.15);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(
  0xfff4e8,
  20_000,
  0,
  2,
);

sunLight.position.set(0, 0, 0);
scene.add(sunLight);

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

async function drawOrbitPaths(body) {
  const elements = ORBITAL_ELEMENTS[body.name];
  if (!elements) return null;

  const {
    a,
    e,
    i,
    O,
    w,
  } = elements;

  const inclination = THREE.MathUtils.degToRad(i);
  const ascendingNode = THREE.MathUtils.degToRad(O);

  const argumentOfPeriapsis = THREE.MathUtils.degToRad(w);

  const points = [];
  const segments = 256;

  for (let segment = 0; segment <= segments; segment++) {
    const trueAnomaly = (segment / segments) * Math.PI * 2;

    const radius = 
      (a * (1 - e ** 2)) /
      (1 + e * Math.cos(trueAnomaly));

    const angle = argumentOfPeriapsis + trueAnomaly;

    const cosO = Math.cos(ascendingNode);
    const sinO = Math.sin(ascendingNode);
    const cosI = Math.cos(inclination);
    const sinI = Math.sin(inclination);
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    // heliocentric ecliptic coordinates in AU
    const position = {
      x: radius * (
        cosO * cosAngle -
        sinO * sinAngle * cosI
      ),

      y: radius * (
        sinO * cosAngle + 
        cosO * sinAngle * cosI
      ),

      z: radius * sinAngle * sinI,
    };

    // apply exact same coordinate conversion and logarithmic radial scaling used
    // by the planets
    points.push(scalePosition(position));
  }

  const geometry =
    new THREE.BufferGeometry().setFromPoints(points);

  const material = new THREE.LineBasicMaterial({
    color: bodyConfig[body.name]?.orbitColor ?? 0xffffff,
    transparent: true,
    opacity: 0.3,
  });

  return new THREE.LineLoop(geometry, material);
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

  const scaledDistance = Math.log1p(distance) * scaleFactor;

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
    throw new Error(`DSN request failed: ${dsnResponse.status}`);
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

        const orbit = await drawOrbitPaths(body);

        meshes[body.name] = mesh;
        scene.add(mesh);

        if (orbit) {
          orbits[body.name] = orbit;
          scene.add(orbit);
        }
      }

      const celestialBodies = Object.values(bodies);
      const maxX = Math.max(...celestialBodies.map(b => Math.abs(b.position.x)));
      const maxY = Math.max(...celestialBodies.map(b => Math.abs(b.position.y)));
      const maxZ = Math.max(...celestialBodies.map(b => Math.abs(b.position.z)));
      const maxBoundary = Math.max(maxX, maxY, maxZ);
      console.log(maxBoundary);

      console.log(bodies);
      resizeScene();
      renderer.setAnimationLoop(animate);
    }
  } catch (error) {
    console.error('Could not initialize Horizons:', error);
  }
}

// animation loop
function animate() {
  // rotate the sun
  // sun.rotation.y = time / 5000;

  controls.update();
  renderer.render(scene, camera);
}

sceneCanvas.addEventListener('mousedown', () => {
  sceneCanvas.classList.add('grabbing');
});
sceneCanvas.addEventListener('mouseup', () => {
  sceneCanvas.classList.remove('grabbing');
});
window.addEventListener('resize', resizeScene);

const minimumSplashTime = new Promise((resolve) => {
  setTimeout(resolve, 4000);
});

await Promise.all([
  initialize(),
  minimumSplashTime,
]);

requestAnimationFrame(() => {
  splashScreen.classList.add('is-hidden');
  sceneCanvas.classList.add('is-visible');
  underConstruction.classList.add('bottom');
});

setTimeout(() => {
  splashScreen.style.display = 'none';
  underConstruction.style.display = 'grid';
}, 400);

