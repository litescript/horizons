// look at all those imports!
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { PickHelper } from './scene/PickHelper.js';
import { ORBITAL_ELEMENTS, bodyConfig } from './scene/Constants.js';


// variables, consts, DOM
const sceneCanvas = document.getElementById('scene-canvas');
const splashScreen = document.getElementById('splash');
const underConstruction = document.getElementById('under-construction');
const idBox = document.getElementById('id-box');
sceneCanvas.width = window.innerWidth;
sceneCanvas.height = window.innerHeight;
const aspectRatio = sceneCanvas.width / sceneCanvas.height;
const bodies = {};
const meshes = {};
const orbits = {};
const pickPosition = {x: 0, y: 0};
const scaleFactor = 50;
const CAMERA_FLIGHT_BASE_DURATION = 900;
const CAMERA_FLIGHT_DISTANCE_FACTOR = 180;
const CLICK_DRAG_THRESHOLD = 6;
const BLOOM_LAYER = 1;
const MASK_LAYER = 2;
let sceneInteractive = false;
let cameraFlight = null;
let pointerDownPosition = null;

// basic scene setup
const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();
const smaaPass = new SMAAPass();
const outputPass = new OutputPass();

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

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

// instantiate the PickHelper, attach the idBox to it
const pickHelper = new PickHelper((object) => {
  if (!object) {
    idBox.textContent = '';
    idBox.style.visibility = 'hidden';
    idBox.style.zIndex = '-1';
    return;
  }

  idBox.textContent = object.name;
  idBox.style.visibility = 'visible';
  idBox.style.zIndex = '4';
});

// halo effect stuff
const bloomRenderPass = new RenderPass(scene, camera);
const finalRenderPass = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.8,  // strength
  0.5,  // radius
  0.0,  // threshold
);

const maskMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  toneMapped: false,
});

const maskRenderPass = new RenderPass(scene, camera);

const maskComposer = new EffectComposer(renderer);
maskComposer.renderToScreen = false;
maskComposer.addPass(maskRenderPass);

const bloomComposer = new EffectComposer(renderer);
bloomComposer.renderToScreen = false;
bloomComposer.addPass(bloomRenderPass);
bloomComposer.addPass(bloomPass);

const renderTarget = new THREE.WebGLRenderTarget(
  window.innerWidth,
  window.innerHeight,
  {
    samples: 12,
  }
);

const mixPass = new ShaderPass(
  new THREE.ShaderMaterial({
    uniforms: {
      baseTexture: { value: null },

      bloomTexture: {
        value: bloomComposer.renderTarget2.texture,
      },

      maskTexture: {
        value: maskComposer.renderTarget2.texture,
      },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;

        gl_Position =
          projectionMatrix *
          modelViewMatrix *
          vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      uniform sampler2D baseTexture;
      uniform sampler2D bloomTexture;
      uniform sampler2D maskTexture;

      varying vec2 vUv;

      float random(vec2 p) {
        return fract(
          sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453
        );
      }

      void main() {
        vec4 base = texture2D(baseTexture, vUv);
        vec4 bloom = texture2D(bloomTexture, vUv);
        vec4 mask = texture2D(maskTexture, vUv);

        float outsideObject = 1.0 - mask.r;

        vec4 color = base + bloom * outsideObject;

        float noise =
          (random(gl_FragCoord.xy) - 0.5) / 255.0;

        color.rgb += noise;

        gl_FragColor = color;
      }
    `,
  }),

  'baseTexture',
);

const finalComposer = new EffectComposer(
  renderer,
  renderTarget,
);

finalComposer.addPass(finalRenderPass);
finalComposer.addPass(mixPass);
finalComposer.addPass(smaaPass);
finalComposer.addPass(outputPass);

// orbit controls (Three.js orbit controls, not planetary orbits)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);
controls.update();

// lighting
const ambientLight = new THREE.AmbientLight(
  0x223344,
  0.45,
);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(
  0xfff4e8,
  20_000,
  0,
  2,
);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// HELPER FUNCTIONS
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function flyToObject(object) {
  const targetPosition = new THREE.Vector3();
  object.getWorldPosition(targetPosition);

  const travelDistance = controls.target.distanceTo(targetPosition);
  const duration =
    CAMERA_FLIGHT_BASE_DURATION +
      Math.log1p(travelDistance) *
      CAMERA_FLIGHT_DISTANCE_FACTOR;

  // preserve current viewing angle/distance
  const cameraOffset = camera.position
    .clone()
    .sub(controls.target);

  cameraFlight = {
    startTime: performance.now(),
    duration,

    cameraStart: camera.position.clone(),
    cameraEnd: targetPosition.clone().add(cameraOffset),

    targetStart: controls.target.clone(),
    targetEnd: targetPosition.clone(),
  }
}

function updateCameraFlight(time) {
  if (!cameraFlight) {
    return;
  }

  const elapsed = time - cameraFlight.startTime;

  const progress = Math.min(
    elapsed / cameraFlight.duration,
    1,
  );

  const eased = easeInOutCubic(progress);

  camera.position.lerpVectors(
    cameraFlight.cameraStart,
    cameraFlight.cameraEnd,
    eased,
  );

  controls.target.lerpVectors(
    cameraFlight.targetStart,
    cameraFlight.targetEnd,
    eased,
  );

  if (progress >= 1) {
    cameraFlight = null;
    controls.enabled = true;
  }
}

function getsceneCanvasRelativePosition(event) {
  const rect = sceneCanvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * sceneCanvas.width / rect.width,
    y: (event.clientY - rect.top) * sceneCanvas.height / rect.height,
  };
}

function setPickPosition(event) {
  const pos = getsceneCanvasRelativePosition(event);
  pickPosition.x = (pos.x / sceneCanvas.width) * 2 - 1;
  pickPosition.y = (pos.y / sceneCanvas.height) * -2 + 1; // invert Y
}

function clearPickPosition() {
  pickPosition.x = -1000000;
  pickPosition.y = -1000000;
}

async function createBodyMesh(body) {
  const config = bodyConfig[body.name];

  if (!config) {
    throw new Error(`Missing display config for ${body.name}`);
  }

  const texture = await textureLoader.loadAsync(config.texture);

  const geometry = new THREE.SphereGeometry(
    config.radius,
    96,
    64,
  );

  const materialOptions = {
    map: texture,
    ...config.materialOptions,
  }

  const material =
    config.material === 'basic'
      ? new THREE.MeshBasicMaterial(materialOptions)
      : new THREE.MeshStandardMaterial(materialOptions);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = body.name;
  mesh.userData.body = body;

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

function resizeScene() {
  const width = sceneCanvas.clientWidth;
  const height = sceneCanvas.clientHeight;
  const pixelRatio = Math.min(window.devicePixelRatio, 2);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);

  bloomComposer.setPixelRatio(pixelRatio);
  maskComposer.setPixelRatio(pixelRatio);
  finalComposer.setPixelRatio(pixelRatio);

  bloomComposer.setSize(width, height);
  maskComposer.setSize(width, height);
  finalComposer.setSize(width, height);
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
    camera.position.z = 40;
    clearPickPosition();

    if (solarSystem && dsn) {
      // oh, hello
      console.log('Horizons initialized.');

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

      resizeScene();
      renderer.setAnimationLoop(animate);
    }
  } catch (error) {
    console.error('Could not initialize Horizons:', error);
  }
}

// animation loop
function animate(time) {
  if (sceneInteractive) {
    if (cameraFlight) {
      updateCameraFlight(time);
    } else {
      controls.update();
    }

    pickHelper.pick(
      pickPosition,
      Object.values(meshes),
      camera,
    );
  }

  // render halo only into bloom texture
  camera.layers.set(BLOOM_LAYER);
  bloomComposer.render();

  // render selected object's silhouette into mask texture
  camera.layers.set(MASK_LAYER);

  scene.overrideMaterial = maskMaterial;
  maskComposer.render();
  scene.overrideMaterial = null;

  // render normal scene
  camera.layers.set(0);
  finalComposer.render();
}

// ------------------ LISTENERS --------------------
sceneCanvas.addEventListener('mousedown', () => {
  sceneCanvas.classList.add('grabbing');
});
sceneCanvas.addEventListener('mouseup', () => {
  sceneCanvas.classList.remove('grabbing');
});

sceneCanvas.addEventListener('pointerdown', (event) => {
  pointerDownPosition = {
    x: event.clientX,
    y: event.clientY,
  };
});

sceneCanvas.addEventListener('pointerup', (event) => {
  if (!pointerDownPosition) {
    return;
  }

  const dx = event.clientX - pointerDownPosition.x;
  const dy = event.clientY - pointerDownPosition.y;

  pointerDownPosition = null;

  const distance = Math.hypot(dx, dy);

  // check again event being an orbit controls drag, not click/tap
  if (distance > CLICK_DRAG_THRESHOLD) {
    return;
  }

  // ensure the raycaster is using the pointer-up location
  setPickPosition(event);

  pickHelper.pick(
    pickPosition,
    Object.values(meshes),
    camera,
  );

  if (!pickHelper.pickedObject) {
    return;
  }

  flyToObject(pickHelper.pickedObject);
});

sceneCanvas.addEventListener('pointercancel', () => {
  pointerDownPosition = null;
});

window.addEventListener('resize', resizeScene);
const resizeObserver = new ResizeObserver(() => {
  resizeScene();
});
resizeObserver.observe(sceneCanvas);

if (idBox) {
  document.addEventListener('mousemove', (event) => {
    idBox.style.top = `${event.clientY + 50}px`;
    idBox.style.left = `${event.clientX + 50}px`;
  });

  window.addEventListener('mousemove', setPickPosition);
  window.addEventListener('mouseout', clearPickPosition);
  window.addEventListener('mouseleave', clearPickPosition);

  // mobile
  window.addEventListener('touchstart', (event) => {
    event.preventDefault();
    setPickPosition(event.touches[0]);
  }, {passive: false});

  window.addEventListener('touchmove', (event) => {
    setPickPosition(event.touches[0]);
  });

  window.addEventListener('touchend', clearPickPosition);
}
// -------------------------------------------------

// ---------------- SPLASH HANDLING ----------------
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
  sceneInteractive = true;
}, 400);
// -------------------------------------------------

