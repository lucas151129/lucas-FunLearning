import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import {
  glowTexture,
  makeGlowSprite,
  seededRandom,
} from './utils.js';

function createEnvironmentTexture(renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, 0, 512);
  base.addColorStop(0, '#071624');
  base.addColorStop(0.42, '#050d16');
  base.addColorStop(1, '#010308');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 512);

  const blob = (x, y, radius, color) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.55, color.replace(/[\d.]+\)$/, '0.16)'));
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  };
  blob(210, 150, 230, 'rgba(42, 213, 255, 0.52)');
  blob(808, 170, 210, 'rgba(255, 138, 60, 0.44)');
  blob(512, 390, 280, 'rgba(118, 72, 220, 0.28)');

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const environment = pmrem.fromEquirectangular(texture).texture;
  texture.dispose();
  pmrem.dispose();
  return environment;
}

function makePlatformTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const center = 512;

  ctx.fillStyle = '#06121b';
  ctx.fillRect(0, 0, 1024, 1024);

  const glow = ctx.createRadialGradient(center, center, 30, center, center, 500);
  glow.addColorStop(0, 'rgba(30, 95, 110, 0.22)');
  glow.addColorStop(0.4, 'rgba(13, 46, 58, 0.12)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.translate(center, center);
  ctx.strokeStyle = 'rgba(104, 230, 248, 0.16)';
  ctx.lineWidth = 1.3;
  [80, 180, 300, 405, 470].forEach((radius) => {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.strokeStyle = 'rgba(104, 230, 248, 0.075)';
  for (let i = 0; i < 24; i += 1) {
    const angle = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 335, Math.sin(angle) * 335);
    ctx.lineTo(Math.cos(angle) * 462, Math.sin(angle) * 462);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255, 180, 92, 0.16)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 120, Math.sin(angle) * 120);
    ctx.lineTo(Math.cos(angle) * 405, Math.sin(angle) * 405);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(104, 230, 248, 0.26)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 110, 0.18, 1.24);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 110, 3.32, 4.38);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 180, 92, 0.34)';
  ctx.beginPath();
  ctx.arc(0, 0, 58, 0.7, 2.7);
  ctx.stroke();

  ctx.fillStyle = 'rgba(112, 235, 250, 0.24)';
  for (let i = 0; i < 72; i += 1) {
    const angle = (i / 72) * Math.PI * 2;
    const long = i % 6 === 0;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillRect(452, long ? -8 : -3, long ? 26 : 12, long ? 2 : 1);
    ctx.restore();
  }

  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.font = '600 18px "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(118, 226, 243, 0.28)';
  ctx.fillText('STAR FORGE // ORBITAL PLATFORM 01', 0, -440);
  ctx.font = '500 12px "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255, 180, 92, 0.22)';
  ctx.fillText('SECTOR 7G · GRAVITY STABLE', 0, 454);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildPlatform(renderer) {
  const group = new THREE.Group();

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x07131e,
    metalness: 0.75,
    roughness: 0.3,
    envMapIntensity: 0.9,
  });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(5.72, 6.12, 0.52, 96, 1), baseMaterial);
  base.position.y = -0.26;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const platformTexture = makePlatformTexture();
  platformTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const topMaterial = new THREE.MeshStandardMaterial({
    map: platformTexture,
    color: 0xb8d7df,
    metalness: 0.45,
    roughness: 0.5,
    envMapIntensity: 0.65,
  });
  const top = new THREE.Mesh(new THREE.CircleGeometry(5.72, 96), topMaterial);
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.015;
  top.receiveShadow = true;
  group.add(top);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(5.73, 0.027, 8, 180),
    new THREE.MeshBasicMaterial({
      color: 0x5ff3ff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.055;
  group.add(rim);

  const innerRim = new THREE.Mesh(
    new THREE.TorusGeometry(5.4, 0.012, 6, 160),
    new THREE.MeshBasicMaterial({
      color: 0xffb45c,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  innerRim.rotation.x = Math.PI / 2;
  innerRim.position.y = 0.06;
  group.add(innerRim);

  const polar = new THREE.PolarGridHelper(5.45, 8, 5, 96, 0x1b6373, 0x16333f);
  polar.position.y = 0.075;
  polar.material.transparent = true;
  polar.material.opacity = 0.28;
  polar.material.depthWrite = false;
  group.add(polar);

  const pylonMaterial = new THREE.MeshStandardMaterial({
    color: 0x081722,
    metalness: 0.82,
    roughness: 0.28,
    envMapIntensity: 0.8,
  });
  const stripMaterial = new THREE.MeshBasicMaterial({
    color: 0x67f3ff,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const pylons = new THREE.Group();
  group.add(pylons);
  for (let i = 0; i < 4; i += 1) {
    const pylon = new THREE.Group();
    const angle = Math.PI * 0.25 + (i * Math.PI) / 2;
    pylon.position.set(Math.cos(angle) * 5.3, 0.7, Math.sin(angle) * 5.3);
    pylon.lookAt(0, 0.7, 0);

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.4, 0.18), pylonMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    pylon.add(body);

    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.92, 0.19), stripMaterial);
    strip.position.set(-0.1, 0.04, 0.095);
    pylon.add(strip);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.24), pylonMaterial);
    cap.position.y = 0.72;
    cap.castShadow = true;
    pylon.add(cap);

    const halo = makeGlowSprite(0x5ff3ff, 0.48, 0.34);
    halo.position.y = 0.78;
    pylon.add(halo);
    pylons.add(pylon);
  }

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(72, 96),
    new THREE.MeshStandardMaterial({
      color: 0x02060c,
      roughness: 0.96,
      metalness: 0.08,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.53;
  floor.receiveShadow = true;
  group.add(floor);

  const grid = new THREE.GridHelper(80, 80, 0x10313d, 0x0a1d26);
  grid.position.y = -0.5;
  grid.material.transparent = true;
  grid.material.opacity = 0.16;
  grid.material.depthWrite = false;
  group.add(grid);

  group.userData.pylons = pylons;
  return group;
}

function buildStars() {
  const random = seededRandom(1987);
  const count = 1500;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  const palette = [0xe8fbff, 0x9df6ff, 0xffe0b0, 0x86a9ff, 0xffffff];

  for (let i = 0; i < count; i += 1) {
    const radius = 28 + random() * 48;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi) * 0.65 + 4;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    color.setHex(palette[Math.floor(random() * palette.length)]);
    if (random() > 0.82) color.multiplyScalar(0.45);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.24,
      map: glowTexture,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      fog: false,
    }),
  );
  points.frustumCulled = false;

  const group = new THREE.Group();
  group.add(points);
  return group;
}

function buildDust() {
  const random = seededRandom(7781);
  const count = 260;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const radius = 1.5 + random() * 8;
    const angle = random() * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.2 + random() * 5.6;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.055,
      map: glowTexture,
      color: 0x83eaff,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    }),
  );
  const group = new THREE.Group();
  group.add(points);
  return group;
}

function buildNebula() {
  const group = new THREE.Group();
  const specs = [
    { color: 0x167d98, position: [-18, 8, -32], scale: [36, 24], opacity: 0.1 },
    { color: 0xff7434, position: [20, 5, -36], scale: [30, 20], opacity: 0.075 },
    { color: 0x6b45c8, position: [3, -2, -42], scale: [42, 25], opacity: 0.055 },
  ];
  specs.forEach((spec) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: spec.color,
        transparent: true,
        opacity: spec.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    );
    sprite.position.set(...spec.position);
    sprite.scale.set(spec.scale[0], spec.scale[1], 1);
    group.add(sprite);
  });
  return group;
}

function buildGem(index) {
  const geometries = [
    new THREE.BoxGeometry(0.18, 0.18, 0.18),
    new THREE.TorusGeometry(0.14, 0.045, 8, 24),
    new THREE.OctahedronGeometry(0.19, 0),
    new THREE.SphereGeometry(0.15, 20, 14),
    new THREE.ConeGeometry(0.14, 0.28, 5),
  ];
  const colors = [0xff7a6a, 0x63f5a6, 0x6f9dff, 0xffb45c, 0x5ff3ff];
  const geometry = geometries[index];
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: colors[index],
      toneMapped: false,
    }),
  );
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 24),
    new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      toneMapped: false,
    }),
  );
  edges.renderOrder = 4;
  mesh.add(edges);
  if (index === 1) mesh.rotation.x = Math.PI / 2.6;
  mesh.castShadow = true;
  return mesh;
}

function buildCore(scale = 1) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.54, 1),
    new THREE.MeshStandardMaterial({
      color: 0xffb15f,
      emissive: 0xff5a16,
      emissiveIntensity: 3.1,
      metalness: 0.38,
      roughness: 0.24,
      flatShading: true,
    }),
  );
  core.castShadow = true;
  group.add(core);

  const inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.24, 0),
    new THREE.MeshBasicMaterial({ color: 0xfff3d4, toneMapped: false }),
  );
  group.add(inner);

  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.88, 1),
    new THREE.MeshBasicMaterial({
      color: 0x85fbff,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  group.add(wire);

  const rings = [];
  const ringSpecs = [
    { radius: 1.25, color: 0x67f3ff, rotation: [Math.PI / 2.2, 0.2, 0.3], speed: 0.16 },
    { radius: 1.43, color: 0xffb45c, rotation: [0.55, 0.2, Math.PI / 2.2], speed: -0.11 },
    { radius: 1.62, color: 0x8ea7ff, rotation: [1.15, 0.85, 0.2], speed: 0.07 },
  ];
  ringSpecs.forEach((spec) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, 0.008, 6, 160),
      new THREE.MeshBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: 0.38,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    ring.rotation.set(...spec.rotation);
    ring.userData.baseRotation = spec.rotation.slice();
    ring.userData.speed = spec.speed;
    group.add(ring);
    rings.push(ring);
  });

  const glow = makeGlowSprite(0xff9b46, 4.2, 0.5);
  group.add(glow);

  const light = new THREE.PointLight(0xff8d42, 38, 14, 2);
  group.add(light);

  const gems = [];
  const gemColors = [0xff6b6b, 0x63f5a6, 0x6f9dff, 0xffb45c, 0x5ff3ff];
  gemColors.forEach((color, index) => {
    const pivot = new THREE.Group();
    pivot.rotation.y = (index / gemColors.length) * Math.PI * 2;
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.075, 0),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 2.4,
        metalness: 0.2,
        roughness: 0.25,
      }),
    );
    gem.position.set(1.82, Math.sin(index * 1.7) * 0.16, 0);
    pivot.add(gem);
    group.add(pivot);
    gems.push({ pivot, gem, phase: index * 1.7 });
  });

  group.scale.setScalar(scale);
  group.userData = { core, inner, wire, rings, gems, baseScale: scale };
  return group;
}

function animateCore(group, time) {
  const { core, inner, wire, rings, gems, baseScale } = group.userData;
  core.rotation.y = time * 0.2;
  core.rotation.x = Math.sin(time * 0.28) * 0.16;
  inner.rotation.y = -time * 0.35;
  wire.rotation.y = -time * 0.1;
  wire.rotation.z = time * 0.055;
  rings.forEach((ring) => {
    const [x, y, z] = ring.userData.baseRotation;
    ring.rotation.set(
      x + Math.sin(time * 0.18 + ring.userData.speed * 8) * 0.07,
      y + time * ring.userData.speed,
      z + Math.cos(time * 0.14) * 0.05,
    );
  });
  gems.forEach(({ pivot, gem, phase }) => {
    pivot.rotation.y = time * 0.22 + phase;
    gem.position.y = Math.sin(time * 0.8 + phase) * 0.18;
    gem.rotation.y = time * 0.8;
    gem.rotation.x = time * 0.5;
  });
  const pulse = 1 + Math.sin(time * 1.35) * 0.014;
  group.scale.setScalar(baseScale * pulse);
}

function buildFinaleObservatory() {
  const group = buildCore(1.18);
  group.position.set(1.8, 2.35, 0);

  const orbitSpecs = [
    { radius: 1.95, color: 0xff6b6b, tilt: [0.32, 0, -0.2], speed: 0.17 },
    { radius: 2.23, color: 0x63f5a6, tilt: [-0.24, 0, 0.3], speed: -0.13 },
    { radius: 2.52, color: 0x6f9dff, tilt: [0.16, 0, 0.4], speed: 0.11 },
    { radius: 2.82, color: 0xffb45c, tilt: [-0.36, 0, -0.12], speed: -0.09 },
    { radius: 3.12, color: 0x5ff3ff, tilt: [0.25, 0, -0.3], speed: 0.075 },
  ];

  const orbits = orbitSpecs.map((spec, index) => {
    const orbit = new THREE.Group();
    orbit.rotation.set(spec.tilt[0], spec.tilt[1], spec.tilt[2]);
    group.add(orbit);

    const spinner = new THREE.Group();
    orbit.add(spinner);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, 0.008, 6, 180),
      new THREE.MeshBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    spinner.add(ring);

    const gem = buildGem(index);
    gem.position.set(spec.radius, 0, 0);
    spinner.add(gem);

    const halo = makeGlowSprite(spec.color, 0.75, 0.38);
    halo.position.copy(gem.position);
    spinner.add(halo);

    const marker = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, 0.004, 4, 180),
      new THREE.MeshBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    marker.rotation.x = Math.PI / 2;
    orbit.add(marker);

    return { orbit, spinner, gem, halo, spec, phase: index * 1.4 };
  });

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.2, 2.35, 18, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x6ff5ff,
      transparent: true,
      opacity: 0.035,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  beam.position.y = -1.18;
  group.add(beam);

  const halo = makeGlowSprite(0x6ff5ff, 8.5, 0.13);
  group.add(halo);

  group.userData.orbits = orbits;
  group.userData.beam = beam;
  group.userData.halo = halo;
  group.userData.isFinale = true;
  return group;
}

function animateFinale(group, time) {
  animateCore(group, time * 0.7);
  group.rotation.y = time * 0.035;
  group.userData.orbits.forEach(({ spinner, halo, spec, phase }) => {
    spinner.rotation.y = time * spec.speed + phase;
    halo.material.opacity = 0.25 + Math.sin(time * 1.4 + phase) * 0.12;
    halo.scale.setScalar(0.7 + Math.sin(time * 1.1 + phase) * 0.08);
  });
  group.userData.beam.material.opacity = 0.025 + Math.sin(time * 0.8) * 0.012;
  group.userData.halo.material.opacity = 0.1 + Math.sin(time * 0.55) * 0.035;
}

export function createWorld() {
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02060d);
  scene.fog = new THREE.FogExp2(0x02070e, 0.017);
  scene.environment = createEnvironmentTexture(renderer);
  if ('environmentIntensity' in scene) scene.environmentIntensity = 0.62;

  const getCameraFov = () => {
    const touchLandscape =
      window.matchMedia('(any-pointer: coarse)').matches &&
      window.innerWidth >= window.innerHeight;
    return touchLandscape || window.innerWidth <= 820 ? 50 : 42;
  };

  const camera = new THREE.PerspectiveCamera(
    getCameraFov(),
    window.innerWidth / window.innerHeight,
    0.1,
    130,
  );
  camera.position.set(7.4, 4.5, 13.2);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(1.8, 2.1, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  controls.minDistance = 6;
  controls.maxDistance = 23;
  controls.minPolarAngle = 0.28;
  controls.maxPolarAngle = Math.PI * 0.485;
  controls.rotateSpeed = 0.62;
  controls.zoomSpeed = 0.75;
  controls.autoRotateSpeed = 0.34;
  controls.update();

  const hemisphere = new THREE.HemisphereLight(0x91ddff, 0x05090e, 0.56);
  scene.add(hemisphere);

  const key = new THREE.DirectionalLight(0xffe2c2, 2.0);
  key.position.set(6, 9, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -10;
  key.shadow.camera.right = 10;
  key.shadow.camera.top = 10;
  key.shadow.camera.bottom = -10;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 35;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.025;
  key.target.position.set(0, 1.1, 0);
  scene.add(key);
  scene.add(key.target);

  const rim = new THREE.PointLight(0x32dcff, 55, 36, 2);
  rim.position.set(-7.5, 5.5, -5.5);
  scene.add(rim);

  const warm = new THREE.PointLight(0xff8a3e, 40, 32, 2);
  warm.position.set(8, 2.6, 4.5);
  scene.add(warm);

  const fill = new THREE.DirectionalLight(0x3c6bff, 0.5);
  fill.position.set(-5, 4.5, 8);
  scene.add(fill);

  const stageLights = { hemisphere, key, rim, warm, fill };
  const moods = {
    default: { hemisphere: 0.56, key: 2.0, rim: 55, warm: 40, fill: 0.5 },
    light: { hemisphere: 0.3, key: 0.62, rim: 11, warm: 8, fill: 0.18 },
    orbit: { hemisphere: 0.42, key: 1.45, rim: 32, warm: 24, fill: 0.34 },
    finale: { hemisphere: 0.52, key: 1.8, rim: 48, warm: 36, fill: 0.44 },
  };

  function setStageMood(name = 'default') {
    const mood = moods[name] || moods.default;
    hemisphere.intensity = mood.hemisphere;
    key.intensity = mood.key;
    rim.intensity = mood.rim;
    warm.intensity = mood.warm;
    fill.intensity = mood.fill;
  }

  const worldGroup = new THREE.Group();
  scene.add(worldGroup);
  const platform = buildPlatform(renderer);
  worldGroup.add(platform);
  const pylons = platform.userData.pylons;

  const stars = buildStars();
  scene.add(stars);

  const dust = buildDust();
  scene.add(dust);

  const nebula = buildNebula();
  scene.add(nebula);

  const introRoot = buildCore(1);
  introRoot.position.set(4.0, 2.2, 0);
  scene.add(introRoot);

  const finaleRoot = buildFinaleObservatory();
  finaleRoot.visible = false;
  scene.add(finaleRoot);

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.fov = getCameraFov();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function animateAmbient(dt, time) {
    stars.rotation.y += dt * 0.0035;
    dust.rotation.y += dt * 0.018;
    dust.position.y = Math.sin(time * 0.12) * 0.12;
    if (introRoot.visible) animateCore(introRoot, time);
    if (finaleRoot.visible) animateFinale(finaleRoot, time);
  }

  function render() {
    renderer.render(scene, camera);
  }

  return {
    renderer,
    scene,
    camera,
    controls,
    stageLights,
    introRoot,
    finaleRoot,
    setStageMood,
    resize,
    animateAmbient,
    render,
    showIntro: () => { introRoot.visible = true; },
    hideIntro: () => { introRoot.visible = false; },
    showFinale: () => {
      finaleRoot.visible = true;
      pylons.visible = false;
    },
    hideFinale: () => {
      finaleRoot.visible = false;
      pylons.visible = true;
    },
    getCameraIntro: () => ({
      position: new THREE.Vector3(7.4, 4.5, 13.2),
      target: new THREE.Vector3(1.8, 2.1, 0),
    }),
  };
}

export { animateCore, buildCore, buildGem };
